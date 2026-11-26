import { notFound } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { fmtDate, ORDER_STATUS } from '@/lib/labels';

const ORDERABLE = [['annual_report', 'Annual report filing'], ['ein', 'EIN application'], ['ra', 'Registered agent'], ['mail', 'Business address & mail'], ['launch', 'Launch Pack']];

export default async function Orders({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: orders } = await sb.from('orders').select('*, order_events(*)').eq('entity_id', e.id).order('created_at', { ascending: false });
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="orders" />
    {searchParams?.paid && <div className="note">Payment received. Your order will appear below in a moment.</div>}
    <section className="card" style={{ marginBottom: 18 }}><h3>Order a service for this company</h3>
      <p className="muted">Charged to this company's card on file.</p>
      <p>{ORDERABLE.filter(([k]) => !(k === 'ra' && e.registered_agent) && !(k === 'mail' && e.mail_service)).map(([k, label]) => <a key={k} className="btn sec small" style={{ marginRight: 8, marginBottom: 8 }} href={`/api/stripe/checkout?product=${k}&entity=${e.file_number}`}>{label}</a>)}</p>
    </section>
    {!orders?.length ? <div className="note">No orders yet.</div> : <div className="grid">{orders.map(o => (
      <div className="card" key={o.id}><h3>{o.service}</h3><p><span className={`pill ${o.status === 'information_needed' ? 'warn' : ['completed', 'delivered'].includes(o.status) ? 'ok' : ''}`}>{ORDER_STATUS[o.status]}</span></p>
        <p className="muted">Ordered {fmtDate(o.created_at)}</p>
        <ul className="timeline">{(o.order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(ev => <li key={ev.id}><strong>{ORDER_STATUS[ev.status] || ev.status}</strong> <span className="muted">{fmtDate(ev.created_at)}</span>{ev.note && <div className="muted">{ev.note}</div>}</li>)}</ul>
      </div>))}</div>}
  </Shell>);
}
