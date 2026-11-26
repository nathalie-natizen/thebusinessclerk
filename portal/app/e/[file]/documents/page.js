import { notFound } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { fmtDay, DOC_CATEGORY } from '@/lib/labels';

export default async function Documents({ params }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: docs } = await sb.from('documents').select('*').eq('entity_id', e.id).order('created_at', { ascending: false });
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="documents" />
    <p className="sub">Your filed Articles, EIN letter, annual report confirmations, certificates and agreements.</p>
    {!docs?.length ? <div className="note">No documents yet.</div> : <div className="scroll"><table><thead><tr><th>Document</th><th>Type</th><th>Added</th><th></th></tr></thead><tbody>
      {docs.map(d => <tr key={d.id}><td><a href={`/api/file?type=document&id=${d.id}&view=1`} target="_blank" rel="noopener noreferrer">{d.title}</a></td><td>{DOC_CATEGORY[d.category]}</td><td>{fmtDay(d.created_at)}</td><td><div className="row" style={{ gap: 6 }}><a className="btn small" href={`/api/file?type=document&id=${d.id}&view=1`} target="_blank" rel="noopener noreferrer">View</a><a className="btn small sec" href={`/api/file?type=document&id=${d.id}`}>Download</a></div></td></tr>)}
    </tbody></table></div>}
  </Shell>);
}
