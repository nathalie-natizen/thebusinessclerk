import { NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase/server';
import { priceOf } from '@/lib/prices';

// Public checkout link used by the website, e.g. https://app.thebusinessclerk.com/api/stripe/checkout?product=llc
export async function GET(req) {
  const url = new URL(req.url); const key = url.searchParams.get('product'); const p = PRODUCTS[key];
  const price = p && (await priceOf(key))?.id;
  if (!price) return new NextResponse('Unknown or unconfigured product', { status: 400 });
  const app = process.env.NEXT_PUBLIC_APP_URL;
  const line_items = [{ price, quantity: 1 }];
  // Ordering for an existing company from the portal: bill that company's own customer record (its own card)
  let ent = null; const file = url.searchParams.get('entity');
  if (file) {
    const { data } = await supabaseServer().from('entities').select('id, legal_name, stripe_customer_id').eq('file_number', file).maybeSingle(); // RLS: members/staff only
    if (!data) return NextResponse.redirect(new URL('/login', req.url), 303);
    ent = data;
  }
  const session = await stripe().checkout.sessions.create({
    mode: p.mode,
    line_items,
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    ...(ent?.stripe_customer_id ? { customer: ent.stripe_customer_id, customer_update: { address: 'auto', name: 'auto' } } : p.mode === 'payment' ? { customer_creation: 'always' } : {}),
    ...(p.mode === 'payment' ? { invoice_creation: { enabled: true } } : {}),
    ...(ent ? {} : { custom_fields: [{ key: 'company', label: { type: 'custom', custom: 'Company name (or the name you want)' }, type: 'text' }] }),
    consent_collection: { terms_of_service: 'required' },
    metadata: { product: key, ...(ent ? { entity_id: ent.id } : {}) },
    ...(p.mode === 'subscription' ? { subscription_data: { metadata: { product: key, ...(ent ? { entity_id: ent.id } : {}) } } } : {}),
    success_url: ent ? `${app}/e/${file}/orders?paid=1` : `${app}/welcome?session={CHECKOUT_SESSION_ID}`,
    cancel_url: ent ? `${app}/e/${file}/orders` : 'https://thebusinessclerk.com/pricing',
  });
  return NextResponse.redirect(session.url, 303);
}
