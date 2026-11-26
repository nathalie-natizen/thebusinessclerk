import { T, pick } from '../t';
export const metadata = { title: 'Thank you | The Business Clerk', robots: { index: false } };
export default function Thanks({ searchParams }) {
  const t = T[pick(searchParams?.lang)]; const file = /^TBC-\d+$/.test(searchParams?.file || '') ? searchParams.file : null;
  return (<main style={{ maxWidth: 600, paddingTop: 70 }}><div className="card">
    <p className="file">THE BUSINESS CLERK</p>
    <h1 style={{ marginTop: 12 }}>{t.thanksH}</h1>
    {file && <p>{t.thanksP} <strong className="file">{file}</strong></p>}
    <h3>{t.thanksNext}</h3>
    <ol><li>{t.thanks1}</li>{!searchParams?.paid && <li>{t.thanks2}</li>}<li>{t.thanks3}</li></ol>
    <p><a className="btn" href="/login">{t.portal}</a></p>
    <p className="muted">hello@thebusinessclerk.com</p>
  </div></main>);
}
