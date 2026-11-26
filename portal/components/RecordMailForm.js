import UploadForm from './UploadForm';
import { recordMail } from '@/lib/mail-actions';
import { MAIL_CATEGORY, HANDLING } from '@/lib/labels';

// The one form staff use to log mail (company file and the quick Record mail page)
export default function RecordMailForm({ entityId, handling }) {
  const opts = Object.entries(MAIL_CATEGORY).map(([k, l]) => <option key={k} value={k}>{l}</option>);
  return (<UploadForm bucket="mail" entityId={entityId} action={recordMail} submitLabel="Save and notify client">
    <input type="hidden" name="entity_id" value={entityId} />
    <div className="row"><label>Type<select name="category" defaultValue="general">{opts}</select></label><label>From (sender)<input name="sender" placeholder="e.g. Florida Department of State" /></label></div>
    <div className="row"><label>Received<input name="received_at" type="datetime-local" /></label><label>Short description<input name="description" placeholder="e.g. Summons, Orange County Circuit Court" /></label></div>
    <div className="row"><label>Envelope photo (front)<input name="file" type="file" accept="image/*,application/pdf" capture="environment" /></label><label>Scanned contents (PDF; required for legal/state mail or a scan request)<input name="content_file" type="file" accept="application/pdf,image/*" /></label><label style={{ flex: '0 1 140px' }}>Pages scanned<input name="pages" type="number" min="1" placeholder="e.g. 3" /></label></div>
    <p className="muted" style={{ margin: 0 }}>Client's standing choice: <strong>{HANDLING[handling || 'notify']}</strong>. It is applied automatically when you save. Received date blank = now.</p>
    <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="urgent" style={{ minHeight: 'auto' }} /> Urgent (lawsuits and state notices are always urgent)</label>
  </UploadForm>);
}
