import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import ClientView from '@/components/ClientView';
import { orderDeadline, toneClass } from '@/lib/sla';
import { scheduleLabel, nextShipDay, BATCH } from '@/lib/batches';
import Preview from '@/components/Preview';
import Shell from '@/components/Shell';
import UploadForm from '@/components/UploadForm';
import { requireStaff, getEntity } from '@/lib/auth';
import { notifyEntity } from '@/lib/notify';
import { setOrderStatus } from '@/lib/orders';
import { startTracking } from '@/lib/tracking';
import OrderDetails from '@/components/OrderDetails';
import { fmtDate, fmtDay, MAIL_CATEGORY, MAIL_STATUS, ORDER_STATUS, DOC_CATEGORY, HANDLING, statusLabel, STAFF_STATUSES, KINDS, CARRIERS, TRACKING_STATUS, CMRA_STATUS, WITNESS } from '@/lib/labels';

const clean = (v, n = 200) => String(v || '').trim().slice(0, n) || null;

// ----- Server actions (staff only; each one re-checks the role) -----
async function recordMail(fd) {
  'use server';
  const { sb, user } = await requireStaff();
  const entity_id = String(fd.get('entity_id')); const category = String(fd.get('category'));
  if (!MAIL_CATEGORY[category]) return { error: 'Choose a mail type.' };
  const urgent = fd.get('urgent') === 'on' || ['service_of_process', 'state_notice'].includes(category);
  const legal = ['service_of_process', 'state_notice'].includes(category);
  const content_path = clean(fd.get('content_path'), 300);
  if (legal && !content_path) return { error: 'Legal papers and state notices must be opened and scanned now. Add the scanned contents.' };
  // Apply the client's standing choice for new mail
  const { data: pref } = await sb.from('mail_preferences').select('handling, forward_shipping').eq('entity_id', entity_id).maybeSingle();
  const h = pref?.handling || 'notify';
  let status = 'received', client_request = null, forward_shipping = null;
  if (content_path) status = 'scanned';
  else if (h === 'scan_all') { status = 'scan_requested'; client_request = 'scan (standing choice)'; }
  else if (h.startsWith('forward_')) { status = 'forward_requested'; client_request = { forward_each: 'forward', forward_weekly: 'forward (weekly batch)', forward_biweekly: 'forward (every 2 weeks batch)', forward_monthly: 'forward (monthly batch)' }[h]; forward_shipping = pref?.forward_shipping || 'first_class'; }
  else if (h === 'hold_pickup') status = 'held';
  const { error } = await sb.from('mail_items').insert({
    entity_id, category, urgent, sender: clean(fd.get('sender')), description: clean(fd.get('description'), 500),
    file_path: clean(fd.get('file_path'), 300), content_path, pages: content_path ? Math.max(1, parseInt(fd.get('pages')) || 1) : null, scanned_at: content_path ? new Date().toISOString() : null,
    status, client_request, forward_shipping, requested_at: client_request ? new Date().toISOString() : null,
    received_at: fd.get('received_at') ? new Date(String(fd.get('received_at'))).toISOString() : new Date().toISOString(), received_by: user.id,
  });
  if (error) return { error: error.message };
  const label = MAIL_CATEGORY[category];
  const r = await notifyEntity(entity_id, {
    category: ['service_of_process', 'state_notice'].includes(category) ? 'legal' : 'mail',
    subject: urgent ? `URGENT: ${label} received for your company` : `New mail received for your company`,
    text: `We received ${urgent ? 'an urgent item' : 'mail'} for your company${fd.get('sender') ? ` from ${clean(fd.get('sender'))}` : ''}: ${label}.${urgent ? ' Legal and state notices can have short deadlines. Please review it today.' : ''}`,
    sms: urgent ? `THE BUSINESS CLERK: URGENT ${label} received for your company. View it in your portal:` : `THE BUSINESS CLERK: New mail received for your company. View it:`,
  });
  await sb.from('mail_items').update({ notified_at: new Date().toISOString() }).eq('entity_id', entity_id).is('notified_at', null);
  revalidatePath('/staff/e/[file]', 'page');
  return { message: `Mail recorded. ${r.filter(x => x.status === 'sent').length} notification(s) sent.` };
}

async function recordDocument(fd) {
  'use server';
  const { sb, user } = await requireStaff();
  const entity_id = String(fd.get('entity_id')); const category = String(fd.get('category'));
  if (!fd.get('file_path')) return { error: 'Choose a file.' };
  const { error } = await sb.from('documents').insert({ entity_id, title: clean(fd.get('title')) || 'Document', category: DOC_CATEGORY[category] ? category : 'other', file_path: clean(fd.get('file_path'), 300), uploaded_by: user.id });
  if (error) return { error: error.message };
  if (fd.get('notify') === 'on') await notifyEntity(entity_id, { category: 'documents', subject: 'A new document is in your portal', text: `We added a new document to your company file: ${clean(fd.get('title'))}.`, sms: 'THE BUSINESS CLERK: A new document was added to your company file:' });
  revalidatePath('/staff/e/[file]', 'page');
  return { message: 'Document added.' };
}

async function createOrder(fd) {
  'use server';
  const { sb, user } = await requireStaff();
  const kind = KINDS[fd.get('kind')] ? String(fd.get('kind')) : null;
  const { data: o } = await sb.from('orders').insert({ entity_id: String(fd.get('entity_id')), kind, service: clean(fd.get('service')) || (kind ? KINDS[kind].name : 'Service'), status: 'received' }).select().single();
  if (o) await sb.from('order_events').insert({ order_id: o.id, status: 'received', note: clean(fd.get('note'), 500), created_by: user.id });
  revalidatePath('/staff/e/[file]', 'page');
}

async function updateOrder(fd) {
  'use server';
  const { sb, user } = await requireStaff();
  const id = String(fd.get('order_id')); const status = String(fd.get('status')); const note = clean(fd.get('note'), 500);
  if (!STAFF_STATUSES.some(([k]) => k === status)) return;
  await setOrderStatus({ orderId: id, status, note, notify: fd.get('notify') === 'on', userId: user.id });
  revalidatePath('/staff/e/[file]', 'page');
}

async function updateEntity(fd) {
  'use server';
  const { sb } = await requireStaff();
  const id = String(fd.get('entity_id'));
  await sb.from('entities').update({
    legal_name: clean(fd.get('legal_name')), entity_type: String(fd.get('entity_type')), status: String(fd.get('status')),
    sunbiz_doc_number: clean(fd.get('sunbiz_doc_number')), formation_date: clean(fd.get('formation_date')),
    registered_agent: fd.get('registered_agent') === 'on', mail_service: fd.get('mail_service') === 'on',
    stripe_customer_id: clean(fd.get('stripe_customer_id')), ein: clean(fd.get('ein'), 20),
    sunbiz_url: /^https:\/\/search\.sunbiz\.org\//.test(String(fd.get('sunbiz_url') || '')) ? clean(fd.get('sunbiz_url'), 600) : null,
    contact_name: clean(fd.get('contact_name')), contact_email: clean(fd.get('contact_email')), contact_phone: clean(fd.get('contact_phone'), 40),
  }).eq('id', id);
  await sb.from('entity_notes').upsert({ entity_id: id, notes: clean(fd.get('notes'), 2000), updated_at: new Date().toISOString() });
  redirect(`/staff/e/${String(fd.get('file'))}?saved=1&tab=details`);
}

async function addMember(fd) {
  'use server';
  const { sb } = await requireStaff();
  const entity_id = String(fd.get('entity_id')); const email = String(fd.get('email') || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return;
  const { data: p } = await sb.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (p) await sb.from('entity_members').upsert({ entity_id, user_id: p.id });
  else await sb.from('invitations').upsert({ email, entity_id });
  revalidatePath('/staff/e/[file]', 'page');
}

async function removeMember(fd) {
  'use server';
  const { sb } = await requireStaff();
  const entity_id = String(fd.get('entity_id'));
  if (fd.get('user_id')) await sb.from('entity_members').delete().eq('entity_id', entity_id).eq('user_id', String(fd.get('user_id')));
  if (fd.get('email')) await sb.from('invitations').delete().eq('entity_id', entity_id).eq('email', String(fd.get('email')));
  revalidatePath('/staff/e/[file]', 'page');
}

async function setMailStatus(fd) {
  'use server';
  const { sb } = await requireStaff();
  const status = String(fd.get('status')); if (!MAIL_STATUS[status]) return;
  const id = String(fd.get('id'));
  const { data: before } = await sb.from('mail_items').select('tracking_number, carrier').eq('id', id).single();
  await sb.from('mail_items').update({ status }).eq('id', id);
  const tn = clean(fd.get('tracking')) || ''; const carrier = String(fd.get('carrier') || 'USPS');
  if (tn !== (before?.tracking_number || '') || (tn && carrier !== before?.carrier)) await startTracking(id, carrier, tn);
  revalidatePath('/staff/e/[file]', 'page');
}

async function reviewCmra(fd) {
  'use server';
  const { sb, user } = await requireStaff();
  const entity_id = String(fd.get('entity_id')); const status = String(fd.get('status'));
  if (!CMRA_STATUS[status]) return;
  const note = clean(fd.get('staff_note'), 1000);
  const patch = { entity_id, status, staff_note: note, updated_at: new Date().toISOString() };
  if (status === 'verified' || status === 'filed') Object.assign(patch, { verified_by: user.id, verified_at: new Date().toISOString() });
  if (status === 'filed') patch.crd_filed_at = fd.get('crd_date') ? new Date(String(fd.get('crd_date')) + 'T12:00:00').toISOString() : new Date().toISOString();
  if (fd.get('file_path')) patch.form_path = clean(fd.get('file_path'), 300);
  await sb.from('cmra_applications').upsert(patch, { onConflict: 'entity_id' });
  const msg = { needs_changes: ['Action needed: your USPS Form 1583', `Please update your Form 1583 information in your portal (Compliance tab).${note ? `\n\n${note}` : ''}`], verified: ['Your USPS Form 1583 is verified', 'Your identity and Form 1583 are verified. Thank you!'], filed: ['Your mail service is fully set up', 'Your Form 1583 has been filed with USPS. Your mail service is complete.'] }[status];
  if (msg) await notifyEntity(entity_id, { category: 'compliance', subject: msg[0], text: msg[1], sms: `THE BUSINESS CLERK: ${msg[0]}.` });
  revalidatePath('/staff/e/[file]', 'page');
  return { message: 'Saved.' };
}

export default async function StaffEntity({ params, searchParams }) {
  const { sb, profile } = await requireStaff();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const [{ data: members }, { data: invites }, { data: mail }, { data: docs }, { data: orders }, { data: prefs }, { data: noteRow }] = await Promise.all([
    sb.from('entity_members').select('user_id, profiles(email, full_name, phone, sms_opt_in)').eq('entity_id', e.id),
    sb.from('invitations').select('email').eq('entity_id', e.id),
    sb.from('mail_items').select('*').eq('entity_id', e.id).order('received_at', { ascending: false }),
    sb.from('documents').select('*').eq('entity_id', e.id).order('created_at', { ascending: false }),
    sb.from('orders').select('*, order_events(*)').eq('entity_id', e.id).order('created_at', { ascending: false }),
    sb.from('mail_preferences').select('*').eq('entity_id', e.id).maybeSingle(),
    sb.from('entity_notes').select('notes').eq('entity_id', e.id).maybeSingle(),
  ]);
  const { data: cmra } = await sb.from('cmra_applications').select('*').eq('entity_id', e.id).maybeSingle();
  const opts = o => Object.entries(o).map(([k, l]) => <option key={k} value={k}>{l}</option>);
  const TABS = [['overview', 'Overview'], ['mail', 'Mail'], ['documents', 'Documents'], ['orders', 'Orders'], ...(e.mail_service ? [['compliance', 'Form 1583']] : []), ['access', 'Client access'], ['details', 'Company details']];
  const tab = TABS.some(([k]) => k === searchParams?.tab) ? searchParams.tab : 'overview';
  const T = k => `/staff/e/${e.file_number}?tab=${k}`;
  return (<Shell profile={profile}>
    <p><Link href="/staff">← All entities</Link></p>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}><div><span className="file" style={{ fontSize: 16 }}>{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1></div><ClientView file={e.file_number} /></div>
    <nav className="tabs">{TABS.map(([k, l]) => <Link key={k} href={T(k)} aria-current={tab === k ? 'page' : undefined}>{l}</Link>)}</nav>
    {tab === 'overview' && <>{(() => {
      const open = (orders || []).filter(o => !['completed', 'delivered', 'cancelled', 'awaiting_payment'].includes(o.status));
      const late = open.filter(o => orderDeadline({ ...o, entities: { status: e.status } }).tone === 'late').length;
      const waiting = (mail || []).filter(m => ['forward_requested', 'scan_requested', 'shred_requested'].includes(m.status)).length;
      const unread = (mail || []).filter(m => m.status === 'received').length;
      const legal = (mail || []).filter(m => ['service_of_process', 'state_notice'].includes(m.category) && !m.viewed_at).length;
      const y = new Date().getFullYear(); const arDone = (orders || []).some(o => o.kind === 'annual_report' && new Date(o.created_at).getFullYear() === y && o.status !== 'cancelled');
      const tile = (label, value, sub, tone, href) => <a href={href} className="card" style={{ padding: '10px 12px', textDecoration: 'none', color: 'inherit', minWidth: 0, borderLeft: `4px solid ${tone === 'late' ? '#C0392B' : tone === 'warn' ? '#E0A100' : tone === 'ok' ? '#2E8B57' : 'var(--line, #ddd)'}` }}><div className="muted" style={{ fontSize: 12 }}>{label}</div><div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>{sub && <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub}>{sub}</div>}</a>;
      return <div id="overview" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', alignItems: 'start', margin: '6px 0 14px' }}>
        {tile('Company status', e.status === 'active' ? 'Active' : e.status === 'pending' ? 'Pending at the State' : e.status, e.sunbiz_doc_number ? `Doc # ${e.sunbiz_doc_number}` : 'No document number yet', e.status === 'active' ? 'ok' : 'warn', T('details'))}
        {tile('Open orders', open.length, late ? `${late} overdue` : open.length ? 'On time' : 'Nothing open', late ? 'late' : open.length ? 'warn' : 'ok', T('orders'))}
        {tile('Mail to act on', waiting, `${unread} without instructions${legal ? ` · ${legal} legal unread by client` : ''}`, legal ? 'late' : waiting ? 'warn' : 'ok', T('mail'))}
        {tile('Services', [e.registered_agent && 'RA', e.mail_service && 'Mail'].filter(Boolean).join(' + ') || 'None', e.mail_service && BATCH[prefs?.handling] ? `${scheduleLabel(prefs.handling, prefs.forward_day)} · next ${nextShipDay(prefs.handling, prefs.forward_day)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : (prefs?.handling ? { notify: 'Mail: notify only', scan_all: 'Mail: scan all', forward_each: 'Mail: forward each', hold_pickup: 'Mail: hold for pickup' }[prefs.handling] || '' : ''), 'info', T('details'))}
        {e.mail_service && tile('Form 1583', CMRA_STATUS[cmra?.status || 'not_started'] || 'Not started', 'Mail is held until approved', ['verified', 'filed'].includes(cmra?.status) ? 'ok' : cmra?.status === 'submitted' ? 'warn' : 'late', T('compliance'))}
        {e.registered_agent && tile(`Annual report ${y}`, arDone ? 'Ordered' : 'Not ordered', 'Due May 1', arDone ? 'ok' : new Date().getMonth() >= 2 ? 'warn' : 'info', T('orders'))}
        {e.payment_issue && tile('Payment', 'Failed', `$${((e.payment_issue.amount || 0) / 100).toFixed(2)} · client alerted`, 'late', T('details'))}
      </div>; })()}
    <p className="sub">Label the paper folder and the PMB line with <strong>{e.file_number}</strong>. Mail handling: {HANDLING[prefs?.handling || 'notify']}.</p>
    <div className="grid">
      <section className="card"><h3 style={{ marginTop: 0 }}>Open orders</h3>{(() => { const open = (orders || []).filter(o => !['completed', 'delivered', 'cancelled', 'awaiting_payment'].includes(o.status)); return !open.length ? <p className="muted">Nothing open.</p> : <ul style={{ paddingLeft: 18, margin: 0 }}>{open.map(o => { const d = orderDeadline({ ...o, entities: { status: e.status } }); return <li key={o.id} style={{ marginBottom: 6 }}><strong>{o.service}</strong> · {statusLabel(o.status, o.kind)} <span className={`pill ${toneClass(d.tone)}`}>{d.text}</span></li>; })}</ul>; })()}<p style={{ marginBottom: 0 }}><Link href="/staff/pipeline">Work it in the Pipeline →</Link></p></section>
      <section className="card"><h3 style={{ marginTop: 0 }}>Latest mail</h3>{!mail?.length ? <p className="muted">No mail yet.</p> : <ul style={{ paddingLeft: 18, margin: 0 }}>{mail.slice(0, 6).map(m => <li key={m.id} style={{ marginBottom: 6 }}>{fmtDate(m.received_at)} · {m.urgent && <span className="pill urgent">Urgent</span>} {MAIL_CATEGORY[m.category]}{m.sender ? ` · ${m.sender}` : ''} · <span className="muted">{MAIL_STATUS[m.status] || m.status}</span></li>)}</ul>}<p style={{ marginBottom: 0 }}><Link href={T('mail')}>Mail log →</Link></p></section>
      <section className="card"><h3 style={{ marginTop: 0 }}>Contact</h3><p style={{ margin: 0 }}>{e.contact_name || '—'}<br />{e.contact_email || ''}{e.contact_phone ? <><br />{e.contact_phone}</> : ''}</p><p className="muted" style={{ marginBottom: 0 }}>{(members || []).length} portal user{(members || []).length === 1 ? '' : 's'}{(invites || []).length ? ` · ${(invites || []).length} invited` : ''}</p></section>
    </div></>}
    {searchParams?.saved && <p className="ok-msg">Saved.</p>}

    {tab === 'mail' && <section className="card" id="record-mail" style={{ marginBottom: 18 }}><h2 style={{ marginTop: 0 }}>Record mail</h2>
        <UploadForm bucket="mail" entityId={e.id} action={recordMail} submitLabel="Save and notify client">
          <input type="hidden" name="entity_id" value={e.id} />
          <div className="row"><label>Type<select name="category" defaultValue="general">{opts(MAIL_CATEGORY)}</select></label><label>From (sender)<input name="sender" placeholder="e.g. Florida Department of State" /></label></div>
          <div className="row"><label>Received<input name="received_at" type="datetime-local" /></label><label>Short description<input name="description" placeholder="e.g. Summons, Orange County Circuit Court" /></label></div>
          <div className="row"><label>Envelope photo (front)<input name="file" type="file" accept="image/*,application/pdf" capture="environment" /></label><label>Scanned contents (PDF; required for legal/state mail or a scan request)<input name="content_file" type="file" accept="application/pdf,image/*" /></label><label style={{ flex: '0 1 140px' }}>Pages scanned<input name="pages" type="number" min="1" placeholder="e.g. 3" /></label></div>
          <p className="muted" style={{ margin: 0 }}>Client's standing choice: <strong>{HANDLING[prefs?.handling || 'notify']}</strong>. It is applied automatically when you save.</p>
          <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="urgent" style={{ minHeight: 'auto' }} /> Urgent (lawsuits and state notices are always urgent)</label>
        </UploadForm>
      </section>}
      {tab === 'documents' && <section className="card" id="add-document" style={{ marginBottom: 18 }}><h2 style={{ marginTop: 0 }}>Add document</h2>
        <UploadForm bucket="documents" entityId={e.id} action={recordDocument} submitLabel="Add document" requireFile>
          <input type="hidden" name="entity_id" value={e.id} />
          <label>Title<input name="title" placeholder="e.g. Filed Articles of Organization" required /></label>
          <label>Category<select name="category" defaultValue="filing">{opts(DOC_CATEGORY)}</select></label>
          <label>File<input name="file" type="file" accept="application/pdf,image/*" /></label>
          <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="notify" defaultChecked style={{ minHeight: 'auto' }} /> Notify client</label>
        </UploadForm>
      </section>}

    {tab === 'compliance' && <><h2 id="compliance" style={{ scrollMarginTop: 70 }}>Compliance: USPS Form 1583</h2>
    <section className="card" style={{ marginBottom: 18 }}>
      <p>Status: <span className={`pill ${['verified', 'filed'].includes(cmra?.status) ? 'ok' : cmra?.status === 'submitted' ? 'warn' : ''}`}>{CMRA_STATUS[cmra?.status || 'not_started']}</span>{cmra?.witness_method && <span className="muted"> · Signing: {WITNESS[cmra.witness_method]}</span>}</p>
      {cmra && <table style={{ fontSize: 14 }}><tbody>
        <tr><th style={{ textAlign: 'left', width: 170 }}>Applicant</th><td>{cmra.applicant_name} · {cmra.applicant_email} · {cmra.applicant_phone}</td></tr>
        <tr><th style={{ textAlign: 'left' }}>Home address</th><td>{cmra.home_address}</td></tr>
        <tr><th style={{ textAlign: 'left' }}>Business</th><td>{cmra.business_name} · {cmra.business_type} · {cmra.registration_place}{cmra.business_address ? ` · ${cmra.business_address}` : ''}</td></tr>
        {cmra.receivers && <tr><th style={{ textAlign: 'left' }}>Other receivers</th><td>{cmra.receivers}</td></tr>}
        <tr><th style={{ textAlign: 'left' }}>Photo ID</th><td>{cmra.id1_path ? <><Preview src={`/api/file?type=compliance&id=${e.id}&part=id1&view=1`} pdf title="Preview">{cmra.id1_type}</Preview> · #{cmra.id1_number || '—'} · {cmra.id1_issuer} · exp. {cmra.id1_expires || '—'}</> : 'Missing'}</td></tr>
        <tr><th style={{ textAlign: 'left' }}>Address ID</th><td>{cmra.id2_path ? <><Preview src={`/api/file?type=compliance&id=${e.id}&part=id2&view=1`} pdf title="Preview">{cmra.id2_type}</Preview> · {cmra.id2_issuer} · exp. {cmra.id2_expires || '—'}</> : 'Missing'}</td></tr>
        <tr><th style={{ textAlign: 'left' }}>Form 1583</th><td><Preview src={`/api/cmra/form?entity=${e.id}`} pdf title="Pre-filled PS Form 1583">Pre-filled form</Preview> · {cmra.form_path ? <Preview src={`/api/file?type=compliance&id=${e.id}&part=form&view=1`} pdf title="Preview">Signed form</Preview> : 'Signed form not uploaded yet'}{cmra.id1_back_path && <> · <Preview src={`/api/file?type=compliance&id=${e.id}&part=id1_back&view=1`} pdf title="Preview">ID back</Preview></>}{cmra.selfie_path && <> · <Preview src={`/api/file?type=compliance&id=${e.id}&part=selfie&view=1`} pdf title="Preview">Selfie with ID</Preview></>}{cmra.protected_individual && <strong> · Court-ordered protected individual: get the court order</strong>}</td></tr>
        {cmra.client_note && <tr><th style={{ textAlign: 'left' }}>Client note</th><td>{cmra.client_note}</td></tr>}
      </tbody></table>}
      <UploadForm bucket="compliance" entityId={e.id} action={reviewCmra} submitLabel="Save review">
        <input type="hidden" name="entity_id" value={e.id} />
        <div className="row"><label>Set status<select name="status" defaultValue={cmra?.status || 'not_started'}>{opts(CMRA_STATUS)}</select></label><label>Filed in USPS CRD on<input name="crd_date" type="date" /></label></div>
        <label>Note to client (shown if changes are needed)<input name="staff_note" defaultValue={cmra?.staff_note || ''} /></label>
        <label>Upload the final signed form (after the video/in-person signing), optional<input name="file" type="file" accept="application/pdf,image/*" /></label>
      </UploadForm>
      <p className="muted" style={{ marginTop: 8 }}>Checklist: both IDs current and matching the name; second ID shows the home address; a driver's/state ID used for only one of the two; the form is notarized (or you watched the client sign in person); you signed item 14 as CMRA agent; then enter it in the USPS CMRA Customer Registration Database and mark "Complete".</p>
    </section></>}

    {tab === 'mail' && <><h2 id="mail-log" style={{ scrollMarginTop: 70 }}>Mail log</h2>
    {!mail?.length ? <p className="muted">No mail yet.</p> : <div className="scroll"><table><thead><tr><th>Received</th><th>Type</th><th>From</th><th>Client</th><th>Status</th></tr></thead><tbody>
      {mail.map(m => <tr key={m.id}><td>{fmtDate(m.received_at)}</td><td>{m.urgent && <span className="pill urgent">Urgent</span>} {MAIL_CATEGORY[m.category]}{m.file_path && <div><Preview src={`/api/file?type=mail&id=${m.id}&view=1`} pdf title="Preview">Envelope</Preview></div>}{m.content_path && <div><Preview src={`/api/file?type=mail&id=${m.id}&part=content&view=1`} pdf title="Preview">Scan ({m.pages || '?'} p.)</Preview></div>}</td><td>{m.sender || '—'}</td>
        <td className="muted">{m.notified_at ? `Notified ${fmtDate(m.notified_at)}` : 'Not notified'}<br />{m.viewed_at ? `Viewed ${fmtDate(m.viewed_at)}` : 'Not viewed'}</td>
        <td><form action={setMailStatus} className="row" style={{ gap: 6 }}><input type="hidden" name="id" value={m.id} /><select name="status" defaultValue={m.status}>{opts(MAIL_STATUS)}</select><select name="carrier" defaultValue={m.carrier || 'USPS'} style={{ width: 'auto' }}>{Object.entries(CARRIERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><input name="tracking" defaultValue={m.tracking_number || ''} placeholder="Tracking #" /><button className="btn small sec">Update</button>{m.tracking_status && <div className="muted" style={{ flexBasis: '100%' }}>{TRACKING_STATUS[m.tracking_status] || m.tracking_status}{m.tracking_url && <> · <a href={m.tracking_url} target="_blank" rel="noopener noreferrer">Track</a></>}</div>}</form></td></tr>)}
    </tbody></table></div>}</>}

    {tab === 'orders' && <><h2 id="orders" style={{ scrollMarginTop: 70 }}>Orders</h2>
    <form className="row" action={createOrder} style={{ marginBottom: 14 }}><input type="hidden" name="entity_id" value={e.id} /><select name="kind" style={{ flex: '0 1 220px' }}><option value="">Other service</option>{Object.entries(KINDS).filter(([, v]) => !v.internal).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select><input name="service" placeholder="Name shown to client, e.g. Annual report 2027 (optional)" /><input name="note" placeholder="Note (optional)" /><button className="btn sec" style={{ flex: '0 0 auto' }}>Add order</button></form>
    <div className="grid">{(orders || []).map(o => <div className="card" key={o.id}><h3>{o.service}</h3><p><span className="pill">{statusLabel(o.status, o.kind)}</span> <span className="muted">{fmtDate(o.created_at)}</span></p>
      <OrderDetails d={o.details} kind={o.kind} orderId={o.id} />
      <form className="stack" action={updateOrder}><input type="hidden" name="order_id" value={o.id} /><select name="status" defaultValue={STAFF_STATUSES.some(([k]) => k === o.status) ? o.status : 'received'}>{STAFF_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><input name="note" placeholder="Note shown to client (optional)" /><label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="notify" defaultChecked style={{ minHeight: 'auto' }} /> Notify client</label><button className="btn small">Update status</button></form>
      <ul className="timeline">{(o.order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(ev => <li key={ev.id}><strong>{statusLabel(ev.status, o.kind)}</strong> <span className="muted">{fmtDate(ev.created_at)}</span>{ev.note && <div className="muted">{ev.note}</div>}</li>)}</ul></div>)}</div></>}

    {tab === 'documents' && <><h2 id="documents" style={{ scrollMarginTop: 70 }}>Documents</h2>
    {!docs?.length ? <p className="muted">No documents.</p> : <ul>{docs.map(d => <li key={d.id}><Preview src={`/api/file?type=document&id=${d.id}&view=1`} pdf title="Preview">{d.title}</Preview> (<a href={`/api/file?type=document&id=${d.id}`}>download</a>) <span className="muted">· {DOC_CATEGORY[d.category]} · {fmtDay(d.created_at)}</span></li>)}</ul>}</>}

    {tab === 'access' && <><h2 id="access" style={{ scrollMarginTop: 70 }}>Client access</h2>
    <ul>{(members || []).map(m => <li key={m.user_id}>{m.profiles?.email} {m.profiles?.phone && <span className="muted">· {m.profiles.phone}{m.profiles.sms_opt_in ? ' (texts on)' : ''}</span>} <form action={removeMember} style={{ display: 'inline' }}><input type="hidden" name="entity_id" value={e.id} /><input type="hidden" name="user_id" value={m.user_id} /><button className="btn small sec">Remove</button></form></li>)}
      {(invites || []).map(i => <li key={i.email}>{i.email} <span className="pill warn">Invited, hasn't signed in</span> <form action={removeMember} style={{ display: 'inline' }}><input type="hidden" name="entity_id" value={e.id} /><input type="hidden" name="email" value={i.email} /><button className="btn small sec">Remove</button></form></li>)}</ul>
    <form className="row" action={addMember}><input type="hidden" name="entity_id" value={e.id} /><input name="email" type="email" placeholder="client@example.com" required /><button className="btn sec" style={{ flex: '0 0 auto' }}>Give access</button></form>
    <p className="muted">The client signs in at app.thebusinessclerk.com with this email. Access is linked automatically on first sign-in. Clients manage their own team and notifications on their Team tab.</p></>}

    {tab === 'details' && <><h2 id="details" style={{ scrollMarginTop: 70 }}>Company details</h2>
    <form className="stack" action={updateEntity}>
      <input type="hidden" name="entity_id" value={e.id} /><input type="hidden" name="file" value={e.file_number} />
      <label>Legal name<input name="legal_name" defaultValue={e.legal_name} required /></label>
      <div className="row"><label>Type<select name="entity_type" defaultValue={e.entity_type}><option>LLC</option><option>Corporation</option><option>Nonprofit</option><option>Other</option></select></label>
        <label>Status<select name="status" defaultValue={e.status}><option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option><option value="dissolved">Dissolved</option></select></label></div>
      <div className="row"><label>Florida document #<input name="sunbiz_doc_number" defaultValue={e.sunbiz_doc_number || ''} /></label><label>Formation date<input name="formation_date" type="date" defaultValue={e.formation_date || ''} /></label><label>EIN<input name="ein" defaultValue={e.ein || ''} placeholder="12-3456789" /></label></div>
      <label>Sunbiz page link: open the company's detail page on Sunbiz (<a href={`/api/sunbiz?entity=${e.id}`} target="_blank" rel="noopener noreferrer">find it</a>), click the company, copy the address bar and paste it here. The client's "View on Sunbiz" button then opens it directly.<input name="sunbiz_url" defaultValue={e.sunbiz_url || ''} placeholder="https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail?..." /></label>
      <div className="row"><label>Contact name<input name="contact_name" defaultValue={e.contact_name || ''} /></label><label>Contact email<input name="contact_email" type="email" defaultValue={e.contact_email || ''} /></label><label>Contact phone<input name="contact_phone" defaultValue={e.contact_phone || ''} /></label></div>
      <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="registered_agent" defaultChecked={e.registered_agent} style={{ minHeight: 'auto' }} /> Registered agent service</label>
      <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="mail_service" defaultChecked={e.mail_service} style={{ minHeight: 'auto' }} /> Business address & mail service</label>
      <label>Stripe customer ID<input name="stripe_customer_id" defaultValue={e.stripe_customer_id || ''} /></label>
      <label>Internal notes (staff only)<textarea name="notes" defaultValue={noteRow?.notes || ''} /></label>
      <button className="btn">Save details</button>
    </form></>}
  </Shell>);
}
