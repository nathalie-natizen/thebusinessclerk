'use client';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitIntake } from './actions';

function Submit({ label }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? '…' : label}</button>; }

export default function IntakeForm({ t, lang, initial, payReady }) {
  const [service, setService] = useState(initial);
  const [addons, setAddons] = useState({});
  const [state, action] = useFormState(submitIntake, null);
  const formation = service === 'llc' || service === 'corp';
  const existing = !formation && service !== 'mail' && service !== 'launch';
  const hasMail = service === 'mail' || (formation && addons.mail);
  const hasEin = service === 'ein' || (formation && addons.ein);
  const R = ' *';
  return (<form className="stack" action={action}>
    <input type="hidden" name="lang" value={lang} />
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
    {state?.error && state.error !== 'spam' && <p className="err">{t.err}</p>}

    <label style={{ fontSize: 20, fontWeight: 700 }}>{t.service}<select name="service" value={service} onChange={e => setService(e.target.value)}>{Object.entries(t.s).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
    {formation && <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontWeight: 700, marginBottom: 6 }}>{t.addons}</legend>
      {Object.entries(t.a).map(([k, l]) => <label key={k} style={{ display: 'flex', gap: 10, fontWeight: 400 }}><input type="checkbox" name={'addon_' + k} checked={!!addons[k]} onChange={e => setAddons({ ...addons, [k]: e.target.checked })} style={{ minHeight: 'auto' }} />{l}</label>)}
    </fieldset>}

    <h2>{t.company}</h2>
    {formation ? <>
      <p style={{ fontWeight: 600, margin: 0 }}>{t.names}</p><p className="muted" style={{ margin: 0 }}>{t.namesHelp} <a href="https://search.sunbiz.org/Inquiry/CorporationSearch/ByName" target="_blank" rel="noopener noreferrer">{t.checkSunbiz} ↗</a></p>
      <label>{t.name1}{R}<input name="company" required maxLength={150} /></label>
      <label>{t.name2}{R}<input name="name2" required maxLength={150} /></label>
      <label>{t.name3}<input name="name3" maxLength={150} /></label>
      <label>{t.ending}<select name="ending">{(service === 'corp' ? ['Inc.', 'Corp.', 'Corporation', 'Incorporated'] : ['LLC', 'L.L.C.', 'Limited Liability Company']).map(x => <option key={x}>{x}</option>)}</select></label>
      <label style={{ display: 'flex', gap: 10, fontWeight: 400 }}><input type="checkbox" name="use_backup" defaultChecked style={{ minHeight: 'auto' }} />{t.useBackup}</label>
      {service === 'llc' && <label>{t.management}<select name="management">{t.mgmt.map(m => <option key={m}>{m}</option>)}</select></label>}
      {service === 'corp' && <>
        <div className="row"><label>{t.shares}<input name="shares" type="number" min="1" defaultValue="1000" /></label><label>{t.par}<input name="par" defaultValue="$0.01" /></label></div>
        <p className="muted" style={{ margin: 0 }}>{t.parHelp}</p>
        <label>{t.incorporator}<input name="incorporator" /></label>
        <label>{t.scorp}<select name="s_corp">{t.scorpOpt.map(m => <option key={m}>{m}</option>)}</select></label>
      </>}
      <label>{t.effective}<input name="effective_date" type="date" /></label>
    </> : <label>{existing ? t.nameExisting : t.name}{R}<input name="company" required maxLength={200} /></label>}
    {existing && <label>{t.doc}<input name="doc" maxLength={20} /></label>}
    {formation && <label>{t.purpose}<input name="purpose" maxLength={300} /></label>}

    {(formation || service === 'annual_report') && <>
      <h2>{t.principal}</h2><p className="muted">{t.principalHelp}</p>
      {hasMail && <label style={{ display: 'flex', gap: 10, fontWeight: 400 }}><input type="checkbox" name="use_our_address" style={{ minHeight: 'auto' }} />{t.useOurs}</label>}
      <label>{t.line1}<input name="line1" autoComplete="address-line1" /></label>
      <label>{t.line2}<input name="line2" autoComplete="address-line2" /></label>
      <div className="row"><label>{t.city}<input name="city" autoComplete="address-level2" /></label><label>{t.state}<input name="state" autoComplete="address-level1" /></label></div>
      <div className="row"><label>{t.postal}<input name="postal" autoComplete="postal-code" /></label><label>{t.country}<input name="country" autoComplete="country-name" defaultValue="United States" /></label></div>
      {formation && <label>{t.mailing}<input name="mailing_address" /></label>}
    </>}

    {(formation || service === 'annual_report') && <>
      <h2>{t.people}</h2><p className="muted">{t.peopleHelp}</p>
      {[1, 2, 3, 4].map(i => <div key={i} className="row" style={{ alignItems: 'end' }}>
        <label>{t.pname}{i === 1 && formation && R}<input name={`p${i}_name`} required={i === 1 && formation} /></label>
        <label style={{ maxWidth: 220 }}>{t.ptitle}<select name={`p${i}_title`}>{t.roles[service === 'corp' ? 'corp' : 'llc'].map(r => <option key={r}>{r}</option>)}</select></label>
        <label>{t.paddr}<input name={`p${i}_address`} /></label>
      </div>)}
    </>}
    {hasEin && <p className="note">{t.einHelp}</p>}

    {formation && <label>{t.signer}{R}<input name="signer" required /></label>}
    <h2>{t.contact}</h2>
    <label>{t.cname}{R}<input name="contact_name" required autoComplete="name" /></label>
    <label>{t.email}{R}<input name="email" type="email" required autoComplete="email" /></label>
    <label>{t.phone}<input name="phone" type="tel" autoComplete="tel" /></label>
    <label>{t.notes}<textarea name="notes" rows={3} maxLength={2000} /></label>
    <label style={{ display: 'flex', gap: 10, fontWeight: 400, alignItems: 'flex-start' }}><input type="checkbox" name="terms" required style={{ minHeight: 'auto', marginTop: 4 }} />
      <span>{t.terms} (<a href="https://thebusinessclerk.com/terms" target="_blank" rel="noopener">Terms</a> · <a href="https://thebusinessclerk.com/privacy" target="_blank" rel="noopener">Privacy</a>){R}</span></label>
    <Submit label={payReady ? t.submitPay : t.submit} />
  </form>);
}
