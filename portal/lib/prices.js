import 'server-only';
import { stripe } from './stripe';
import { FILINGS } from './filings';

// Our price list in Stripe. Prices are found by lookup key (tbc_<service>), so no price IDs need to be copied into settings.
// Keep amounts in step with the website (config.js). "Create / update Stripe prices" on Staff > Setup applies changes.
export const CATALOG = {
  llc: { name: 'Florida LLC Formation', cents: 21300, desc: 'Service, $125 state filing fee and first year of registered agent' },
  corp: { name: 'Florida Corporation Formation', cents: 15800, desc: 'Service, $70 state filing fee and first year of registered agent' },
  ra: { name: 'Florida Registered Agent', cents: 4900, interval: 'year' },
  annual_report: { name: 'Annual Report Filing (service fee)', cents: 10000, desc: 'State fee charged separately when filed' },
  ein: { name: 'EIN Application', cents: 7500 },
  mail: { name: 'Business Address & Mail (base plan)', cents: 2500, interval: 'month', desc: '30 items logged a month; usage billed at month end' },
  bundle: { name: 'Annual Essentials Pack: Registered Agent + Annual Report + Business Address & Mail Forwarding', cents: 38900, interval: 'year', desc: 'Registered agent, annual report filing and 12 months of business address with scheduled mail forwarding and up to 5 scans a month; you pay only postage, plus the annual report state fee' },
  launch: { name: 'Launch Pack', cents: 59900, desc: 'Domain, email and website up to 5 pages, up to 2 revisions' },
  ...Object.fromEntries(Object.entries(FILINGS).map(([k, f]) => [k, { name: `${f.name} (service fee)`, cents: f.cents, desc: f.withRa ? 'Service and first year of registered agent; Florida state fee charged separately when filed' : 'Florida state fee charged separately when filed' }])),
};
const key = k => `tbc_${k}`;
let cache = null, cachedAt = 0;

export async function prices() {
  if (!process.env.STRIPE_SECRET_KEY) return {};
  if (cache && Date.now() - cachedAt < 300000) return cache;
  const r = await stripe().prices.list({ lookup_keys: Object.keys(CATALOG).map(key), active: true, limit: 100 }).catch(() => ({ data: [] }));
  cache = Object.fromEntries(r.data.map(p => [p.lookup_key.replace(/^tbc_/, ''), p])); cachedAt = Date.now();
  return cache;
}
export const priceOf = async k => (await prices())[k] || null;
export const isRa = price => price?.lookup_key === key('ra');
export const isMail = price => price?.lookup_key === key('mail');
export const isBundle = price => price?.lookup_key === key('bundle');

// Create missing products/prices, and replace any price whose amount changed (the lookup key moves to the new price)
export async function ensureCatalog() {
  const s = stripe(); const out = [];
  const existing = (await s.prices.list({ lookup_keys: Object.keys(CATALOG).map(key), active: true, limit: 100, expand: ['data.product'] })).data;
  for (const [k, c] of Object.entries(CATALOG)) {
    const cur = existing.find(p => p.lookup_key === key(k));
    const same = cur && cur.unit_amount === c.cents && (cur.recurring?.interval || null) === (c.interval || null);
    if (same) { out.push([k, 'ok']); continue; }
    const product = cur?.product?.id || (await s.products.create({ name: c.name, description: c.desc || undefined, metadata: { tbc: k } })).id;
    await s.prices.create({ product, currency: 'usd', unit_amount: c.cents, ...(c.interval ? { recurring: { interval: c.interval } } : {}), lookup_key: key(k), transfer_lookup_key: true, nickname: c.name });
    if (cur) await s.prices.update(cur.id, { active: false });
    out.push([k, cur ? 'updated' : 'created']);
  }
  cache = null;
  return out;
}

export const WEBHOOK_EVENTS = ['checkout.session.completed', 'customer.subscription.deleted', 'invoice.payment_failed', 'invoice.paid'];
