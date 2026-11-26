import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { notifyEntity } from './notify';
import { statusLabel } from './labels';

// Quality check before an order can be archived (Final review → Archive). Returns what's missing.
export async function archiveCheck(orderId) {
  const db = supabaseAdmin();
  const { data: o } = await db.from('orders').select('*, entities(*)').eq('id', orderId).single();
  if (!o) return ['Order not found'];
  const e = o.entities || {}; const i = o.details?.internal || {}; const miss = [];
  const { count: docs } = await db.from('documents').select('id', { count: 'exact', head: true }).eq('entity_id', o.entity_id).gte('created_at', o.created_at);
  const needDoc = ['llc', 'corp', 'foreign', 'annual_report', 'ein', 'launch'].includes(o.kind) || o.kind && (await import('./labels')).KINDS[o.kind]?.filing;
  if (needDoc && !docs) miss.push('Upload the final document to the Documents tab (filed Articles, report, EIN letter or handover sheet)');
  if (['llc', 'corp', 'foreign'].includes(o.kind)) {
    if (!(i.doc_number || e.sunbiz_doc_number)) miss.push('Enter the Florida document number (Internal record)');
    if (!i.filed_name) miss.push('Enter the exact name as filed (Internal record)');
  }
  if ((o.kind === 'annual_report' || (await import('./labels')).KINDS[o.kind]?.filing) && !i.confirmation) miss.push('Enter the Sunbiz confirmation number (Internal record)');
  if (o.kind === 'ein' && !(i.ein || e.ein)) miss.push('Enter the EIN (Internal record)');
  return miss;
}

// Change an order's status: log the event, notify the client, and keep the company record in step.
export async function setOrderStatus({ orderId, status, note, notify = true, userId = null }) {
  const db = supabaseAdmin();
  const { data: o } = await db.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId).select('*, entities(id, status)').single();
  if (!o) return null;
  const sent = notify && status !== 'awaiting_payment';
  await db.from('order_events').insert({ order_id: o.id, status, note: note || null, created_by: userId, notified: sent });
  const i = o.details?.internal || {};
  if (status === 'completed' && ['llc', 'corp', 'foreign'].includes(o.kind)) {
    await db.from('entities').update({ status: 'active', ...(i.doc_number ? { sunbiz_doc_number: i.doc_number } : {}), ...(i.filed_name ? { legal_name: i.filed_name } : {}), ...(o.details?.principal_address ? { principal_address: o.details.principal_address } : {}), ...(o.details?.mailing_address ? { mailing_address: o.details.mailing_address } : {}), formation_date: i.filed_date || new Date().toISOString().slice(0, 10) }).eq('id', o.entity_id);
    // Orders that waited for the State (EIN) start their clock now
    const { data: deps } = await db.from('orders').select('id').eq('entity_id', o.entity_id).eq('kind', 'ein').in('status', ['received', 'payment_confirmed']);
    for (const d of deps || []) { await db.from('orders').update({ updated_at: new Date().toISOString() }).eq('id', d.id); await db.from('order_events').insert({ order_id: d.id, status: 'received', note: 'Florida approved the company. EIN application starts now.', created_by: userId, notified: false }); }
  }
  if (status === 'completed' && o.kind === 'ein' && i.ein) await db.from('entities').update({ ein: i.ein }).eq('id', o.entity_id);
  if (sent) {
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
