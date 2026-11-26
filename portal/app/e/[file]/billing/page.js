import { notFound } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { loadBilling, BillingSection } from '@/components/EntityBilling';

export default async function EntityBillingPage({ params }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: statements } = await sb.from('mail_statements').select('*').eq('entity_id', e.id).order('period_start', { ascending: false });
  const data = await loadBilling(e);
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="billing" />
    <p className="sub">This company's card on file, monthly mail statements, subscriptions and receipts.</p>
    <BillingSection e={e} data={data} statements={statements} showName={false} />
  </Shell>);
}
