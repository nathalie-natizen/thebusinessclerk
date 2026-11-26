// Questionnaires clients complete in the portal after ordering. Answers are saved on the order (details.q).
// Field types: text, textarea, select, radio, checkboxes, rows (repeating table), date, number, file (client upload)
const US_ENDINGS_LLC = ['LLC', 'L.L.C.', 'Limited Liability Company'];
const US_ENDINGS_CORP = ['Inc.', 'Corp.', 'Corporation', 'Incorporated', 'Company'];

import { FILING_KINDS, filingQuestionnaire } from './filings';

export const QUESTIONNAIRES = {
  ein: {
    title: 'EIN application details',
    intro: 'The IRS asks these questions on Form SS-4. For your security, we will ask for the responsible party’s SSN or ITIN by phone. Never type it here.',
    fields: [
      { name: 'responsible_name', label: 'Responsible party: full legal name', type: 'text', required: true, help: 'The owner or officer who controls the company.' },
      { name: 'responsible_title', label: 'Their title', type: 'select', options: ['Member', 'Managing member', 'Manager', 'President', 'CEO', 'Owner'], required: true },
      { name: 'tax_id_type', label: 'Does the responsible party have a U.S. SSN or ITIN?', type: 'radio', options: ['Yes, SSN', 'Yes, ITIN', 'No (we will apply by fax; takes longer)'], required: true },
      { name: 'members', label: 'How many members/owners does the company have?', type: 'number', required: true },
      { name: 'activity', label: 'What does the business do? (main activity)', type: 'text', required: true, help: 'e.g. "Bookkeeping services", "Online retail of clothing".' },
      { name: 'start_date', label: 'Business start date (or expected)', type: 'date' },
      { name: 'employees', label: 'Employees expected in the next 12 months', type: 'number', help: 'Enter 0 if none.' },
      { name: 'first_wages', label: 'If hiring: date of first payroll', type: 'date' },
      { name: 'fiscal_year_end', label: 'Accounting year ends in', type: 'select', options: ['December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'], default: 'December' },
      { name: 'irs_mail', label: 'Where should the IRS mail the EIN letter?', type: 'radio', options: ['Our business address with you (mail service)', 'Another address (write it below)'], required: true },
      { name: 'irs_mail_other', label: 'Other mailing address (if chosen)', type: 'text' },
      { name: 'phone', label: 'Best phone number to reach you for the SSN/ITIN', type: 'text', required: true },
    ],
  },
  launch: {
    title: 'Launch Pack questionnaire',
    intro: 'Tell us what you want. If you are not sure about something, choose "Suggest for me" or "Create it for me" and we will propose options for your approval.',
    fields: [
      { section: 'Brand' },
      { name: 'brand', label: 'Brand / business name to use (and to search for trademarks)', type: 'text', required: true },
      { name: 'about', label: 'In one or two sentences, what does the business do and for whom?', type: 'textarea', required: true },
      { name: 'tagline', label: 'Tagline or slogan (optional)', type: 'text', help: 'Leave blank and we can suggest one.' },
      { section: 'Domain' },
      { name: 'domain_choice', label: 'Domain (website address)', type: 'radio', options: ['I already own a domain', 'I have ideas (list below)', 'Suggest for me'], required: true },
      { name: 'domain_ideas', label: 'Domain you own, or up to 3 ideas', type: 'text', help: 'e.g. mybrand.com, mybrandfl.com' },
      { section: 'Professional email' },
      { name: 'email_provider', label: 'Email provider', type: 'radio', options: ['Google Workspace', 'Microsoft 365', 'Suggest for me'], required: true, help: 'You pay the provider directly, per mailbox, on your own account.' },
      { name: 'mailboxes', label: 'Mailboxes (one per person who needs their own login)', type: 'rows', columns: [['full_name', 'Full name'], ['address', 'Email address wanted (e.g. maria@)']], min: 1, max: 15 },
      { name: 'aliases', label: 'Extra addresses that forward to a mailbox (no extra cost), e.g. info@, billing@', type: 'text' },
      { section: 'Look and feel' },
      { name: 'logo', label: 'Logo', type: 'radio', options: ['I have a logo (upload below)', 'Create a simple text logo for me (my name in a clean font)'], required: true },
      { name: 'logo_file', label: 'Upload your logo (PNG, SVG or PDF)', type: 'file' },
      { name: 'colors', label: 'Brand colors', type: 'radio', options: ['I have colors (write them below)', 'Suggest a palette for me'], required: true },
      { name: 'color_values', label: 'Your colors (names or hex codes, e.g. navy #0F2A44, gold #F2B33D)', type: 'text' },
      { name: 'style', label: 'Style you like', type: 'checkboxes', options: ['Modern', 'Classic', 'Bold', 'Minimal', 'Warm / friendly', 'Luxury', 'Playful'] },
      { name: 'references', label: 'Websites you like (links), and what you like about them', type: 'textarea' },
      { section: 'Website (up to 5 pages)' },
      { name: 'pages', label: 'Pages', type: 'checkboxes', options: ['Home', 'About', 'Services', 'Pricing', 'Contact', 'FAQ', 'Gallery / Portfolio', 'Booking'], help: 'Choose up to 5.', max: 5, default: ['Home', 'About', 'Services', 'Contact'] },
      { name: 'content', label: 'Website text', type: 'radio', options: ['I will provide the text', 'Write it for me from my answers (I will review)'], required: true },
      { name: 'services_list', label: 'Your main services or products (one per line)', type: 'textarea' },
      { name: 'photos', label: 'Photos', type: 'radio', options: ['I will provide photos', 'Use quality stock photos'], required: true },
      { name: 'contact_info', label: 'Contact details to show on the site (phone, email, hours, address or service area)', type: 'textarea' },
      { name: 'social', label: 'Social media links (optional)', type: 'text' },
      { name: 'notes', label: 'Anything else?', type: 'textarea' },
    ],
  },
  annual_report: {
    title: 'Annual report: confirm your details',
    intro: 'We file your annual report with the information currently on record. Tell us if anything changed.',
    fields: [
      { name: 'changes', label: 'Has anything changed since last year?', type: 'radio', options: ['No changes', 'Yes (describe below)'], required: true },
      { name: 'change_details', label: 'What changed? (addresses, members/managers/officers, their addresses, FEIN)', type: 'textarea' },
      { name: 'signer', label: 'Name of the person authorizing this filing', type: 'text', required: true },
    ],
  },
};

for (const k of FILING_KINDS) QUESTIONNAIRES[k] = filingQuestionnaire(k);
export const needsQuestionnaire = kind => !!QUESTIONNAIRES[kind];
export const ENDINGS = { llc: US_ENDINGS_LLC, corp: US_ENDINGS_CORP };

// Validate and collect answers from a submitted form
export function collect(def, fd) {
  const q = {}; const missing = [];
  for (const f of def.fields) {
    if (!f.name) continue;
    if (f.type === 'checkboxes') q[f.name] = fd.getAll(f.name).map(String).slice(0, f.max || 20);
    else if (f.type === 'rows') {
      const rows = [];
      for (let i = 0; i < (f.max || 10); i++) { const r = Object.fromEntries(f.columns.map(([c]) => [c, String(fd.get(`${f.name}_${i}_${c}`) || '').trim().slice(0, 200)])); if (Object.values(r).some(Boolean)) rows.push(r); }
      q[f.name] = rows; if (f.min && rows.length < f.min) missing.push(f.label);
      continue;
    } else if (f.type === 'file') { const p = String(fd.get(f.name.replace(/file$/, 'path')) || ''); if (p) q[f.name] = p; continue; }
    else q[f.name] = String(fd.get(f.name) || '').trim().slice(0, f.type === 'textarea' ? 3000 : 300);
    if (f.required && (!q[f.name] || (Array.isArray(q[f.name]) && !q[f.name].length))) missing.push(f.label);
  }
  return { q, missing };
}
