import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';
import { closeMonth, previousMonth, money } from '@/lib/billing';

const dollars = v => Math.round(parseFloat(String(v || '0').replace(/[^0-9.]/g, '')) * 100) || 0;

async function savePricing(fd) {
  'use server';
  const { sb } = await requireStaff();
  const tiers = [1, 2, 3, 4, 5].map(i => ({ up_to: parseInt(fd.get(`t${i}_up`)), cents: dollars(fd.get(`t${i}_price`)) })).filter(t => t.up_to > 0);
  await sb.from('mail_pricing').update({ tiers, base_cents: dollars(fd.get('base')), over_cents: dollars(fd.get('over')), package_cents: dollars(fd.get('package')), forward_cents: dollars(fd.get('forward')), updated_at: new Date().toISOString() }).eq('id', 1);
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
  const tiers = [...(p?.tiers || [])].sort((a, b) => a.up_to - b.up_to);
  const d = c => (c / 100).toFixed(2);
  return (<Shell profile={profile}>
    <h1>Mail billing</h1>
    <p className="sub">On the 1st of each month the system closes the previous month for every company with mail service: it counts the mail log, picks the tier, adds packages, forwarding and postage, subtracts the monthly plan already paid, and charges the difference to that company's card with an itemized invoice. Registered agent legal papers and state notices are never counted.</p>
    {searchParams?.saved && <p className="ok-msg">Price list saved.</p>}
    {searchParams?.closed && <p className="ok-msg">Month closed for {searchParams.closed} companies.</p>}

    <form action={savePricing} className="card stack" style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0 }}>Price list</h2>
      <p className="muted">Monthly price by number of mail items received (envelope logged, opened and scanned to the portal).</p>
      {[0, 1, 2, 3, 4].map(i => <div className="row" key={i}><label>Tier {i + 1}: up to (items)<input name={`t${i + 1}_up`} type="number" min="1" defaultValue={tiers[i]?.up_to || ''} /></label><label>Monthly price ($)<input name={`t${i + 1}_price`} defaultValue={tiers[i] ? d(tiers[i].cents) : ''} /></label></div>)}
      <div className="row"><label>Each item above the last tier ($)<input name="over" defaultValue={d(p?.over_cents || 0)} /></label><label>Monthly plan already charged by subscription ($)<input name="base" defaultValue={d(p?.base_cents || 0)} /></label></div>
      <div className="row"><label>Per package received ($)<input name="package" defaultValue={d(p?.package_cents || 0)} /></label><label>Forwarding handling per item ($, postage added at cost)<input name="forward" defaultValue={d(p?.forward_cents || 0)} /></label></div>
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
