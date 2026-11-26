import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import Shell from '@/components/Shell';
import OrderDetails from '@/components/OrderDetails';
import { requireStaff } from '@/lib/auth';
import { setOrderStatus, logRevision } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revisions, STAFF_STEPS } from '@/lib/guidelines';
import { PIPELINE, KINDS, STAFF_STATUSES, fmtDate } from '@/lib/labels';

async function move(fd) {
  'use server';
  const { user } = await requireStaff();
  const status = String(fd.get('status'));
  if (!STAFF_STATUSES.some(([k]) => k === status)) return;
  await setOrderStatus({ orderId: String(fd.get('order_id')), status, note: String(fd.get('note') || '').trim().slice(0, 500) || null, notify: fd.get('notify') === 'on', userId: user.id });
  revalidatePath('/staff/pipeline');
}

async function staffRevision(fd) {
  'use server';
  const { user } = await requireStaff();
  const { data: o } = await supabaseAdmin().from('orders').select('*').eq('id', String(fd.get('order_id'))).single();
  if (!o || o.kind !== 'launch') return;
  await logRevision({ order: o, text: String(fd.get('note') || '').trim().slice(0, 2000) || 'Requested by phone/email', by: 'staff', userId: user.id });
  revalidatePath('/staff/pipeline');
}

const days = d => Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5));

export default async function Pipeline({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const kind = KINDS[searchParams?.kind] ? searchParams.kind : null;
  const showDone = searchParams?.done === '1';
  let q = sb.from('orders').select('*, entities(file_number, legal_name, contact_name)').not('status', 'in', '(cancelled,awaiting_payment)').order('created_at');
  if (kind) q = q.eq('kind', kind);
  const { data: orders } = await q;
  const filter = (k, label) => <Link key={k || 'all'} className={`pill ${kind === k ? 'ok' : ''}`} href={`/staff/pipeline${k ? `?kind=${k}` : ''}`} style={{ textDecoration: 'none', marginRight: 6 }}>{label}</Link>;
  return (<Shell profile={profile}>
    <h1>Pipeline</h1>
    <p className="sub">Every paid order, by stage. Moving an order updates the client's portal and notifies them (untick "Notify" to skip). Use "Waiting on client" with a note when you need something from them. Completed orders show for 30 days (<a href="/staff/pipeline?done=1">show all</a>).</p>
    <p>{filter(null, 'All')}{Object.entries(KINDS).map(([k, v]) => filter(k, v.name.replace('Florida ', '')))}</p>
    <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(270px, 1fr)', gap: 14, overflowX: 'auto', paddingBottom: 12 }}>
      {PIPELINE.map(([label, sts]) => { const list = (orders || []).filter(o => sts.includes(o.status) && (label !== 'Completed' || showDone || new Date(o.updated_at) > Date.now() - 30 * 864e5));
        return (<section key={label} style={{ background: 'var(--sand)', borderRadius: 14, padding: 10, minHeight: 200 }}>
          <h3 style={{ margin: '4px 6px 10px' }}>{label} <span className="muted">({list.length})</span></h3>
          {list.map(o => <div key={o.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
            <Link className="file" href={`/staff/e/${o.entities?.file_number}`}>{o.entities?.file_number}</Link>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{o.entities?.legal_name}</div>
            <div>{o.service}</div>
            <div className="muted" style={{ fontSize: 13 }}>{o.source === 'website' ? 'Website' : 'Staff'} · opened {fmtDate(o.created_at)} · {days(o.created_at)}d</div>
            {o.kind === 'launch' && (() => { const r = revisions(o.details); return <div style={{ marginTop: 6 }}>
              <span className={`pill ${r.used >= r.allowed ? 'urgent' : ''}`}>{r.used ? `Revision ${r.used} of ${r.allowed}` : 'No revisions yet'} · {r.allowed - r.used} left</span>
              {r.used < r.allowed && <details style={{ marginTop: 4 }}><summary style={{ cursor: 'pointer', fontSize: 14 }}>Log revision (phone/email request)</summary>
                <form action={staffRevision} className="stack" style={{ gap: 6, marginTop: 6 }}><input type="hidden" name="order_id" value={o.id} /><input name="note" placeholder="What the client asked for" required /><button className="btn small sec">Log revision {r.used + 1} of {r.allowed}</button></form></details>}
            </div>; })()}
            {STAFF_STEPS[o.kind] && <details style={{ margin: '6px 0' }}><summary style={{ cursor: 'pointer', fontSize: 14 }}>Staff steps</summary><ol style={{ fontSize: 14, paddingLeft: 18, margin: '6px 0' }}>{STAFF_STEPS[o.kind].map(([st, txt], i) => <li key={i}><strong>{st}:</strong> {txt}</li>)}</ol></details>}
            <OrderDetails d={o.details} kind={o.kind} orderId={o.id} />
            <form action={move} className="stack" style={{ gap: 6, marginTop: 8 }}>
              <input type="hidden" name="order_id" value={o.id} />
              <select name="status" defaultValue={STAFF_STATUSES.some(([k]) => k === o.status) ? o.status : 'received'}>{STAFF_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <input name="note" placeholder="Note to client (optional)" />
              <label style={{ display: 'flex', gap: 8, fontWeight: 400, fontSize: 14 }}><input type="checkbox" name="notify" defaultChecked style={{ minHeight: 'auto' }} /> Notify client</label>
              <button className="btn small">Move</button>
            </form>
          </div>)}
        </section>); })}
    </div>
  </Shell>);
}
