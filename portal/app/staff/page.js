import Link from 'next/link';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';

export default async function Staff({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const q = String(searchParams?.q || '').trim();
  let query = sb.from('entities').select('*, cmra_applications(status), entity_members(user_id)').order('created_at', { ascending: false }).limit(200);
  if (q) query = query.or(`legal_name.ilike.%${q.replace(/[%,()]/g, '')}%,file_number.ilike.%${q.replace(/[%,()]/g, '')}%,sunbiz_doc_number.ilike.%${q.replace(/[%,()]/g, '')}%`);
  const svc = String(searchParams?.svc || '');
  if (svc === 'ra') query = query.eq('registered_agent', true); else if (svc === 'mail') query = query.eq('mail_service', true); else if (svc === 'none') query = query.eq('registered_agent', false).eq('mail_service', false);
  const { data: entities } = await query;
  const plural = (n, w) => `${n || 0} ${w}${n === 1 ? '' : 's'}`;
  const cap = t => t ? t[0].toUpperCase() + t.slice(1) : '';
  const { count: pending } = await sb.from('mail_items').select('id', { count: 'exact', head: true }).in('status', ['forward_requested', 'shred_requested']);
  const { count: newOrders } = await sb.from('orders').select('id', { count: 'exact', head: true }).in('status', ['received', 'payment_confirmed', 'information_needed']);
  return (<Shell profile={profile}>
    <h1>Entities</h1>
    <p className="sub">{plural(pending, 'mail request')} waiting (<Link href="/staff/queue">Mail queue</Link>) · {plural(newOrders, 'order')} to process (<Link href="/staff/pipeline">Pipeline</Link>)</p>
    <form className="row" style={{ marginBottom: 16 }}><input name="q" defaultValue={q} placeholder="Search name, file number or Florida document #" /><select name="svc" defaultValue={svc} style={{ flex: '0 1 200px' }}><option value="">All services</option><option value="ra">Registered agent</option><option value="mail">Mail service</option><option value="none">No active service</option></select><button className="btn sec" style={{ flex: '0 0 auto' }}>Search</button><Link className="btn" href="/staff/new" style={{ flex: '0 0 auto' }}>New entity</Link></form>
    <div className="scroll"><table><thead><tr><th>File #</th><th>Company</th><th>Type</th><th>Status</th><th>Services</th><th>Form 1583</th><th>Contact</th><th>Portal users</th></tr></thead><tbody>
      {(entities || []).map(e => { const c = Array.isArray(e.cmra_applications) ? e.cmra_applications[0] : e.cmra_applications; const ok = ['verified', 'filed'].includes(c?.status); return <tr key={e.id}><td><Link className="file" href={`/staff/e/${e.file_number}`}>{e.file_number}</Link></td><td><Link href={`/staff/e/${e.file_number}`}>{e.legal_name}</Link></td><td>{e.entity_type}</td><td>{cap(e.status)}</td><td>{e.registered_agent && <span className="pill ok">RA</span>} {e.mail_service && <span className="pill ok">Mail</span>}{!e.registered_agent && !e.mail_service && <span className="muted">None</span>}</td><td>{e.mail_service ? <span className={`pill ${ok ? 'ok' : 'urgent'}`}>{ok ? 'Approved' : 'Not approved'}</span> : <span className="muted">—</span>}</td><td className="muted">{e.contact_name || ''}{e.contact_phone ? <div>{e.contact_phone}</div> : ''}</td><td>{(e.entity_members || []).length || <span className="pill urgent">0</span>}</td></tr>; })}
    </tbody></table></div>
  </Shell>);
}
