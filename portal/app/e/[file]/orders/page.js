import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Shell, { EntityTabs } from '@/components/Shell';
import { requireUser, getEntity } from '@/lib/auth';
import { fmtDate, statusLabel, KINDS } from '@/lib/labels';
import { savedCard, priceFor, chargeOnFile, createPaidOrder } from '@/lib/charge';
import { needsQuestionnaire } from '@/lib/questionnaires';
import AgreementBox from '@/components/AgreementBox';
import { FILINGS } from '@/lib/filings';
import { CATALOG } from '@/lib/prices';
const priceText = k => { const c = CATALOG[k]; if (!c) return ''; return `$${(c.cents / 100).toFixed(2).replace(/\.00$/, '')}${c.interval ? `/${c.interval === 'year' ? 'yr' : 'mo'}` : ''}`; };
const stateFeeNote = k => (k === 'annual_report' || FILINGS[k]) ? ' The Florida state fee is charged at cost when we file.' : '';
import { clientExpectation } from '@/lib/sla';
import { draftFor, recordAcceptance } from '@/lib/agreements';

const ORDERABLE = [['bundle', 'Annual Compliance Pack (agent + annual report + address)'], ['annual_report', 'Annual report filing'], ['ein', 'EIN application'], ['ra', 'Registered agent'], ['mail', 'Business address & mail'], ['launch', 'Launch Pack'], ...Object.entries(FILINGS).map(([k, f]) => [k, f.name])];
const money = c => '$' + (c / 100).toFixed(2).replace(/\.00$/, '');

async function placeOrder(fd) {
  'use server';
  const { sb, user, profile } = await requireUser();
  const file = String(fd.get('file')); const kind = String(fd.get('kind'));
  const sign = String(fd.get('sign_name') || '').trim().slice(0, 120);
  if (!KINDS[kind] || KINDS[kind].internal || fd.get('service_terms') !== 'on' || !sign) return;
  const e = await getEntity(sb, file); if (!e) return; // RLS: only this company's people
  if (!process.env.STRIPE_SECRET_KEY) { // card payments not activated yet: order goes to the team now, charged later
    await recordAcceptance(e, [kind], { name: sign, email: profile?.email || user.email, userId: user.id });
    const o = await createPaidOrder(e, kind, { source: 'portal', unpaid: true });
    redirect(needsQuestionnaire(kind) ? `/e/${file}/orders/${o.id}?new=1` : `/e/${file}/orders?placed=1`);
  }
  const r = await chargeOnFile(e, kind);
  if (!r.ok && r.reason !== 'no_card') redirect(`/e/${file}/orders?declined=1`);
  await recordAcceptance(e, [kind], { name: sign, email: profile?.email || user.email, userId: user.id });
  if (!r.ok) { await createPaidOrder(e, kind, { source: 'portal', pending: true }); redirect(`/e/${file}/billing?pending=1`); }
  const o = await createPaidOrder(e, kind, { amount: r.amount, source: 'portal', ref: r.ref });
  redirect(needsQuestionnaire(kind) ? `/e/${file}/orders/${o.id}?new=1` : `/e/${file}/orders?paid=1`);
}

export default async function Orders({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: orders } = await sb.from('orders').select('*, order_events(*)').eq('entity_id', e.id).order('created_at', { ascending: false });
  const pick = KINDS[searchParams?.order] ? searchParams.order : null;
  const [card, price, draft] = pick ? await Promise.all([savedCard(e.stripe_customer_id), priceFor(pick), draftFor(e, [pick])]) : [null, null, null];
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="orders" />
    {searchParams?.paid && <div className="note">Payment received. Your order is below.</div>}
    {searchParams?.placed && <div className="note">Order placed. It shows Pending payment on the Billing tab until it is charged to this company's card on file.</div>}
    {searchParams?.declined && <div className="note">Your card was declined. Update the card on the Billing tab and try again.</div>}

    {pick ? <section className="card" style={{ marginBottom: 18 }}>
      <h3>Confirm your order: {KINDS[pick].name}</h3>
      <form action={placeOrder} className="stack wide">
        <input type="hidden" name="file" value={e.file_number} /><input type="hidden" name="kind" value={pick} />
        {draft?.type !== 'none' && <><p style={{ margin: 0 }}><strong>{draft.type === 'addendum' ? `Addendum No. ${draft.number} to your Client Service Agreement` : 'Client Service Agreement'}</strong> <span className="muted">{draft.type === 'addendum' ? '(adds this service to your existing agreement)' : ''}</span></p><AgreementBox text={draft.text} /></>}
        <label>Type your full name to sign<input name="sign_name" required maxLength={120} defaultValue={profile?.full_name || ''} /></label>
        <label style={{ display: 'flex', gap: 10, fontWeight: 400, alignItems: 'flex-start' }}><input type="checkbox" name="service_terms" required style={{ minHeight: 'auto', marginTop: 4 }} /><span>{draft?.type === 'addendum' ? 'I have read and agree to this Addendum.' : draft?.type === 'none' ? 'I confirm this order under my existing Client Service Agreement.' : 'I have read and agree to the Client Service Agreement.'}</span></label>
        <p style={{ margin: 0 }}><strong>{price ? `${money(price.unit_amount)}${price.recurring ? ` per ${price.recurring.interval}` : ''}` : priceText(pick)}</strong>{stateFeeNote(pick)}</p>
        {card ? <label style={{ display: 'flex', gap: 10, fontWeight: 400, alignItems: 'flex-start' }}><input type="checkbox" name="charge_ok" required style={{ minHeight: 'auto', marginTop: 4 }} /><span>Charge this to {card.brand.toUpperCase()} ending {card.last4}, the card on file for {e.legal_name}{price?.recurring ? ', renewing automatically until I cancel' : ''}. <Link href={`/e/${e.file_number}/billing`}>Use a different card</Link></span></label>
          : <p className="note" style={{ margin: 0 }}>{process.env.STRIPE_SECRET_KEY ? <>This company has no card on file yet. Place the order and add a card on the Billing tab: the order is charged automatically as soon as the card is saved, and it shows as <strong>Pending payment</strong> until then.</> : <>Card payments are being activated. Your order goes to our team now and shows <strong>Pending payment</strong> on your Billing tab; it is charged to this company's card on file.</>}</p>}
        <div className="row" style={{ gap: 8 }}><button className="btn" style={{ flex: '0 0 auto' }}>{card ? `Pay ${price ? money(price.unit_amount) : priceText(pick)} and place order` : process.env.STRIPE_SECRET_KEY ? 'Place order and add card' : 'Place order'}</button><Link className="btn sec" style={{ flex: '0 0 auto' }} href={`/e/${e.file_number}/orders`}>Cancel</Link></div>
      </form>
    </section> : <section className="card" style={{ marginBottom: 18 }}><h3>Order a service for this company</h3>
      <p className="muted">Same services and prices as our website. Charged to this company's card on file after you confirm. Want to form another company? <a href="/start?service=llc">Start a new company →</a></p>
      <p>{ORDERABLE.filter(([k]) => !(k === 'ra' && e.registered_agent) && !(k === 'mail' && e.mail_service) && !(k === 'bundle' && e.bundle) && !(['ra', 'mail', 'annual_report'].includes(k) && e.bundle)).map(([k, label]) => <Link key={k} className="btn sec small" style={{ marginRight: 8, marginBottom: 8 }} href={`/e/${e.file_number}/orders?order=${k}`}>{label} · {priceText(k)}</Link>)}</p>
    </section>}

    {!orders?.length ? <div className="note">No orders yet.</div> : <div className="grid">{orders.map(o => (
      <div className="card" key={o.id}><h3><Link href={`/e/${e.file_number}/orders/${o.id}`} style={{ color: 'inherit' }}>{o.service}</Link></h3>
        <p><span className={`pill ${['information_needed', 'awaiting_payment'].includes(o.status) ? 'urgent' : ['completed', 'delivered'].includes(o.status) ? 'ok' : ''}`}>{statusLabel(o.status, o.kind)}</span>{o.status === 'awaiting_payment' && <> <Link href={`/e/${params.file}/billing`}>Add or update card on Billing</Link></>}</p>
        {o.status === 'information_needed' && <p><Link className="btn small" href={`/e/${e.file_number}/orders/${o.id}`}>{needsQuestionnaire(o.kind) && !o.details?.q ? 'Complete questionnaire' : 'See what we need'}</Link></p>}
        <p className="muted">Ordered {fmtDate(o.created_at)}</p>
        {(() => { const x = clientExpectation({ ...o, entities: { status: e.status } }); return x ? <p style={{ fontSize: 14 }}>{x}</p> : null; })()}
        <ul className="timeline">{(o.order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3).map(ev => <li key={ev.id}><strong>{statusLabel(ev.status, o.kind)}</strong> <span className="muted">{fmtDate(ev.created_at)}</span>{ev.note && <div className="muted">{ev.note}</div>}</li>)}</ul>
        <Link href={`/e/${e.file_number}/orders/${o.id}`}>Open order →</Link>
      </div>))}</div>}
  </Shell>);
}
