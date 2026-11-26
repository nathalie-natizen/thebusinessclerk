import Link from 'next/link';
import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';
import { fmtDate, MAIL_CATEGORY } from '@/lib/labels';

export default async function Dashboard() {
  const { sb, profile } = await requireUser();
  const { data: entities } = await sb.from('entities').select('*').order('legal_name');
  const ids = (entities || []).map(e => e.id);
  const { data: recent } = ids.length ? await sb.from('mail_items').select('*, entities(file_number, legal_name)').in('entity_id', ids).order('received_at', { ascending: false }).limit(8) : { data: [] };
  return (<Shell profile={profile}>
    <h1>My companies</h1>
    <p className="sub">Your registered agent mail, documents, orders and billing for each company.</p>
    {!entities?.length && <div className="note">No companies are linked to {profile?.email} yet. If you just ordered, we'll link your company within one business day. Questions? hello@thebusinessclerk.com</div>}
    <div className="grid">{(entities || []).map(e => {
      const unread = (recent || []).filter(m => m.entity_id === e.id && !m.viewed_at).length;
      return (<Link key={e.id} href={`/e/${e.file_number}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span className="file">{e.file_number}</span>
        <h3 style={{ marginTop: 10 }}>{e.legal_name}</h3>
        <p className="muted">{e.entity_type} · {e.status}{e.sunbiz_doc_number ? ` · Doc #${e.sunbiz_doc_number}` : ''}</p>
        <p>{e.registered_agent && <span className="pill ok">Registered agent</span>} {e.mail_service && <span className="pill ok">Mail service</span>} {unread > 0 && <span className="pill urgent">{unread} new</span>}</p>
      </Link>);
    })}</div>
    {!!recent?.length && <><h2>Latest mail</h2><div className="scroll"><table><thead><tr><th>Received</th><th>Company</th><th>Type</th><th>From</th></tr></thead><tbody>
      {recent.map(m => <tr key={m.id}><td>{fmtDate(m.received_at)}</td><td><Link href={`/e/${m.entities.file_number}/mail`}>{m.entities.legal_name}</Link></td><td>{m.urgent && <span className="pill urgent">Urgent</span>} {MAIL_CATEGORY[m.category]}</td><td>{m.sender || '—'}</td></tr>)}
    </tbody></table></div></>}
  </Shell>);
}
