import Link from 'next/link';
import { headers } from 'next/headers';

export default function Shell({ profile, children }) {
  // Staff "Client view" pop-up loads client pages in an iframe: show the client layout there
  const embedded = headers().get('sec-fetch-dest') === 'iframe';
  const staff = ['staff', 'admin'].includes(profile?.role) && !embedded;
  const missing = staff ? [!process.env.RESEND_API_KEY && 'email', !process.env.TWILIO_ACCOUNT_SID && 'texts', !process.env.STRIPE_SECRET_KEY && 'payments', !process.env.CRON_SECRET && 'scheduled jobs'].filter(Boolean) : [];
  if (embedded) return (<>
    <header className="top"><div className="in"><span className="brand" style={{ color: '#fff' }}><img src="/favicon.svg" alt="" width="30" height="30" /><span>THE BUSINESS CLERK<small>Client portal (staff preview)</small></span></span></div></header>
    <main>{children}</main>
  </>);
  return (<>
    {missing.length > 0 && <div style={{ background: '#C0392B', color: '#fff', padding: '6px 20px', fontSize: 13.5, textAlign: 'center' }}><strong>Not live yet:</strong> {missing.join(', ')} not set up. Clients are NOT receiving {[missing.includes('email') && 'emails', missing.includes('texts') && 'texts'].filter(Boolean).join(' or ') || 'everything'}{missing.includes('payments') ? ' and nothing is charged' : ''}.{profile?.role === 'admin' && <> <Link href="/staff/setup" style={{ color: '#fff', textDecoration: 'underline' }}>Setup</Link></>}</div>}
    <header className={`top${staff ? ' staff' : ''}`}><div className="in">
      <Link className="brand" href={staff ? '/staff/pipeline' : '/dashboard'}>
        <img src="/favicon.svg" alt="" width="30" height="30" />
        <span>THE BUSINESS CLERK<small>{staff ? 'Staff portal' : 'Client portal'}</small></span>
      </Link>
      {staff ? <><Link href="/staff/pipeline">Pipeline</Link><Link href="/staff/record">Record mail</Link><Link href="/staff">Entities</Link><Link href="/staff/queue">Mail queue</Link><Link href="/staff/new">New entity</Link><Link href="/staff/billing">Billing</Link><Link href="/staff/guidelines">Guidelines</Link>{profile?.role === 'admin' && <Link href="/staff/setup">Setup</Link>}<Link href="/staff/resources">Resources</Link></>
             : <><Link href="/dashboard">My companies</Link><Link href="/billing">Billing</Link><Link href="/resources">Resources</Link><Link href="/account">Account</Link></>}
      <span className="who hide-sm">{profile?.email}</span>
      <form action="/auth/signout" method="post"><button className="btn small sec" style={{ background: 'transparent', color: '#fff', borderColor: '#fff' }}>Sign out</button></form>
    </div></header>
    <main>{children}</main>
  </>);
}

async function PaymentBanner({ file }) {
  const { supabaseServer } = await import('@/lib/supabase/server');
  const { data: e } = await supabaseServer().from('entities').select('payment_issue').eq('file_number', file).maybeSingle();
  const p = e?.payment_issue; if (!p) return null;
  return <div className="note" style={{ borderLeftColor: '#C0392B' }}><strong>Payment failed:</strong> we couldn't charge ${((p.amount || 0) / 100).toFixed(2)} for {p.what} to your card on file. <Link href={`/e/${file}/billing`}>Update your card now</Link> so your services continue.</div>;
}

export function EntityTabs({ file, active }) {
  const t = [['', 'Overview'], ['mail', 'Mail & legal notices'], ['documents', 'Documents'], ['orders', 'Orders'], ['billing', 'Billing'], ['settings', 'Mail settings'], ['compliance', 'Compliance'], ['team', 'Team'], ['agreement', 'Agreement']];
  return <><PaymentBanner file={file} /><nav className="tabs">{t.map(([p, l]) => <Link key={p} href={`/e/${file}${p ? '/' + p : ''}`} aria-current={active === p ? 'page' : undefined}>{l}</Link>)}</nav></>;
}
