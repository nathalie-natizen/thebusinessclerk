import { NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '@/lib/stripe';

// Public checkout link used by the website, e.g. https://app.thebusinessclerk.com/api/stripe/checkout?product=llc
export async function GET(req) {
  const url = new URL(req.url); const key = url.searchParams.get('product'); const p = PRODUCTS[key];
  const price = p && process.env[p.env];
  if (!price) return new NextResponse('Unknown or unconfigured product', { status: 400 });
  const app = process.env.NEXT_PUBLIC_APP_URL;
  const line_items = [{ price, quantity: 1 }];
  const session = await stripe().checkout.sessions.create({
    mode: p.mode,
    line_items,
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    ...(p.mode === 'payment' ? { customer_creation: 'always', invoice_creation: { enabled: true } } : {}),
    custom_fields: [{ key: 'company', label: { type: 'custom', custom: 'Company name (or the name you want)' }, type: 'text' }],
    consent_collection: { terms_of_service: 'required' },
    metadata: { product: key },
    ...(p.mode === 'subscription' ? { subscription_data: { metadata: { product: key } } } : {}),
    success_url: `${app}/welcome?session={CHECKOUT_SESSION_ID}`,
    cancel_url: 'https://thebusinessclerk.com/pricing',
  });
  return NextResponse.redirect(session.url, 303);
}
