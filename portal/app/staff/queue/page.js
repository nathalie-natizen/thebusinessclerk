import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import Preview from '@/components/Preview';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';
import { startTracking } from '@/lib/tracking';
import { isBatchRequest } from '@/lib/batches';
import { mailDeadline, toneClass, addBizDays, bizDaysBetween, CMRA_REVIEW_DAYS } from '@/lib/sla';
import { notifyEntity } from '@/lib/notify';
import UploadForm from '@/components/UploadForm';
import { fmtDate, MAIL_CATEGORY, MAIL_STATUS, ORDER_STATUS, HANDLING, SHIPPING, CARRIERS } from '@/lib/labels';

async function complete(formData) {
  'use server';
  const { sb } = await requireStaff();
  const id = String(formData.get('id')); const status = String(formData.get('status') || 'forwarded');
  if (!['forwarded', 'shredded', 'picked_up', 'held'].includes(status)) return;
  const postage = Math.round(parseFloat(String(formData.get('postage') || '').replace(/[^0-9.]/g, '')) * 100);
  if (status === 'forwarded' && (!String(formData.get('tracking') || '').trim() || isNaN(postage) || postage < 0)) return { error: 'Enter the tracking number and the postage paid.' };
  await sb.from('mail_items').update({ status, ...(postage >= 0 && !isNaN(postage) ? { postage_cents: postage } : {}), ...(formData.get('label_path') ? { label_path: String(formData.get('label_path')).slice(0, 300) } : {}) }).eq('id', id);
  if (status === 'forwarded') await startTracking(id, String(formData.get('carrier')), String(formData.get('tracking') || ''));
  revalidatePath('/staff/queue');
  return { message: status === 'forwarded' ? 'Marked forwarded; tracking started.' : 'Done.' };
}

// Staff uploads the opened & scanned contents for a scan request
async function completeScan(fd) {
  'use server';
  const { sb } = await requireStaff();
  const id = String(fd.get('id')); const content_path = String(fd.get('content_path') || '');
  if (!content_path) return { error: 'Choose the scanned PDF.' };
  const pages = Math.max(1, parseInt(fd.get('pages')) || 1);
  const { data: m } = await sb.from('mail_items').update({ content_path, pages, scanned_at: new Date().toISOString(), status: 'scanned' }).eq('id', id).select('entity_id, sender').single();
  if (m) await notifyEntity(m.entity_id, { category: 'mail', subject: 'Your mail has been scanned', text: `We opened and scanned your mail${m.sender ? ` from ${m.sender}` : ''}. It's ready in your portal.`, sms: 'THE BUSINESS CLERK: Your mail was scanned and is in your portal:' });
  revalidatePath('/staff/queue');
  return { message: 'Scan uploaded and client notified.' };
}

export default async function Queue() {
  const { sb, profile } = await requireStaff();
  const { data: mailAll } = await sb.from('mail_items').select('*, entities(file_number, legal_name, mail_preferences(*))').in('status', ['forward_requested', 'shred_requested']).order('received_at');
  const mail = (mailAll || []).filter(m => !isBatchRequest(m.client_request));
  const batched = (mailAll || []).length - mail.length;
  const { data: cmra } = await sb.from('cmra_applications').select('entity_id, applicant_name, witness_method, submitted_at, entities(file_number, legal_name)').eq('status', 'submitted').order('submitted_at');
  const { data: scans } = await sb.from('mail_items').select('*, entities(id, file_number, legal_name)').eq('status', 'scan_requested').order('received_at');
  const { data: expired } = await sb.from('mail_items').select('*, entities(file_number, legal_name)').eq('status', 'received').eq('category', 'general').lt('hold_notice_at', new Date(Date.now() - 15 * 864e5).toISOString()).order('received_at');
  return (<Shell profile={profile}>
    <h1>Queue</h1>
    <p><a className="btn" href="/staff/record">+ Record new mail</a></p>
    <h2>Forward and shred requests</h2>
    {batched > 0 && <p className="muted">{batched} item{batched > 1 ? 's are' : ' is'} waiting for a scheduled weekly, every-two-weeks or monthly shipment. A forwarding task opens in the Pipeline on each client’s shipping day.</p>}
    {!mail?.length ? <p className="muted">Nothing waiting.</p> : <div className="scroll"><table><thead><tr><th>File #</th><th>Item</th><th>Request</th><th>Forward to</th><th>Done</th></tr></thead><tbody>
      {mail.map(m => { const p = m.entities?.mail_preferences; const pr = Array.isArray(p) ? p[0] : p; return <tr key={m.id}>
        <td><Link className="file" href={`/staff/e/${m.entities.file_number}`}>{m.entities.file_number}</Link><div className="muted">{m.entities.legal_name}</div></td>
        <td>{MAIL_CATEGORY[m.category]}<div className="muted">{m.sender} · {fmtDate(m.received_at)}</div></td>
        <td><span className="pill warn">{MAIL_STATUS[m.status]}</span> {(() => { const d = mailDeadline(m); return <span className={`pill ${toneClass(d.tone)}`}>{d.text}</span>; })()}{m.status === 'forward_requested' && <div><strong>{SHIPPING[m.forward_shipping || 'first_class']}</strong>{m.client_request && m.client_request !== 'forward' && <div className="muted">{m.client_request}</div>}</div>}</td>
        <td className="muted">{m.status === 'forward_requested' && pr ? [pr.forward_name, pr.forward_line1, pr.forward_line2, [pr.forward_city, pr.forward_state, pr.forward_postal].filter(Boolean).join(', '), pr.forward_country].filter(Boolean).map((l, i) => <div key={i}>{l}</div>) : (pr ? HANDLING[pr.handling] : '')}</td>
        <td>{m.status === 'forward_requested' ? <UploadForm bucket="mail" entityId={m.entity_id} action={complete} submitLabel="Mark forwarded"><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="forwarded" /><div className="row" style={{ gap: 6 }}><select name="carrier" required defaultValue={['courier_overnight'].includes(m.forward_shipping) ? 'UPS' : 'USPS'}>{Object.entries(CARRIERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><input name="tracking" placeholder="Tracking # *" required /><input name="postage" placeholder="Postage $ *" inputMode="decimal" required style={{ maxWidth: 120 }} /></div><label style={{ fontSize: 13 }}>Label / postage receipt (photo or PDF)<input name="label_file" type="file" accept="image/*,application/pdf" /></label></UploadForm> : <form action={complete}><input type="hidden" name="id" value={m.id} /><button className="btn small" name="status" value="shredded">Mark shredded</button></form>}
        </td></tr>; })}
    </tbody></table></div>}
    {expired?.length > 0 && <><h2>Ready to shred (no instruction after notice)</h2>
      <p className="muted">Ordinary mail held 30 days with no instruction; the client was notified and 15 more days passed. Checks, legal papers and packages never appear here.</p>
      <div className="scroll"><table><thead><tr><th>File #</th><th>Item</th><th>Notice sent</th><th>Done</th></tr></thead><tbody>{expired.map(m => <tr key={m.id}>
        <td><Link className="file" href={`/staff/e/${m.entities.file_number}`}>{m.entities.file_number}</Link><div className="muted">{m.entities.legal_name}</div></td>
        <td>{m.sender || 'Unknown sender'}<div className="muted">received {fmtDate(m.received_at)}</div></td><td>{fmtDate(m.hold_notice_at)}</td>
        <td><form action={complete}><input type="hidden" name="id" value={m.id} /><button className="btn small" name="status" value="shredded">Mark shredded</button></form></td></tr>)}</tbody></table></div></>}
    <h2>Form 1583 to review</h2>
    {!cmra?.length ? <p className="muted">Nothing to review.</p> : <ul>{cmra.map(c => <li key={c.entity_id}><Link className="file" href={`/staff/e/${c.entities.file_number}`}>{c.entities.file_number}</Link> {c.entities.legal_name} · {c.applicant_name} · {c.witness_method === 'in_person' ? 'sign in person: schedule an office visit' : c.witness_method === 'ron' ? 'online notary form uploaded' : 'notarized form uploaded'} · submitted {fmtDate(c.submitted_at)} {(() => { const late = bizDaysBetween(addBizDays(c.submitted_at, CMRA_REVIEW_DAYS), new Date()) > 0; return <span className={`pill ${late ? 'urgent' : 'ok'}`}>{late ? 'Review overdue' : `Review by ${addBizDays(c.submitted_at, CMRA_REVIEW_DAYS).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</span>; })()}</li>)}</ul>}
    <h2>Scan requests</h2>
    {!scans?.length ? <p className="muted">Nothing to scan.</p> : <div className="grid">{scans.map(m => <div className="card" key={m.id}>
      <Link className="file" href={`/staff/e/${m.entities.file_number}`}>{m.entities.file_number}</Link> <strong>{m.entities.legal_name}</strong>
      <p className="muted">{(() => { const d = mailDeadline(m); return <span className={`pill ${toneClass(d.tone)}`}>{d.text}</span>; })()} {MAIL_CATEGORY[m.category]} · {m.sender || 'Unknown sender'} · received {fmtDate(m.received_at)}{m.file_path && <> · <Preview src={`/api/file?type=mail&id=${m.id}&view=1`} pdf title="Preview">envelope</Preview></>}</p>
      <UploadForm bucket="mail" entityId={m.entities.id} action={completeScan} submitLabel="Upload scan and notify client">
        <input type="hidden" name="id" value={m.id} />
        <label>Scanned contents (PDF)<input name="content_file" type="file" accept="application/pdf,image/*" /></label>
        <label>Number of pages<input name="pages" type="number" min="1" defaultValue="1" /></label>
      </UploadForm>
    </div>)}</div>}
    <p className="muted" style={{ marginTop: 24 }}>Orders are on the <Link href="/staff/pipeline">Pipeline</Link>.</p>
  </Shell>);
}
