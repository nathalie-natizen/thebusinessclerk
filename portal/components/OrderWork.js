import { moveOrder, saveInternal, stateFee } from '@/lib/order-actions';
import { STAFF_STATUSES, KINDS, statusLabel, fmtDate } from '@/lib/labels';

const STAGE = Object.fromEntries(STAFF_STATUSES);
// Standard Florida state fees we are sure of (staff still confirm on Sunbiz)
const FEE = { annual_report: ['138.75', '150.00'], amendment: ['25.00', '35.00'], dissolution: ['25.00', '35.00'], foreign: ['125.00', '70.00'], dba: ['50.00', '50.00'] };
export const isFiling = o => o.kind === 'annual_report' || !!KINDS[o.kind]?.filing;

// The staff work panel for one order: move, internal record, state fee, history. Used on the Pipeline and the company Orders tab.
export default function OrderWork({ o, back, entity, missing, staffNames = {} }) {
  const i = o.details?.internal || {};
  const formation = ['llc', 'corp', 'foreign'].includes(o.kind);
  const corp = /corp/i.test(entity?.entity_type || '');
  const canCharge = !!(entity?.stripe_customer_id && process.env.STRIPE_SECRET_KEY);
  const ev = [...(o.order_events || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return (<div className="stack" style={{ gap: 14 }}>
    {o.status === 'final_review' && missing && <div className={missing.length ? 'note' : 'ok-msg'} style={{ margin: 0 }}>{missing.length ? <><strong>Quality check before Archive:</strong><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{missing.map(m => <li key={m}>{m}</li>)}</ul></> : 'Quality check passed: ready to Archive.'}</div>}
    <form action={moveOrder} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="back" value={back} />
      <label>Move to<select name="status" defaultValue={STAGE[o.status] ? o.status : 'received'}>{STAFF_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label>Note to client (required for Waiting on client)<textarea name="note" rows={3} placeholder="What the client will read. Internal details go in the Internal record below." /></label>
      <label style={{ display: 'flex', gap: 8, fontWeight: 400, fontSize: 14 }}><input type="checkbox" name="notify" defaultChecked style={{ minHeight: 'auto' }} /> Notify client</label>
      <button className="btn">Move</button>
    </form>
    <details open={!!(i.tracking || i.doc_number || i.confirmation || i.ein || i.note)}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Internal record (staff only)</summary>
      <form action={saveInternal} className="stack" style={{ gap: 6, marginTop: 6 }}>
        <input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="back" value={back} />
        {(formation || isFiling(o)) && <div className="row"><label>Sunbiz tracking #<input name="tracking" defaultValue={i.tracking || ''} /></label>{isFiling(o) && <label>Confirmation #<input name="confirmation" defaultValue={i.confirmation || ''} /></label>}</div>}
        {formation && <div className="row"><label>Florida document #<input name="doc_number" defaultValue={i.doc_number || ''} /></label><label>Filed date<input name="filed_date" type="date" defaultValue={i.filed_date || ''} /></label></div>}
        {formation && <label>Exact name as filed<input name="filed_name" defaultValue={i.filed_name || ''} placeholder="Becomes the company's legal name on Archive" /></label>}
        {o.kind === 'ein' && <label>EIN<input name="ein" defaultValue={i.ein || ''} placeholder="12-3456789" /></label>}
        <label>Internal note<textarea name="internal_note" rows={2} defaultValue={i.note || ''} /></label>
        <button className="btn small sec" style={{ alignSelf: 'flex-start' }}>Save internal record</button>
      </form></details>
    {isFiling(o) && ['submitted', 'final_review'].includes(o.status) && (o.details?.state_fee?.ref ? <p className="muted" style={{ margin: 0 }}>State fee charged ${(o.details.state_fee.cents / 100).toFixed(2)} on {fmtDate(o.details.state_fee.at)}.</p>
      : !canCharge ? <p className="muted" style={{ margin: 0 }}>State fee: no card on file{process.env.STRIPE_SECRET_KEY ? '' : ' (payments not set up)'}. Ask the client to add a card on their Billing tab.</p>
      : <form action={stateFee} className="stack" style={{ gap: 6 }}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="back" value={back} />
        <label>Florida state fee ($)<input name="amount" required defaultValue={FEE[o.kind] ? FEE[o.kind][corp ? 1 : 0] : ''} placeholder="Amount shown on Sunbiz" /></label>
        <label style={{ display: 'flex', gap: 8, fontWeight: 400, fontSize: 14 }}><input type="checkbox" name="confirm" required style={{ minHeight: 'auto' }} /> This matches the amount on Sunbiz</label>
        <button className="btn small sec" style={{ alignSelf: 'flex-start' }}>Charge state fee to card on file</button></form>)}
    {ev.length > 0 && <div><strong style={{ fontSize: 14 }}>History</strong><ul className="timeline" style={{ marginTop: 4 }}>{ev.slice(0, 6).map(x => <li key={x.id}><strong>{STAGE[x.status] || statusLabel(x.status, o.kind)}</strong> <span className="muted">· client sees “{statusLabel(x.status, o.kind)}” · {fmtDate(x.created_at)}{x.created_by ? ` · ${staffNames[x.created_by] || 'staff'}` : ' · system'}{x.notified === true ? ' · client notified' : x.notified === false ? ' · not notified' : ''}</span>{x.note && <div className="muted">{x.note}</div>}</li>)}</ul></div>}
  </div>);
}
