import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { notifyEntity } from './notify';
import { TRACKING_STATUS, CARRIERS, carrierUrl } from './labels';

// Start automatic tracking for a forwarded item. Works without EasyPost too (just a carrier link, no auto updates).
export async function startTracking(itemId, carrier, trackingNumber) {
  const db = supabaseAdmin();
  const code = String(trackingNumber || '').replace(/\s+/g, '').slice(0, 60);
  const c = CARRIERS[carrier] ? carrier : 'USPS';
  const patch = { tracking_number: code || null, carrier: code ? c : null, tracking_url: carrierUrl(c, code), tracking_status: code ? 'unknown' : null, tracker_id: null };
  if (code && process.env.EASYPOST_API_KEY) {
    try {
      const r = await fetch('https://api.easypost.com/v2/trackers', {
        method: 'POST',
        headers: { Authorization: 'Basic ' + Buffer.from(process.env.EASYPOST_API_KEY + ':').toString('base64'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracker: { tracking_code: code, carrier: c } }),
      });
      const t = await r.json();
      if (t?.id) Object.assign(patch, { tracker_id: t.id, tracking_status: t.status || 'unknown', tracking_url: t.public_url || patch.tracking_url, est_delivery: t.est_delivery_date || null });
    } catch { /* keep the carrier link; staff can retry by saving again */ }
  }
  await db.from('mail_items').update(patch).eq('id', itemId);
  return patch;
}

// Apply a tracker update from EasyPost. Marks the item delivered and tells the client.
export async function applyTrackerUpdate(t) {
  const db = supabaseAdmin();
  const { data: all } = await db.from('mail_items').select('id, entity_id, status, tracking_status, description, sender').eq('tracker_id', t.id);
  const item = all?.[0]; if (!item) return false; // a batch shares one tracker
  const patch = { tracking_status: t.status, tracking_url: t.public_url || undefined, est_delivery: t.est_delivery_date || null };
  const delivered = t.status === 'delivered' && item.status !== 'delivered';
  if (delivered) Object.assign(patch, { status: 'delivered', delivered_at: new Date().toISOString() });
  await db.from('mail_items').update(patch).eq('tracker_id', t.id).neq('status', 'delivered');
  if (!delivered) await db.from('mail_items').update({ tracking_status: t.status }).eq('tracker_id', t.id);
  if (t.status !== item.tracking_status && ['out_for_delivery', 'delivered', 'return_to_sender', 'failure', 'available_for_pickup'].includes(t.status)) {
    const label = TRACKING_STATUS[t.status];
    await notifyEntity(item.entity_id, { category: 'mail',
      subject: `Forwarded mail: ${label}`,
      text: all.length > 1 ? `Your package of ${all.length} forwarded mail items is now: ${label}.` : `Mail we forwarded for you${item.sender ? ` (from ${item.sender})` : ''} is now: ${label}.`,
      sms: `THE BUSINESS CLERK: Your forwarded mail is ${label.toLowerCase()}.`,
    });
  }
  return true;
}
