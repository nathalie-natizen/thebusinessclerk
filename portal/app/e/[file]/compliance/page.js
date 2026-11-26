import { notFound, redirect } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import UploadForm from '@/components/UploadForm';
import { requireUser, getEntity } from '@/lib/auth';
import { canActFor, upsertCmra, maybeSubmit } from '@/lib/compliance';
import { PRIMARY_IDS, SECONDARY_IDS, CMRA_STATUS, WITNESS, fmtDay } from '@/lib/labels';
import { officeLine } from '@/lib/office';
import { supabaseServer } from '@/lib/supabase/server';
import { newCaptureToken } from '@/lib/capture';
import QRCode from 'qrcode';

const c = (v, n = 300) => String(v ?? '').trim().slice(0, n) || null;
const locked = s => ['submitted', 'verified', 'filed'].includes(s);

async function saveInfo(fd) {
  'use server';
  await requireUser(); const id = String(fd.get('entity_id'));
  if (!(await canActFor(id))) return;
  const g = (k, n) => c(fd.get(k), n);
  const first = g('first_name', 80), last = g('last_name', 80), mi = g('middle_initial', 2);
  const street = g('home_street'), city = g('home_city', 80), st = g('home_state', 40), zip = g('home_zip', 20), country = g('home_country', 60);
  await upsertCmra(id, {
    status: 'in_progress', first_name: first, last_name: last, middle_initial: mi, applicant_name: [first, mi, last].filter(Boolean).join(' ') || null,
    applicant_email: g('applicant_email'), applicant_phone: g('applicant_phone', 40),
    home_street: street, home_city: city, home_state: st, home_zip: zip, home_country: country, home_address: [street, city, st, zip, country].filter(Boolean).join(', ') || null,
    protected_individual: fd.get('protected_individual') === 'yes',
    business_name: g('business_name'), business_type: g('business_type'), business_phone: g('business_phone', 40), registration_place: g('registration_place'),
    receivers: g('receivers', 1000), witness_method: WITNESS[fd.get('witness_method')] ? String(fd.get('witness_method')) : null,
  });
  const sent = await maybeSubmit(id);
  redirect(`/e/${fd.get('file')}/compliance?${sent ? 'submitted' : 'saved'}=1`);
}
async function saveId(fd) {
  'use server';
  await requireUser(); const id = String(fd.get('entity_id')); const which = fd.get('which') === 'id2' ? 'id2' : 'id1';
  if (!(await canActFor(id))) return { error: 'Not allowed.' };
  const path = c(fd.get('file_path'));
  const { data: have } = await supabaseServer().from('cmra_applications').select('id1_path, id2_path').eq('entity_id', id).maybeSingle();
  if (path && !path.startsWith(id + '/')) return { error: 'Upload failed. Try again.' };
  if (!path && !have?.[`${which}_path`]) return { error: 'Take a photo with your phone (above) or upload a clear photo or scan of the ID.' };
  const list = which === 'id1' ? PRIMARY_IDS : SECONDARY_IDS;
  if (!list.includes(String(fd.get('type')))) return { error: 'Choose the type of ID.' };
  const exp = c(fd.get('expires'), 10);
  if (exp && new Date(exp) < new Date()) return { error: 'This ID is expired. USPS only accepts current IDs.' };
  const t = String(fd.get('type'));
  const { data: cur } = await supabaseServer().from('cmra_applications').select('id1_type, id2_type').eq('entity_id', id).maybeSingle();
  const DL = PRIMARY_IDS[0];
  if (t === DL && cur?.[which === 'id1' ? 'id2_type' : 'id1_type'] === DL) return { error: "USPS allows a driver's/state ID for only one of the two IDs. Choose a different type." };
  await upsertCmra(id, { status: 'in_progress', [`${which}_type`]: t, [`${which}_issuer`]: c(fd.get('issuer')), [`${which}_expires`]: exp, ...(path ? { [`${which}_path`]: path } : {}), ...(which === 'id1' ? { id1_number: c(fd.get('number'), 40) } : {}) });
  return { message: (await maybeSubmit(id)) ? 'ID saved. Your file is complete and was sent to our team for review. Refresh to see the status.' : 'ID saved.' };
}
async function phoneLink(fd) {
  'use server';
  const { user } = await requireUser(); const id = String(fd.get('entity_id'));
  if (!(await canActFor(id))) return;
  const token = await newCaptureToken(id, user.id);
  redirect(`/e/${fd.get('file')}/compliance?qr=${token}#phone`);
}

async function saveForm(fd) {
  'use server';
  await requireUser(); const id = String(fd.get('entity_id'));
  if (!(await canActFor(id))) return { error: 'Not allowed.' };
  const path = c(fd.get('file_path')); if (!path?.startsWith(id + '/')) return { error: 'Choose the signed form.' };
  await upsertCmra(id, { status: 'in_progress', form_path: path });
  return { message: (await maybeSubmit(id)) ? 'Signed form saved. Your file is complete and was sent to our team for review. Refresh to see the status.' : 'Signed form saved.' };
}
export default async function Compliance({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: a0 } = await sb.from('cmra_applications').select('*').eq('entity_id', e.id).maybeSingle();
  const a = a0 || { status: 'not_started', business_name: e.legal_name, applicant_email: profile?.email };
  const ro = locked(a.status);
  const app = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';
  const qrUrl = searchParams?.qr && /^[A-Za-z0-9_-]{20,64}$/.test(searchParams.qr) ? `${app}/m/${searchParams.qr}` : null;
  const qrSvg = qrUrl ? await QRCode.toString(qrUrl, { type: 'svg', margin: 1, width: 200, color: { dark: '#0F4C5C', light: '#FFFFFF' } }) : null;
  const Step = ({ n, done, title, children }) => <section className="card" style={{ marginBottom: 16 }}><h2 style={{ marginTop: 0 }}>{done ? '✓' : n + '.'} {title}</h2>{children}</section>;
  const H = ({ name, value }) => <input type="hidden" name={name} value={value} />;
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="compliance" />
    <p className="sub">Federal rules require USPS Form 1583 before we can receive mail for you at our address. You'll need <strong>two current IDs</strong>: a photo ID and a second ID that shows your home address. Digital IDs are not accepted. Your files are stored privately in your company file; only you and our staff can see them.</p>
    <p>Status: <span className={`pill ${['verified', 'filed'].includes(a.status) ? 'ok' : a.status === 'needs_changes' ? 'urgent' : 'warn'}`}>{CMRA_STATUS[a.status]}</span>
      {a.status === 'needs_changes' && a.staff_note && <span className="note" style={{ display: 'block' }}>From our team: {a.staff_note}</span>}</p>
    {searchParams?.saved && <p className="ok-msg">Saved.</p>}
    {searchParams?.submitted && <p className="ok-msg">Submitted. We'll review it within one business day{a.witness_method === 'in_person' ? ' and contact you to schedule your office visit' : ''}.</p>}

    <Step n="1" done={!!a.home_address} title="Your details (as they appear on Form 1583)">
      <form className="stack" action={saveInfo}><H name="entity_id" value={e.id} /><H name="file" value={e.file_number} />
        <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0 }} className="stack">
        <div className="row"><label>Last name<input name="last_name" defaultValue={a.last_name || ''} required /></label><label>First name<input name="first_name" defaultValue={a.first_name || ''} required /></label><label style={{ maxWidth: 120 }}>Middle initial<input name="middle_initial" maxLength={1} defaultValue={a.middle_initial || ''} /></label></div>
        <div className="row"><label>Phone<input name="applicant_phone" defaultValue={a.applicant_phone || ''} /></label><label>Email<input name="applicant_email" type="email" defaultValue={a.applicant_email || ''} /></label></div>
        <label>Home street address (must match your second ID)<input name="home_street" defaultValue={a.home_street || ''} required /></label>
        <div className="row"><label>City<input name="home_city" defaultValue={a.home_city || ''} /></label><label>State / province<input name="home_state" defaultValue={a.home_state || ''} /></label><label>ZIP / postal code<input name="home_zip" defaultValue={a.home_zip || ''} /></label><label>Country<input name="home_country" defaultValue={a.home_country || 'United States'} /></label></div>
        <label>Are you a court-ordered protected individual?<select name="protected_individual" defaultValue={a.protected_individual ? 'yes' : 'no'}><option value="no">No</option><option value="yes">Yes (we will ask for a copy of the court order)</option></select></label>
        <h3 style={{ margin: '8px 0 0' }}>Business</h3>
        <div className="row"><label>Business name<input name="business_name" defaultValue={a.business_name || e.legal_name} /></label><label>Type of business<input name="business_type" defaultValue={a.business_type || ''} placeholder="e.g. Consulting" /></label></div>
        <div className="row"><label>Business phone<input name="business_phone" defaultValue={a.business_phone || ''} /></label><label>Place of registration (county and state, or country)<input name="registration_place" defaultValue={a.registration_place || 'Florida'} /></label></div>
        <label>Business address (your mailbox at our office)<input value={officeLine(e.file_number)} disabled readOnly style={{ background: 'var(--sand)', color: 'var(--soft)' }} /></label>
        <label>Other people who may receive mail at this mailbox (names), if any<input name="receivers" defaultValue={a.receivers || ''} /></label>
        <label>How will you sign the form?<select name="witness_method" defaultValue={a.witness_method || 'notary'}>{Object.entries(WITNESS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <button className="btn">Save details</button></fieldset>
      </form>
    </Step>

    {!ro && <section id="phone" className="card" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>Take your ID photos with your phone</h2>
      {qrSvg ? <div className="row" style={{ alignItems: 'center' }}>
        <div style={{ flex: '0 0 200px' }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <div><p>Scan this code with your phone's camera, or open this link on your phone:</p><p style={{ wordBreak: 'break-all' }}><a href={qrUrl}>{qrUrl}</a></p>
          <p className="muted">The link works for 30 minutes. It opens your camera to photograph your photo ID (front and back), and your address ID. Then <a href={`/e/${e.file_number}/compliance`}>refresh this page</a>.</p></div>
      </div> : <form action={phoneLink}><H name="entity_id" value={e.id} /><H name="file" value={e.file_number} />
        <p className="muted">Fastest way: we show you a QR code, you scan it with your phone, and your camera opens to take each photo. Nothing to download.</p>
        <button className="btn">Show QR code</button></form>}
      <p className="muted" style={{ marginTop: 10 }}>Photos received: {[['id1', 'photo ID front'], ['id1_back', 'back'], ['id2', 'address ID']].map(([k, l]) => a[`${k}_path`] ? <a key={k} style={{ marginRight: 10 }} href={`/api/file?type=compliance&id=${e.id}&part=${k}&view=1`} target="_blank" rel="noopener noreferrer">✓ {l}</a> : <span key={k} style={{ marginRight: 10 }}>○ {l}</span>)}</p>
    </section>}

    {['id1', 'id2'].map((w, i) => <Step key={w} n={i + 2} done={!!a[`${w}_path`]} title={i === 0 ? 'Photo ID (primary)' : 'Second ID showing your home address'}>
      {a[`${w}_path`] && <p className="muted">On file: {a[`${w}_type`]}{a[`${w}_expires`] ? `, expires ${fmtDay(a[`${w}_expires`] + 'T12:00:00')}` : ''} · <a href={`/api/file?type=compliance&id=${e.id}&part=${w}&view=1`} target="_blank" rel="noopener noreferrer">View</a></p>}
      {!ro && <UploadForm bucket="compliance" entityId={e.id} action={saveId} submitLabel="Save ID details">
        <H name="entity_id" value={e.id} /><H name="which" value={w} />
        <label>Type of ID<select name="type" defaultValue={a[`${w}_type`] || ''}><option value="" disabled>Choose…</option>{(i === 0 ? PRIMARY_IDS : SECONDARY_IDS).map(t => <option key={t}>{t}</option>)}</select></label>
        <div className="row">{i === 0 && <label>ID number<input name="number" defaultValue={a.id1_number || ''} required /></label>}<label>Issued by (state, agency or country)<input name="issuer" defaultValue={a[`${w}_issuer`] || ''} /></label><label>Expiration date (if any)<input name="expires" type="date" defaultValue={a[`${w}_expires`] || ''} /></label></div>
        <label>{a[`${w}_path`] ? 'Replace the photo (optional)' : 'Or upload a photo or scan from this computer'}<input name="file" type="file" accept="image/*,application/pdf" /></label>
      </UploadForm>}
    </Step>)}

    <Step n="4" done={!!a.form_path || a.witness_method === 'in_person'} title="Sign your pre-filled USPS Form 1583">
      <p>We fill in the latest official USPS form with your details: <a className="btn small" href={`/api/cmra/form?entity=${e.id}`} target="_blank" rel="noopener noreferrer">Open my pre-filled Form 1583</a></p>
      <p className="muted">Check it, print it, and <strong>don't sign until you are in front of the notary</strong> (or our staff). Bring both original IDs.</p>
      <ul><li><strong>Notary near you or online notary (RON):</strong> sign in front of the notary, then upload the notarized form below.</li>
        <li><strong>In person at our Florida office:</strong> bring the printed form and both original IDs; you'll sign in front of our staff.</li></ul>
      {a.form_path && <p className="muted">Signed form on file · <a href={`/api/file?type=compliance&id=${e.id}&part=form&view=1`} target="_blank" rel="noopener noreferrer">View</a></p>}
      {!ro && <UploadForm bucket="compliance" entityId={e.id} action={saveForm} submitLabel="Upload notarized form">
        <H name="entity_id" value={e.id} />
        <label>Notarized PS Form 1583 (PDF)<input name="file" type="file" accept="application/pdf,image/*" /></label>
      </UploadForm>}
    </Step>

    {!ro && <p className="muted">When all the steps above are done, your file is sent to our team for review automatically.</p>}
    {['verified', 'filed'].includes(a.status) && <p className="ok-msg">Your Form 1583 is verified{a.crd_filed_at ? ` and was filed with USPS on ${fmtDay(a.crd_filed_at)}` : ''}. If any of your details or IDs change, let us know: USPS requires a new form.</p>}
  </Shell>);
}
