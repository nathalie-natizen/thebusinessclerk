import 'server-only';
import { stripe } from './stripe';
import { supabaseAdmin } from './supabase/admin';
import { KINDS } from './labels';
import { needsQuestionnaire } from './questionnaires';
import { GUIDELINES_VERSION } from './guidelines';
import { priceOf } from './prices';

// The company's saved card (null if none)
export async function savedCard(customerId) {
  if (!customerId || !process.env.STRIPE_SECRET_KEY) return null;
  const s = stripe();
  const c = await s.customers.retrieve(customerId, { expand: ['invoice_settings.default_payment_method'] }).catch(() => null);
  let pm = c?.invoice_settings?.default_payment_method;
  if (!pm || typeof pm === 'string') pm = (await s.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 }).catch(() => ({ data: [] }))).data[0];
  return pm?.card ? { id: pm.id, ...pm.card } : null;
}
export async function priceFor(kind) { return priceOf(kind); }

// Create the order record after payment (website, checkout or card on file)
export async function createPaidOrder(entity, kind, { amount = null, source = 'portal', ref = null, unpaid = false, pending = false } = {}) {
  const db = supabaseAdmin();
  const status = pending ? 'awaiting_payment' : needsQuestionnaire(kind) ? 'information_needed' : 'received';
  const { data: o } = await db.from('orders').insert({ entity_id: entity.id, kind, service: KINDS[kind].name, status, source, stripe_session_id: ref, amount_cents: amount, details: { service_terms_version: GUIDELINES_VERSION } }).select().single();
  await db.from('order_events').insert({ order_id: o.id, status, note: pending ? 'Order placed. Pending payment: it is charged automatically to this company’s card on file as soon as a card is saved on the Billing tab.' : unpaid ? `Order placed. Payment pending (card payments are being activated).${status === 'information_needed' ? ' Please complete the short questionnaire so we can start.' : ''}` : status === 'information_needed' ? 'Payment received. Please complete the short questionnaire so we can start.' : 'Payment received. We’re starting on it.' });
  if (!pending) await (await import('./notify')).notifyStaff({ subject: `New portal order: ${entity.legal_name} (${entity.file_number})`, text: `${KINDS[kind].name}${unpaid ? ' (payment pending: Stripe not connected yet)' : ''}\n\n${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com'}/staff/pipeline` }).catch(() => {});
  if (kind === 'ra' || kind === 'foreign') await db.from('entities').update({ registered_agent: true }).eq('id', entity.id);
  if (kind === 'foreign') await startRaRenewal(entity).catch(() => {});
  if (kind === 'mail') await db.from('entities').update({ mail_service: true }).eq('id', entity.id);
  return o;
}

// Charge the company's card on file right away. One-time services become a paid invoice (shows in receipts); plans become a subscription.
export async function chargeOnFile(entity, kind) {
  const card = await savedCard(entity.stripe_customer_id); const price = await priceFor(kind);
  if (!card || !price) return { ok: false, reason: 'no_card' };
  const s = stripe();
  try {
    if (KINDS[kind].recurring) {
      const sub = await s.subscriptions.create({ customer: entity.stripe_customer_id, items: [{ price: price.id }], default_payment_method: card.id, metadata: { entity_id: entity.id, product: kind }, payment_behavior: 'error_if_incomplete' });
      return { ok: true, amount: price.unit_amount, ref: sub.id };
    }
    const inv = await s.invoices.create({ customer: entity.stripe_customer_id, collection_method: 'charge_automatically', auto_advance: false, pending_invoice_items_behavior: 'exclude', default_payment_method: card.id, description: `${KINDS[kind].name} for ${entity.legal_name} (${entity.file_number})`, metadata: { entity_id: entity.id, product: kind } });
    await s.invoiceItems.create({ customer: entity.stripe_customer_id, invoice: inv.id, price: price.id });
    await s.invoices.finalizeInvoice(inv.id);
    const paid = await s.invoices.pay(inv.id, { payment_method: card.id });
    if (paid.status !== 'paid') { await s.invoices.voidInvoice(inv.id).catch(() => {}); return { ok: false, reason: 'declined' }; }
    return { ok: true, amount: paid.amount_paid, ref: inv.id };
  } catch (e) { return { ok: false, reason: 'declined', message: e.message }; }
}

// Annual report: charge the Florida state fee to the card on file when staff file the report
export async function chargeStateFee(entity, order, cents) {
  if (order.details?.state_fee?.ref) return { ok: true, already: true };
  if (!(cents > 0)) return { ok: false, reason: 'Enter the state fee amount.' };
  if (!process.env.STRIPE_SECRET_KEY) return { ok: false, reason: 'Stripe is not connected yet.' };
  const card = await savedCard(entity.stripe_customer_id);
  if (!card) return { ok: false, reason: 'No card on file for this company.' };
  const s = stripe();
  try {
    const inv = await s.invoices.create({ customer: entity.stripe_customer_id, collection_method: 'charge_automatically', auto_advance: false, pending_invoice_items_behavior: 'exclude', default_payment_method: card.id, description: `Florida state fee (${order.service}) for ${entity.legal_name} (${entity.file_number})`, metadata: { entity_id: entity.id, product: 'annual_report_fee', order_id: order.id } });
    await s.invoiceItems.create({ customer: entity.stripe_customer_id, invoice: inv.id, currency: 'usd', amount: cents, description: `Florida Division of Corporations fee: ${order.service}` });
    await s.invoices.finalizeInvoice(inv.id);
    const paid = await s.invoices.pay(inv.id, { payment_method: card.id });
    if (paid.status !== 'paid') { await s.invoices.voidInvoice(inv.id).catch(() => {}); return { ok: false, reason: 'Card declined.' }; }
    await supabaseAdmin().from('orders').update({ details: { ...(order.details || {}), state_fee: { ref: inv.id, cents: paid.amount_paid, at: new Date().toISOString() } } }).eq('id', order.id);
    return { ok: true, cents: paid.amount_paid };
  } catch (e) { return { ok: false, reason: e.message }; }
}

// Foreign qualification includes the first registered agent year: renewal starts in 12 months on the card on file
export async function startRaRenewal(entity) {
  const price = await priceOf('ra'); const card = await savedCard(entity.stripe_customer_id);
  if (!price || !card) return null;
  return stripe().subscriptions.create({ customer: entity.stripe_customer_id, items: [{ price: price.id }], trial_period_days: 365, default_payment_method: card.id, metadata: { entity_id: entity.id, product: 'ra' } });
}

// Charge every order of this company that is pending payment (after a card is saved, or "Pay now")
export async function payPendingOrders(entity) {
  const db = supabaseAdmin();
  const { data: pend } = await db.from('orders').select('*').eq('entity_id', entity.id).eq('status', 'awaiting_payment').eq('source', 'portal');
  const out = [];
  for (const o of pend || []) {
    const r = await chargeOnFile(entity, o.kind);
    if (!r.ok) { out.push({ id: o.id, ok: false, reason: r.reason }); continue; }
    const status = needsQuestionnaire(o.kind) ? 'information_needed' : 'received';
    await db.from('orders').update({ status, amount_cents: r.amount, stripe_session_id: r.ref, updated_at: new Date().toISOString() }).eq('id', o.id);
    await db.from('order_events').insert({ order_id: o.id, status, note: status === 'information_needed' ? 'Payment received. Please complete the short questionnaire so we can start.' : 'Payment received. We’re starting on it.' });
    if (o.kind === 'ra' || o.kind === 'foreign') await db.from('entities').update({ registered_agent: true }).eq('id', entity.id);
    if (o.kind === 'mail') await db.from('entities').update({ mail_service: true }).eq('id', entity.id);
    await (await import('./notify')).notifyStaff({ subject: `New portal order: ${entity.legal_name} (${entity.file_number})`, text: `${KINDS[o.kind]?.name || o.service} (paid)\n\n${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com'}/staff/pipeline` }).catch(() => {});
    out.push({ id: o.id, ok: true });
  }
  return out;
}
