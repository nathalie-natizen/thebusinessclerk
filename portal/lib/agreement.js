// Client Service Agreement: general terms + one schedule per service the client chose.
// Adding a service later creates a dated Addendum with only that service's schedule.
// DRAFT pending attorney review. Change the text here and bump AGREEMENT_VERSION; signed copies are stored as accepted.
import { clientTerms } from './guidelines';
import { FILINGS, FILING_KINDS } from './filings';

export const AGREEMENT_VERSION = '2026-11-27-draft3';
const CO = 'THE BUSINESS CLERK LLC';

const NAMES = { llc: 'Florida LLC Formation', corp: 'Florida Corporation Formation', ra: 'Florida Registered Agent', annual_report: 'Annual Report Filing', ein: 'EIN Application', mail: 'Business Address & Mail (Mail Service Addendum)', launch: 'Launch Pack' };
for (const [k, f] of Object.entries(FILINGS)) NAMES[k] = f.name;
const ORDER = ['llc', 'corp', 'bundle', 'ra', 'annual_report', 'ein', 'mail', 'launch', ...FILING_KINDS];
const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

const GENERAL = [
  ['1. Agreement and acceptance', [
    `This Client Service Agreement (the "Agreement") is between ${CO}, a Florida limited liability company ("we", "us"), and the client named above ("you"). It consists of these General Terms and the Service Schedules for the services you order. Each additional service you order later is added by a dated Addendum, which becomes part of this Agreement.`,
    'You accept this Agreement electronically by typing your name and checking the acceptance box. Your electronic acceptance has the same effect as a handwritten signature. We keep a record of the date, time, name, email and IP address of each acceptance, and a copy of the exact text accepted is available in your client portal.',
    'If you accept on behalf of a company, you confirm that you are authorized to bind it, and "you" includes that company.']],
  ['2. Our role', [
    'We provide administrative business filing, registered agent, mail-handling and business launch services. We are not a law firm, CPA firm or government agency and we do not give legal, tax, accounting or immigration advice. No attorney-client or accountant-client relationship is created. When you need advice, consult a licensed professional.']],
  ['3. Your responsibilities', [
    'You will give us complete, accurate and current information, review what we prepare before you approve it, and tell us promptly when anything changes. We file and act on the information you provide.',
    'You are responsible for choosing your entity type and for your own legal, tax and licensing obligations.',
    'You will provide identity documents we reasonably request, and you will not use our services for any unlawful, fraudulent or deceptive purpose. We may refuse or stop service if we cannot verify identity or reasonably suspect misuse.']],
  ['4. Fees and payment', [
    'Fees are those shown when you order. Government fees, postage and third-party costs are passed through at cost unless a schedule says they are included.',
    'You authorize us to charge the card on file for the company for each service you order, for recurring services when they renew, and for usage-based charges described in a schedule. Recurring services renew automatically until you cancel.',
    'If a payment fails, we will notify you right away and you agree to update your payment method promptly. Services may be suspended while a balance is unpaid, subject to the schedules.',
    'We may change prices for recurring services with at least 30 days’ notice in your portal or by email. The new price applies from the next renewal.']],
  ['5. Term, cancellation and refunds', [
    'This Agreement stays in effect while you have any active service. You may cancel a recurring service at any time in your portal or by email; it ends as described in its schedule.',
    'Refunds follow each Service Schedule and our published Refund Policy. Government fees are not refundable once submitted. If a filing is rejected because of our error, we correct and refile it at no charge.',
    'We may end a service with notice if you breach this Agreement, fail to pay, or use the service unlawfully. Sections 6 to 11 survive termination.']],
  ['6. Confidentiality and records', [
    'We keep your information confidential and use it only to provide the services, comply with law and enforce this Agreement, as described in our Privacy Policy. Information filed with the State of Florida becomes public record. We retain records as required by law, including USPS rules for mail services.']],
  ['7. Notices and electronic communications', [
    'You agree that we may send notices, documents and alerts through your client portal, by email and, if you opt in, by text message. Notices are effective when posted in the portal or sent to the email on file. You are responsible for keeping your contact details current and for reading what we send.']],
  ['8. No guarantee of government action', [
    'We submit filings promptly but we do not control and cannot guarantee processing times, approvals, name availability, EIN issuance, bank account approval or any other decision by a government agency or third party.']],
  ['9. Limitation of liability', [
    'To the fullest extent allowed by law, our total liability for any claim relating to this Agreement is limited to the fees you paid us for the service involved during the 12 months before the claim. We are not liable for indirect, incidental, special or consequential damages, lost profits or lost data, or for losses caused by information you gave us, your failure to act on notices, or events beyond our reasonable control.']],
  ['10. Indemnification', [
    'You will indemnify and hold us harmless from claims, losses and expenses, including reasonable attorneys’ fees, arising from inaccurate information you provided, your use of the services, or your breach of this Agreement.']],
  ['11. Governing law and disputes', [
    'This Agreement is governed by the laws of the State of Florida. Any dispute will be resolved in the state or federal courts located in the Florida county of our principal office, and both parties consent to that venue.']],
  ['12. General', [
    'This Agreement, its Schedules and Addenda are the entire agreement about the services and replace prior proposals. We may update these General Terms with at least 30 days’ notice in your portal; continued use of a service after that date means you accept the update. If any part is unenforceable, the rest remains in effect. You may not assign this Agreement without our consent. Failure to enforce a term is not a waiver. If this Agreement is translated, the English version controls.']],
];

const SCHEDULE_TERMS = {
  llc: [
    'You authorize us to prepare and file Articles of Organization (LLC) or Articles of Incorporation (corporation) with the Florida Division of Corporations on your behalf, signed by the authorized person you name, using the information you provide.',
    'We check name availability on Sunbiz before filing. If your first choice is unavailable and you allowed it, we file your next choice; otherwise we ask you in the portal. The State may still reject a name.',
    'Unless you instruct otherwise, we are named as your registered agent and you consent to that appointment under the Registered Agent schedule for the first year.'],
  ra: [
    'You appoint us as registered agent for your company, and we accept the appointment, at our Florida registered office. We will be available during business hours as Florida law requires.',
    'We will accept service of process and official notices for your company, scan them and post them to your portal with an email and text alert the same business day. You are responsible for reviewing them and acting in time, including contacting an attorney.',
    'Registered agent service renews yearly. If payment remains unpaid 30 days after notice, or this service is cancelled, we may resign as registered agent as permitted by Florida law, after notice to you. You are then responsible for appointing a new agent.'],
  annual_report: [
    'You authorize us to file your Florida annual report with the information you confirm and to pay the state fee on your behalf, which you reimburse.',
    'Florida charges a late fee for reports filed after May 1. You are responsible for that fee if your confirmation reaches us after that date.'],
  ein: [
    'You authorize us to apply for an Employer Identification Number on your behalf and to act as third-party designee on Form SS-4 for that application only.',
    'You confirm the information about the responsible party is accurate. Taxpayer identification numbers are collected by phone at the time of filing and are not stored in the portal.'],
  mail: [
    `You appoint ${CO} as your commercial mail receiving agency (CMRA) and authorize us to receive, sign for and hold mail and packages addressed to you at our address with your private mailbox (PMB) number.`,
    'This service begins only after USPS Form 1583 is completed, signed as USPS requires, and approved by us, with two acceptable forms of identification. You will submit a new Form 1583 if the company name, the people authorized, or the address details change.',
    'According to your instructions in the portal or your default setting, you authorize us to open and scan mail, forward it by the carrier you choose, shred it, or hold it for pickup. We are not responsible for the contents of mail, for delays or loss by carriers, or for items you ask us to shred.',
    'You will use the address with your PMB number as shown in the portal. We may refuse or return hazardous, perishable, illegal or oversized items and mail for people not listed on your Form 1583.',
    'Items with no instruction are held 30 days. After a further 15-day notice, ordinary mail may be shredded; checks, legal papers and packages are never shredded without your instruction.',
    'Monthly charges are billed on the card on file at month end with an itemized statement. When this service ends, we will forward or return remaining mail per your instruction and handle later mail as USPS rules require.'],
  bundle: [
    'The Annual Compliance Pack combines the Registered Agent, Annual Report Filing and Business Address & Mail schedules of this Agreement, which apply in full, for one yearly fee of $389 charged to the card on file.',
    'While the pack is active, mail is forwarded on the schedule you choose (weekly, every two weeks or monthly) and you pay only postage at cost: there are no per-item, package or forwarding fees. Up to 5 open & scan items a month are included; unused scans do not carry over. Additional scans, and pages above 10 per item, are billed at the regular price only when you request them.',
    'The Florida annual report state fee is not included and is charged at cost when we file.',
    'The pack renews automatically every year until you cancel. It replaces any separate registered agent or mail subscription for the same company. The current year is not prorated on cancellation.'],
  launch: [
    'Domain, email and hosting accounts are created in your name, with your own payment method, during a screen-share. You own them, pay the providers directly, and remain responsible for renewing them.',
    'The Launch Pack includes up to 2 revisions. A revision is one round of changes sent at once. When we deliver, you approve the work or request a revision in the portal; if you do neither within 14 days, the work is considered approved.',
    'You confirm you have the rights to logos, text and images you provide. The trademark check is a basic search, not legal clearance.'],
};
SCHEDULE_TERMS.corp = SCHEDULE_TERMS.llc;
for (const k of FILING_KINDS) SCHEDULE_TERMS[k] = [
  `You authorize us to prepare and file the ${FILINGS[k].name} for your company with the Florida Division of Corporations, using the information you confirm, signed by the authorized person you name.`,
  'The Florida state fee is passed through at cost and charged to the card on file when we file. You are responsible for the accuracy of the information and for any approvals your company documents require.',
  ...(k === 'dba' ? ['Florida requires the fictitious name to be advertised in a newspaper in the county of the business before registration. Arranging and paying for that notice is your responsibility unless we agree otherwise in writing.'] : []),
  ...(k === 'dissolution' ? ['You confirm the dissolution was approved as your company documents require. Dissolving does not settle debts or taxes; after the effective date we cancel your recurring services with us.'] : []),
  ...(k === 'reinstatement' ? ['Before filing we tell you the total state fees due for all missed years; you authorize those charges when you confirm.'] : []),
];

const scheduleSection = (k, letter) => {
  const t = clientTerms(k, 'en') || {};
  const L = [`## Schedule ${letter}: ${NAMES[k]}`, ...SCHEDULE_TERMS[k].map(x => `- ${x}`)];
  const add = (label, arr) => arr?.length && L.push(`**${label}:** ${arr.join('; ')}.`);
  add('Included', t.inc); add('Not included', t.exc); add('You provide', t.you); add('Timing', t.time); add('Revisions', t.rev); add('Cancellation and refunds', t.refund);
  return L.join('\n\n');
};

// Formation includes the first year of registered agent service, so its schedule comes with it
export const sortKinds = kinds => { const ks = [...kinds]; if (ks.some(k => k === 'llc' || k === 'corp' || k === 'foreign')) ks.push('ra'); if (ks.includes('bundle')) ks.push('ra', 'annual_report', 'mail'); return ORDER.filter(k => ks.includes(k) && SCHEDULE_TERMS[k]); };
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function buildAgreement({ clientName, file, kinds, date = new Date() }) {
  const ks = sortKinds(kinds);
  return [
    `# Client Service Agreement`,
    `**Between:** ${CO} and **${clientName}**${file ? ` (file ${file})` : ''}`,
    `**Date:** ${fmt(date)} · **Version:** ${AGREEMENT_VERSION}`,
    `**Services covered:** ${ks.map(k => NAMES[k]).join('; ')}`,
    `# Part 1: General Terms`,
    ...GENERAL.map(([h, ps]) => `## ${h}\n\n${ps.join('\n\n')}`),
    `# Part 2: Service Schedules`,
    ...ks.map((k, i) => scheduleSection(k, letters[i])),
  ].join('\n\n');
}

export function buildAddendum({ clientName, file, kinds, number, baseDate, date = new Date() }) {
  const ks = sortKinds(kinds);
  return [
    `# Addendum No. ${number} to the Client Service Agreement`,
    `**Between:** ${CO} and **${clientName}** (file ${file})`,
    `**Date:** ${fmt(date)} · **Version:** ${AGREEMENT_VERSION}`,
    `This Addendum is part of the existing Client Service Agreement between ${CO} and ${clientName}, file ${file}, accepted on ${fmt(baseDate)}. It adds the service schedule${ks.length > 1 ? 's' : ''} below, effective ${fmt(date)}. All General Terms of the Agreement apply to ${ks.length > 1 ? 'these services' : 'this service'}, and all other terms remain in effect.`,
    ...ks.map((k, i) => scheduleSection(k, `${number}-${letters[i]}`)),
  ].join('\n\n');
}

export const signatureLine = ({ name, email, at, ip }) => `---\n\n**Accepted electronically** by ${name}${email ? ` (${email})` : ''} on ${new Date(at).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET${ip ? ` from IP ${ip}` : ''}.`;
