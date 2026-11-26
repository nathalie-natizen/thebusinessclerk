'use server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { KINDS } from '@/lib/labels';
import { needsQuestionnaire } from '@/lib/questionnaires';
import { GUIDELINES_VERSION } from '@/lib/guidelines';
import { recordAcceptance } from '@/lib/agreements';
import { prices } from '@/lib/prices';
import { sendEmail, notifyStaff } from '@/lib/notify';

const FORMATION = ['llc', 'corp'];
const clip = (v, n = 200) => String(v ?? '').trim().slice(0, n);

export async function submitIntake(_prev, fd) {
  // Simple spam protection: a hidden field people never see must stay empty
  if (fd.get('website')) return { error: 'spam' };
  const lang = ['en', 'pt', 'es'].includes(fd.get('lang')) ? fd.get('lang') : 'en';
  const service = String(fd.get('service'));
  if (!KINDS[service]) return { error: 'required' };
  const addons = FORMATION.includes(service) ? ['ein', 'mail', 'launch'].filter(k => fd.get('addon_' + k) === 'on') : [];
  const g = k => clip(fd.get(k));
  const email = g('email').toLowerCase();
  if (!g('contact_name') || !/^\S+@\S+\.\S+$/.test(email) || !g('company') || fd.get('terms') !== 'on' || fd.get('service_terms') !== 'on' || !g('sign_name')) return { error: 'required' };
  if (FORMATION.includes(service) && (!g('p1_name') || !g('name2') || !g('signer'))) return { error: 'required' };

  const people = [1, 2, 3, 4].map(i => ({ name: g(`p${i}_name`), title: g(`p${i}_title`), address: g(`p${i}_address`, 300) })).filter(p => p.name);
  const useOurs = fd.get('use_our_address') === 'on' && (service === 'mail' || addons.includes('mail'));
  const details = {
    service, addons, company: g('company'), names: [g('company'), g('name2'), g('name3')].filter(Boolean), ending: g('ending', 40) || null,
    use_backup: fd.get('use_backup') === 'on', management: g('management'), shares: g('shares', 20), par: g('par', 20), incorporator: g('incorporator'), s_corp: g('s_corp'),
    effective_date: g('effective_date', 10), signer: g('signer'), mailing_address: g('mailing_address'), sunbiz_doc_number: g('doc'), purpose: g('purpose', 300),
    principal_address: useOurs ? 'Use THE BUSINESS CLERK office address' : [g('line1'), g('line2'), g('city'), g('state'), g('postal'), g('country')].filter(Boolean).join(', '),
    people, contact: { name: g('contact_name'), email, phone: g('phone', 40), language: lang }, notes: g('notes', 2000),
    ip: headers().get('x-forwarded-for')?.split(',')[0] || null, submitted_at: new Date().toISOString(), terms_accepted: true, service_terms_version: GUIDELINES_VERSION,
  };

  const db = supabaseAdmin();
  const { data: entity, error } = await db.from('entities').insert({
    legal_name: FORMATION.includes(service) && details.ending && !details.company.toUpperCase().endsWith(details.ending.toUpperCase()) ? `${details.company} ${details.ending}` : details.company, entity_type: service === 'corp' ? 'Corporation' : 'LLC', status: FORMATION.includes(service) ? 'pending' : 'active',
    sunbiz_doc_number: details.sunbiz_doc_number || null, registered_agent: FORMATION.includes(service) || service === 'ra',
    mail_service: service === 'mail' || addons.includes('mail'), contact_name: details.contact.name, contact_email: email, contact_phone: details.contact.phone || null, language: lang,
  }).select().single();
  if (error) return { error: 'server' };
  await db.from('mail_preferences').insert({ entity_id: entity.id });
  await recordAcceptance(entity, [service, ...addons], { name: g('sign_name'), email });

  // Pay online only when every needed Stripe price is set up; otherwise we send a payment link later
  const kinds = [service, ...addons];
  const pr = await prices();
  const canPay = !!process.env.STRIPE_SECRET_KEY && kinds.every(k => pr[k]);
  const orders = [];
  for (const k of kinds) {
    const { data: o } = await db.from('orders').insert({ entity_id: entity.id, kind: k, service: KINDS[k].name, status: canPay ? 'awaiting_payment' : needsQuestionnaire(k) ? 'information_needed' : 'received', source: 'website', details: k === service ? details : { parent_service: service, service_terms_version: GUIDELINES_VERSION } }).select().single();
    await db.from('order_events').insert({ order_id: o.id, status: o.status, note: o.status === 'information_needed' ? 'Order placed. Please complete the short questionnaire in your portal so we can start.' : 'Order placed on the website.' });
    orders.push(o);
  }
  // Give the client portal access: link now if they already have a login, otherwise on first sign-in
  const { data: prof } = await db.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (prof) await db.from('entity_members').upsert({ entity_id: entity.id, user_id: prof.id });
  else await db.from('invitations').upsert({ email, entity_id: entity.id });

  const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';
  const names = kinds.map(k => KINDS[k].name).join(', ');
  if (!canPay) await sendEmail(email, `Order received: ${entity.legal_name} (${entity.file_number})`, `Thank you, ${details.contact.name}. We received your order: ${names}.\n\nYour company file number is ${entity.file_number}. Follow every step and complete any questionnaire in your client portal. Sign in with this email: ${APP}/login\n\nTHE BUSINESS CLERK`).catch(() => {});
  if (!canPay) await notifyStaff({ subject: `New website order: ${entity.legal_name} (${entity.file_number})`, text: `${names}\nContact: ${details.contact.name} · ${email} · ${details.contact.phone || ''}\n\n${APP}/staff/pipeline` }).catch(() => {});
  if (!canPay) redirect(`/start/thanks?file=${entity.file_number}&lang=${lang}`);

  const app = process.env.NEXT_PUBLIC_APP_URL;
  const recurring = kinds.some(k => KINDS[k].recurring);
  const meta = { entity_id: entity.id, order_ids: orders.map(o => o.id).join(',') };
  const session = await stripe().checkout.sessions.create({
    mode: recurring ? 'subscription' : 'payment',
    line_items: kinds.map(k => ({ price: pr[k].id, quantity: 1 })),
    customer_email: email,
    billing_address_collection: 'required',
    ...(recurring ? { subscription_data: { metadata: meta } } : { customer_creation: 'always', invoice_creation: { enabled: true }, payment_intent_data: { setup_future_usage: 'off_session' } }),
    consent_collection: { terms_of_service: 'required' },
    metadata: meta,
    locale: lang === 'en' ? 'en' : lang === 'pt' ? 'pt-BR' : 'es',
    success_url: `${app}/start/thanks?file=${entity.file_number}&lang=${lang}&paid=1`,
    cancel_url: `${app}/start/thanks?file=${entity.file_number}&lang=${lang}`,
  });
  redirect(session.url);
}
