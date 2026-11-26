import UploadForm from './UploadForm';
import { recordMail } from '@/lib/mail-actions';
import { MAIL_CATEGORY, HANDLING } from '@/lib/labels';
import { etInputNow } from '@/lib/time';

// The one form staff use to log mail (company file and the quick Record mail page)
export default function RecordMailForm({ entityId, handling }) {
  const opts = Object.entries(MAIL_CATEGORY).map(([k, l]) => <option key={k} value={k}>{l}</option>);
  return (<UploadForm bucket="mail" entityId={entityId} action={recordMail} submitLabel="Save and notify client">
    <input type="hidden" name="entity_id" value={entityId} />
    <div className="row"><label>Type<select name="category" defaultValue="general">{opts}</select></label><label>From (sender)<input name="sender" placeholder="e.g. Florida Department of State" /></label></div>
    <div className="row"><label>Received (Eastern time)<input name="received_at" type="datetime-local" defaultValue={etInputNow()} required /></label><label>Short description<input name="description" placeholder="e.g. Summons, Orange County Circuit Court" /></label></div>
    <div className="row"><label>Envelope photo (front) *<input name="file" required type="file" accept="image/*,application/pdf" capture="environment" /></label><label>Scanned contents (PDF; required for legal/state mail or a scan request)<input name="content_file" type="file" accept="application/pdf,image/*" /></label><label style={{ flex: '0 1 140px' }}>Pages scanned<input name="pages" type="number" min="1" placeholder="e.g. 3" /></label></div>
    <fieldset style={{ border: '1px solid var(--line, #ddd)', borderRadius: 8, padding: '8px 12px' }}><legend style={{ fontSize: 13, fontWeight: 700 }}>Service of process only (lawsuit papers)</legend>
      <div className="row"><label>Court<input name="court" placeholder="e.g. Orange County Circuit Court" /></label><label>Case number<input name="case_number" /></label><label>Served by<input name="served_by" placeholder="Process server name / company" /></label></div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>The Received time above is the time of service. Lawsuits and state notices are always marked urgent.</p></fieldset>
    <p className="muted" style={{ margin: 0 }}>Client's standing choice: <strong>{HANDLING[handling || 'notify']}</strong>. It is applied automatically when you save (ordinary mail is held instead while Form 1583 isn't approved).</p>
    <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="urgent" style={{ minHeight: 'auto' }} /> Urgent (other items)</label>
  </UploadForm>);
}
