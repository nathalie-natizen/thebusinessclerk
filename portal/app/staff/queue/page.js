import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';
import { fmtDate, MAIL_CATEGORY, MAIL_STATUS, ORDER_STATUS, HANDLING, SHIPPING } from '@/lib/labels';

async function complete(formData) {
  'use server';
  const { sb } = await requireStaff();
  const id = String(formData.get('id')); const status = String(formData.get('status'));
  if (!['forwarded', 'shredded', 'picked_up', 'held'].includes(status)) return;
  await sb.from('mail_items').update({ status, tracking_number: String(formData.get('tracking') || '') || null }).eq('id', id);
  revalidatePath('/staff/queue');
}

export default async function Queue() {
  const { sb, profile } = await requireStaff();
  const { data: mail } = await sb.from('mail_items').select('*, entities(file_number, legal_name, mail_preferences(*))').in('status', ['forward_requested', 'shred_requested']).order('received_at');
  const { data: orders } = await sb.from('orders').select('*, entities(file_number, legal_name)').in('status', ['received', 'payment_confirmed', 'information_needed', 'in_review', 'submitted']).order('created_at');
  return (<Shell profile={profile}>
    <h1>Queue</h1>
    <h2>Mail requests from clients</h2>
    {!mail?.length ? <p className="muted">Nothing waiting.</p> : <div className="scroll"><table><thead><tr><th>File #</th><th>Item</th><th>Request</th><th>Forward to</th><th>Done</th></tr></thead><tbody>
      {mail.map(m => { const p = m.entities?.mail_preferences; const pr = Array.isArray(p) ? p[0] : p; return <tr key={m.id}>
        <td><Link className="file" href={`/staff/e/${m.entities.file_number}`}>{m.entities.file_number}</Link><div className="muted">{m.entities.legal_name}</div></td>
        <td>{MAIL_CATEGORY[m.category]}<div className="muted">{m.sender} · {fmtDate(m.received_at)}</div></td>
        <td><span className="pill warn">{MAIL_STATUS[m.status]}</span>{m.status === 'forward_requested' && <div><strong>{SHIPPING[m.forward_shipping || 'first_class']}</strong></div>}</td>
        <td className="muted">{m.status === 'forward_requested' && pr ? [pr.forward_name, pr.forward_line1, pr.forward_line2, [pr.forward_city, pr.forward_state, pr.forward_postal].filter(Boolean).join(', '), pr.forward_country].filter(Boolean).map((l, i) => <div key={i}>{l}</div>) : (pr ? HANDLING[pr.handling] : '')}</td>
        <td><form action={complete} className="row" style={{ gap: 6 }}><input type="hidden" name="id" value={m.id} />
          {m.status === 'forward_requested' ? <><input name="tracking" placeholder="Tracking #" /><button className="btn small" name="status" value="forwarded">Mark forwarded</button></> : <button className="btn small" name="status" value="shredded">Mark shredded</button>}
        </form></td></tr>; })}
    </tbody></table></div>}
    <h2>Open orders</h2>
    {!orders?.length ? <p className="muted">No open orders.</p> : <div className="scroll"><table><thead><tr><th>File #</th><th>Service</th><th>Status</th><th>Ordered</th></tr></thead><tbody>
      {orders.map(o => <tr key={o.id}><td><Link className="file" href={`/staff/e/${o.entities.file_number}`}>{o.entities.file_number}</Link><div className="muted">{o.entities.legal_name}</div></td><td>{o.service}</td><td>{ORDER_STATUS[o.status]}</td><td>{fmtDate(o.created_at)}</td></tr>)}
    </tbody></table></div>}
  </Shell>);
}
