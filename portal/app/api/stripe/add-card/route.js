import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

// Save a card for one company (Stripe secure page). When it's saved, any order pending payment is charged automatically.
export async function POST(req) {
  const form = await req.formData(); const entityId = String(form.get('entity_id'));
  const { data: e } = await supabaseServer().from('entities').select('id, file_number, legal_name, stripe_customer_id, contact_email').eq('id', entityId).single(); // RLS: members/staff only
  if (!e) return NextResponse.redirect(new URL('/login', req.url), 303);
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.redirect(new URL(`/e/${e.file_number}/billing?notready=1`, req.url), 303);
  const s = stripe(); let customer = e.stripe_customer_id;
  if (!customer) {
    customer = (await s.customers.create({ name: e.legal_name, email: e.contact_email || undefined, metadata: { entity_id: e.id, file_number: e.file_number } })).id;
    await supabaseAdmin().from('entities').update({ stripe_customer_id: customer }).eq('id', e.id);
  }
  const app = process.env.NEXT_PUBLIC_APP_URL;
  const session = await s.checkout.sessions.create({ mode: 'setup', customer, currency: 'usd', payment_method_types: ['card'], metadata: { entity_id: e.id, purpose: 'card_on_file' },
    success_url: `${app}/e/${e.file_number}/billing?card=1`, cancel_url: `${app}/e/${e.file_number}/billing` });
  return NextResponse.redirect(session.url, 303);
}
