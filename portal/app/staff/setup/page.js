import Shell from '@/components/Shell';
import Action from './Actions';
import { requireStaff } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { ensureCatalog, prices, CATALOG, WEBHOOK_EVENTS } from '@/lib/prices';
import { sendEmail, sendSms } from '@/lib/notify';
import { OFFICE } from '@/lib/office';

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';
const on = (...k) => k.every(x => !!process.env[x]);

async function syncPrices() {
  'use server';
  await requireStaff();
  if (!process.env.STRIPE_SECRET_KEY) return { error: 'Add STRIPE_SECRET_KEY in Vercel first.' };
  try { const r = await ensureCatalog(); return { message: r.map(([k, s]) => `${CATALOG[k].name}: ${s}`).join('\n') }; } catch (e) { return { error: e.message }; }
}
async function makeWebhook() {
  'use server';
  await requireStaff();
  if (!process.env.STRIPE_SECRET_KEY) return { error: 'Add STRIPE_SECRET_KEY in Vercel first.' };
  const url = `${APP}/api/stripe/webhook`; const s = stripe();
  const list = await s.webhookEndpoints.list({ limit: 100 });
  const found = list.data.find(w => w.url === url);
  if (found) { await s.webhookEndpoints.update(found.id, { enabled_events: WEBHOOK_EVENTS }); return { message: `Webhook already exists; events updated (${WEBHOOK_EVENTS.join(', ')}). If STRIPE_WEBHOOK_SECRET is not set, open it in the Stripe dashboard and reveal its signing secret.` }; }
  const w = await s.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS, description: 'THE BUSINESS CLERK portal' });
  return { message: `Webhook created for ${url}.`, secret: w.secret };
}
async function testEmail() {
  'use server';
  const { profile } = await requireStaff();
  const r = await sendEmail(profile.email, 'Test email from THE BUSINESS CLERK portal', 'If you can read this, client emails are working.');
  return r.ok ? { message: `Sent to ${profile.email}.` } : { error: r.error };
}
async function testSms() {
  'use server';
  const { profile } = await requireStaff();
  if (!profile.phone) return { error: 'Add your mobile number on the Account page first.' };
  const r = await sendSms(profile.phone, 'THE BUSINESS CLERK: test text message. Client alerts are working.');
  return r.ok ? { message: `Sent to ${profile.phone}.` } : { error: r.error };
}

export default async function Setup() {
  const { profile } = await requireStaff();
  const pr = await prices();
  const missingPrices = Object.keys(CATALOG).filter(k => !pr[k]);
  const rows = [
    ['Stripe: secret key', on('STRIPE_SECRET_KEY'), 'Vercel env STRIPE_SECRET_KEY (live key, sk_live_…)'],
    ['Stripe: prices', on('STRIPE_SECRET_KEY') && !missingPrices.length, missingPrices.length ? `Missing: ${missingPrices.join(', ')}. Use the button below.` : 'All prices found by lookup key'],
    ['Stripe: webhook secret', on('STRIPE_WEBHOOK_SECRET'), 'Create the webhook below, then add STRIPE_WEBHOOK_SECRET in Vercel'],
    ['Email (Resend)', on('RESEND_API_KEY', 'EMAIL_FROM'), 'RESEND_API_KEY and EMAIL_FROM (e.g. THE BUSINESS CLERK <hello@thebusinessclerk.com>)'],
    ['Text messages (Twilio)', on('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'), 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (+1…); A2P 10DLC registration needs the EIN'],
    ['Package tracking (EasyPost)', on('EASYPOST_API_KEY'), 'Webhook already created in EasyPost'],
    ['Office address', !!OFFICE.street && !!OFFICE.zip, 'OFFICE_STREET, OFFICE_CITY, OFFICE_ZIP, OFFICE_PHONE (used on Form 1583 and client addresses)'],
    ['Scheduled jobs secret', on('CRON_SECRET'), 'CRON_SECRET (any long random text) protects the monthly billing and daily jobs'],
  ];
  return (<Shell profile={profile}>
    <h1>Go-live setup</h1>
    <p className="sub">What the portal still needs before taking real orders. Keys are added by you in Vercel (Project → Settings → Environment Variables), then redeploy. Values are never shown here.</p>
    <table><thead><tr><th>Item</th><th>Status</th><th>How</th></tr></thead><tbody>{rows.map(([n, ok, how]) => <tr key={n}><td>{n}</td><td><span className={`pill ${ok ? 'ok' : 'urgent'}`}>{ok ? 'Ready' : 'Needed'}</span></td><td style={{ fontSize: 14 }}>{how}</td></tr>)}</tbody></table>
    <section className="card stack" style={{ marginTop: 18 }}>
      <h2 style={{ margin: 0 }}>Stripe</h2>
      <Action action={syncPrices} label="Create / update Stripe prices" hint="Creates every product and price from our price list. Safe to run again after a price change." />
      <Action action={makeWebhook} label="Create Stripe webhook" hint={`Points Stripe to ${APP}/api/stripe/webhook with the events the portal needs.`} />
    </section>
    <section className="card stack" style={{ marginTop: 18 }}>
      <h2 style={{ margin: 0 }}>Notifications</h2>
      <Action action={testEmail} label="Send me a test email" />
      <Action action={testSms} label="Send me a test text" />
      <p className="muted" style={{ margin: 0 }}>Also set Resend as the email sender for sign-in links: Supabase → Authentication → Emails → SMTP settings (host smtp.resend.com, port 465, user resend, password = Resend API key, sender hello@thebusinessclerk.com). Without it, Supabase only sends about 2 sign-in emails per hour.</p>
    </section>
  </Shell>);
}
