import { NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setOrderStatus } from '@/lib/orders';
import { createPaidOrder } from '@/lib/charge';
import { needsQuestionnaire } from '@/lib/questionnaires';
import { KINDS } from '@/lib/labels';
import { flagPaymentIssue, clearPaymentIssue } from '@/lib/payments';
import { priceOf, isRa, isMail, isBundle } from '@/lib/prices';
import { sendEmail, notifyStaff } from '@/lib/notify';

// Stripe → portal. Creates the company file, order and client access after payment, and keeps service flags in sync.
export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  let event;
  try { event = stripe().webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return new NextResponse('Invalid signature', { status: 400 }); }
  const db = supabaseAdmin();

  // Card saved for a company (setup mode): make it the default card and charge any orders pending payment
  if (event.type === 'checkout.session.completed' && event.data.object.mode === 'setup') {
    const s = event.data.object; const entityId = s.metadata?.entity_id;
    if (entityId && s.setup_intent) {
      const st = stripe(); const si = await st.setupIntents.retrieve(s.setup_intent);
      if (si.payment_method) await st.customers.update(s.customer, { invoice_settings: { default_payment_method: si.payment_method } });
      const { data: ent } = await db.from('entities').select('*').eq('id', entityId).single();
      if (ent) { await (await import('@/lib/charge')).payPendingOrders(ent); await clearPaymentIssue(ent.id); }
    }
    return NextResponse.json({ received: true });
  }

  // Website intake orders: the orders already exist, mark them paid
  if (event.type === 'checkout.session.completed' && event.data.object.metadata?.order_ids) {
    const s = event.data.object; const entityId = s.metadata.entity_id;
    if (s.customer) await db.from('entities').update({ stripe_customer_id: s.customer }).eq('id', entityId).is('stripe_customer_id', null);
    const ids = s.metadata.order_ids.split(',').filter(Boolean);
    const { data: orders } = await db.from('orders').select('id, kind, status, details').in('id', ids);
    for (const o of orders || []) if (o.status === 'awaiting_payment') {
      const q = needsQuestionnaire(o.kind) && !o.details?.q;
      await setOrderStatus({ orderId: o.id, status: q ? 'information_needed' : 'received', note: q ? 'Payment received. Please complete the short questionnaire in your portal so we can start.' : 'Payment received. We\u2019re starting on it.' });
    }
    const { data: ent } = await db.from('entities').select('legal_name, file_number, contact_name, contact_email').eq('id', entityId).single();
    const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';
    if (ent?.contact_email) await sendEmail(ent.contact_email, `Payment received: ${ent.legal_name} (${ent.file_number})`, `Thank you, ${ent.contact_name || ''}. Your payment was received and your order is with our team.\n\nYour company file number is ${ent.file_number}. Follow every step and complete any questionnaire in your client portal. Sign in with this email: ${APP}/login\n\nTHE BUSINESS CLERK`).catch(() => {});
    await notifyStaff({ subject: `New paid order: ${ent?.legal_name} (${ent?.file_number})`, text: `${(orders || []).map(o => KINDS[o.kind]?.name || o.kind).join(', ')}\n\n${APP}/staff/pipeline` }).catch(() => {});
    // Formation includes the first year of registered agent service; set up the yearly renewal to start in 12 months
    const formation = (orders || []).some(o => ['llc', 'corp', 'foreign'].includes(o.kind));
    const raPrice = formation && s.customer ? await priceOf('ra') : null;
    if (raPrice) {
      try {
        const st = stripe(); let pm = null;
        if (s.payment_intent) pm = (await st.paymentIntents.retrieve(s.payment_intent)).payment_method;
        else if (s.subscription) pm = (await st.subscriptions.retrieve(s.subscription)).default_payment_method;
        if (pm) await st.customers.update(s.customer, { invoice_settings: { default_payment_method: pm } });
        await st.subscriptions.create({ customer: s.customer, items: [{ price: raPrice.id }], trial_period_days: 365, metadata: { entity_id: entityId, product: 'ra' }, ...(pm ? { default_payment_method: pm } : {}) });
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
    if (key === 'bundle') Object.assign(flags, { registered_agent: true, mail_service: true, bundle: true });
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
    const items = sub.items?.data?.map(i => i.price) || [];
    const fields = {};
    if (items.some(isRa) || sub.metadata?.product === 'ra') fields.registered_agent = false;
    if (items.some(isMail) || sub.metadata?.product === 'mail') fields.mail_service = false;
    if (items.some(isBundle) || sub.metadata?.product === 'bundle') Object.assign(fields, { registered_agent: false, mail_service: false, bundle: false });
    if (Object.keys(fields).length) {
      if (sub.metadata?.entity_id) await db.from('entities').update(fields).eq('id', sub.metadata.entity_id);
      else await db.from('entities').update(fields).eq('stripe_customer_id', sub.customer);
    }
  }

  // Failed card payment (renewals, mail statements): alert client + staff immediately. Paid: clear the alert.
  if (event.type === 'invoice.payment_failed' || event.type === 'invoice.paid') {
    const inv = event.data.object;
    let q = db.from('entities').select('*');
    q = inv.metadata?.entity_id ? q.eq('id', inv.metadata.entity_id) : q.eq('stripe_customer_id', inv.customer);
    const { data: ents } = await q.limit(1);
    const ent = ents?.[0];
    if (ent && event.type === 'invoice.paid') await clearPaymentIssue(ent.id);
    if (ent && event.type === 'invoice.payment_failed') {
      const what = inv.lines?.data?.map(l => l.description).filter(Boolean).slice(0, 2).join('; ') || inv.description || 'your services';
      await flagPaymentIssue(ent, { amountCents: inv.amount_due, what, invoiceId: inv.id, invoiceUrl: inv.hosted_invoice_url });
    }
  }
  return NextResponse.json({ received: true });
}
