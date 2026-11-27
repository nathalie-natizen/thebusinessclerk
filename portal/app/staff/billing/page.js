import Link from 'next/link';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';
import { money } from '@/lib/billing';
import { CATALOG } from '@/lib/prices';
import { KINDS } from '@/lib/labels';

export default async function StaffBilling({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const { data: sts } = await sb.from('mail_statements').select('*, entities(file_number, legal_name)').order('period_start', { ascending: false }).order('created_at', { ascending: false }).limit(200);
  const { data: failed } = await sb.from('entities').select('file_number, legal_name, contact_name, contact_phone, payment_issue').not('payment_issue', 'is', null);
  const { data: unpaidSt } = await sb.from('mail_statements').select('id, period_start, total_cents, status, error, created_at, entities(file_number, legal_name)').in('status', ['failed', 'needs_card', 'invoiced']).order('created_at');
  const { data: pendingOrders } = await sb.from('orders').select('id, kind, service, amount_cents, created_at, entities(file_number, legal_name)').eq('status', 'awaiting_payment').order('created_at');
  const days = d => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));
  const age = d => { const n = days(d); return <span className={`pill ${n >= 30 ? 'urgent' : n >= 7 ? 'warn' : ''}`}>{n} day{n === 1 ? '' : 's'}</span>; };
  const owed = [...(failed || []).map(f => f.payment_issue.amount || 0), ...(unpaidSt || []).map(x => x.total_cents || 0), ...(pendingOrders || []).map(o => o.amount_cents || CATALOG[o.kind]?.cents || 0)].reduce((a, b) => a + b, 0);
  const lateCount = (failed || []).length + (unpaidSt || []).length + (pendingOrders || []).length;
  return (<Shell profile={profile}>
    <h1>Billing</h1>
    <p className="sub">On the 1st of each month the system closes the previous month for every company with mail service: it counts the mail log, scans, packages, forwarding and postage, picks the cheapest scan level, subtracts the monthly plan already paid, and charges the difference to that company's card with an itemized invoice. Registered agent legal papers and state notices are never counted. Annual pack companies pay no per-item, package or forwarding fees, and their first 5 scans each month are free.</p>
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
    <p className="muted">One-off service charges and receipts for each company are on that company's file (Orders, and the client's Billing tab). Monthly mail statements are below; the system closes each month automatically on the 1st.</p>

    <h2>Statements</h2>
    {!sts?.length ? <p className="muted">No statements yet.</p> : <div className="scroll"><table><thead><tr><th>Month</th><th>Company</th><th>Items</th><th>Charged</th><th>Status</th><th></th></tr></thead><tbody>
      {sts.map(s => <tr key={s.id}><td>{s.period_start.slice(0, 7)}</td><td><Link className="file" href={`/staff/e/${s.entities?.file_number}`}>{s.entities?.file_number}</Link> {s.entities?.legal_name}</td><td>{s.items_count}</td><td>{money(s.total_cents)}</td>
        <td><span className={`pill ${s.status === 'paid' || s.status === 'no_charge' ? 'ok' : s.status === 'failed' || s.status === 'needs_card' ? 'urgent' : 'warn'}`}>{s.status.replace('_', ' ')}</span>{s.error && <div className="muted">{s.error}</div>}</td>
        <td><Link href={`/billing/statement/${s.id}`}>View</Link>{s.invoice_url && <> · <a href={s.invoice_url} target="_blank" rel="noopener noreferrer">Invoice</a></>}</td></tr>)}
    </tbody></table></div>}
  </Shell>);
}
