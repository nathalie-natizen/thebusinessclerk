import IntakeForm from './Form';
import { T, pick } from './t';
import { KINDS } from '@/lib/labels';

export const metadata = { title: 'Start your order | The Business Clerk', robots: { index: false } };

export default function Start({ searchParams }) {
  const lang = pick(searchParams?.lang); const t = T[lang];
  const initial = KINDS[searchParams?.service] ? searchParams.service : 'llc';
  const payReady = !!process.env.STRIPE_SECRET_KEY;
  return (<main style={{ maxWidth: 760, paddingTop: 40, paddingBottom: 60 }}>
    <p><a href={`https://thebusinessclerk.com${lang === 'en' ? '' : '/' + lang}`} style={{ textDecoration: 'none' }}><img src="/favicon.svg" alt="" width="28" height="28" style={{ verticalAlign: 'middle' }} /> <strong>THE BUSINESS CLERK</strong></a>
      <span style={{ float: 'right' }}>{['en', 'pt', 'es'].map(l => <a key={l} href={`/start?service=${initial}&lang=${l}`} aria-current={l === lang ? 'true' : undefined} style={{ marginLeft: 10, fontWeight: l === lang ? 800 : 400 }}>{l.toUpperCase()}</a>)}</span></p>
    <h1>{t.title}</h1>
    <p className="sub">{t.lead}</p>
    <div className="card"><IntakeForm t={t} lang={lang} initial={initial} payReady={payReady} /></div>
  </main>);
}
