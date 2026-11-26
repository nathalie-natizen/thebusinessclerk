import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';
import { startTracking } from '@/lib/tracking';
import { notifyEntity } from '@/lib/notify';
import UploadForm from '@/components/UploadForm';
import { fmtDate, MAIL_CATEGORY, MAIL_STATUS, ORDER_STATUS, HANDLING, SHIPPING, CARRIERS } from '@/lib/labels';

async function complete(formData) {
  'use server';
  const { sb } = await requireStaff();
  const id = String(formData.get('id')); const status = String(formData.get('status'));
  if (!['forwarded', 'shredded', 'picked_up', 'held'].includes(status)) return;
  const postage = Math.round(parseFloat(String(formData.get('postage') || '').replace(/[^0-9.]/g, '')) * 100);
  await sb.from('mail_items').update({ status, ...(postage >= 0 && !isNaN(postage) ? { postage_cents: postage } : {}) }).eq('id', id);
  if (status === 'forwarded') await startTracking(id, String(formData.get('carrier')), String(formData.get('tracking') || ''));
  revalidatePath('/staff/queue');
}

// Staff uploads the opened & scanned contents for a scan request
async function completeScan(fd) {
  'use server';
  const { sb } = await requireStaff();
  const id = String(fd.get('id')); const content_path = String(fd.get('content_path') || '');
  if (!content_path) return { error: 'Choose the scanned PDF.' };
  const pages = Math.max(1, parseInt(fd.get('pages')) || 1);
  const { data: m } = await sb.from('mail_items').update({ content_path, pages, scanned_at: new Date().toISOString(), status: 'scanned' }).eq('id', id).select('entity_id, sender').single();
  if (m) await notifyEntity(m.entity_id, { subject: 'Your mail has been scanned', text: `We opened and scanned your mail${m.sender ? ` from ${m.sender}` : ''}. It's ready in your portal.`, sms: 'THE BUSINESS CLERK: Your mail was scanned and is in your portal:' });
  revalidatePath('/staff/queue');
  return { message: 'Scan uploaded and client notified.' };
}

export default async function Queue() {
  const { sb, profile } = await requireStaff();
  const { data: mail } = await sb.from('mail_items').select('*, entities(file_number, legal_name, mail_preferences(*))').in('status', ['forward_requested', 'shred_requested']).order('received_at');
  const { data: cmra } = await sb.from('cmra_applications').select('entity_id, applicant_name, witness_method, submitted_at, entities(file_number, legal_name)').eq('status', 'submitted').order('submitted_at');
  const { data: scans } = await sb.from('mail_items').select('*, entities(id, file_number, legal_name)').eq('status', 'scan_requested').order('received_at');
  return (<Shell profile={profile}>
    <h1>Queue</h1>
    <h2>Forward and shred requests</h2>
    {!mail?.length ? <p className="muted">Nothing waiting.</p> : <div className="scroll"><table><thead><tr><th>File #</th><th>Item</th><th>Request</th><th>Forward to</th><th>Done</th></tr></thead><tbody>
      {mail.map(m => { const p = m.entities?.mail_preferences; const pr = Array.isArray(p) ? p[0] : p; return <tr key={m.id}>
        <td><Link className="file" href={`/staff/e/${m.entities.file_number}`}>{m.entities.file_number}</Link><div className="muted">{m.entities.legal_name}</div></td>
        <td>{MAIL_CATEGORY[m.category]}<div className="muted">{m.sender} · {fmtDate(m.received_at)}</div></td>
        <td><span className="pill warn">{MAIL_STATUS[m.status]}</span>{m.status === 'forward_requested' && <div><strong>{SHIPPING[m.forward_shipping || 'first_class']}</strong>{m.client_request && m.client_request !== 'forward' && <div className="muted">{m.client_request}</div>}</div>}</td>
        <td className="muted">{m.status === 'forward_requested' && pr ? [pr.forward_name, pr.forward_line1, pr.forward_line2, [pr.forward_city, pr.forward_state, pr.forward_postal].filter(Boolean).join(', '), pr.forward_country].filter(Boolean).map((l, i) => <div key={i}>{l}</div>) : (pr ? HANDLING[pr.handling] : '')}</td>
        <td><form action={complete} className="row" style={{ gap: 6 }}><input type="hidden" name="id" value={m.id} />
          {m.status === 'forward_requested' ? <><select name="carrier" defaultValue={['courier_overnight'].includes(m.forward_shipping) ? 'UPS' : 'USPS'} style={{ width: 'auto' }}>{Object.entries(CARRIERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><input name="tracking" placeholder="Tracking #" /><input name="postage" placeholder="Postage $" inputMode="decimal" style={{ maxWidth: 110 }} /><button className="btn small" name="status" value="forwarded">Mark forwarded</button></> : <button className="btn small" name="status" value="shredded">Mark shredded</button>}
        </form></td></tr>; })}
    </tbody></table></div>}
    <h2>Form 1583 to review</h2>
    {!cmra?.length ? <p className="muted">Nothing to review.</p> : <ul>{cmra.map(c => <li key={c.entity_id}><Link className="file" href={`/staff/e/${c.entities.file_number}`}>{c.entities.file_number}</Link> {c.entities.legal_name} · {c.applicant_name} · {c.witness_method === 'notary' ? 'notarized form uploaded' : `schedule ${c.witness_method === 'video' ? 'video call' : 'office visit'}`} · submitted {fmtDate(c.submitted_at)}</li>)}</ul>}
    <h2>Scan requests</h2>
    {!scans?.length ? <p className="muted">Nothing to scan.</p> : <div className="grid">{scans.map(m => <div className="card" key={m.id}>
      <Link className="file" href={`/staff/e/${m.entities.file_number}`}>{m.entities.file_number}</Link> <strong>{m.entities.legal_name}</strong>
      <p className="muted">{MAIL_CATEGORY[m.category]} · {m.sender || 'Unknown sender'} · received {fmtDate(m.received_at)}{m.file_path && <> · <a href={`/api/file?type=mail&id=${m.id}`}>envelope</a></>}</p>
      <UploadForm bucket="mail" entityId={m.entities.id} action={completeScan} submitLabel="Upload scan and notify client">
        <input type="hidden" name="id" value={m.id} />
        <label>Scanned contents (PDF)<input name="content_file" type="file" accept="application/pdf,image/*" /></label>
        <label>Number of pages<input name="pages" type="number" min="1" defaultValue="1" /></label>
      </UploadForm>
    </div>)}</div>}
    <p className="muted" style={{ marginTop: 24 }}>Orders are on the <Link href="/staff/pipeline">Pipeline</Link>.</p>
  </Shell>);
}
