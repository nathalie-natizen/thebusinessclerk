import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';
import { sendEmail, notifyStaff } from '@/lib/notify';

async function sendRequest(formData) {
  'use server';
  const { sb, user, profile } = await requireUser();
  const partnerId = String(formData.get('partner') || '');
  const message = String(formData.get('message') || '').trim().slice(0, 1000);
  const { data: p } = await sb.from('network_partners').select('firm, name, email').eq('id', partnerId).eq('active', true).maybeSingle();
  if (!p?.email) redirect('/network');
  const { error } = await sb.from('network_intros').insert({ partner_id: partnerId, user_id: user.id, message: message || null });
  if (error) redirect('/network?error=1');
  const who = profile?.full_name || profile?.email;
  const contact = [`Name: ${profile?.full_name || '-'}`, `Email: ${profile?.email}`, `Phone: ${profile?.phone || '-'}`].join('\n');
  const body = `Hello,\n\nA client of THE BUSINESS CLERK would like to speak with ${p.firm}.\n\n${contact}${message ? `\n\nTheir message:\n${message}` : ''}\n\nReply to this email to contact them directly.\n\nTHE BUSINESS CLERK\nhello@thebusinessclerk.com`;
  await sendEmail(p.email, `New client request from THE BUSINESS CLERK: ${who}`, body, { replyTo: profile?.email });
  await notifyStaff({ subject: `Partner request sent: ${who} to ${p.firm}`, text: `Copy of the request sent to ${p.firm} (${p.email}):\n\n${contact}${message ? `\n\nMessage:\n${message}` : ''}` }).catch(() => {});
  redirect('/network?sent=1');
}

const initials = s => s.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export default async function Network({ searchParams }) {
  const { sb, profile } = await requireUser();
  const staff = ['staff', 'admin'].includes(profile?.role);
  const { data: rows } = await sb.from('network_partners').select('*').eq('active', true).order('sort').order('firm');
  return (<Shell profile={profile}>
    <h1>Trusted network</h1>
    <p className="sub">Independent Florida professionals we know and work with, for the things we don't do ourselves.</p>
    {staff && <p><a className="btn small" href="/staff/network">Manage network</a></p>}
    {searchParams?.sent && <p className="ok-msg">Sent. They'll contact you directly.</p>}
    {searchParams?.error && <div className="note">We couldn't send your request. Please try again or email hello@thebusinessclerk.com.</div>}
    <div className="grid">{(rows || []).map(p => (
      <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {p.photo_url
            ? <img src={p.photo_url} alt="" width="52" height="52" style={{ borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />
            : <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: '50%', background: '#0F4C5C', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, flex: 'none' }}>{initials(p.firm)}</span>}
          <div><h3 style={{ margin: 0 }}>{p.firm}</h3><div className="muted">{p.name} · {p.category}</div></div>
        </div>
        {p.bio && <p style={{ margin: 0 }}>{p.bio}</p>}
        {p.note && <p className="muted" style={{ margin: 0, fontSize: 13 }}>{p.note}</p>}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {p.email && <details><summary className="btn small" style={{ display: 'inline-block' }}>Send a message</summary>
          <form action={sendRequest} style={{ marginTop: 10 }}>
            <input type="hidden" name="partner" value={p.id} />
            <label>Short message (optional)<textarea name="message" rows="3" maxLength="1000" placeholder="What do you need help with?" /></label>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 8px' }}>They'll receive your name, email and phone number.</p>
            <button className="btn small">Send request</button>
          </form>
          </details>}
          {p.languages?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{p.languages.map(l => <span key={l} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: '#E3EEEC', color: '#0F4C5C', fontWeight: 600 }}>{l}</span>)}</div>}
        </div>
      </div>))}</div>
    {!rows?.length && <p className="muted">No partners listed yet.</p>}
    <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>These professionals are independent and are not part of The Business Clerk. Choosing one is entirely up to you, and they set their own fees and terms.</p>
  </Shell>);
}
