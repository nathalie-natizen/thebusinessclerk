import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';
import { closeMonth, previousMonth, money } from '@/lib/billing';

const dollars = v => Math.round(parseFloat(String(v || '0').replace(/[^0-9.]/g, '')) * 100) || 0;

async function savePricing(fd) {
  'use server';
  const { sb } = await requireStaff();
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
  await requireStaff();
  const [y, m] = String(fd.get('period')).split('-').map(Number);
  if (!y || !m) return;
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
  return (<Shell profile={profile}>
    <h1>Mail billing</h1>
    <p className="sub">On the 1st of each month the system closes the previous month for every company with mail service: it counts the mail log, scans, packages, forwarding and postage, picks the cheapest scan level, subtracts the monthly plan already paid, and charges the difference to that company's card with an itemized invoice. Registered agent legal papers and state notices are never counted.</p>
    {searchParams?.saved && <p className="ok-msg">Price list saved.</p>}
    {searchParams?.closed && <p className="ok-msg">Month closed for {searchParams.closed} companies.</p>}

    <form action={savePricing} className="card stack" style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0 }}>Price list</h2>
      <h3>Business address &amp; mail (base)</h3>
      <div className="row"><label>Monthly plan ($, charged by subscription)<input name="base" defaultValue={d(p?.base_cents || 0)} /></label><label>Items logged per month included<input name="included" type="number" defaultValue={p?.included_items ?? 30} /></label><label>Each item above that ($)<input name="over" defaultValue={d(p?.over_item_cents || 0)} /></label></div>
      <div className="row"><label>Forwarding per item ($, postage at cost on top)<input name="forward" defaultValue={d(p?.forward_cents || 0)} /></label><label>Per package received ($)<input name="package" defaultValue={d(p?.package_cents || 0)} /></label></div>
      <h3>Open, scan &amp; upload</h3>
      <div className="row"><label>Pages included per scan<input name="scan_pages" type="number" defaultValue={p?.scan_pages ?? 10} /></label><label>Each extra page ($)<input name="page" defaultValue={d(p?.page_cents || 0)} /></label></div>
      <p className="muted">Scan levels. Clients don't choose one: at month end the system prices that month's scans under every level and charges the cheapest. Keep a "Pay as you go" level with $0 monthly price and 0 included.</p>
      {[0, 1, 2, 3, 4, 5].map(i => { const l = levels[i]; return <div className="row" key={i}>
        <label>Level name<input name={`l${i + 1}_name`} defaultValue={l?.name || ''} /></label>
        <label>Monthly price ($)<input name={`l${i + 1}_price`} defaultValue={l ? d(l.cents) : ''} /></label>
        <label>Scans included<input name={`l${i + 1}_inc`} type="number" defaultValue={l?.included ?? ''} /></label>
        <label>Each extra scan ($)<input name={`l${i + 1}_extra`} defaultValue={l ? d(l.extra_cents) : ''} /></label></div>; })}
      <button className="btn">Save price list</button>
    </form>

    <form action={runClose} className="row card" style={{ marginBottom: 20 }}>
      <label>Close a month now (it also runs automatically on the 1st)<input name="period" type="month" defaultValue={def} /></label>
      <button className="btn sec" style={{ flex: '0 0 auto' }}>Close month and charge</button>
    </form>

    <h2>Statements</h2>
    {!sts?.length ? <p className="muted">No statements yet.</p> : <div className="scroll"><table><thead><tr><th>Month</th><th>Company</th><th>Items</th><th>Charged</th><th>Status</th><th></th></tr></thead><tbody>
      {sts.map(s => <tr key={s.id}><td>{s.period_start.slice(0, 7)}</td><td><Link className="file" href={`/staff/e/${s.entities?.file_number}`}>{s.entities?.file_number}</Link> {s.entities?.legal_name}</td><td>{s.items_count}</td><td>{money(s.total_cents)}</td>
        <td><span className={`pill ${s.status === 'paid' || s.status === 'no_charge' ? 'ok' : s.status === 'failed' || s.status === 'needs_card' ? 'urgent' : 'warn'}`}>{s.status.replace('_', ' ')}</span>{s.error && <div className="muted">{s.error}</div>}</td>
        <td><Link href={`/billing/statement/${s.id}`}>View</Link>{s.invoice_url && <> · <a href={s.invoice_url} target="_blank" rel="noopener noreferrer">Invoice</a></>}</td></tr>)}
    </tbody></table></div>}
  </Shell>);
}
