import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { stripe } from './stripe';
import { notifyEntity } from './notify';
import { MAIL_CATEGORY } from './labels';

// Registered agent legal papers and state notices never count toward the mail plan
const FREE = ['service_of_process', 'state_notice'];
const money = c => '$' + (c / 100).toFixed(2);

// Pick the cheapest scan level for this many scans (clients never choose a plan; the month-end bill always takes the lowest total)
export function bestScanLevel(scans, p) {
  const opts = (p.scan_levels || []).map(l => ({ ...l, total: l.cents + Math.max(0, scans - l.included) * l.extra_cents }));
  if (!scans) return null;
  return opts.sort((a, b) => a.total - b.total || b.included - a.included)[0];
}

// Build (or rebuild) the statement for one company and one month. Does not charge.
export async function buildStatement(entity, start, end, pricing) {
  const db = supabaseAdmin();
  const { data: items } = await db.from('mail_items').select('id, received_at, sender, category, status, client_request, forward_shipping, postage_cents, tracking_number, scanned_at, pages')
    .eq('entity_id', entity.id).gte('received_at', start + 'T00:00:00-05:00').lt('received_at', end + 'T00:00:00-05:00').order('received_at');
  const all = items || [];
  const counted = all.filter(i => !FREE.includes(i.category));
  const packages = counted.filter(i => i.category === 'package');
  const forwarded = counted.filter(i => ['forwarded', 'delivered'].includes(i.status));
  const scanned = counted.filter(i => i.scanned_at);
  const extraPages = scanned.reduce((s, i) => s + Math.max(0, (i.pages || 0) - pricing.scan_pages), 0);
  const postage = forwarded.reduce((s, i) => s + (i.postage_cents || 0), 0);
  const lines = [{ label: `Business address & mail plan (${counted.length} item${counted.length === 1 ? '' : 's'} logged, ${pricing.included_items} included)`, cents: entity.mail_service ? pricing.base_cents : 0 }];
  // Annual pack: no per-item, package or forwarding fees; only postage at cost (and scans, if requested)
  const pack = !!entity.bundle;
  if (pack) lines[0].label = `Business address & mail (annual pack, prepaid): ${counted.length} item${counted.length === 1 ? '' : 's'} logged, no per-item fees`;
  const over = pack ? 0 : Math.max(0, counted.length - pricing.included_items);
  if (over) lines.push({ label: `Mail above ${pricing.included_items} items: ${over} × ${money(pricing.over_item_cents)}`, cents: over * pricing.over_item_cents });
  if (packages.length && !pack) lines.push({ label: `Packages received: ${packages.length} × ${money(pricing.package_cents)}`, cents: packages.length * pricing.package_cents });
  if (forwarded.length && !pack) lines.push({ label: `Forwarding: ${forwarded.length} × ${money(pricing.forward_cents)}`, cents: forwarded.length * pricing.forward_cents });
  if (postage) lines.push({ label: 'Postage (at cost)', cents: postage });
  const lvl = bestScanLevel(scanned.length, pricing);
  if (lvl) lines.push({ label: `Open & scan: ${scanned.length} scan${scanned.length === 1 ? '' : 's'}, best price ${lvl.name}${lvl.cents ? ` (${money(lvl.cents)} for ${lvl.included})` : ''}${scanned.length > lvl.included ? ` + ${scanned.length - lvl.included} × ${money(lvl.extra_cents)}` : ''}`, cents: lvl.total });
  if (extraPages) lines.push({ label: `Extra scanned pages (over ${pricing.scan_pages} per item): ${extraPages} × ${money(pricing.page_cents)}`, cents: extraPages * pricing.page_cents });
  const gross = lines.reduce((s, l) => s + l.cents, 0);
  const base = entity.mail_service ? pricing.base_cents : 0;
  if (base) lines.push({ label: pack ? 'Less: included in your annual pack' : 'Less: monthly plan already paid by subscription', cents: -base });
  const total = Math.max(0, gross - base);
  const row = {
    entity_id: entity.id, period_start: start, period_end: end, items_count: counted.length, lines, base_cents: base, total_cents: total,
    items: all.map(i => ({ date: i.received_at, sender: i.sender, type: MAIL_CATEGORY[i.category] || i.category, counted: !FREE.includes(i.category),
      scanned: !!i.scanned_at, pages: i.pages || null, forwarded: forwarded.some(f => f.id === i.id), postage_cents: i.postage_cents || 0, tracking: i.tracking_number })),
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
    await notifyEntity(entity.id, { category: 'billing',
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
