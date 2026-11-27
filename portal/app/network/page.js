import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';

const initials = s => s.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export default async function Network() {
  const { sb, profile } = await requireUser();
  const staff = ['staff', 'admin'].includes(profile?.role);
  const { data: rows } = await sb.from('network_partners').select('*').eq('active', true).order('sort').order('firm');
  return (<Shell profile={profile}>
    <h1>Trusted network</h1>
    <p className="sub">Independent Florida professionals we know and work with, for the things we don't do ourselves.</p>
    {staff && <p><a className="btn small" href="/staff/network">Manage network</a></p>}
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
        {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer">Website ↗</a>}
      </div>))}</div>
    {!rows?.length && <p className="muted">No partners listed yet.</p>}
    <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>These professionals are independent and are not part of The Business Clerk. Choosing one is entirely up to you, and they set their own fees and terms.</p>
  </Shell>);
}
