import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { setOrderStatus } from './orders';
import { startTracking } from './tracking';
import { notifyEntity } from './notify';
import { CARRIERS } from './labels';

export const BATCH = { forward_weekly: 'weekly', forward_biweekly: 'every two weeks', forward_monthly: 'monthly' };
export const WEEKDAYS = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
export const isBatchRequest = r => /weekly|weeks|monthly/.test(r || '');

const etToday = () => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); d.setHours(0, 0, 0, 0); return d; };
const isoWeek = d => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y) / 864e5 + 1) / 7); };

// Is today a shipping day for this client? weekly = every chosen weekday; every two weeks = chosen weekday of even ISO weeks;
// monthly = first chosen weekday of the month
export function isShipDay(handling, weekday, d = etToday()) {
  if (d.getDay() !== Number(weekday || 5)) return false;
  if (handling === 'forward_weekly') return true;
  if (handling === 'forward_biweekly') return isoWeek(d) % 2 === 0;
  if (handling === 'forward_monthly') return d.getDate() <= 7;
  return false;
}
export function nextShipDay(handling, weekday, from = etToday()) {
  const d = new Date(from); for (let i = 0; i < 70; i++) { d.setDate(d.getDate() + 1); if (isShipDay(handling, weekday, d)) return d; } return null;
}
export const scheduleLabel = (handling, weekday) => !BATCH[handling] ? '' : handling === 'forward_monthly' ? `First ${WEEKDAYS[weekday || 5]} of each month` : handling === 'forward_biweekly' ? `Every other ${WEEKDAYS[weekday || 5]}` : `Every ${WEEKDAYS[weekday || 5]}`;

// Daily job: open a forwarding task for each client whose shipping day is today and who has mail waiting
export async function createDueBatches() {
  const db = supabaseAdmin(); const today = etToday(); let created = 0;
  const { data: prefs } = await db.from('mail_preferences').select('entity_id, handling, forward_day, entities(id, legal_name, mail_service)').in('handling', Object.keys(BATCH));
  for (const p of prefs || []) {
    if (!p.entities?.mail_service || !isShipDay(p.handling, p.forward_day, today)) continue;
    const { count } = await db.from('mail_items').select('id', { count: 'exact', head: true }).eq('entity_id', p.entity_id).eq('status', 'forward_requested');
    if (!count) continue;
    const { data: open } = await db.from('orders').select('id').eq('entity_id', p.entity_id).eq('kind', 'mail_batch').not('status', 'in', '(completed,cancelled)').limit(1);
    if (open?.length) continue;
    const label = `Mail forwarding: ${BATCH[p.handling]} shipment (${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    const { data: o } = await db.from('orders').insert({ entity_id: p.entity_id, kind: 'mail_batch', service: label, status: 'received', source: 'staff', details: { schedule: p.handling, ship_date: today.toISOString().slice(0, 10) } }).select().single();
    if (o) { await db.from('order_events').insert({ order_id: o.id, status: 'received', note: `Scheduled ${BATCH[p.handling]} forwarding: ${count} item${count > 1 ? 's' : ''} waiting.` }); created++; }
  }
  return created;
}

// Staff ship the selected items in one package: each item is billed as forwarded, postage is recorded once, one tracking number for all
export async function shipBatch({ orderId, itemIds, carrier, tracking, postageCents, labelPath = null, userId }) {
  const db = supabaseAdmin();
  const { data: o } = await db.from('orders').select('*').eq('id', orderId).single();
  if (!o || o.kind !== 'mail_batch') return { error: 'Not a forwarding task.' };
  const { data: items } = await db.from('mail_items').select('id, status').eq('entity_id', o.entity_id).in('id', itemIds).eq('status', 'forward_requested');
  if (!items?.length) return { error: 'Select at least one item.' };
  const now = new Date().toISOString();
  for (const [i, it] of items.entries()) await db.from('mail_items').update({ status: 'forwarded', batch_order_id: o.id, label_path: labelPath, postage_cents: i === 0 ? (postageCents >= 0 ? postageCents : null) : 0 }).eq('id', it.id);
  const patch = await startTracking(items[0].id, CARRIERS[carrier] ? carrier : 'USPS', tracking);
  if (items.length > 1) await db.from('mail_items').update({ tracking_number: patch.tracking_number, carrier: patch.carrier, tracking_url: patch.tracking_url, tracking_status: patch.tracking_status, tracker_id: patch.tracker_id, est_delivery: patch.est_delivery || null }).in('id', items.slice(1).map(i => i.id));
  const note = `Shipped ${items.length} item${items.length > 1 ? 's' : ''} in one package${patch.tracking_number ? ` · ${carrier} ${patch.tracking_number}` : ''}.`;
  await db.from('orders').update({ details: { ...(o.details || {}), shipped: { at: now, items: items.map(i => i.id), carrier, tracking: patch.tracking_number, postage_cents: postageCents, label_path: labelPath } } }).eq('id', o.id);
  await setOrderStatus({ orderId: o.id, status: 'completed', note, notify: false, userId });
  await notifyEntity(o.entity_id, { category: 'mail', subject: `Your mail is on the way (${items.length} item${items.length > 1 ? 's' : ''})`, text: `${note}${patch.tracking_url ? `\n\nTrack it: ${patch.tracking_url}` : ''}\n\nEach item is listed on your Mail page and on your monthly statement.`, sms: `THE BUSINESS CLERK: ${items.length} mail item(s) shipped${patch.tracking_number ? `, tracking ${patch.tracking_number}` : ''}.` });
  return { ok: true, count: items.length };
}
