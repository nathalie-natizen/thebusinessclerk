import { notFound, redirect } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import UploadForm from '@/components/UploadForm';
import { requireUser, getEntity } from '@/lib/auth';
import { canActFor, upsertCmra } from '@/lib/compliance';
import { PRIMARY_IDS, SECONDARY_IDS, CMRA_STATUS, WITNESS, fmtDay } from '@/lib/labels';

const c = (v, n = 300) => String(v ?? '').trim().slice(0, n) || null;
const locked = s => ['submitted', 'verified', 'filed'].includes(s);

async function saveInfo(fd) {
  'use server';
  await requireUser(); const id = String(fd.get('entity_id'));
  if (!(await canActFor(id))) return;
  await upsertCmra(id, {
    status: 'in_progress', applicant_name: c(fd.get('applicant_name')), applicant_email: c(fd.get('applicant_email')), applicant_phone: c(fd.get('applicant_phone'), 40),
    home_address: c(fd.get('home_address'), 500), business_name: c(fd.get('business_name')), business_address: c(fd.get('business_address'), 500),
    business_type: c(fd.get('business_type')), registration_place: c(fd.get('registration_place')), receivers: c(fd.get('receivers'), 1000),
    witness_method: WITNESS[fd.get('witness_method')] ? String(fd.get('witness_method')) : null,
  });
  redirect(`/e/${fd.get('file')}/compliance?saved=1`);
}
async function saveId(fd) {
  'use server';
  await requireUser(); const id = String(fd.get('entity_id')); const which = fd.get('which') === 'id2' ? 'id2' : 'id1';
  if (!(await canActFor(id))) return { error: 'Not allowed.' };
  const path = c(fd.get('file_path')); if (!path?.startsWith(id + '/')) return { error: 'Choose a clear photo or scan of the ID (front and back if it has an address on the back).' };
  const list = which === 'id1' ? PRIMARY_IDS : SECONDARY_IDS;
  if (!list.includes(String(fd.get('type')))) return { error: 'Choose the type of ID.' };
  const exp = c(fd.get('expires'), 10);
  if (exp && new Date(exp) < new Date()) return { error: 'This ID is expired. USPS only accepts current IDs.' };
  await upsertCmra(id, { status: 'in_progress', [`${which}_type`]: String(fd.get('type')), [`${which}_issuer`]: c(fd.get('issuer')), [`${which}_expires`]: exp, [`${which}_path`]: path });
  return { message: 'ID saved.' };
}
async function saveForm(fd) {
  'use server';
  await requireUser(); const id = String(fd.get('entity_id'));
  if (!(await canActFor(id))) return { error: 'Not allowed.' };
  const path = c(fd.get('file_path')); if (!path?.startsWith(id + '/')) return { error: 'Choose the signed form.' };
  await upsertCmra(id, { status: 'in_progress', form_path: path });
  return { message: 'Signed form saved.' };
}
async function submit(fd) {
  'use server';
  const { sb } = await requireUser(); const id = String(fd.get('entity_id'));
  if (!(await canActFor(id))) return;
  const { data: a } = await sb.from('cmra_applications').select('*').eq('entity_id', id).maybeSingle();
  const missing = !a?.applicant_name || !a?.home_address || !a?.id1_path || !a?.id2_path || !a?.witness_method || (a.witness_method === 'notary' && !a.form_path);
  if (missing) redirect(`/e/${fd.get('file')}/compliance?missing=1`);
  await upsertCmra(id, { status: 'submitted', submitted_at: new Date().toISOString(), client_note: c(fd.get('client_note'), 1000) });
  redirect(`/e/${fd.get('file')}/compliance?submitted=1`);
}

export default async function Compliance({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: a0 } = await sb.from('cmra_applications').select('*').eq('entity_id', e.id).maybeSingle();
  const a = a0 || { status: 'not_started', business_name: e.legal_name, applicant_email: profile?.email };
  const ro = locked(a.status);
  const Step = ({ n, done, title, children }) => <section className="card" style={{ marginBottom: 16 }}><h2 style={{ marginTop: 0 }}>{done ? '✓' : n + '.'} {title}</h2>{children}</section>;
  const H = ({ name, value }) => <input type="hidden" name={name} value={value} />;
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="compliance" />
    <p className="sub">Federal rules require USPS Form 1583 before we can receive mail for you at our address. You'll need <strong>two current IDs</strong>: a photo ID and a second ID that shows your home address. Digital IDs are not accepted. Your files are stored privately in your company file; only you and our staff can see them.</p>
    <p>Status: <span className={`pill ${['verified', 'filed'].includes(a.status) ? 'ok' : a.status === 'needs_changes' ? 'urgent' : 'warn'}`}>{CMRA_STATUS[a.status]}</span>
      {a.status === 'needs_changes' && a.staff_note && <span className="note" style={{ display: 'block' }}>From our team: {a.staff_note}</span>}</p>
    {searchParams?.saved && <p className="ok-msg">Saved.</p>}
    {searchParams?.missing && <p className="err">Please complete every step first: your details, both IDs, how you'll sign, and (if using a notary) the notarized form.</p>}
    {searchParams?.submitted && <p className="ok-msg">Submitted. We'll review it within one business day{a.witness_method === 'video' ? ' and email you to schedule your short video call' : ''}.</p>}

    <Step n="1" done={!!a.home_address} title="Your details (as they appear on Form 1583)">
      <form className="stack" action={saveInfo}><H name="entity_id" value={e.id} /><H name="file" value={e.file_number} />
        <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0 }} className="stack">
        <div className="row"><label>Your full legal name<input name="applicant_name" defaultValue={a.applicant_name || ''} required /></label><label>Email<input name="applicant_email" type="email" defaultValue={a.applicant_email || ''} /></label><label>Phone<input name="applicant_phone" defaultValue={a.applicant_phone || ''} /></label></div>
        <label>Your home address (street, city, state, ZIP, country)<input name="home_address" defaultValue={a.home_address || ''} required /></label>
        <div className="row"><label>Business name<input name="business_name" defaultValue={a.business_name || e.legal_name} /></label><label>Type of business<input name="business_type" defaultValue={a.business_type || ''} placeholder="e.g. Consulting" /></label><label>Where it's registered<input name="registration_place" defaultValue={a.registration_place || 'Florida'} /></label></div>
        <label>Business address (if different from ours)<input name="business_address" defaultValue={a.business_address || ''} /></label>
        <label>Other people allowed to receive mail here (names), if any<input name="receivers" defaultValue={a.receivers || ''} /></label>
        <label>How will you sign the form?<select name="witness_method" defaultValue={a.witness_method || 'video'}>{Object.entries(WITNESS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <button className="btn">Save details</button></fieldset>
      </form>
    </Step>

    {['id1', 'id2'].map((w, i) => <Step key={w} n={i + 2} done={!!a[`${w}_path`]} title={i === 0 ? 'Photo ID (primary)' : 'Second ID showing your home address'}>
      {a[`${w}_path`] && <p className="muted">On file: {a[`${w}_type`]}{a[`${w}_expires`] ? `, expires ${fmtDay(a[`${w}_expires`] + 'T12:00:00')}` : ''} · <a href={`/api/file?type=compliance&id=${e.id}&part=${w}`}>View</a></p>}
      {!ro && <UploadForm bucket="compliance" entityId={e.id} action={saveId} submitLabel={a[`${w}_path`] ? 'Replace ID' : 'Save ID'} requireFile>
        <H name="entity_id" value={e.id} /><H name="which" value={w} />
        <label>Type of ID<select name="type" defaultValue={a[`${w}_type`] || ''}><option value="" disabled>Choose…</option>{(i === 0 ? PRIMARY_IDS : SECONDARY_IDS).map(t => <option key={t}>{t}</option>)}</select></label>
        <div className="row"><label>Issued by (state or country)<input name="issuer" defaultValue={a[`${w}_issuer`] || ''} /></label><label>Expiration date (if any)<input name="expires" type="date" defaultValue={a[`${w}_expires`] || ''} /></label></div>
        <label>Photo or scan (PDF or image; front and back in one file if needed)<input name="file" type="file" accept="image/*,application/pdf" /></label>
      </UploadForm>}
    </Step>)}

    <Step n="4" done={!!a.form_path || (a.witness_method && a.witness_method !== 'notary')} title="Sign USPS Form 1583">
      <p>Download the official form: <a href="https://about.usps.com/forms/ps1583.pdf" target="_blank" rel="noopener noreferrer">PS Form 1583 (USPS)</a>. Fill it in but <strong>don't sign yet</strong>.</p>
      <ul><li><strong>Video call or in person:</strong> you sign while our staff watches and checks your original IDs. We'll schedule it after you submit.</li>
        <li><strong>Notary:</strong> sign in front of a notary (an online notary is fine), then upload the notarized form here.</li></ul>
      {a.form_path && <p className="muted">Signed form on file · <a href={`/api/file?type=compliance&id=${e.id}&part=form`}>View</a></p>}
      {!ro && <UploadForm bucket="compliance" entityId={e.id} action={saveForm} submitLabel="Upload signed form">
        <H name="entity_id" value={e.id} />
        <label>Signed / notarized PS Form 1583 (PDF)<input name="file" type="file" accept="application/pdf,image/*" /></label>
      </UploadForm>}
    </Step>

    {!ro && <form action={submit} className="card stack"><H name="entity_id" value={e.id} /><H name="file" value={e.file_number} />
      <h2 style={{ margin: 0 }}>5. Submit for review</h2>
      <label>Anything we should know? (optional)<input name="client_note" /></label>
      <button className="btn">Submit for review</button></form>}
    {['verified', 'filed'].includes(a.status) && <p className="ok-msg">Your Form 1583 is verified{a.crd_filed_at ? ` and was filed with USPS on ${fmtDay(a.crd_filed_at)}` : ''}. If any of your details or IDs change, let us know: USPS requires a new form.</p>}
  </Shell>);
}
