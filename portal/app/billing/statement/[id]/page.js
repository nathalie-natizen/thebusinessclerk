import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';
import { fmtDay } from '@/lib/labels';

const money = c => (c < 0 ? '−$' : '$') + (Math.abs(c) / 100).toFixed(2);
const STATUS = { draft: 'Draft', no_charge: 'No extra charge', invoiced: 'Invoiced', paid: 'Paid', failed: 'Payment failed', needs_card: 'Card needed' };

export default async function Statement({ params }) {
  const { sb, profile } = await requireUser();
  const { data: s } = await sb.from('mail_statements').select('*, entities(file_number, legal_name)').eq('id', params.id).maybeSingle(); // RLS: members/staff only
  if (!s) notFound();
  return (<Shell profile={profile}>
    <span className="file">{s.entities.file_number}</span><h1 style={{ marginTop: 8 }}>Mail statement: {s.entities.legal_name}</h1>
    <p className="sub">{fmtDay(s.period_start + 'T12:00:00')} to {fmtDay(new Date(new Date(s.period_end + 'T12:00:00') - 864e5))} · {s.items_count} items counted · <strong>{STATUS[s.status]}</strong>{s.invoice_url && <> · <a href={s.invoice_url} target="_blank" rel="noopener noreferrer">Stripe invoice / receipt</a></>}</p>
    <div className="card" style={{ marginBottom: 18 }}><table><tbody>
      {s.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td style={{ textAlign: 'right' }}>{money(l.cents)}</td></tr>)}
      <tr><th style={{ textAlign: 'left' }}>Charged to your card on file</th><th style={{ textAlign: 'right' }}>{money(s.total_cents)}</th></tr>
    </tbody></table></div>
    <h2>Mail included</h2>
    {!s.items.length ? <p className="muted">No mail this month.</p> : <div className="scroll"><table><thead><tr><th>Received</th><th>Type</th><th>From</th><th>Counted</th><th>Forwarded</th><th>Postage</th></tr></thead><tbody>
      {s.items.map((it, i) => <tr key={i}><td>{fmtDay(it.date)}</td><td>{it.type}</td><td>{it.sender || '—'}</td><td>{it.counted ? 'Yes' : 'No (legal/state notice)'}</td><td>{it.forwarded ? `Yes${it.tracking ? ` · ${it.tracking}` : ''}` : ''}</td><td>{it.postage_cents ? money(it.postage_cents) : ''}</td></tr>)}
    </tbody></table></div>}
  </Shell>);
}
