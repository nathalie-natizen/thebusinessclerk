import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { HANDLING, SHIPPING } from '@/lib/labels';
import { BATCH, WEEKDAYS, scheduleLabel, nextShipDay } from '@/lib/batches';

async function save(formData) {
  'use server';
  const { sb } = await requireUser();
  const entity_id = String(formData.get('entity_id'));
  const handling = String(formData.get('handling'));
  if (!HANDLING[handling]) return;
  const f = k => String(formData.get(k) || '').trim().slice(0, 120) || null;
  const ship = String(formData.get('forward_shipping'));
  if (handling.startsWith('forward_') && !(f('forward_line1') && f('forward_city') && f('forward_postal'))) redirect(`/e/${String(formData.get('file'))}/settings?addr=1`);
  const day = Math.min(5, Math.max(1, parseInt(formData.get('forward_day')) || 5));
  await sb.from('mail_preferences').upsert({ entity_id, handling, forward_day: day, forward_shipping: SHIPPING[ship] ? ship : 'first_class', forward_name: f('forward_name'), forward_line1: f('forward_line1'), forward_line2: f('forward_line2'), forward_city: f('forward_city'), forward_state: f('forward_state'), forward_postal: f('forward_postal'), forward_country: f('forward_country'), updated_at: new Date().toISOString() });
  redirect(`/e/${String(formData.get('file'))}/settings?saved=1`);
}

export default async function Settings({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: p } = await sb.from('mail_preferences').select('*').eq('entity_id', e.id).maybeSingle();
  const v = p || { handling: 'notify', forward_country: 'United States', forward_shipping: 'first_class' };
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="settings" />
    <form className="stack" action={save}>
      <input type="hidden" name="entity_id" value={e.id} /><input type="hidden" name="file" value={e.file_number} />
      {searchParams?.saved && <p className="ok-msg">Mail settings saved.</p>}
      {searchParams?.addr && <p className="err">To have mail forwarded, enter the forwarding address (address line 1, city and postal code). Nothing was saved.</p>}
      <h2 style={{ marginTop: 0 }}>What should we do with your mail?</h2>
      <div className="row"><label style={{ flex: '2 1 420px' }}>Default handling<select name="handling" defaultValue={v.handling}>{Object.entries(HANDLING).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label>Shipping day for weekly, every-two-weeks or monthly forwarding<select name="forward_day" defaultValue={v.forward_day || 5}>{Object.entries(WEEKDAYS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label></div>
      {BATCH[v.handling] && <p className="note" style={{ margin: 0 }}>Your schedule: <strong>{scheduleLabel(v.handling, v.forward_day)}</strong>. Next shipment: <strong>{nextShipDay(v.handling, v.forward_day)?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong> (only if mail is waiting). Everything we receive until then goes in one package.</p>}
      <label>Default carrier service for forwarding<select name="forward_shipping" defaultValue={v.forward_shipping || 'first_class'}>{Object.entries(SHIPPING).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <p className="muted">Legal papers and state notices are always scanned and sent to you the same business day. Forwarding is $2.50 per item plus postage at cost; opening and scanning is priced per item (the lowest rate for your monthly volume is applied automatically). You can pick a different speed for any single item on the Mail page.</p>
      <h2>Forwarding address</h2>
      <div className="row"><label>Name<input name="forward_name" defaultValue={v.forward_name || ''} autoComplete="name" /></label><label>Address line 1<input name="forward_line1" defaultValue={v.forward_line1 || ''} autoComplete="address-line1" /></label><label>Address line 2<input name="forward_line2" defaultValue={v.forward_line2 || ''} autoComplete="address-line2" /></label></div>
      <div className="row"><label>City<input name="forward_city" defaultValue={v.forward_city || ''} autoComplete="address-level2" /></label><label>State / province<input name="forward_state" defaultValue={v.forward_state || ''} autoComplete="address-level1" /></label></div>
      <div className="row"><label>Postal code<input name="forward_postal" defaultValue={v.forward_postal || ''} autoComplete="postal-code" /></label><label>Country<input name="forward_country" defaultValue={v.forward_country || ''} autoComplete="country-name" /></label></div>
      <button className="btn">Save mail settings</button>
    </form>
  </Shell>);
}
