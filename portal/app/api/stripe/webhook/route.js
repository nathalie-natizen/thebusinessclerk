import { NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Stripe → portal. Creates the company file, order and client access after payment, and keeps service flags in sync.
export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  let event;
  try { event = stripe().webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return new NextResponse('Invalid signature', { status: 400 }); }
  const db = supabaseAdmin();

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
    const { data: order } = await db.from('orders').insert({ entity_id: entity.id, service: p.name, status: 'payment_confirmed', stripe_session_id: s.id, amount_cents: s.amount_total }).select().single();
    await db.from('order_events').insert({ order_id: order.id, status: 'payment_confirmed', note: 'Payment received through Stripe.' });
    if (email) {
      const { data: prof } = await db.from('profiles').select('id').ilike('email', email).maybeSingle();
      if (prof) await db.from('entity_members').upsert({ entity_id: entity.id, user_id: prof.id });
      else await db.from('invitations').upsert({ email: email.toLowerCase(), entity_id: entity.id });
      if (s.customer_details?.phone && prof) await db.from('profiles').update({ phone: s.customer_details.phone }).eq('id', prof.id).is('phone', null);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object; const key = sub.metadata?.product;
    const field = key === 'ra' ? 'registered_agent' : key === 'mail' ? 'mail_service' : null;
    if (field) {
      if (sub.metadata?.entity_id) await db.from('entities').update({ [field]: false }).eq('id', sub.metadata.entity_id);
      else await db.from('entities').update({ [field]: false }).eq('stripe_customer_id', sub.customer);
    }
  }
  return NextResponse.json({ received: true });
}
