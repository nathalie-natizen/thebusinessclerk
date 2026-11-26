import { notFound } from 'next/navigation';
import Link from 'next/link';
import { OFFICE } from '@/lib/office';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { fmtDay, HANDLING, statusLabel } from '@/lib/labels';

export default async function Entity({ params }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const [{ data: prefs }, { count: mailCount }, { data: orders }] = await Promise.all([
    sb.from('mail_preferences').select('*').eq('entity_id', e.id).maybeSingle(),
    sb.from('mail_items').select('id', { count: 'exact', head: true }).eq('entity_id', e.id),
    sb.from('orders').select('*').eq('entity_id', e.id).order('created_at', { ascending: false }).limit(3),
  ]);
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="" />
    <div className="grid">
      <div className="card"><h3>Company</h3><p className="muted">Type: {e.entity_type}<br />Status: {e.status}<br />Florida document #: {e.sunbiz_doc_number || 'pending'}<br />Formed: {fmtDay(e.formation_date)}</p></div>
      <div className="card"><h3>Your file number</h3><p><span className="file">{e.file_number}</span></p>
        {e.mail_service && <><p style={{ margin: '10px 0 4px', fontWeight: 600 }}>Your business mailing address</p>
          <address style={{ fontStyle: 'normal', background: 'var(--sand)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }}>
            {e.legal_name}<br />{OFFICE.street ? <>{OFFICE.street}, PMB {e.file_number}<br />{OFFICE.city}, {OFFICE.state} {OFFICE.zip}</> : <>[Our office street address], PMB {e.file_number}<br />[City], FL [ZIP]</>}
          </address>
          <p className="muted" style={{ marginTop: 6 }}>Use it exactly like this, including "PMB {e.file_number}", so your mail reaches your mailbox.{!OFFICE.street && ' The street address will appear here once our office opens.'}</p></>}
        {!e.mail_service && <p className="muted">Use this number when you contact us.</p>}
      </div>
      <div className="card"><h3>Mail</h3><p className="muted">{mailCount || 0} items on file<br />Handling: {HANDLING[prefs?.handling || 'notify']}</p><Link href={`/e/${e.file_number}/mail`}>View mail →</Link></div>
      <div className="card"><h3>Recent orders</h3>{orders?.length ? orders.map(o => <p key={o.id} className="muted">{o.service}: <strong>{statusLabel(o.status, o.kind)}</strong></p>) : <p className="muted">No orders yet.</p>}<Link href={`/e/${e.file_number}/orders`}>All orders →</Link></div>
    </div>
  </Shell>);
}
