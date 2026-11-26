import { notFound } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import Md from '@/components/Md';
import { requireUser, getEntity } from '@/lib/auth';
import { fmtDate } from '@/lib/labels';

export default async function AgreementPage({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: docs } = await sb.from('agreements').select('*').eq('entity_id', e.id).order('accepted_at');
  const pick = (docs || []).find(d => d.id === searchParams?.doc) || docs?.[0];
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="agreement" />
    {!docs?.length ? <div className="note">No signed agreement yet. It's signed when you place your first order.</div> : <>
      <p className="sub">Your Client Service Agreement and every addendum added when you ordered a new service, exactly as you signed them.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>{docs.map(d => <a key={d.id} href={`?doc=${d.id}`} className={`btn small ${d.id === pick.id ? '' : 'sec'}`} style={{ flex: '0 0 auto' }}>{d.doc_type === 'agreement' ? 'Agreement' : `Addendum ${d.number}`} · {fmtDate(d.accepted_at)}</a>)}</div>
      <article className="card" style={{ maxWidth: 860 }}><Md text={pick.content} /></article>
      <p className="muted">Use your browser's Print to save a PDF copy.</p>
    </>}
  </Shell>);
}
