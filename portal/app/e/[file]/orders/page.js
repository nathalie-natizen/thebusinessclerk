import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { fmtDate, statusLabel, KINDS } from '@/lib/labels';
import { savedCard, priceFor, chargeOnFile, createPaidOrder } from '@/lib/charge';
import { needsQuestionnaire } from '@/lib/questionnaires';
import AgreementBox from '@/components/AgreementBox';
import { FILINGS } from '@/lib/filings';
import { clientExpectation } from '@/lib/sla';
import { draftFor, recordAcceptance } from '@/lib/agreements';

const ORDERABLE = [['annual_report', 'Annual report filing'], ['ein', 'EIN application'], ['ra', 'Registered agent'], ['mail', 'Business address & mail'], ['launch', 'Launch Pack'], ...Object.entries(FILINGS).map(([k, f]) => [k, f.name])];
const money = c => '$' + (c / 100).toFixed(2).replace(/\.00$/, '');

async function placeOrder(fd) {
  'use server';
  const { sb, user, profile } = await requireUser();
  const file = String(fd.get('file')); const kind = String(fd.get('kind'));
  const sign = String(fd.get('sign_name') || '').trim().slice(0, 120);
  if (!KINDS[kind] || fd.get('service_terms') !== 'on' || !sign) return;
  const e = await getEntity(sb, file); if (!e) return; // RLS: only this company's people
  const r = await chargeOnFile(e, kind);
  if (!r.ok) redirect(r.reason === 'no_card' ? `/api/stripe/checkout?product=${kind}&entity=${file}` : `/e/${file}/orders?declined=1`);
  await recordAcceptance(e, [kind], { name: sign, email: profile?.email || user.email, userId: user.id });
  const o = await createPaidOrder(e, kind, { amount: r.amount, source: 'portal', ref: r.ref });
  redirect(needsQuestionnaire(kind) ? `/e/${file}/orders/${o.id}?new=1` : `/e/${file}/orders?paid=1`);
}

async function toCheckout(fd) {
  'use server';
  const { sb, user, profile } = await requireUser();
  const file = String(fd.get('file')); const kind = String(fd.get('kind')); const sign = String(fd.get('sign_name') || '').trim().slice(0, 120);
  if (!KINDS[kind] || fd.get('service_terms') !== 'on' || !sign) return;
  const e = await getEntity(sb, file); if (!e) return;
  await recordAcceptance(e, [kind], { name: sign, email: profile?.email || user.email, userId: user.id });
  redirect(`/api/stripe/checkout?product=${kind}&entity=${file}`);
}

export default async function Orders({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: orders } = await sb.from('orders').select('*, order_events(*)').eq('entity_id', e.id).neq('status', 'awaiting_payment').order('created_at', { ascending: false });
  const pick = KINDS[searchParams?.order] ? searchParams.order : null;
  const [card, price, draft] = pick ? await Promise.all([savedCard(e.stripe_customer_id), priceFor(pick), draftFor(e, [pick])]) : [null, null, null];
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="orders" />
    {searchParams?.paid && <div className="note">Payment received. Your order is below.</div>}
    {searchParams?.declined && <div className="note">Your card was declined. Update the card on the Billing tab and try again.</div>}

    {pick ? <section className="card" style={{ marginBottom: 18 }}>
      <h3>Confirm your order: {KINDS[pick].name}</h3>
      {card && price ? <form action={placeOrder} className="stack">
        <input type="hidden" name="file" value={e.file_number} /><input type="hidden" name="kind" value={pick} />
      {draft?.type !== 'none' && <><p style={{ margin: 0 }}><strong>{draft.type === 'addendum' ? `Addendum No. ${draft.number} to your Client Service Agreement` : 'Client Service Agreement'}</strong> <span className="muted">{draft.type === 'addendum' ? '(adds this service to your existing agreement)' : ''}</span></p><AgreementBox text={draft.text} /></>}
      <label>Type your full name to sign<input name="sign_name" required maxLength={120} defaultValue={profile?.full_name || ''} /></label>
      <label style={{ display: 'flex', gap: 10, fontWeight: 400, alignItems: 'flex-start' }}><input type="checkbox" name="service_terms" required style={{ minHeight: 'auto', marginTop: 4 }} /><span>{draft?.type === 'addendum' ? 'I have read and agree to this Addendum.' : draft?.type === 'none' ? 'I confirm this order under my existing Client Service Agreement.' : 'I have read and agree to the Client Service Agreement.'}</span></label>
        <p><strong>{money(price.unit_amount)}{price.recurring ? ` per ${price.recurring.interval}` : ''}</strong> will be charged now to {card.brand.toUpperCase()} ending {card.last4}{price.recurring ? ', renewing automatically until you cancel' : ''}.{['annual_report'].includes(pick) ? ' The Florida state fee is charged separately when we file.' : ''}</p>
        <div className="row" style={{ gap: 8 }}><button className="btn" style={{ flex: '0 0 auto' }}>Pay {money(price.unit_amount)} and order</button><Link className="btn sec" style={{ flex: '0 0 auto' }} href={`/e/${e.file_number}/orders`}>Cancel</Link></div>
      </form> : <form action={toCheckout} className="stack">
        <input type="hidden" name="file" value={e.file_number} /><input type="hidden" name="kind" value={pick} />
      {draft?.type !== 'none' && <><p style={{ margin: 0 }}><strong>{draft.type === 'addendum' ? `Addendum No. ${draft.number} to your Client Service Agreement` : 'Client Service Agreement'}</strong> <span className="muted">{draft.type === 'addendum' ? '(adds this service to your existing agreement)' : ''}</span></p><AgreementBox text={draft.text} /></>}
      <label>Type your full name to sign<input name="sign_name" required maxLength={120} defaultValue={profile?.full_name || ''} /></label>
      <label style={{ display: 'flex', gap: 10, fontWeight: 400, alignItems: 'flex-start' }}><input type="checkbox" name="service_terms" required style={{ minHeight: 'auto', marginTop: 4 }} /><span>{draft?.type === 'addendum' ? 'I have read and agree to this Addendum.' : draft?.type === 'none' ? 'I confirm this order under my existing Client Service Agreement.' : 'I have read and agree to the Client Service Agreement.'}</span></label>
        <p>You'll enter a card on the secure Stripe page. <button className="btn small">Continue to payment</button> <Link href={`/e/${e.file_number}/orders`}>Cancel</Link></p>
      </form>}
    </section> : <section className="card" style={{ marginBottom: 18 }}><h3>Order a service for this company</h3>
      <p className="muted">Charged to this company's card on file after you confirm.</p>
      <p>{ORDERABLE.filter(([k]) => !(k === 'ra' && e.registered_agent) && !(k === 'mail' && e.mail_service)).map(([k, label]) => <Link key={k} className="btn sec small" style={{ marginRight: 8, marginBottom: 8 }} href={`/e/${e.file_number}/orders?order=${k}`}>{label}</Link>)}</p>
    </section>}

    {!orders?.length ? <div className="note">No orders yet.</div> : <div className="grid">{orders.map(o => (
      <div className="card" key={o.id}><h3><Link href={`/e/${e.file_number}/orders/${o.id}`} style={{ color: 'inherit' }}>{o.service}</Link></h3>
        <p><span className={`pill ${o.status === 'information_needed' ? 'urgent' : ['completed', 'delivered'].includes(o.status) ? 'ok' : ''}`}>{statusLabel(o.status, o.kind)}</span></p>
        {o.status === 'information_needed' && <p><Link className="btn small" href={`/e/${e.file_number}/orders/${o.id}`}>{needsQuestionnaire(o.kind) && !o.details?.q ? 'Complete questionnaire' : 'See what we need'}</Link></p>}
        <p className="muted">Ordered {fmtDate(o.created_at)}</p>
        {(() => { const x = clientExpectation({ ...o, entities: { status: e.status } }); return x ? <p style={{ fontSize: 14 }}>{x}</p> : null; })()}
        <ul className="timeline">{(o.order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3).map(ev => <li key={ev.id}><strong>{statusLabel(ev.status, o.kind)}</strong> <span className="muted">{fmtDate(ev.created_at)}</span>{ev.note && <div className="muted">{ev.note}</div>}</li>)}</ul>
        <Link href={`/e/${e.file_number}/orders/${o.id}`}>Open order →</Link>
      </div>))}</div>}
  </Shell>);
}
