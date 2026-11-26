import Link from 'next/link';
import { notFound } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { loadBilling, BillingSection } from '@/components/EntityBilling';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { payPendingOrders, savedCard } from '@/lib/charge';
import { KINDS, fmtDate } from '@/lib/labels';

async function payNow(fd) {
  'use server';
  const file = String(fd.get('file'));
  const { sb } = await requireUser();
  const e = await getEntity(sb, file); if (!e) redirect('/');
  const r = await payPendingOrders(e);
  redirect(`/e/${file}/billing?${r.some(x => !x.ok) ? 'declined=1' : 'paid=1'}`);
}

export default async function EntityBillingPage({ params, searchParams = {} }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: statements } = await sb.from('mail_statements').select('*').eq('entity_id', e.id).order('period_start', { ascending: false });
  const data = await loadBilling(e);
  const { data: pending } = await supabaseAdmin().from('orders').select('id, kind, service, created_at').eq('entity_id', e.id).eq('status', 'awaiting_payment').order('created_at');
  const card = pending?.length ? await savedCard(e.stripe_customer_id).catch(() => null) : null;
  const note = searchParams.pending ? 'Your order is placed and shows as Pending payment. Add a card below and it is charged automatically.'
    : searchParams.card ? 'Card saved. Any order pending payment is being charged now.'
    : searchParams.paid ? 'Payment received. Your order is now in progress.'
    : searchParams.declined ? 'The card was declined. Please update the card on file and try again.'
    : searchParams.notready ? 'Online card payments are not available yet. We will contact you about payment.' : null;
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="billing" />
    <p className="sub">This company's card on file, monthly mail statements, subscriptions and receipts.</p>
    {note && <p className="note">{note}</p>}
    {pending?.length > 0 && <section className="card" style={{ marginBottom: 16 }}>
      <h3>Pending payment</h3>
      <table><thead><tr><th>Service</th><th>Ordered</th><th>Status</th></tr></thead><tbody>
        {pending.map(o => <tr key={o.id}><td><Link href={`/e/${e.file_number}/orders/${o.id}`}>{KINDS[o.kind]?.name || o.service}</Link></td><td>{fmtDate(o.created_at)}</td><td><span className="pill urgent">Pending payment</span></td></tr>)}
      </tbody></table>
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        {card && <form action={payNow}><input type="hidden" name="file" value={e.file_number} /><button className="btn">Pay now with {card.brand?.toUpperCase()} ending {card.last4}</button></form>}
        <form action="/api/stripe/add-card" method="post"><input type="hidden" name="entity_id" value={e.id} /><button className={card ? 'btn secondary' : 'btn'}>{card ? 'Use a different card' : 'Add card and pay'}</button></form>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>Work starts as soon as payment goes through.</p>
    </section>}
    <BillingSection e={e} data={data} statements={statements} showName={false} />
  </Shell>);
}
