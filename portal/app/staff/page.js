import Link from 'next/link';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';

export default async function Staff({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const q = String(searchParams?.q || '').trim();
  let query = sb.from('entities').select('*').order('created_at', { ascending: false }).limit(200);
  if (q) query = query.or(`legal_name.ilike.%${q.replace(/[%,()]/g, '')}%,file_number.ilike.%${q.replace(/[%,()]/g, '')}%,sunbiz_doc_number.ilike.%${q.replace(/[%,()]/g, '')}%`);
  const { data: entities } = await query;
  const { count: pending } = await sb.from('mail_items').select('id', { count: 'exact', head: true }).in('status', ['forward_requested', 'shred_requested']);
  const { count: newOrders } = await sb.from('orders').select('id', { count: 'exact', head: true }).in('status', ['received', 'payment_confirmed', 'information_needed']);
  return (<Shell profile={profile}>
    <h1>Entities</h1>
    <p className="sub">{pending || 0} mail requests waiting · {newOrders || 0} orders to process · <Link href="/staff/queue">Open queue</Link></p>
    <form className="row" style={{ marginBottom: 16 }}><input name="q" defaultValue={q} placeholder="Search name, file number or Florida document #" /><button className="btn sec" style={{ flex: '0 0 auto' }}>Search</button><Link className="btn" href="/staff/new" style={{ flex: '0 0 auto' }}>New entity</Link></form>
    <div className="scroll"><table><thead><tr><th>File #</th><th>Company</th><th>Type</th><th>Status</th><th>Services</th></tr></thead><tbody>
      {(entities || []).map(e => <tr key={e.id}><td><Link className="file" href={`/staff/e/${e.file_number}`}>{e.file_number}</Link></td><td><Link href={`/staff/e/${e.file_number}`}>{e.legal_name}</Link></td><td>{e.entity_type}</td><td>{e.status}</td><td>{e.registered_agent && <span className="pill ok">RA</span>} {e.mail_service && <span className="pill ok">Mail</span>}</td></tr>)}
    </tbody></table></div>
  </Shell>);
}
