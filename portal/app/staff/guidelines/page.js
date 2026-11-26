import Shell from '@/components/Shell';
import ServiceTerms from '@/components/ServiceTerms';
import { requireStaff } from '@/lib/auth';
import { KINDS } from '@/lib/labels';
import { STAFF_STEPS, GUIDELINES_VERSION, AUTO_APPROVE_DAYS } from '@/lib/guidelines';
import { TODO_DAYS, FINAL_REVIEW_DAYS, STATE_CHECK_DAYS, MAIL_DAYS, CMRA_REVIEW_DAYS } from '@/lib/sla';

const MANUAL = 'https://docs.google.com/document/d/1lOePoSbuQGxkE01cfuZVqvXP8k2IBHcoA0FlPvYxHrY/edit';

export default async function Guidelines() {
  const { profile } = await requireStaff();
  return (<Shell profile={profile}>
    <h1>Service guidelines</h1>
    <p className="sub">Staff steps and the exact terms each client sees for the services they order. Version {GUIDELINES_VERSION}. Full manual: <a href={MANUAL} target="_blank" rel="noopener noreferrer">Service Guidelines & Operations Manual ↗</a></p>
    <section className="card" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>Deadlines (what the website promises)</h2>
      <p className="muted">Business days, Monday to Friday, Eastern time. The Pipeline and Mail queue show each order's due date and turn red when overdue.</p>
      <table><tbody>
        <tr><td>Formation, annual report, EIN, registered agent change, every filing: file after the order reaches To do</td><td>{TODO_DAYS.llc} business day</td></tr>
        <tr><td>Launch Pack: domain, email and first draft / each revision</td><td>{TODO_DAYS.launch} / {TODO_DAYS.launch_revision} business days</td></tr>
        <tr><td>Launch Pack: client review before automatic approval</td><td>{AUTO_APPROVE_DAYS} days</td></tr>
        <tr><td>Final review (quality check) before archiving</td><td>{FINAL_REVIEW_DAYS} business day</td></tr>
        <tr><td>Filed with Florida: check Sunbiz if not approved after</td><td>{STATE_CHECK_DAYS} business days</td></tr>
        <tr><td>Mail: scan, forward (each) or shred after the client asks</td><td>{MAIL_DAYS} business day</td></tr>
        <tr><td>Scheduled forwarding (weekly, every two weeks, monthly): ship on the client’s chosen day</td><td>Same business day</td></tr>
        <tr><td>Form 1583 review after the client submits</td><td>{CMRA_REVIEW_DAYS} business day</td></tr>
        <tr><td>Legal papers and state notices: log, scan and alert the client</td><td>Same business day</td></tr>
        <tr><td>New orders and client messages: first response</td><td>1 business day</td></tr>
      </tbody></table>
    </section>
    {Object.entries(KINDS).filter(([k, v]) => k !== 'corp' && (!v.internal || k === 'mail_batch')).map(([k, v]) => (
      <section key={k} className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>{k === 'llc' ? 'LLC and corporation formation' : v.name}</h2>
        <h3>Staff steps</h3>
        <ol>{(STAFF_STEPS[k] || []).map(([st, t], i) => <li key={i}><strong>{st}:</strong> {t}</li>)}</ol>
        <h3>What the client sees</h3>
        <ServiceTerms kinds={[k]} names={{ [k]: 'Client terms (English; Portuguese and Spanish on the order form)' }} open={false} />
      </section>))}
  </Shell>);
}
