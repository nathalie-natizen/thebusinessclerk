'use server';
import { revalidatePath } from 'next/cache';
import { requireStaff } from './auth';
import { notifyEntity } from './notify';
import { MAIL_CATEGORY } from './labels';
import { etInputToISO } from './time';

const clean = (v, n = 200) => String(v || '').trim().slice(0, n) || null;

// Record a piece of mail for a company: applies the client's standing choice and notifies the team
export async function recordMail(fd) {
  const { sb, user } = await requireStaff();
  const entity_id = String(fd.get('entity_id')); const category = String(fd.get('category'));
  if (!MAIL_CATEGORY[category]) return { error: 'Choose a mail type.' };
  const urgent = fd.get('urgent') === 'on' || ['service_of_process', 'state_notice'].includes(category);
  const legal = ['service_of_process', 'state_notice'].includes(category);
  const content_path = clean(fd.get('content_path'), 300);
  const { data: ent } = await sb.from('entities').select('registered_agent, mail_service').eq('id', entity_id).single();
  if (!ent) return { error: 'Company not found.' };
  // Service rules: legal papers need registered agent (or mail service); ordinary mail needs mail service
  if (legal && !ent.registered_agent && !ent.mail_service) return { error: 'This company has no active service with us. Do not accept papers for it; tell the process server we are not its registered agent.' };
  if (!legal && !ent.mail_service) return { error: ent.registered_agent ? 'Registered agent only: ordinary mail is not covered. Return it to sender (or ask the client to add mail service). Nothing was saved.' : 'This company has no active service. Return the mail to sender. Nothing was saved.' };
  if (!clean(fd.get('file_path'), 300)) return { error: 'Add the envelope photo (front).' };
  if (legal && !content_path) return { error: 'Legal papers and state notices must be opened and scanned now. Add the scanned contents.' };
  const received = fd.get('received_at') ? etInputToISO(fd.get('received_at')) : new Date().toISOString();
  if (!received) return { error: 'Check the received date and time.' };
  // Service of process record
  const sop = category === 'service_of_process' ? [['Court', fd.get('court')], ['Case #', fd.get('case_number')], ['Served by', fd.get('served_by')]].filter(([, v]) => String(v || '').trim()).map(([k, v]) => `${k}: ${clean(v, 120)}`).join(' · ') : '';
  // Form 1583: ordinary mail is logged and held (not opened or forwarded) until approved
  const { data: cmra } = await sb.from('cmra_applications').select('status').eq('entity_id', entity_id).maybeSingle();
  const approved = ['verified', 'filed'].includes(cmra?.status);
  // Apply the client's standing choice for new mail
  const { data: pref } = await sb.from('mail_preferences').select('handling, forward_shipping').eq('entity_id', entity_id).maybeSingle();
  const h = pref?.handling || 'notify';
  let status = 'received', client_request = null, forward_shipping = null;
  if (content_path) status = 'scanned';
  else if (!legal && !approved) status = 'held';
  else if (h === 'scan_all') { status = 'scan_requested'; client_request = 'scan (standing choice)'; }
  else if (h.startsWith('forward_')) { status = 'forward_requested'; client_request = { forward_each: 'forward', forward_weekly: 'forward (weekly batch)', forward_biweekly: 'forward (every 2 weeks batch)', forward_monthly: 'forward (monthly batch)' }[h]; forward_shipping = pref?.forward_shipping || 'first_class'; }
  else if (h === 'hold_pickup') status = 'held';
  const { error } = await sb.from('mail_items').insert({
    entity_id, category, urgent, sender: clean(fd.get('sender')), description: clean([sop, String(fd.get('description') || '').trim()].filter(Boolean).join(' · '), 500),
    file_path: clean(fd.get('file_path'), 300), content_path, pages: content_path ? Math.max(1, parseInt(fd.get('pages')) || 1) : null, scanned_at: content_path ? new Date().toISOString() : null,
    status, client_request, forward_shipping, requested_at: client_request ? new Date().toISOString() : null,
    received_at: received, received_by: user.id,
  });
  if (error) return { error: error.message };
  const label = MAIL_CATEGORY[category];
  const r = await notifyEntity(entity_id, {
    category: ['service_of_process', 'state_notice'].includes(category) ? 'legal' : 'mail',
    subject: urgent ? `URGENT: ${label} received for your company` : `New mail received for your company`,
    text: `We received ${urgent ? 'an urgent item' : 'mail'} for your company${fd.get('sender') ? ` from ${clean(fd.get('sender'))}` : ''}: ${label}.${urgent ? ' Legal and state notices can have short deadlines. Please review it today.' : ''}`,
    sms: urgent ? `THE BUSINESS CLERK: URGENT ${label} received for your company. View it in your portal:` : `THE BUSINESS CLERK: New mail received for your company. View it:`,
  });
  await sb.from('mail_items').update({ notified_at: new Date().toISOString() }).eq('entity_id', entity_id).is('notified_at', null);
  revalidatePath('/staff/e/[file]', 'page'); revalidatePath('/staff/record');
  const sent = r.filter(x => x.status === 'sent').length;
  const held = status === 'held' && !legal && !approved ? ' Held: Form 1583 is not approved yet, so do not open or forward it.' : '';
  if (!sent) return { error: `Mail recorded, but NO ONE was notified (${!r.length ? 'no portal user on this file' : 'email/texts are not set up'}).${legal ? ' Call the client now and note the call.' : ''}${held}` };
  return { message: `Mail recorded. ${sent} notification(s) sent.${held}` };
}

