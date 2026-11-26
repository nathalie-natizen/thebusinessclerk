import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';
import { loadBilling, BillingSection } from '@/components/EntityBilling';

// All companies on one page. Each company also has its own Billing tab.
export default async function Billing({ searchParams }) {
  const { sb, profile } = await requireUser();
  const { data: entities } = await sb.from('entities').select('id, file_number, legal_name, stripe_customer_id').order('legal_name');
  const { data: statements } = await sb.from('mail_statements').select('*').order('period_start', { ascending: false });
  const rows = await Promise.all((entities || []).map(async e => ({ e, data: await loadBilling(e) })));
  return (<Shell profile={profile}>
    <h1>Billing</h1>
    <p className="sub">Your subscriptions, payment history and card on file for all your companies. Card details are handled securely by Stripe; we never see or store your full card number.</p>
    {searchParams?.missing && <div className="note">Billing isn't set up for that company yet. Contact hello@thebusinessclerk.com.</div>}
    {rows.length > 1 && <p className="muted">Each company has its own card on file. Changing the card for one company doesn't change the others.</p>}
    {rows.map(({ e, data }) => <BillingSection key={e.id} e={e} data={data} statements={statements} />)}
  </Shell>);
}
