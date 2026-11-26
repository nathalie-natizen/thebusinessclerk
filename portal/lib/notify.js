import 'server-only';
import { supabaseAdmin } from './supabase/admin';

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';

export async function sendEmail(to, subject, text) {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'email not configured' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  return r.ok ? { ok: true } : { ok: false, error: await r.text() };
}

export async function sendSms(to, body) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: tok, TWILIO_FROM_NUMBER: from } = process.env;
  if (!sid || !tok || !from) return { ok: false, error: 'sms not configured' };
  const twilio = (await import('twilio')).default(sid, tok);
  try { await twilio.messages.create({ to, from, body }); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
}

// Notify every client linked to an entity. Never puts document contents in the message, only a link.
export async function notifyEntity(entityId, { subject, text, sms }) {
  const db = supabaseAdmin();
  const { data: members } = await db.from('entity_members').select('profiles(email, phone, sms_opt_in)').eq('entity_id', entityId);
  const log = [];
  for (const m of members || []) {
    const p = m.profiles; if (!p) continue;
    const e = await sendEmail(p.email, subject, `${text}\n\nSign in to view it: ${APP}\n\nTHE BUSINESS CLERK`);
    log.push({ entity_id: entityId, channel: 'email', recipient: p.email, subject, status: e.ok ? 'sent' : 'failed', error: e.error || null });
    if (p.sms_opt_in && p.phone && sms) {
      const s = await sendSms(p.phone, `${sms} ${APP} Reply STOP to opt out.`);
      log.push({ entity_id: entityId, channel: 'sms', recipient: p.phone, subject, status: s.ok ? 'sent' : 'failed', error: s.error || null });
    }
  }
  if (log.length) await db.from('notifications').insert(log);
  return log;
}

// Email every staff member (alerts that need someone to act)
export async function notifyStaff({ subject, text }) {
  const db = supabaseAdmin();
  const { data: staff } = await db.from('profiles').select('email').in('role', ['staff', 'admin']);
  const log = [];
  for (const p of staff || []) { const e = await sendEmail(p.email, subject, `${text}\n\nTHE BUSINESS CLERK portal`); log.push({ channel: 'email', recipient: p.email, subject, status: e.ok ? 'sent' : 'failed', error: e.error || null }); }
  if (log.length) await db.from('notifications').insert(log).then(() => {}, () => {});
  return log;
}
