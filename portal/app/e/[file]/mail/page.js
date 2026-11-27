import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Shell, { EntityTabs } from '@/components/Shell';
import { BATCH, scheduleLabel, nextShipDay } from '@/lib/batches';
import Preview from '@/components/Preview';
import { requireUser, getEntity } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fmtDate, MAIL_CATEGORY, MAIL_STATUS, SHIPPING, SHIPPING_SHORT, TRACKING_STATUS, CARRIERS } from '@/lib/labels';

// Client asks us to forward, shred or hold a specific item
async function requestAction(formData) {
  'use server';
  const { sb } = await requireUser();
  const id = String(formData.get('id')); const action = String(formData.get('action'));
  const map = { forward: 'forward_requested', shred: 'shred_requested', hold: 'held', scan: 'scan_requested' };
  if (!map[action]) return;
  const { data: item } = await sb.from('mail_items').select('id, entity_id, status, category').eq('id', id).single(); // RLS: only members see it
  if (!item || ['forwarded', 'delivered', 'shredded', 'picked_up'].includes(item.status)) return;
  // USPS: ordinary mail can't be opened, forwarded or shredded until Form 1583 is approved
  if (action !== 'hold' && !['service_of_process', 'state_notice'].includes(item.category)) { const { data: c } = await sb.from('cmra_applications').select('status').eq('entity_id', item.entity_id).maybeSingle(); if (!['verified', 'filed'].includes(c?.status)) return; }
  if (action === 'scan' && item.status === 'scanned') return;
  const ship = String(formData.get('shipping'));
  await supabaseAdmin().from('mail_items').update({ status: map[action], client_request: action, requested_at: new Date().toISOString(),
    forward_shipping: action === 'forward' ? (SHIPPING[ship] ? ship : 'first_class') : null }).eq('id', item.id);
  revalidatePath('/e/[file]/mail', 'page');
}

export default async function Mail({ params }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: items } = await sb.from('mail_items').select('*').eq('entity_id', e.id).order('received_at', { ascending: false });
  const { data: pref } = await sb.from('mail_preferences').select('forward_shipping').eq('entity_id', e.id).maybeSingle();
  const { data: cmra } = await sb.from('cmra_applications').select('status').eq('entity_id', e.id).maybeSingle();
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="mail" />
    {await (async () => { const { data: pf } = await sb.from('mail_preferences').select('handling, forward_day').eq('entity_id', e.id).maybeSingle(); return pf && BATCH[pf.handling] ? <div className="note">Scheduled forwarding: <strong>{scheduleLabel(pf.handling, pf.forward_day)}</strong>. Next shipment {nextShipDay(pf.handling, pf.forward_day)?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} with everything received until then. <a href={`/e/${e.file_number}/settings`}>Change</a></div> : null; })()}
    {e.mail_service && !['verified', 'filed'].includes(cmra?.status) && <div className="note"><strong>Action needed:</strong> USPS requires Form 1583 and two IDs before we can handle business mail at our address. <a href={`/e/${e.file_number}/compliance`}>Complete it in the Compliance tab →</a></div>}
    <p className="sub">Registered agent notices and business mail received at our Florida office for this company. For each item you can: {e.bundle ? <><strong>open &amp; scan</strong> it to your portal (your first 5 scans each month are included in your annual pack, then from $1.50 to $2.50 per item, up to 10 pages), <strong>forward</strong> it (no forwarding fee with your pack, postage at cost only) or <strong>shred</strong> it (free).</> : <><strong>open &amp; scan</strong> it to your portal (from $1.50 to $2.50 per item, up to 10 pages; the lowest price for your monthly volume is applied automatically), <strong>forward</strong> it ($2.50 per item + postage at cost) or <strong>shred</strong> it (free).</>} Legal papers and state notices are always opened and scanned for free. Legal papers are flagged urgent: please read them right away and contact an attorney if needed.</p>
    {!items?.length ? <div className="note">No mail received yet.</div> : <div className="scroll"><table><thead><tr><th>Received</th><th>Type</th><th>From</th><th>Status</th><th>Envelope / scan</th><th>What should we do?</th></tr></thead><tbody>
      {items.map(m => <tr key={m.id}>
        <td>{fmtDate(m.received_at)}</td>
        <td>{m.urgent && <span className="pill urgent">Urgent</span>} {MAIL_CATEGORY[m.category]}{m.description && <div className="muted">{m.description}</div>}</td>
        <td>{m.sender || '—'}</td>
        <td><span className="pill">{MAIL_STATUS[m.status]}</span>{m.tracking_number && <div className="muted">{CARRIERS[m.carrier] || ''} {m.tracking_url ? <a href={m.tracking_url} target="_blank" rel="noopener noreferrer">{m.tracking_number}</a> : m.tracking_number}{m.tracking_status && m.status !== 'delivered' && <div>{TRACKING_STATUS[m.tracking_status] || m.tracking_status}{m.est_delivery ? ` · expected ${new Date(m.est_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</div>}</div>}</td>
        <td>{m.file_path && (/\.(jpe?g|png|gif|webp|heic)$/i.test(m.file_path)
            ? <Preview src={`/api/file?type=mail&id=${m.id}&view=1`} title={`Envelope from ${m.sender || 'sender'}`}><img src={`/api/file?type=mail&id=${m.id}&view=1`} alt={`Envelope from ${m.sender || 'sender'}`} style={{ height: 64, maxWidth: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)', display: 'block', marginBottom: 6 }} /></Preview>
            : <div><Preview src={`/api/file?type=mail&id=${m.id}&view=1`} pdf title="Envelope">View envelope</Preview></div>)}
          {m.content_path ? <div className="row" style={{ gap: 6 }}><Preview className="btn small" src={`/api/file?type=mail&id=${m.id}&part=content&view=1`} pdf title={`Scan: ${m.sender || 'mail'}`}>View scan</Preview><a className="btn small sec" href={`/api/file?type=mail&id=${m.id}&part=content`}>Download</a></div> : m.status === 'scan_requested' ? <span className="pill warn">Scan requested</span> : <span className="muted">Not opened</span>}</td>
        <td>{['received', 'scanned', 'held', 'scan_requested'].includes(m.status) ? <form action={requestAction} className="stack" style={{ gap: 6 }}>
          <input type="hidden" name="id" value={m.id} />
          {!m.content_path && m.status !== 'scan_requested' && <button className="btn small" name="action" value="scan">Open &amp; scan to portal</button>}
          <div className="row" style={{ gap: 6, alignItems: 'center' }}>
            <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>Forward:<select name="shipping" defaultValue={pref?.forward_shipping || 'first_class'} aria-label="Carrier service" style={{ width: 'auto' }}>{Object.entries(SHIPPING_SHORT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <button className="btn small sec" name="action" value="forward">Forward</button>
          </div>
          <button className="btn small sec" name="action" value="shred">Shred</button>
        </form> : <span className="muted">{m.client_request ? `You asked: ${m.client_request}${m.forward_shipping ? ` (${SHIPPING_SHORT[m.forward_shipping]})` : ''}` : ''}</span>}</td>
      </tr>)}
    </tbody></table></div>}
  </Shell>);
}
