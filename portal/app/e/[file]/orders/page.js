import { notFound } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { fmtDate, ORDER_STATUS } from '@/lib/labels';

export default async function Orders({ params }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: orders } = await sb.from('orders').select('*, order_events(*)').eq('entity_id', e.id).order('created_at', { ascending: false });
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="orders" />
    {!orders?.length ? <div className="note">No orders yet.</div> : <div className="grid">{orders.map(o => (
      <div className="card" key={o.id}><h3>{o.service}</h3><p><span className={`pill ${o.status === 'information_needed' ? 'warn' : ['completed', 'delivered'].includes(o.status) ? 'ok' : ''}`}>{ORDER_STATUS[o.status]}</span></p>
        <p className="muted">Ordered {fmtDate(o.created_at)}</p>
        <ul className="timeline">{(o.order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(ev => <li key={ev.id}><strong>{ORDER_STATUS[ev.status] || ev.status}</strong> <span className="muted">{fmtDate(ev.created_at)}</span>{ev.note && <div className="muted">{ev.note}</div>}</li>)}</ul>
      </div>))}</div>}
  </Shell>);
}
