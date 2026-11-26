export const MAIL_CATEGORY = {
  service_of_process: 'Service of process (lawsuit)',
  state_notice: 'Florida state notice',
  government: 'Government (IRS, county, other)',
  general: 'General business mail',
  package: 'Package',
};
export const MAIL_STATUS = {
  received: 'Received', scanned: 'Scanned', forward_requested: 'Forward requested', forwarded: 'Forwarded',
  shred_requested: 'Shred requested', shredded: 'Shredded', held: 'Held at office', picked_up: 'Picked up',
};
export const HANDLING = {
  scan_hold: 'Scan it, keep the original 90 days, then shred',
  scan_shred: 'Scan it and shred the original after 30 days',
  scan_forward_monthly: 'Scan it and mail me the originals once a month',
  scan_forward_quarterly: 'Scan it and mail me the originals every 3 months',
  forward_unopened: 'Forward each item to me unopened (no scan)',
  hold_pickup: 'Scan it and hold the original for pickup at the office',
};
export const ORDER_STATUS = {
  awaiting_payment: 'Awaiting payment', received: 'Order received', payment_confirmed: 'Payment confirmed', information_needed: 'Information needed',
  in_review: 'Under review', submitted: 'Submitted', completed: 'Completed',
  delivered: 'Documents delivered', cancelled: 'Cancelled',
};
export const DOC_CATEGORY = {
  formation: 'Formation', filing: 'Filing', annual_report: 'Annual report', ein: 'EIN letter',
  certificate: 'Certificate', agreement: 'Agreement', other: 'Other',
};
export const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
export const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// Forwarding speed. Postage is billed at cost.
export const SHIPPING = {
  first_class: 'USPS First-Class Mail (regular, usually 2–5 business days)',
  priority: 'USPS Priority Mail (usually 1–3 business days)',
  express: 'USPS Priority Mail Express (overnight to 2 days)',
  courier_overnight: 'UPS or FedEx overnight',
};
export const SHIPPING_SHORT = { first_class: 'USPS First-Class', priority: 'USPS Priority', express: 'USPS Priority Express', courier_overnight: 'UPS/FedEx Overnight' };

// Status label with the right agency for the service
export const statusLabel = (status, kind) => status === 'submitted'
  ? (kind === 'ein' ? 'Submitted to the IRS' : ['llc', 'corp', 'annual_report', 'amendment', 'ra_change'].includes(kind) ? 'Submitted to the State of Florida' : 'In progress')
  : ORDER_STATUS[status] || status;

// Pipeline columns, in order
export const PIPELINE = [
  ['awaiting_payment', 'Awaiting payment'], ['received', 'New'], ['payment_confirmed', 'Paid – to do'], ['information_needed', 'Waiting on client'],
  ['in_review', 'Preparing'], ['submitted', 'Submitted'], ['completed', 'Completed'],
];

// Services that can be ordered
export const KINDS = {
  llc: { name: 'Florida LLC Formation', env: 'STRIPE_PRICE_LLC' },
  corp: { name: 'Florida Corporation Formation', env: 'STRIPE_PRICE_CORP' },
  ra: { name: 'Florida Registered Agent', env: 'STRIPE_PRICE_RA', recurring: true },
  annual_report: { name: 'Annual Report Filing', env: 'STRIPE_PRICE_ANNUAL_REPORT' },
  ein: { name: 'EIN Application', env: 'STRIPE_PRICE_EIN' },
  mail: { name: 'Business Address & Mail', env: 'STRIPE_PRICE_MAIL', recurring: true },
  launch: { name: 'Launch Pack', env: 'STRIPE_PRICE_LAUNCH' },
};
