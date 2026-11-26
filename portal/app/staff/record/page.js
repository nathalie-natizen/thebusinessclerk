import Link from 'next/link';
import Shell from '@/components/Shell';
import EntityPicker from '@/components/EntityPicker';
import RecordMailForm from '@/components/RecordMailForm';
import { requireStaff } from '@/lib/auth';
import { fmtDate, MAIL_CATEGORY, MAIL_STATUS, CMRA_STATUS } from '@/lib/labels';

export default async function RecordMail({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const { data: entities } = await sb.from('entities').select('id, file_number, legal_name, registered_agent, mail_service, status').order('file_number');
  const e = (entities || []).find(x => x.file_number === String(searchParams?.file || '').toUpperCase());
  const [{ data: pref }, { data: cmra }, { data: recent }] = e ? await Promise.all([
    sb.from('mail_preferences').select('handling').eq('entity_id', e.id).maybeSingle(),
    sb.from('cmra_applications').select('status').eq('entity_id', e.id).maybeSingle(),
    sb.from('mail_items').select('id, received_at, category, sender, status').eq('entity_id', e.id).order('received_at', { ascending: false }).limit(5),
  ]) : [{}, {}, {}];
  const legalOnly = e && !e.mail_service;
  const held = e?.mail_service && !['verified', 'filed'].includes(cmra?.status);
  return (<Shell profile={profile}>
    <h1>Record mail</h1>
    <p className="sub">Find the company on the envelope (file number on the PMB line, or the name), then log it. The client is notified as soon as you save.</p>
    <EntityPicker entities={entities || []} autoFocus={!e} />
    {searchParams?.file && !e && <div className="note" style={{ marginTop: 12 }}>No company with file number {searchParams.file}. If the mail isn't for one of our clients, return it to sender.</div>}
    {e && <section className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <span className="file" style={{ fontSize: 16 }}>{e.file_number}</span><h2 style={{ margin: 0 }}>{e.legal_name}</h2>
        <span className="pill">{[e.registered_agent && 'Registered agent', e.mail_service && 'Mail service'].filter(Boolean).join(' + ') || 'No active service'}</span>
        <Link href={`/staff/e/${e.file_number}?tab=mail`} style={{ marginLeft: 'auto' }}>Open company file →</Link>
      </div>
      {legalOnly && <div className="note" style={{ marginBottom: 12 }}>This company has <strong>registered agent only</strong>: accept legal papers and state notices. Ordinary mail is not covered; return it to sender unless the client adds mail service.</div>}
      {held && <div className="note" style={{ marginBottom: 12 }}>Form 1583 is <strong>{CMRA_STATUS[cmra?.status || 'not_started'] || 'not started'}</strong>. Log the envelope, but hold the mail (don't open or forward ordinary mail) until it's approved. Legal papers are always scanned.</div>}
      <RecordMailForm entityId={e.id} handling={pref?.handling} />
      {recent?.length > 0 && <><h3>Last items for this company</h3><ul style={{ margin: 0, paddingLeft: 18 }}>{recent.map(m => <li key={m.id}>{fmtDate(m.received_at)} · {MAIL_CATEGORY[m.category]}{m.sender ? ` · ${m.sender}` : ''} · <span className="muted">{MAIL_STATUS[m.status] || m.status}</span></li>)}</ul></>}
      <p style={{ marginBottom: 0 }}><Link className="btn small sec" href="/staff/record">Next envelope →</Link></p>
    </section>}
  </Shell>);
}
