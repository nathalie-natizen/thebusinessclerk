import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { stripe } from './stripe';
import { notifyEntity } from './notify';
import { MAIL_CATEGORY } from './labels';

// Registered agent legal papers and state notices never count toward the mail plan
const FREE = ['service_of_process', 'state_notice'];
const money = c => '$' + (c / 100).toFixed(2);

export function tierFor(count, p) {
  const tiers = [...(p.tiers || [])].sort((a, b) => a.up_to - b.up_to);
  const t = tiers.find(x => count <= x.up_to);
  if (t) return { cents: t.cents, label: `Mail plan: ${count} item${count === 1 ? '' : 's'} (tier up to ${t.up_to})`, extra: 0 };
  const last = tiers[tiers.length - 1] || { up_to: 0, cents: 0 };
  const over = count - last.up_to;
  return { cents: last.cents + over * p.over_cents, label: `Mail plan: ${count} items (${last.up_to} + ${over} extra at ${money(p.over_cents)})`, extra: over };
}

// Build (or rebuild) the statement for one company and one month. Does not charge.
export async function buildStatement(entity, start, end, pricing) {
  const db = supabaseAdmin();
  const { data: items } = await db.from('mail_items').select('id, received_at, sender, category, status, client_request, forward_shipping, postage_cents, tracking_number')
    .eq('entity_id', entity.id).gte('received_at', start + 'T00:00:00-05:00').lt('received_at', end + 'T00:00:00-05:00').order('received_at');
  const billable = (items || []).filter(i => !FREE.includes(i.category));
  const packages = billable.filter(i => i.category === 'package').length;
  const forwarded = billable.filter(i => ['forwarded', 'delivered'].includes(i.status) || i.client_request === 'forward');
  const postage = forwarded.reduce((s, i) => s + (i.postage_cents || 0), 0);
  const tier = tierFor(billable.length, pricing);
  const lines = [{ label: tier.label, cents: tier.cents }];
  if (packages) lines.push({ label: `Packages received: ${packages} × ${money(pricing.package_cents)}`, cents: packages * pricing.package_cents });
  if (forwarded.length) lines.push({ label: `Forwarding handling: ${forwarded.length} × ${money(pricing.forward_cents)}`, cents: forwarded.length * pricing.forward_cents });
  if (postage) lines.push({ label: 'Postage (at cost)', cents: postage });
  const gross = lines.reduce((s, l) => s + l.cents, 0);
  const base = entity.mail_service ? pricing.base_cents : 0;
  lines.push({ label: 'Less: monthly plan already paid', cents: -Math.min(base, gross) });
  const total = Math.max(0, gross - base);
  const row = {
    entity_id: entity.id, period_start: start, period_end: end, items_count: billable.length, lines, base_cents: base, total_cents: total,
    items: (items || []).map(i => ({ date: i.received_at, sender: i.sender, type: MAIL_CATEGORY[i.category] || i.category, counted: !FREE.includes(i.category), forwarded: forwarded.some(f => f.id === i.id), postage_cents: i.postage_cents || 0, tracking: i.tracking_number })),
  };
  const { data } = await db.from('mail_statements').upsert(row, { onConflict: 'entity_id,period_start' }).select().single();
  return data;
}

// Charge a statement to the company's card on file through a Stripe invoice that lists each charge
export async function chargeStatement(st, entity) {
  const db = supabaseAdmin();
  if (['invoiced', 'paid'].includes(st.status)) return st;
  if (st.total_cents <= 0) { await db.from('mail_statements').update({ status: 'no_charge' }).eq('id', st.id); return { ...st, status: 'no_charge' }; }
  if (!process.env.STRIPE_SECRET_KEY || !entity.stripe_customer_id) { await db.from('mail_statements').update({ status: 'needs_card' }).eq('id', st.id); return { ...st, status: 'needs_card' }; }
  const s = stripe(); const app = process.env.NEXT_PUBLIC_APP_URL;
  try {
    const inv = await s.invoices.create({
      customer: entity.stripe_customer_id, collection_method: 'charge_automatically', auto_advance: true, pending_invoice_items_behavior: 'exclude',
      description: `Mail activity ${st.period_start} to ${st.period_end} for ${entity.legal_name} (${entity.file_number}). ${st.items_count} items. Full item list: ${app}/billing/statement/${st.id}`,
      metadata: { statement_id: st.id, entity_id: entity.id, file_number: entity.file_number },
    });
    for (const l of st.lines) if (l.cents !== 0) await s.invoiceItems.create({ customer: entity.stripe_customer_id, invoice: inv.id, currency: 'usd', amount: l.cents, description: l.label });
    const fin = await s.invoices.finalizeInvoice(inv.id);
    let paid = fin;
    try { paid = await s.invoices.pay(inv.id); } catch { /* card declined: Stripe retries automatically */ }
    const status = paid.status === 'paid' ? 'paid' : 'invoiced';
    await db.from('mail_statements').update({ status, stripe_invoice_id: inv.id, invoice_url: paid.hosted_invoice_url, error: null }).eq('id', st.id);
    await notifyEntity(entity.id, {
      subject: `Mail statement for ${entity.legal_name}: ${money(st.total_cents)}`,
      text: `Your mail statement for ${st.period_start} to ${st.period_end} is ready: ${st.items_count} items, ${money(st.total_cents)} ${status === 'paid' ? 'charged to your card on file' : 'due'}.\n\nSee every item: ${app}/billing/statement/${st.id}`,
    });
    return { ...st, status };
  } catch (e) {
    await db.from('mail_statements').update({ status: 'failed', error: e.message }).eq('id', st.id);
    return { ...st, status: 'failed' };
  }
}

// Close a month for every company with mail service. Safe to run more than once.
export async function closeMonth(year, month /* 1-12 */) {
  const db = supabaseAdmin();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nx = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const { data: pricing } = await db.from('mail_pricing').select('*').eq('id', 1).single();
  const { data: entities } = await db.from('entities').select('*').eq('mail_service', true);
  const out = [];
  for (const e of entities || []) {
    const { data: existing } = await db.from('mail_statements').select('status').eq('entity_id', e.id).eq('period_start', start).maybeSingle();
    if (existing && ['invoiced', 'paid'].includes(existing.status)) { out.push({ file: e.file_number, status: existing.status }); continue; }
    const st = await buildStatement(e, start, nx, pricing);
    const r = await chargeStatement(st, e);
    out.push({ file: e.file_number, status: r.status, total: r.total_cents });
  }
  return out;
}

export const previousMonth = (d = new Date()) => {
  const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const m = et.getMonth(); // 0-based current month
  return m === 0 ? { year: et.getFullYear() - 1, month: 12 } : { year: et.getFullYear(), month: m };
};
export { money };
