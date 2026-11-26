import { NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setOrderStatus } from '@/lib/orders';
import { createPaidOrder } from '@/lib/charge';
import { needsQuestionnaire } from '@/lib/questionnaires';
import { KINDS } from '@/lib/labels';

// Stripe → portal. Creates the company file, order and client access after payment, and keeps service flags in sync.
export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  let event;
  try { event = stripe().webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return new NextResponse('Invalid signature', { status: 400 }); }
  const db = supabaseAdmin();

  // Website intake orders: the orders already exist, mark them paid
  if (event.type === 'checkout.session.completed' && event.data.object.metadata?.order_ids) {
    const s = event.data.object; const entityId = s.metadata.entity_id;
    if (s.customer) await db.from('entities').update({ stripe_customer_id: s.customer }).eq('id', entityId).is('stripe_customer_id', null);
    const ids = s.metadata.order_ids.split(',').filter(Boolean);
    const { data: orders } = await db.from('orders').select('id, kind, status').in('id', ids);
    for (const o of orders || []) if (o.status === 'awaiting_payment') {
      const q = needsQuestionnaire(o.kind);
      await setOrderStatus({ orderId: o.id, status: q ? 'information_needed' : 'received', note: q ? 'Payment received. Please complete the short questionnaire in your portal so we can start.' : 'Payment received. We\u2019re starting on it.' });
    }
    // Formation includes the first year of registered agent service; set up the yearly renewal to start in 12 months
    const formation = (orders || []).some(o => ['llc', 'corp'].includes(o.kind));
    if (formation && s.customer && process.env.STRIPE_PRICE_RA) {
      try {
        const st = stripe(); let pm = null;
        if (s.payment_intent) pm = (await st.paymentIntents.retrieve(s.payment_intent)).payment_method;
        else if (s.subscription) pm = (await st.subscriptions.retrieve(s.subscription)).default_payment_method;
        if (pm) await st.customers.update(s.customer, { invoice_settings: { default_payment_method: pm } });
        await st.subscriptions.create({ customer: s.customer, items: [{ price: process.env.STRIPE_PRICE_RA }], trial_period_days: 365, metadata: { entity_id: entityId, product: 'ra' }, ...(pm ? { default_payment_method: pm } : {}) });
      } catch (err) { await db.from('entity_notes').upsert({ entity_id: entityId, notes: 'Set up the registered agent renewal in Stripe manually: ' + err.message }); }
    }
    return NextResponse.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object; const key = s.metadata?.product; const p = PRODUCTS[key] || { name: key };
    const email = s.customer_details?.email; const customer = s.customer;
    const company = s.custom_fields?.find(f => f.key === 'company')?.text?.value || 'New company';
    let entity = null;
    if (s.metadata?.entity_id) ({ data: entity } = await db.from('entities').select('*').eq('id', s.metadata.entity_id).maybeSingle());
    if (!entity && customer) ({ data: entity } = await db.from('entities').select('*').eq('stripe_customer_id', customer).maybeSingle());
    if (entity && !entity.stripe_customer_id && customer) await db.from('entities').update({ stripe_customer_id: customer }).eq('id', entity.id);
    if (!entity) {
      ({ data: entity } = await db.from('entities').insert({ legal_name: company, status: 'pending', stripe_customer_id: customer || null,
        entity_type: key === 'corp' ? 'Corporation' : 'LLC' }).select().single());
      await db.from('mail_preferences').insert({ entity_id: entity.id });
    }
    const flags = {};
    if (key === 'ra' || p.withRa) flags.registered_agent = true;
    if (key === 'mail') flags.mail_service = true;
    if (Object.keys(flags).length) await db.from('entities').update(flags).eq('id', entity.id);
    if (KINDS[key]) await createPaidOrder(entity, key, { amount: s.amount_total, source: s.metadata?.entity_id ? 'portal' : 'website', ref: s.id });
    if (email) {
      const { data: prof } = await db.from('profiles').select('id').ilike('email', email).maybeSingle();
      if (prof) await db.from('entity_members').upsert({ entity_id: entity.id, user_id: prof.id });
      else await db.from('invitations').upsert({ email: email.toLowerCase(), entity_id: entity.id });
      if (s.customer_details?.phone && prof) await db.from('profiles').update({ phone: s.customer_details.phone }).eq('id', prof.id).is('phone', null);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    // Work out which services this subscription covered from its prices (one subscription can hold several)
    const prices = sub.items?.data?.map(i => i.price?.id) || [];
    const fields = {};
    if (prices.includes(process.env.STRIPE_PRICE_RA) || sub.metadata?.product === 'ra') fields.registered_agent = false;
    if (prices.includes(process.env.STRIPE_PRICE_MAIL) || sub.metadata?.product === 'mail') fields.mail_service = false;
    if (Object.keys(fields).length) {
      if (sub.metadata?.entity_id) await db.from('entities').update(fields).eq('id', sub.metadata.entity_id);
      else await db.from('entities').update(fields).eq('stripe_customer_id', sub.customer);
    }
  }
  return NextResponse.json({ received: true });
}
