// Deadlines (business days, Mon–Fri, Eastern time) that match what the website and manual promise.
// One place for every promise: change it here and the staff pipeline, queue and client pages follow.
import { revisions, AUTO_APPROVE_DAYS } from './guidelines';
import { FILINGS } from './filings';

const etDay = d => { const x = new Date(new Date(d).toLocaleString('en-US', { timeZone: 'America/New_York' })); x.setHours(0, 0, 0, 0); return x; };
// Florida state holidays (Sunbiz closed): New Year, MLK, Memorial, Independence, Labor, Veterans, Thanksgiving + Friday, Christmas.
// A holiday on Saturday is observed Friday; on Sunday, Monday.
const nth = (y, m, wd, n) => { const d = new Date(y, m, 1); while (d.getDay() !== wd) d.setDate(d.getDate() + 1); d.setDate(d.getDate() + 7 * (n - 1)); return d; };
const last = (y, m, wd) => { const d = new Date(y, m + 1, 0); while (d.getDay() !== wd) d.setDate(d.getDate() - 1); return d; };
const obs = d => { const x = new Date(d); if (x.getDay() === 6) x.setDate(x.getDate() - 1); else if (x.getDay() === 0) x.setDate(x.getDate() + 1); return x; };
const HOL = {};
export function holidays(y) {
  if (HOL[y]) return HOL[y];
  const tg = nth(y, 10, 4, 4); const fri = new Date(tg); fri.setDate(fri.getDate() + 1);
  const list = [obs(new Date(y, 0, 1)), nth(y, 0, 1, 3), last(y, 4, 1), obs(new Date(y, 6, 4)), nth(y, 8, 1, 1), obs(new Date(y, 10, 11)), tg, fri, obs(new Date(y, 11, 25))];
  return (HOL[y] = new Set(list.map(d => d.toDateString())));
}
export const HOLIDAY_NOTE = 'Business days are Monday to Friday, Eastern time, excluding Florida state holidays (New Year’s Day, Martin Luther King Jr. Day, Memorial Day, Independence Day, Labor Day, Veterans Day, Thanksgiving and the Friday after, Christmas), when the state is closed.';
const isBiz = d => d.getDay() % 6 !== 0 && !holidays(d.getFullYear()).has(d.toDateString());
// Florida annual reports can only be filed January 1 – May 1
export function arWindowOpen(now = new Date()) { const d = etDay(now); return d.getMonth() < 4 || (d.getMonth() === 4 && d.getDate() === 1); }
export function addBizDays(from, n) { const d = etDay(from); let left = n; while (left > 0) { d.setDate(d.getDate() + 1); if (isBiz(d)) left--; } return d; }
export function bizDaysBetween(a, b) { const s = etDay(a), e = etDay(b); let n = 0; const sign = e >= s ? 1 : -1; const d = new Date(s); while ((sign > 0 ? d < e : d > e)) { d.setDate(d.getDate() + sign); if (isBiz(d)) n += sign; } return n; }
const fmt = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// Promises per service when the order is in "To do" (business days)
export const TODO_DAYS = { bundle: 1, mail_batch: 0, llc: 1, corp: 1, annual_report: 1, ein: 1, ra: 1, launch: 5, launch_revision: 3, ...Object.fromEntries(Object.keys(FILINGS).map(k => [k, 1])) };
export const FINAL_REVIEW_DAYS = 1;
export const STATE_CHECK_DAYS = 5; // Florida usually processes online filings in 2–5 business days
export const MAIL_DAYS = 1;        // scans, forward-each, shred: within 1 business day of the request
export const CMRA_REVIEW_DAYS = 1; // Form 1583 review

const stateKinds = k => ['llc', 'corp', 'annual_report', 'ra', 'bundle'].includes(k) || !!FILINGS[k];

// Returns { text, tone: 'late' | 'today' | 'ok' | 'info', due?: Date }
export function orderDeadline(o, now = new Date()) {
  const since = o.updated_at || o.created_at; const today = etDay(now);
  const due = days => { const d = addBizDays(since, days); const diff = bizDaysBetween(today, d);
    return diff < 0 ? { text: `Overdue ${-diff} business day${diff === -1 ? '' : 's'} (due ${fmt(d)})`, tone: 'late', due: d } : diff === 0 ? { text: `Due today (${fmt(d)})`, tone: 'today', due: d } : { text: `Due ${fmt(d)}`, tone: 'ok', due: d }; };
  const s = o.status;
  if (['received', 'payment_confirmed', 'in_review'].includes(s)) {
    if (o.kind === 'mail') return { text: 'Starts when Form 1583 is approved (Mail queue)', tone: 'info' };
    if (o.kind === 'ein' && o.entities?.status === 'pending') return { text: 'Starts when Florida approves the company', tone: 'info' };
    if (o.kind === 'annual_report' && !arWindowOpen(now)) return { text: `Files when Sunbiz opens Jan 1, ${etDay(now).getFullYear() + 1}`, tone: 'info' };
    const rev = o.kind === 'launch' && revisions(o.details).used > 0 && (o.details?.revisions?.log?.slice(-1)[0]?.at || '') >= since;
    return due(rev ? TODO_DAYS.launch_revision : (TODO_DAYS[o.kind] ?? 1));
  }
  if (s === 'information_needed') { const n = bizDaysBetween(since, now); return { text: `Waiting on client ${n} business day${n === 1 ? '' : 's'}`, tone: 'info' }; }
  if (s === 'submitted') {
    if (o.kind === 'launch') { const d = new Date(new Date(since).getTime() + AUTO_APPROVE_DAYS * 864e5); return { text: `Client review; auto-approves ${fmt(d)}`, tone: 'info', due: d }; }
    if (stateKinds(o.kind)) { const d = addBizDays(since, STATE_CHECK_DAYS); return bizDaysBetween(today, d) < 0 ? { text: `Check Sunbiz: over ${STATE_CHECK_DAYS} business days at the State`, tone: 'today', due: d } : { text: `At the State; check by ${fmt(d)}`, tone: 'info', due: d }; }
    return { text: 'Submitted', tone: 'info' };
  }
  if (s === 'final_review') return due(FINAL_REVIEW_DAYS);
  return { text: '', tone: 'info' };
}

// What we tell the client on the order page
export function clientExpectation(o) {
  const s = o.status; const since = o.updated_at || o.created_at;
  if (['received', 'payment_confirmed', 'in_review'].includes(s)) {
    if (o.kind === 'mail') return 'Your address goes live once your USPS Form 1583 is approved (Compliance tab).';
    if (o.kind === 'mail_batch') return 'Your scheduled mail shipment goes out today. You will get the tracking number by email.';
    if (o.kind === 'ein' && o.entities?.status === 'pending') return 'We apply for your EIN as soon as Florida approves your company.';
    if (o.kind === 'annual_report' && !arWindowOpen()) return `Florida opens annual report filing on January 1. We file within one business day after that, once your questionnaire is complete.`;
    const d = addBizDays(since, o.kind === 'launch' ? (revisions(o.details).used > 0 ? TODO_DAYS.launch_revision : TODO_DAYS.launch) : (TODO_DAYS[o.kind] ?? 1));
    return o.kind === 'launch' ? `We expect to deliver by ${fmt(d)}.` : `We expect to file by ${fmt(d)}.`;
  }
  if (s === 'submitted' && stateKinds(o.kind)) return 'Florida usually processes online filings within 2–5 business days. We update this page as soon as it’s approved.';
  if (s === 'submitted' && o.kind === 'ein') return 'With an SSN or ITIN the IRS usually issues the EIN the same day; by fax it typically takes 4–8 weeks.';
  return null;
}

export function mailDeadline(m, now = new Date()) {
  const batch = /weekly|weeks|monthly/.test(m.client_request || '');
  if (batch) return { text: `Ships with the ${m.client_request.replace(/^forward \(|\)$/g, '')}`, tone: 'info' };
  const since = m.requested_at || m.received_at; const d = addBizDays(since, MAIL_DAYS); const diff = bizDaysBetween(etDay(now), d);
  return diff < 0 ? { text: `Overdue (due ${fmt(d)})`, tone: 'late' } : diff === 0 ? { text: 'Due today', tone: 'today' } : { text: `Due ${fmt(d)}`, tone: 'ok' };
}
export const toneClass = t => t === 'late' ? 'urgent' : t === 'today' ? 'warn' : t === 'ok' ? 'ok' : '';
