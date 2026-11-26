import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { notifyEntity } from './notify';
import { statusLabel } from './labels';

// Change an order's status: log the event, notify the client, and keep the company record in step.
export async function setOrderStatus({ orderId, status, note, notify = true, userId = null }) {
  const db = supabaseAdmin();
  const { data: o } = await db.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId).select('*, entities(id, status)').single();
  if (!o) return null;
  await db.from('order_events').insert({ order_id: o.id, status, note: note || null, created_by: userId });
  if (status === 'completed' && ['llc', 'corp'].includes(o.kind)) await db.from('entities').update({ status: 'active' }).eq('id', o.entity_id);
  if (notify && status !== 'awaiting_payment') {
    const label = statusLabel(status, o.kind);
    await notifyEntity(o.entity_id, {
      subject: `Order update: ${o.service} – ${label}`,
      text: `Your order "${o.service}" is now: ${label}.${note ? `\n\n${note}` : ''}`,
      sms: `THE BUSINESS CLERK: Your order "${o.service}" is now ${label}.`,
    });
  }
  return o;
}

// Launch Pack revisions: count one, log it on the order and send the order back to "To do".
// by: 'client' (request in portal) or 'staff' (logged for a phone/email request)
export async function logRevision({ order, text, file = null, by = 'client', userId = null }) {
  const { revisions } = await import('./guidelines');
  const r = revisions(order.details);
  if (r.used >= r.allowed) return { error: `All ${r.allowed} revisions have been used. Further changes are quoted separately.` };
  const n = r.used + 1; const at = new Date().toISOString();
  const details = { ...(order.details || {}), revisions: { allowed: r.allowed, used: n, log: [...r.log, { n, at, by, text, file }] } };
  if (by === 'client') details.replies = [...(order.details?.replies || []), { at, text: `Revision ${n} of ${r.allowed}: ${text}`, file }];
  await supabaseAdmin().from('orders').update({ details }).eq('id', order.id);
  await setOrderStatus({ orderId: order.id, status: 'received', note: `Revision ${n} of ${r.allowed} requested${by === 'staff' ? ' (logged by staff)' : ''}: ${text || '(see attachment)'}`, notify: by === 'staff', userId });
  return { n, allowed: r.allowed };
}
