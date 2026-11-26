import Shell from '@/components/Shell';
import ServiceTerms from '@/components/ServiceTerms';
import { requireStaff } from '@/lib/auth';
import { KINDS } from '@/lib/labels';
import { STAFF_STEPS, GUIDELINES_VERSION } from '@/lib/guidelines';

const MANUAL = 'https://docs.google.com/document/d/1lOePoSbuQGxkE01cfuZVqvXP8k2IBHcoA0FlPvYxHrY/edit';

export default async function Guidelines() {
  const { profile } = await requireStaff();
  return (<Shell profile={profile}>
    <h1>Service guidelines</h1>
    <p className="sub">Staff steps and the exact terms each client sees for the services they order. Version {GUIDELINES_VERSION}. Full manual: <a href={MANUAL} target="_blank" rel="noopener noreferrer">Service Guidelines & Operations Manual ↗</a></p>
    {Object.entries(KINDS).filter(([k]) => k !== 'corp').map(([k, v]) => (
      <section key={k} className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>{k === 'llc' ? 'LLC and corporation formation' : v.name}</h2>
        <h3>Staff steps</h3>
        <ol>{(STAFF_STEPS[k] || []).map(([st, t], i) => <li key={i}><strong>{st}:</strong> {t}</li>)}</ol>
        <h3>What the client sees</h3>
        <ServiceTerms kinds={[k]} names={{ [k]: 'Client terms (English; Portuguese and Spanish on the order form)' }} open={false} />
      </section>))}
  </Shell>);
}
