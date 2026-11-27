import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';

export default async function Resources() {
  const { sb, profile } = await requireUser();
  const staff = ['staff', 'admin'].includes(profile?.role);
  const { data: rows } = await sb.from('resources').select('*').order('sort').order('title');
  const group = (a) => (rows || []).filter(r => r.audience === a);
  const List = ({ items }) => items.length ? <div className="grid">{items.map(r => (
    <a key={r.id} className="card" href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <h3>{r.title} ↗</h3>{r.description && <p className="muted">{r.description}</p>}
    </a>))}</div> : <p className="muted">No links yet.</p>;
  return (<Shell profile={profile}>
    <h1>Resources</h1>
    <p className="sub">Official links for Florida businesses. They open the government site in a new tab.</p>
    {staff && <p><a className="btn small" href="/staff/resources">Manage links</a></p>}
    <List items={group('client')} />
    {staff && <><h2 style={{ marginTop: 28 }}>Staff only</h2><List items={group('staff')} /></>}
    <p className="muted" style={{ fontSize: 13, marginTop: 28 }}>Need an attorney, tax professional or bookkeeper? <a href="/network">See our trusted network</a>.</p>
  </Shell>);
}
