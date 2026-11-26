import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { notifyEntity, notifyStaff } from './notify';

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';
const money = c => '$' + ((c || 0) / 100).toFixed(2);

// A card payment failed (renewal, mail statement or any invoice): alert the client and staff right away.
export async function flagPaymentIssue(entity, { amountCents, what, invoiceId, invoiceUrl }) {
  if (entity.payment_issue?.invoice === invoiceId) return; // already alerted for this invoice (Stripe retries)
  await supabaseAdmin().from('entities').update({ payment_issue: { at: new Date().toISOString(), amount: amountCents, what, invoice: invoiceId, url: invoiceUrl || null } }).eq('id', entity.id);
  const link = `${APP}/e/${entity.file_number}/billing`;
  await notifyEntity(entity.id, { category: 'billing',
    subject: `Action needed: payment failed for ${entity.legal_name}`,
    text: `We couldn't charge ${money(amountCents)} for ${what} to the card on file for ${entity.legal_name}.\n\nPlease update the card now so your services continue: ${link}`,
    sms: `THE BUSINESS CLERK: payment of ${money(amountCents)} for ${entity.legal_name} failed. Please update your card on file:`,
  });
  await notifyStaff({ subject: `Payment failed: ${entity.legal_name} (${entity.file_number})`, text: `${money(amountCents)} for ${what} failed for ${entity.legal_name} (${entity.file_number}). The client has been asked to update their card.\n\n${APP}/staff/e/${entity.file_number}` });
}

export async function clearPaymentIssue(entityId) {
  await supabaseAdmin().from('entities').update({ payment_issue: null }).eq('id', entityId).not('payment_issue', 'is', null);
}
