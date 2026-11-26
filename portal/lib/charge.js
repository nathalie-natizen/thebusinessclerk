import 'server-only';
import { stripe } from './stripe';
import { supabaseAdmin } from './supabase/admin';
import { KINDS } from './labels';
import { needsQuestionnaire } from './questionnaires';
import { GUIDELINES_VERSION } from './guidelines';

// The company's saved card (null if none)
export async function savedCard(customerId) {
  if (!customerId || !process.env.STRIPE_SECRET_KEY) return null;
  const s = stripe();
  const c = await s.customers.retrieve(customerId, { expand: ['invoice_settings.default_payment_method'] }).catch(() => null);
  let pm = c?.invoice_settings?.default_payment_method;
  if (!pm || typeof pm === 'string') pm = (await s.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 }).catch(() => ({ data: [] }))).data[0];
  return pm?.card ? { id: pm.id, ...pm.card } : null;
}
export async function priceFor(kind) {
  const id = process.env[KINDS[kind]?.env]; if (!id || !process.env.STRIPE_SECRET_KEY) return null;
  return stripe().prices.retrieve(id).catch(() => null);
}

// Create the order record after payment (website, checkout or card on file)
export async function createPaidOrder(entity, kind, { amount = null, source = 'portal', ref = null } = {}) {
  const db = supabaseAdmin();
  const status = needsQuestionnaire(kind) ? 'information_needed' : 'received';
  const { data: o } = await db.from('orders').insert({ entity_id: entity.id, kind, service: KINDS[kind].name, status, source, stripe_session_id: ref, amount_cents: amount, details: { service_terms_version: GUIDELINES_VERSION } }).select().single();
  await db.from('order_events').insert({ order_id: o.id, status, note: status === 'information_needed' ? 'Payment received. Please complete the short questionnaire so we can start.' : 'Payment received. We’re starting on it.' });
  if (kind === 'ra') await db.from('entities').update({ registered_agent: true }).eq('id', entity.id);
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
