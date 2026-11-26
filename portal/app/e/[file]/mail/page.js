import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fmtDate, MAIL_CATEGORY, MAIL_STATUS, SHIPPING, SHIPPING_SHORT, TRACKING_STATUS, CARRIERS } from '@/lib/labels';

// Client asks us to forward, shred or hold a specific item
async function requestAction(formData) {
  'use server';
  const { sb } = await requireUser();
  const id = String(formData.get('id')); const action = String(formData.get('action'));
  const map = { forward: 'forward_requested', shred: 'shred_requested', hold: 'held' };
  if (!map[action]) return;
  const { data: item } = await sb.from('mail_items').select('id, entity_id, status').eq('id', id).single(); // RLS: only members see it
  if (!item || ['forwarded', 'shredded', 'picked_up'].includes(item.status)) return;
  const ship = String(formData.get('shipping'));
  await supabaseAdmin().from('mail_items').update({ status: map[action], client_request: action,
    forward_shipping: action === 'forward' ? (SHIPPING[ship] ? ship : 'first_class') : null }).eq('id', item.id);
  revalidatePath('/e/[file]/mail', 'page');
}

export default async function Mail({ params }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: items } = await sb.from('mail_items').select('*').eq('entity_id', e.id).order('received_at', { ascending: false });
  const { data: pref } = await sb.from('mail_preferences').select('forward_shipping').eq('entity_id', e.id).maybeSingle();
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="mail" />
    <p className="sub">Registered agent notices and business mail received at our Florida office for this company. To forward an item, choose the carrier service next to it (your default is set in Mail settings); postage is billed at cost. Legal papers are flagged urgent: please read them right away and contact an attorney if needed.</p>
    {!items?.length ? <div className="note">No mail received yet.</div> : <div className="scroll"><table><thead><tr><th>Received</th><th>Type</th><th>From</th><th>Status</th><th>Scan</th><th>Original</th></tr></thead><tbody>
      {items.map(m => <tr key={m.id}>
        <td>{fmtDate(m.received_at)}</td>
        <td>{m.urgent && <span className="pill urgent">Urgent</span>} {MAIL_CATEGORY[m.category]}{m.description && <div className="muted">{m.description}</div>}</td>
        <td>{m.sender || '—'}</td>
        <td><span className="pill">{MAIL_STATUS[m.status]}</span>{m.tracking_number && <div className="muted">{CARRIERS[m.carrier] || ''} {m.tracking_url ? <a href={m.tracking_url} target="_blank" rel="noopener noreferrer">{m.tracking_number}</a> : m.tracking_number}{m.tracking_status && m.status !== 'delivered' && <div>{TRACKING_STATUS[m.tracking_status] || m.tracking_status}{m.est_delivery ? ` · expected ${new Date(m.est_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</div>}</div>}</td>
        <td>{m.file_path ? <a className="btn small" href={`/api/file?type=mail&id=${m.id}`}>Download PDF</a> : <span className="muted">Not scanned</span>}</td>
        <td>{['received', 'scanned', 'held'].includes(m.status) ? <form action={requestAction} className="row" style={{ gap: 6 }}>
          <input type="hidden" name="id" value={m.id} />
          <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>Forward:<select name="shipping" defaultValue={pref?.forward_shipping || 'first_class'} aria-label="Carrier service" title="Carrier service" style={{ width: 'auto' }}>{Object.entries(SHIPPING_SHORT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <button className="btn small sec" name="action" value="forward">Forward</button>
          <button className="btn small sec" name="action" value="shred">Shred</button>
        </form> : <span className="muted">{m.client_request ? `You asked: ${m.client_request}${m.forward_shipping ? ` (${SHIPPING_SHORT[m.forward_shipping]})` : ''}` : ''}</span>}</td>
      </tr>)}
    </tbody></table></div>}
  </Shell>);
}
