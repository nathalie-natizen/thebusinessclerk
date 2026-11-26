import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Opens Stripe's secure billing page: update card on file, see invoices, manage subscriptions
export async function POST(req) {
  const form = await req.formData(); const entityId = String(form.get('entity_id'));
  const sb = supabaseServer();
  const { data: e } = await sb.from('entities').select('stripe_customer_id').eq('id', entityId).single(); // RLS: members only
  if (!e?.stripe_customer_id) return NextResponse.redirect(new URL('/billing?missing=1', req.url), 303);
  const s = await stripe().billingPortal.sessions.create({ customer: e.stripe_customer_id, return_url: `${process.env.NEXT_PUBLIC_APP_URL}${String(form.get('return') || '/billing').startsWith('/') ? String(form.get('return') || '/billing') : '/billing'}` });
  return NextResponse.redirect(s.url, 303);
}
