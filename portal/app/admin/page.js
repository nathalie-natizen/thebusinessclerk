import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireAdmin } from '@/lib/auth';
import { closeMonth, previousMonth } from '@/lib/billing';

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
  redirect('/admin?saved=1');
}
async function runClose(fd) {
  'use server';
  await requireAdmin();
  const [y, m] = String(fd.get('period')).split('-').map(Number);
  if (!y || !m || fd.get('confirm') !== 'on') redirect('/admin?confirm=1');
  const r = await closeMonth(y, m);
  redirect(`/admin?closed=${r.length}`);
}


// Admin back end (not part of the staff portal menu): go-live setup, mail price list, manual month close
export default async function Admin({ searchParams }) {
  const { sb, profile } = await requireAdmin();
  const { data: p } = await sb.from('mail_pricing').select('*').eq('id', 1).single();
  const prev = previousMonth(); const def = `${prev.year}-${String(prev.month).padStart(2, '0')}`;
  const levels = [...(p?.scan_levels || [])].sort((a, b) => a.included - b.included);
  const d = c => (c / 100).toFixed(2);
  const admin = true;
  const { count: mailCos } = await sb.from('entities').select('id', { count: 'exact', head: true }).eq('mail_service', true);
  return (<Shell profile={profile}>
    <h1>Admin</h1>
    <p className="sub">Back-end settings, not part of the staff portal. Only admins can open this page. <Link href="/admin/setup">Go-live setup (Stripe, email, texts) →</Link></p>
    {searchParams?.saved && <p className="ok-msg">Price list saved.</p>}
    {searchParams?.closed && <p className="ok-msg">Month closed for {searchParams.closed} companies.</p>}
    {searchParams?.confirm && <p className="err">Tick the confirmation box to close the month.</p>}
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

  </Shell>);
}
