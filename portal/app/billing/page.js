import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { fmtDay } from '@/lib/labels';

const money = (c, cur = 'usd') => (c / 100).toLocaleString('en-US', { style: 'currency', currency: cur.toUpperCase() });

export default async function Billing({ searchParams }) {
  const { sb, profile } = await requireUser();
  const { data: entities } = await sb.from('entities').select('id, file_number, legal_name, stripe_customer_id').order('legal_name');
  const rows = await Promise.all((entities || []).map(async e => {
    if (!e.stripe_customer_id || !process.env.STRIPE_SECRET_KEY) return { e, subs: [], invoices: [], card: null };
    const s = stripe();
    const card = await s.customers.retrieve(e.stripe_customer_id, { expand: ['invoice_settings.default_payment_method'] })
      .then(async c => { let pm = c.invoice_settings?.default_payment_method; if (!pm || typeof pm === 'string') pm = (await s.paymentMethods.list({ customer: c.id, type: 'card', limit: 1 })).data[0]; return pm?.card || null; })
      .catch(() => null);
    const [subs, invoices] = await Promise.all([
      s.subscriptions.list({ customer: e.stripe_customer_id, status: 'all', limit: 10 }).then(async r => { for (const sub of r.data) for (const it of sub.items.data) { if (typeof it.price.product === 'string') it.price.product = await s.products.retrieve(it.price.product).catch(() => ({ name: 'Subscription' })); } return r.data; }).catch(() => []),
      s.invoices.list({ customer: e.stripe_customer_id, limit: 12 }).then(r => r.data).catch(() => []),
    ]);
    return { e, subs, invoices, card };
  }));
  return (<Shell profile={profile}>
    <h1>Billing</h1>
    <p className="sub">Your subscriptions, payment history and card on file. Card details are handled securely by Stripe; we never see or store your full card number.</p>
    {searchParams?.missing && <div className="note">Billing isn't set up for that company yet. Contact hello@thebusinessclerk.com.</div>}
    {rows.length > 1 && <p className="muted">Each company has its own card on file. Changing the card for one company doesn't change the others.</p>}
    {rows.map(({ e, subs, invoices, card }) => (<section key={e.id} className="card" style={{ marginBottom: 18 }}>
      <span className="file">{e.file_number}</span><h3 style={{ marginTop: 8 }}>{e.legal_name}</h3>
      <p style={{ margin: '8px 0 4px' }}><strong>Card on file for this company:</strong> {card ? `${card.brand.toUpperCase()} ending ${card.last4} (exp. ${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)})` : <span className="muted">none yet</span>}</p>
      <form action="/api/stripe/portal" method="post" style={{ margin: '10px 0 16px' }}><input type="hidden" name="entity_id" value={e.id} /><button className="btn">Change card for {e.legal_name}</button></form>
      <h3>Subscriptions</h3>
      {subs.length ? <div className="scroll"><table><thead><tr><th>Service</th><th>Status</th><th>Renews</th><th>Price</th></tr></thead><tbody>{subs.map(s => { const it = s.items.data[0]; return <tr key={s.id}><td>{it?.price?.product?.name || 'Subscription'}</td><td><span className={`pill ${s.status === 'active' ? 'ok' : 'warn'}`}>{s.cancel_at_period_end ? 'Cancels at period end' : s.status}</span></td><td>{fmtDay(s.current_period_end * 1000)}</td><td>{it?.price ? `${money(it.price.unit_amount, it.price.currency)} / ${it.price.recurring?.interval}` : ''}</td></tr>; })}</tbody></table></div> : <p className="muted">No subscriptions.</p>}
      <h3 style={{ marginTop: 16 }}>Payment history</h3>
      {invoices.length ? <div className="scroll"><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{invoices.map(i => <tr key={i.id}><td>{fmtDay(i.created * 1000)}</td><td>{i.lines?.data?.[0]?.description || i.number}</td><td>{money(i.total, i.currency)}</td><td><span className={`pill ${i.status === 'paid' ? 'ok' : 'warn'}`}>{i.status}</span></td><td>{i.hosted_invoice_url && <a href={i.hosted_invoice_url}>Receipt</a>}</td></tr>)}</tbody></table></div> : <p className="muted">No payments yet.</p>}
    </section>))}
  </Shell>);
}
