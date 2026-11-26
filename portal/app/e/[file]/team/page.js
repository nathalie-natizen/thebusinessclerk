import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { TOPICS, sendEmail } from '@/lib/notify';

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';
const TITLES = ['Owner', 'Managing member', 'Manager', 'Partner', 'Officer', 'Accountant / bookkeeper', 'Assistant', 'Other'];
const clip = (v, n = 120) => String(v || '').trim().slice(0, n) || null;

async function me(file) {
  const { sb, user, profile } = await requireUser();
  const e = await getEntity(sb, file); if (!e) return {};
  const { data: m } = await supabaseAdmin().from('entity_members').select('role').eq('entity_id', e.id).eq('user_id', user.id).maybeSingle();
  return { e, user, profile, role: profile?.role !== 'client' ? 'owner' : m?.role };
}

async function addMember(fd) {
  'use server';
  const { e, role, profile } = await me(String(fd.get('file')));
  if (!e || role !== 'owner') return;
  const email = String(fd.get('email') || '').trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return;
  const db = supabaseAdmin(); const r = fd.get('role') === 'owner' ? 'owner' : 'member';
  const rec = { name: clip(fd.get('name')), phone: clip(fd.get('phone'), 40), title: clip(fd.get('title'), 60) };
  const { data: p } = await db.from('profiles').select('id, full_name, phone').ilike('email', email).maybeSingle();
  if (p) {
    await db.from('entity_members').upsert({ entity_id: e.id, user_id: p.id, role: r, title: rec.title });
    await db.from('profiles').update({ full_name: p.full_name || rec.name, phone: p.phone || rec.phone }).eq('id', p.id);
  } else await db.from('invitations').upsert({ email, entity_id: e.id, role: r, ...rec });
  await sendEmail(email, `You've been added to ${e.legal_name} on THE BUSINESS CLERK`, `${profile?.full_name || 'A colleague'} added you to ${e.legal_name} (${e.file_number}) in THE BUSINESS CLERK client portal, where you can see its mail, legal notices, documents and orders.\n\nSign in with this email address: ${APP}/login\n\nAfter you sign in, choose which notifications you want on the company's Team page.`).catch(() => {});
  revalidatePath('/e/[file]/team', 'page');
}

async function removeMember(fd) {
  'use server';
  const { e, role, user } = await me(String(fd.get('file')));
  if (!e) return;
  const db = supabaseAdmin(); const uid = String(fd.get('user_id') || ''); const email = String(fd.get('email') || '');
  if (uid && uid !== user.id && role !== 'owner') return;
  if (email && role !== 'owner') return;
  if (uid) {
    const { data: owners } = await db.from('entity_members').select('user_id').eq('entity_id', e.id).eq('role', 'owner');
    if ((owners || []).length <= 1 && owners?.[0]?.user_id === uid) return; // keep at least one owner
    await db.from('entity_members').delete().eq('entity_id', e.id).eq('user_id', uid);
  }
  if (email) await db.from('invitations').delete().eq('entity_id', e.id).eq('email', email);
  revalidatePath('/e/[file]/team', 'page');
}

async function savePrefs(fd) {
  'use server';
  const { e, user } = await me(String(fd.get('file')));
  if (!e) return;
  const notify = Object.fromEntries(Object.keys(TOPICS).map(k => [k, { email: fd.get(`${k}_email`) === 'on', sms: fd.get(`${k}_sms`) === 'on' }]));
  const db = supabaseAdmin();
  await db.from('entity_members').update({ notify, title: clip(fd.get('title'), 60) }).eq('entity_id', e.id).eq('user_id', user.id);
  await db.from('profiles').update({ full_name: clip(fd.get('full_name')), phone: clip(fd.get('phone'), 40), sms_opt_in: Object.values(notify).some(n => n.sms) }).eq('id', user.id);
  revalidatePath('/e/[file]/team', 'page');
}

export default async function Team({ params, searchParams }) {
  const { e, user, profile, role } = await me(params.file); if (!e) notFound();
  const db = supabaseAdmin();
  const { data: members } = await db.from('entity_members').select('user_id, role, title, notify, profiles(full_name, email, phone)').eq('entity_id', e.id).order('created_at');
  const { data: invites } = await db.from('invitations').select('*').eq('entity_id', e.id);
  const mine = (members || []).find(m => m.user_id === user.id);
  const pref = (k, ch) => (mine?.notify?.[k]?.[ch]) !== false;
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="team" />
    <p className="sub">Everyone who can see this company in the portal. Each person has their own login and chooses their own notifications.</p>
    <div className="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th></th></tr></thead><tbody>
      {(members || []).map(m => <tr key={m.user_id}><td>{m.profiles?.full_name || '—'}{m.user_id === user.id && <span className="muted"> (you)</span>}</td><td>{m.profiles?.email}</td><td>{m.profiles?.phone || '—'}</td><td>{m.title || (m.role === 'owner' ? 'Owner' : 'Member')}{m.role === 'owner' && <span className="pill ok" style={{ marginLeft: 6 }}>can manage team</span>}</td>
        <td>{(role === 'owner' && m.user_id !== user.id) && <form action={removeMember}><input type="hidden" name="file" value={e.file_number} /><input type="hidden" name="user_id" value={m.user_id} /><button className="btn small sec">Remove</button></form>}</td></tr>)}
      {(invites || []).map(i => <tr key={i.email}><td>{i.name || '—'} <span className="pill warn">invited</span></td><td>{i.email}</td><td>{i.phone || '—'}</td><td>{i.title || (i.role === 'owner' ? 'Owner' : 'Member')}</td>
        <td>{role === 'owner' && <form action={removeMember}><input type="hidden" name="file" value={e.file_number} /><input type="hidden" name="email" value={i.email} /><button className="btn small sec">Cancel invite</button></form>}</td></tr>)}
    </tbody></table></div>

    {mine && <form action={savePrefs} className="card stack wide" style={{ marginTop: 20 }}>
      <input type="hidden" name="file" value={e.file_number} />
      <h2 style={{ margin: 0 }}>My profile and notifications for this company</h2>
      <div className="row"><label>Full name<input name="full_name" defaultValue={profile?.full_name || ''} /></label><label>Mobile phone (for texts)<input name="phone" type="tel" defaultValue={profile?.phone || ''} placeholder="+1…" /></label><label>Title<select name="title" defaultValue={mine.title || ''}><option value="">—</option>{TITLES.map(t => <option key={t}>{t}</option>)}</select></label></div>
      <table><thead><tr><th>Notify me about</th><th>Email</th><th>Text</th></tr></thead><tbody>{Object.entries(TOPICS).map(([k, l]) => <tr key={k}><td>{l}{k === 'legal' && <div className="muted" style={{ fontSize: 13 }}>Strongly recommended: lawsuits and state notices can have short deadlines.</div>}</td><td><input type="checkbox" name={`${k}_email`} defaultChecked={pref(k, 'email')} style={{ minHeight: 'auto' }} /></td><td><input type="checkbox" name={`${k}_sms`} defaultChecked={pref(k, 'sms') && !!profile?.sms_opt_in} style={{ minHeight: 'auto' }} /></td></tr>)}</tbody></table>
      <p className="muted" style={{ margin: 0 }}>Texts need a mobile number. Message and data rates may apply; reply STOP to opt out.</p>
      <button className="btn">Save my preferences</button>
    </form>}

    {role === 'owner' && <form action={addMember} className="card stack wide" style={{ marginTop: 20 }}>
      <input type="hidden" name="file" value={e.file_number} />
      <h2 style={{ margin: 0 }}>Add a person</h2>
      <p className="muted" style={{ margin: 0 }}>They get an email invitation and sign in with their own email. Only add people you authorize to see this company's mail and documents.</p>
      <div className="row"><label>Full name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label></div>
      <div className="row"><label>Phone<input name="phone" type="tel" /></label><label>Title<select name="title">{TITLES.map(t => <option key={t}>{t}</option>)}</select></label><label>Access<select name="role"><option value="member">Member: sees everything, can order</option><option value="owner">Owner: also manages the team</option></select></label></div>
      <button className="btn">Add and send invitation</button>
    </form>}
  </Shell>);
}
