import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import Shell from '@/components/Shell';
import OrderDetails from '@/components/OrderDetails';
import { requireStaff } from '@/lib/auth';
import { setOrderStatus } from '@/lib/orders';
import { PIPELINE, KINDS, ORDER_STATUS, statusLabel, fmtDate } from '@/lib/labels';

async function move(fd) {
  'use server';
  const { user } = await requireStaff();
  const status = String(fd.get('status'));
  if (!ORDER_STATUS[status]) return;
  await setOrderStatus({ orderId: String(fd.get('order_id')), status, note: String(fd.get('note') || '').trim().slice(0, 500) || null, notify: fd.get('notify') === 'on', userId: user.id });
  revalidatePath('/staff/pipeline');
}

const days = d => Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5));

export default async function Pipeline({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const kind = KINDS[searchParams?.kind] ? searchParams.kind : null;
  const showDone = searchParams?.done === '1';
  let q = sb.from('orders').select('*, entities(file_number, legal_name, contact_name)').neq('status', 'cancelled').order('created_at');
  if (!showDone) q = q.neq('status', 'delivered');
  if (kind) q = q.eq('kind', kind);
  const { data: orders } = await q;
  const cols = PIPELINE.filter(([s]) => showDone || s !== 'completed' || true);
  const filter = (k, label) => <Link key={k || 'all'} className={`pill ${kind === k ? 'ok' : ''}`} href={`/staff/pipeline${k ? `?kind=${k}` : ''}`} style={{ textDecoration: 'none', marginRight: 6 }}>{label}</Link>;
  return (<Shell profile={profile}>
    <h1>Pipeline</h1>
    <p className="sub">Every order from the website and from staff, by stage. Moving an order updates the client's portal and notifies them (untick "Notify" to skip).</p>
    <p>{filter(null, 'All')}{Object.entries(KINDS).map(([k, v]) => filter(k, v.name.replace('Florida ', '')))}</p>
    <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(270px, 1fr)', gap: 14, overflowX: 'auto', paddingBottom: 12 }}>
      {cols.map(([s, label]) => { const list = (orders || []).filter(o => o.status === s || (s === 'completed' && o.status === 'delivered'));
        return (<section key={s} style={{ background: 'var(--sand)', borderRadius: 14, padding: 10, minHeight: 200 }}>
          <h3 style={{ margin: '4px 6px 10px' }}>{label} <span className="muted">({list.length})</span></h3>
          {list.map(o => <div key={o.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
            <Link className="file" href={`/staff/e/${o.entities?.file_number}`}>{o.entities?.file_number}</Link>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{o.entities?.legal_name}</div>
            <div>{o.service}</div>
            <div className="muted" style={{ fontSize: 13 }}>{o.source === 'website' ? 'Website' : 'Staff'} · opened {fmtDate(o.created_at)} · {days(o.created_at)}d</div>
            <OrderDetails d={o.details} />
            <form action={move} className="stack" style={{ gap: 6, marginTop: 8 }}>
              <input type="hidden" name="order_id" value={o.id} />
              <select name="status" defaultValue={o.status}>{Object.keys(ORDER_STATUS).map(k => <option key={k} value={k}>{statusLabel(k, o.kind)}</option>)}</select>
              <input name="note" placeholder="Note to client (optional)" />
              <label style={{ display: 'flex', gap: 8, fontWeight: 400, fontSize: 14 }}><input type="checkbox" name="notify" defaultChecked style={{ minHeight: 'auto' }} /> Notify client</label>
              <button className="btn small">Move</button>
            </form>
          </div>)}
        </section>); })}
    </div>
  </Shell>);
}
