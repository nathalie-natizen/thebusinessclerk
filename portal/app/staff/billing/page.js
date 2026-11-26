import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireStaff, requireAdmin } from '@/lib/auth';
import { closeMonth, previousMonth, money } from '@/lib/billing';
import { CATALOG } from '@/lib/prices';
import { KINDS } from '@/lib/labels';

const dollars = v => Math.round(parseFloat(String(v || '0').replace(/[^0-9.]/g, '')) * 100) || 0;

async function savePricing(fd) {
  'use server';
  const { sb } = await requireAdmin();
  const scan_levels = [1, 2, 3, 4, 5, 6].map(i => ({ name: String(fd.get(`l${i}_name`) || '').trim(), cents: dollars(fd.get(`l${i}_price`)), included: parseInt(fd.get(`l${i}_inc`)) || 0, extra_cents: dollars(fd.get(`l${i}_extra`)) })).filter(l => l.name && l.extra_cents > 0);
  await sb.from('mail_pricing').update({
    base_cents: dollars(fd.get('base')), included_items: parseInt(fd.get('included')) || 0, over_item_cents: dollars(fd.get('over')),
    forward_cents: dollars(fd.get('forward')), package_cents: dollars(fd.get('package')), scan_pages: parseInt(fd.get('scan_pages')) || 10, page_cents: dollars(fd.get('page')),
    scan_levels, updated_at: new Date().toISOString(),
  }).eq('id', 1);
  redirect('/staff/billing?saved=1');
}
async function runClose(fd) {
  'use server';
  await requireAdmin();
  const [y, m] = String(fd.get('period')).split('-').map(Number);
  if (!y || !m || fd.get('confirm') !== 'on') redirect('/staff/billing?confirm=1');
  const r = await closeMonth(y, m);
  redirect(`/staff/billing?closed=${r.length}`);
}

export default async function StaffBilling({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const { data: p } = await sb.from('mail_pricing').select('*').eq('id', 1).single();
  const { data: sts } = await sb.from('mail_statements').select('*, entities(file_number, legal_name)').order('period_start', { ascending: false }).order('created_at', { ascending: false }).limit(200);
  const prev = previousMonth(); const def = `${prev.year}-${String(prev.month).padStart(2, '0')}`;
  const levels = [...(p?.scan_levels || [])].sort((a, b) => a.included - b.included);
  const d = c => (c / 100).toFixed(2);
  const admin = profile?.role === 'admin';
  const { count: mailCos } = await sb.from('entities').select('id', { count: 'exact', head: true }).eq('mail_service', true);
  const { data: failed } = await sb.from('entities').select('file_number, legal_name, contact_name, contact_phone, payment_issue').not('payment_issue', 'is', null);
  const { data: unpaidSt } = await sb.from('mail_statements').select('id, period_start, total_cents, status, error, created_at, entities(file_number, legal_name)').in('status', ['failed', 'needs_card', 'invoiced']).order('created_at');
  const { data: pendingOrders } = await sb.from('orders').select('id, kind, service, amount_cents, created_at, entities(file_number, legal_name)').eq('status', 'awaiting_payment').order('created_at');
  const days = d => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));
  const age = d => { const n = days(d); return <span className={`pill ${n >= 30 ? 'urgent' : n >= 7 ? 'warn' : ''}`}>{n} day{n === 1 ? '' : 's'}</span>; };
  const owed = [...(failed || []).map(f => f.payment_issue.amount || 0), ...(unpaidSt || []).map(x => x.total_cents || 0), ...(pendingOrders || []).map(o => o.amount_cents || CATALOG[o.kind]?.cents || 0)].reduce((a, b) => a + b, 0);
  const lateCount = (failed || []).length + (unpaidSt || []).length + (pendingOrders || []).length;
  return (<Shell profile={profile}>
    <h1>Billing</h1>
    <p className="sub">On the 1st of each month the system closes the previous month for every company with mail service: it counts the mail log, scans, packages, forwarding and postage, picks the cheapest scan level, subtracts the monthly plan already paid, and charges the difference to that company's card with an itemized invoice. Registered agent legal papers and state notices are never counted.</p>
    {searchParams?.saved && <p className="ok-msg">Price list saved.</p>}
    {searchParams?.closed && <p className="ok-msg">Month closed for {searchParams.closed} companies.</p>}
    {searchParams?.confirm && <p className="err">Tick the confirmation box to close the month.</p>}
    <section className="card" style={{ marginBottom: 20, borderLeft: `4px solid ${lateCount ? '#C0392B' : '#2E8B57'}` }}>
      <h2 style={{ marginTop: 0 }}>Unpaid and late accounts {lateCount > 0 && <span className="pill urgent">{lateCount} · {money(owed)} outstanding</span>}</h2>
      <p className="muted" style={{ marginTop: 0 }}>The system follows up on its own: a failed payment alerts the client (email, text and a portal banner) and staff right away, Stripe retries the card automatically, and orders waiting for payment are charged as soon as the client adds a card. The alert clears when a payment succeeds. Use this list to see who is behind and call when needed. Age: amber after 7 days, red after 30 (registered agent resignation can be considered after 30 days unpaid, with Nat's approval).</p>
      <h3>Failed card payments ({(failed || []).length})</h3>
      {!failed?.length ? <p className="muted">None.</p> : <div className="scroll"><table><thead><tr><th>Company</th><th>Amount</th><th>For</th><th>Failed on</th><th>Age</th><th>Contact</th></tr></thead><tbody>{failed.map(f => <tr key={f.file_number}><td><Link className="file" href={`/staff/e/${f.file_number}`}>{f.file_number}</Link> {f.legal_name}</td><td>{money(f.payment_issue.amount || 0)}</td><td>{f.payment_issue.what}</td><td>{new Date(f.payment_issue.at).toLocaleDateString('en-US')}</td><td>{age(f.payment_issue.at)}</td><td className="muted">{f.contact_name || ''} {f.contact_phone || ''}</td></tr>)}</tbody></table></div>}
      <h3>Unpaid mail statements ({(unpaidSt || []).length})</h3>
      {!unpaidSt?.length ? <p className="muted">None.</p> : <div className="scroll"><table><thead><tr><th>Company</th><th>Month</th><th>Amount</th><th>Status</th><th>Age</th></tr></thead><tbody>{unpaidSt.map(x => <tr key={x.id}><td><Link className="file" href={`/staff/e/${x.entities?.file_number}`}>{x.entities?.file_number}</Link> {x.entities?.legal_name}</td><td>{x.period_start.slice(0, 7)}</td><td>{money(x.total_cents)}</td><td><span className="pill urgent">{{ failed: 'Card declined', needs_card: 'No card on file', invoiced: 'Invoiced, not paid' }[x.status]}</span>{x.error && <div className="muted">{x.error}</div>}</td><td>{age(x.created_at)}</td></tr>)}</tbody></table></div>}
      <h3>Orders pending payment ({(pendingOrders || []).length})</h3>
      {!pendingOrders?.length ? <p className="muted">None.</p> : <div className="scroll"><table><thead><tr><th>Company</th><th>Service</th><th>Amount</th><th>Ordered</th><th>Age</th></tr></thead><tbody>{pendingOrders.map(o => <tr key={o.id}><td><Link className="file" href={`/staff/e/${o.entities?.file_number}?tab=orders`}>{o.entities?.file_number}</Link> {o.entities?.legal_name}</td><td>{KINDS[o.kind]?.name || o.service}</td><td>{money(o.amount_cents || CATALOG[o.kind]?.cents || 0)}</td><td>{new Date(o.created_at).toLocaleDateString('en-US')}</td><td>{age(o.created_at)}</td></tr>)}</tbody></table></div>}
      <p className="muted" style={{ marginBottom: 0 }}>Waiting for the client to add a card on their Billing tab; work starts once it is charged. These orders don't appear in the Pipeline until paid.</p>
    </section>
    <p className="muted">One-off service charges and receipts for each company are on that company's file (Orders, and the client's Billing tab). This page is the monthly mail billing.</p>

    <form action={savePricing} className="card stack" style={{ marginBottom: 20 }}><fieldset disabled={!admin} style={{ border: 0, padding: 0, margin: 0, display: 'contents' }}>
      <h2 style={{ margin: 0 }}>Price list{!admin && <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}> · read-only (admin can edit)</span>}</h2>
      <p className="muted" style={{ margin: 0 }}>Must match the website and the manual (section 6). Change prices everywhere at once.</p>
      <h3>Business address &amp; mail (base)</h3>
      <div className="row"><label>Monthly plan ($, charged by subscription)<input name="base" defaultValue={d(p?.base_cents || 0)} /></label><label>Items logged per month included<input name="included" type="number" defaultValue={p?.included_items ?? 30} /></label><label>Each item above that ($)<input name="over" defaultValue={d(p?.over_item_cents || 0)} /></label></div>
      <div className="row"><label>Forwarding per item ($, postage at cost on top)<input name="forward" defaultValue={d(p?.forward_cents || 0)} /></label><label>Per package received ($)<input name="package" defaultValue={d(p?.package_cents || 0)} /></label></div>
      <h3>Open, scan &amp; upload</h3>
      <div className="row"><label>Pages included per scan<input name="scan_pages" type="number" defaultValue={p?.scan_pages ?? 10} /></label><label>Each extra page ($)<input name="page" defaultValue={d(p?.page_cents || 0)} /></label></div>
      <p className="muted">Scan levels. Clients don't choose one: at month end the system prices that month's scans under every level and charges the cheapest. Keep a "Pay as you go" level with $0 monthly price and 0 included.</p>
      <table><thead><tr><th>Level name</th><th>Monthly price ($)</th><th>Scans included</th><th>Each extra scan ($)</th></tr></thead><tbody>
      {[0, 1, 2, 3, 4, 5].map(i => { const l = levels[i]; return <tr key={i}>
        <td><input aria-label="Level name" name={`l${i + 1}_name`} defaultValue={l?.name || ''} /></td>
        <td><input aria-label="Monthly price" name={`l${i + 1}_price`} defaultValue={l ? d(l.cents) : ''} /></td>
        <td><input aria-label="Scans included" name={`l${i + 1}_inc`} type="number" defaultValue={l?.included ?? ''} /></td>
        <td><input aria-label="Each extra scan" name={`l${i + 1}_extra`} defaultValue={l ? d(l.extra_cents) : ''} /></td></tr>; })}
      </tbody></table>
      {admin && <button className="btn">Save price list</button>}
    </fieldset></form>

    {admin && <form action={runClose} className="card stack" style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0 }}>Close a month manually</h2>
      <p className="muted" style={{ margin: 0 }}>This runs automatically on the 1st. Running it now charges every company with mail service ({mailCos || 0}) for the month you pick. A month already invoiced or paid is skipped.</p>
      <div className="row"><label>Month<input name="period" type="month" defaultValue={def} /></label></div>
      <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="confirm" required style={{ minHeight: 'auto' }} /> I checked the mail logs for this month and want to charge {mailCos || 0} compan{mailCos === 1 ? 'y' : 'ies'} now</label>
      <button className="btn sec" style={{ alignSelf: 'flex-start' }}>Close month and charge</button>
    </form>}

    <h2>Statements</h2>
    {!sts?.length ? <p className="muted">No statements yet.</p> : <div className="scroll"><table><thead><tr><th>Month</th><th>Company</th><th>Items</th><th>Charged</th><th>Status</th><th></th></tr></thead><tbody>
      {sts.map(s => <tr key={s.id}><td>{s.period_start.slice(0, 7)}</td><td><Link className="file" href={`/staff/e/${s.entities?.file_number}`}>{s.entities?.file_number}</Link> {s.entities?.legal_name}</td><td>{s.items_count}</td><td>{money(s.total_cents)}</td>
        <td><span className={`pill ${s.status === 'paid' || s.status === 'no_charge' ? 'ok' : s.status === 'failed' || s.status === 'needs_card' ? 'urgent' : 'warn'}`}>{s.status.replace('_', ' ')}</span>{s.error && <div className="muted">{s.error}</div>}</td>
        <td><Link href={`/billing/statement/${s.id}`}>View</Link>{s.invoice_url && <> · <a href={s.invoice_url} target="_blank" rel="noopener noreferrer">Invoice</a></>}</td></tr>)}
    </tbody></table></div>}
  </Shell>);
}
