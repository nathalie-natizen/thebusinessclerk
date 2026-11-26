import Link from 'next/link';

export default function Shell({ profile, children }) {
  const staff = ['staff', 'admin'].includes(profile?.role);
  return (<>
    <header className="top"><div className="in">
      <Link className="brand" href={staff ? '/staff' : '/dashboard'}>
        <img src="/favicon.svg" alt="" width="30" height="30" />
        <span>THE BUSINESS CLERK<small>{staff ? 'Staff portal' : 'Client portal'}</small></span>
      </Link>
      {staff ? <><Link href="/staff">Entities</Link><Link href="/staff/queue">Mail queue</Link><Link href="/staff/new">New entity</Link><Link href="/dashboard">Client view</Link></>
             : <><Link href="/dashboard">My companies</Link><Link href="/billing">Billing</Link><Link href="/account">Account</Link></>}
      <span className="who hide-sm">{profile?.email}</span>
      <form action="/auth/signout" method="post"><button className="btn small sec" style={{ background: 'transparent', color: '#fff', borderColor: '#fff' }}>Sign out</button></form>
    </div></header>
    <main>{children}</main>
  </>);
}

export function EntityTabs({ file, active }) {
  const t = [['', 'Overview'], ['mail', 'Mail & legal notices'], ['documents', 'Documents'], ['orders', 'Orders'], ['settings', 'Mail settings']];
  return <nav className="tabs">{t.map(([p, l]) => <Link key={p} href={`/e/${file}${p ? '/' + p : ''}`} aria-current={active === p ? 'page' : undefined}>{l}</Link>)}</nav>;
}
