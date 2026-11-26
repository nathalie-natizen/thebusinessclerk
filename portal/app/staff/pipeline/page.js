import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import Shell from '@/components/Shell';
import OrderDetails from '@/components/OrderDetails';
import { requireStaff } from '@/lib/auth';
import { setOrderStatus, logRevision } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { chargeStateFee } from '@/lib/charge';
import { revisions, STAFF_STEPS } from '@/lib/guidelines';
import { PIPELINE, ARCHIVED, KINDS, STAFF_STATUSES, fmtDate } from '@/lib/labels';

async function move(fd) {
  'use server';
  const { user } = await requireStaff();
  const status = String(fd.get('status'));
  if (!STAFF_STATUSES.some(([k]) => k === status)) return;
  const note = String(fd.get('note') || '').trim().slice(0, 1000);
  if (status === 'information_needed' && !note) return; // the client must see what we need
  await setOrderStatus({ orderId: String(fd.get('order_id')), status, note: note || null, notify: fd.get('notify') === 'on', userId: user.id });
  revalidatePath('/staff/pipeline');
}

async function staffRevision(fd) {
  'use server';
  const { user } = await requireStaff();
  const { data: o } = await supabaseAdmin().from('orders').select('*').eq('id', String(fd.get('order_id'))).single();
  if (!o || o.kind !== 'launch') return;
  await logRevision({ order: o, text: String(fd.get('note') || '').trim().slice(0, 2000) || 'Requested by phone/email', by: 'staff', userId: user.id });
  revalidatePath('/staff/pipeline');
}

async function stateFee(fd) {
  'use server';
  const { user } = await requireStaff();
  const db = supabaseAdmin();
  const { data: o } = await db.from('orders').select('*, entities(*)').eq('id', String(fd.get('order_id'))).single();
  if (!o || !(o.kind === 'annual_report' || KINDS[o.kind]?.filing)) return;
  const cents = Math.round(parseFloat(String(fd.get('amount') || '').replace(/[^0-9.]/g, '')) * 100);
  const r = await chargeStateFee(o.entities, o, cents);
  await db.from('order_events').insert({ order_id: o.id, status: o.status, note: r.ok ? (r.already ? 'State fee was already charged.' : `Florida state fee charged: $${(r.cents / 100).toFixed(2)}.`) : `State fee not charged: ${r.reason}`, created_by: user.id });
  revalidatePath('/staff/pipeline');
}

const bizDays = d => { let n = 0; const t = new Date(d); const now = new Date(); t.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0); while (t < now) { t.setDate(t.getDate() + 1); if (t.getDay() % 6) n++; } return n; };
const STAGES = [...PIPELINE.map(([label, sts]) => ({ key: label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, ''), label, sts })), { key: 'archived', label: 'Archived', sts: ARCHIVED }];

export default async function Pipeline({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const kind = KINDS[searchParams?.kind] ? searchParams.kind : null;
  const stage = STAGES.find(x => x.key === searchParams?.stage) || STAGES[0];
  const term = String(searchParams?.q || '').trim().toLowerCase();
  let q = sb.from('orders').select('*, entities(file_number, legal_name, contact_name, entity_type)').not('status', 'in', '(cancelled,awaiting_payment)').order('updated_at');
  if (kind) q = q.eq('kind', kind);
  const { data: all } = await q;
  const { data: unpaid } = await sb.from('entities').select('file_number, legal_name, payment_issue').not('payment_issue', 'is', null);
  const match = o => !term || [o.entities?.file_number, o.entities?.legal_name, o.entities?.contact_name, o.service].some(v => String(v || '').toLowerCase().includes(term));
  const count = st => (all || []).filter(o => st.sts.includes(o.status) && match(o)).length;
  let list = (all || []).filter(o => stage.sts.includes(o.status) && match(o));
  if (stage.key === 'archived') list = list.reverse();
  const url = (over = {}) => { const p = new URLSearchParams({ ...(kind ? { kind } : {}), stage: stage.key, ...(term ? { q: term } : {}), ...over }); [...p].forEach(([k, v]) => !v && p.delete(k)); return `/staff/pipeline?${p}`; };
  return (<Shell profile={profile}>
    <h1>Pipeline</h1>
    {unpaid?.length > 0 && <div className="note" style={{ borderLeftColor: '#C0392B' }}><strong>Payment problems ({unpaid.length}):</strong> the client was alerted by email and text to update their card. {unpaid.map(u => <span key={u.file_number} style={{ marginRight: 12 }}><Link href={`/staff/e/${u.file_number}`}>{u.legal_name}</Link> ${((u.payment_issue.amount || 0) / 100).toFixed(2)} · {new Date(u.payment_issue.at).toLocaleDateString('en-US')}</span>)}</div>}

    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0 14px' }}>{STAGES.map(st => { const on = st.key === stage.key; const n = count(st);
      return <Link key={st.key} href={url({ stage: st.key })} style={{ textDecoration: 'none', padding: '12px 18px', borderRadius: 12, border: `2px solid ${on ? 'var(--teal, #0E4A57)' : 'var(--line, #ddd)'}`, background: on ? 'var(--teal, #0E4A57)' : '#fff', color: on ? '#fff' : 'inherit', fontWeight: 700, minWidth: 150 }}>
        <div style={{ fontSize: 13, opacity: .8, fontWeight: 600 }}>{st.key === 'archived' ? 'Completed' : 'Stage'}</div>{st.label} <span style={{ fontSize: 20, marginLeft: 6 }}>{n}</span></Link>; })}</nav>

    <form method="get" action="/staff/pipeline" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      <input type="hidden" name="stage" value={stage.key} />
      <select name="kind" defaultValue={kind || ''} style={{ maxWidth: 260 }}><option value="">All services</option>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
      <input name="q" defaultValue={term} placeholder="Search company, file number or contact" style={{ flex: '1 1 260px', maxWidth: 420 }} />
      <button className="btn small sec">Filter</button>{(kind || term) && <Link href={`/staff/pipeline?stage=${stage.key}`}>Clear</Link>}
    </form>
    <p className="muted" style={{ marginTop: 0 }}>Oldest first. Click a row to open it, work it and move it. Moving an order updates the client's portal and notifies them unless you untick Notify. In Final review, choose Archive once the quality check passes.</p>

    {!list.length ? <div className="note">Nothing in {stage.label}.</div> : <div className="stack" style={{ gap: 8 }}>{list.map(o => { const age = bizDays(o.updated_at); const late = stage.key === 'to-do' && age > 1; const r = o.kind === 'launch' ? revisions(o.details) : null;
      return (<details key={o.id} className="card" style={{ padding: 0 }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'grid', gridTemplateColumns: '110px minmax(180px, 2fr) minmax(150px, 1.4fr) 120px 150px', gap: 12, alignItems: 'center', padding: '14px 18px' }}>
          <span className="file">{o.entities?.file_number}</span>
          <span><strong>{o.entities?.legal_name}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{o.entities?.contact_name || ''}</span></span>
          <span>{o.service}{r && <><br /><span className="pill" style={{ fontSize: 12 }}>Revision {r.used} of {r.allowed}</span></>}</span>
          <span className="muted" style={{ fontSize: 13 }}>{o.source === 'website' ? 'Website' : o.source === 'portal' ? 'Portal' : 'Staff'}<br />{fmtDate(o.created_at)}</span>
          <span className={`pill ${late ? 'urgent' : ''}`} style={{ justifySelf: 'start' }}>{late ? `Overdue · ${age} business days` : `${age} business day${age === 1 ? '' : 's'} here`}</span>
        </summary>
        <div style={{ padding: '0 18px 18px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(260px, 1fr)', gap: 20, borderTop: '1px solid var(--line, #eee)' }}>
          <div>
            <p style={{ margin: '12px 0 4px' }}><Link href={`/staff/e/${o.entities?.file_number}`}>Open company file →</Link></p>
            <OrderDetails d={o.details} kind={o.kind} orderId={o.id} />
            {STAFF_STEPS[o.kind] && <details style={{ margin: '6px 0' }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Staff steps</summary><ol style={{ fontSize: 14, paddingLeft: 18, margin: '6px 0' }}>{STAFF_STEPS[o.kind].map(([st, txt], i) => <li key={i}><strong>{st}:</strong> {txt}</li>)}</ol></details>}
          </div>
          <div>
            <form action={move} className="stack" style={{ gap: 8, marginTop: 12 }}>
              <input type="hidden" name="order_id" value={o.id} />
              <label>Move to<select name="status" defaultValue={STAFF_STATUSES.some(([k]) => k === o.status) ? o.status : 'received'}>{STAFF_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
              <label>Note to client (optional)<textarea name="note" rows={3} placeholder="Required when moving to Waiting on client" /></label>
              <label style={{ display: 'flex', gap: 8, fontWeight: 400, fontSize: 14 }}><input type="checkbox" name="notify" defaultChecked style={{ minHeight: 'auto' }} /> Notify client</label>
              <button className="btn">Move</button>
            </form>
            {(o.kind === 'annual_report' || KINDS[o.kind]?.filing) && (o.details?.state_fee?.ref ? <p className="muted" style={{ marginTop: 14 }}>State fee charged ${(o.details.state_fee.cents / 100).toFixed(2)} on {fmtDate(o.details.state_fee.at)}.</p> : <form action={stateFee} className="stack" style={{ marginTop: 14, gap: 6 }}><input type="hidden" name="order_id" value={o.id} /><label>Florida state fee ($)<input name="amount" required defaultValue={o.kind === 'annual_report' ? (/corp/i.test(o.entities?.entity_type || '') ? '150.00' : '138.75') : ''} placeholder="Amount shown on Sunbiz" /></label><button className="btn small sec">Charge state fee to card on file</button><div className="muted" style={{ fontSize: 13 }}>Do this when you file. The result is logged on the order.</div></form>)}
            {r && r.used < r.allowed && <form action={staffRevision} className="stack" style={{ gap: 6, marginTop: 14 }}><input type="hidden" name="order_id" value={o.id} /><label>Log revision (phone/email request)<input name="note" placeholder="What the client asked for" required /></label><button className="btn small sec">Log revision {r.used + 1} of {r.allowed}</button></form>}
          </div>
        </div>
      </details>); })}</div>}
  </Shell>);
}
