import { checkToken } from '@/lib/capture';
import Capture from './Capture';

export const metadata = { title: 'Take your ID photos | The Business Clerk', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function PhoneCapture({ params }) {
  const t = await checkToken(params.token);
  return (<main style={{ maxWidth: 480, paddingTop: 28, paddingBottom: 40 }}>
    <p className="file">THE BUSINESS CLERK</p>
    {!t ? <div className="card"><h1>Link expired</h1><p>For your security, photo links last 30 minutes. Open a new one from the Compliance tab in your portal.</p></div> : <>
      <h1 style={{ marginTop: 10 }}>ID photos for {t.entities.legal_name}</h1>
      <p className="sub">Use good light, place the ID on a dark surface and make sure all four corners and the text are clear. No flash glare.</p>
      <Capture token={t.token} slots={[
        ['id1', 'Photo ID: front', 'Your passport photo page, driver’s license or other photo ID.', 'environment'],
        ['id1_back', 'Photo ID: back (if it has information)', 'Skip this for passports.', 'environment'],
        ['id2', 'Second ID showing your home address', 'Lease, insurance policy, voter or vehicle registration card, mortgage, or a driver’s license if not used above.', 'environment'],
      ]} />
    </>}
  </main>);
}
