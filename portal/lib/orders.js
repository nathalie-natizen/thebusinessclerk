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
