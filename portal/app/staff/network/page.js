import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';

const fields = fd => {
  const g = k => String(fd.get(k) || '').trim();
  return { languages: g('languages') ? g('languages').split(',').map(x => x.trim()).filter(Boolean) : null, email: g('email') || null, name: g('name'), firm: g('firm'), category: g('category'), bio: g('bio') || null, note: g('note') || null, website: g('website') || null, photo_url: g('photo_url') || null, sort: Number(g('sort')) || 100 };
};
const fail = e => redirect('/staff/network?error=' + encodeURIComponent(/website|photo/.test(e.message) ? 'Links must start with https://' : e.message));

async function add(fd) {
  'use server';
  const { sb } = await requireStaff();
  const { error } = await sb.from('network_partners').insert(fields(fd));
  if (error) fail(error);
  revalidatePath('/network'); redirect('/staff/network');
}
async function save(fd) {
  'use server';
  const { sb } = await requireStaff();
  const { error } = await sb.from('network_partners').update({ ...fields(fd), active: fd.get('active') === 'on' }).eq('id', String(fd.get('id')));
  if (error) fail(error);
  revalidatePath('/network'); redirect('/staff/network?saved=1');
}
async function setStatus(fd) {
  'use server';
  const { sb } = await requireStaff();
  await sb.from('network_intros').update({ status: String(fd.get('status')) }).eq('id', String(fd.get('id')));
  redirect('/staff/network');
}

const Form = ({ p, action, label }) => (
  <form action={action} className="card" style={{ marginBottom: 14 }}>
    {p && <input type="hidden" name="id" value={p.id} />}
    <div className="row"><label>Firm<input name="firm" required defaultValue={p?.firm} /></label><label>Person<input name="name" required defaultValue={p?.name} /></label></div>
    <div className="row"><label>Category<input name="category" required defaultValue={p?.category} placeholder="Immigration attorney" /></label><label>Order (lower shows first)<input name="sort" type="number" defaultValue={p?.sort ?? 100} /></label></div>
    <label>Partner email (receives client requests)<input name="email" type="email" defaultValue={p?.email || ''} /></label>
    <label>Languages (comma separated)<input name="languages" defaultValue={(p?.languages || []).join(', ')} placeholder="English, Spanish" /></label>
    <label>Short bio (2-3 lines)<textarea name="bio" rows="2" defaultValue={p?.bio || ''} /></label>
    <label>Required notice (e.g. bar admission)<input name="note" defaultValue={p?.note || ''} /></label>
    <div className="row"><label>Website, for your records only (https://…)<input name="website" type="url" defaultValue={p?.website || ''} /></label><label>Photo or logo link (https://…)<input name="photo_url" type="url" defaultValue={p?.photo_url || ''} /></label></div>
    {p && <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="active" defaultChecked={p.active} style={{ width: 'auto' }} />Show to clients</label>}
    <button className="btn small">{label}</button>
  </form>);

export default async function ManageNetwork({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const [{ data: rows }, { data: intros }] = await Promise.all([
    sb.from('network_partners').select('*').order('sort').order('firm'),
    sb.from('network_intros').select('id, message, status, created_at, network_partners(firm), profiles:user_id(email, full_name)').order('created_at', { ascending: false }).limit(100),
  ]);
  return (<Shell profile={profile}>
    <h1>Trusted network</h1>
    <p className="sub">Partners show only on the client portal page <a href="/network">/network</a>, never on the public site.</p>
    {searchParams?.error && <div className="note">{searchParams.error}</div>}
    {searchParams?.saved && <p className="ok-msg">Saved.</p>}
    <h2>Requests sent to partners</h2>
    <div className="scroll"><table><thead><tr><th>Date</th><th>Client</th><th>Partner</th><th>Note</th><th>Status</th></tr></thead><tbody>
      {(intros || []).map(i => <tr key={i.id}><td>{new Date(i.created_at).toLocaleDateString('en-US')}</td><td>{i.profiles?.full_name || i.profiles?.email}<div className="muted">{i.profiles?.email}</div></td><td>{i.network_partners?.firm}</td><td>{i.message || <span className="muted">-</span>}</td>
        <td><form action={setStatus} style={{ display: 'flex', gap: 6 }}><input type="hidden" name="id" value={i.id} /><select name="status" defaultValue={i.status}><option value="new">New</option><option value="introduced">Became their client</option><option value="closed">Closed</option></select><button className="btn small sec">Save</button></form></td></tr>)}
      {!intros?.length && <tr><td colSpan="5" className="muted">No requests yet.</td></tr>}
    </tbody></table></div>
    <h2 style={{ marginTop: 28 }}>Partners</h2>
    {(rows || []).map(p => <Form key={p.id} p={p} action={save} label="Save" />)}
    <h3>Add a partner</h3>
    <Form action={add} label="Add partner" />
  </Shell>);
}
