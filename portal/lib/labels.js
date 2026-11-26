import { FILINGS } from './filings';
export const MAIL_CATEGORY = {
  service_of_process: 'Service of process (lawsuit)',
  state_notice: 'Florida state notice',
  government: 'Government (IRS, county, other)',
  general: 'General business mail',
  package: 'Package',
};
export const MAIL_STATUS = {
  received: 'Received', scan_requested: 'Scan requested', scanned: 'Opened & scanned', forward_requested: 'Forward requested', forwarded: 'Forwarded', delivered: 'Delivered',
  shred_requested: 'Shred requested', shredded: 'Shredded', held: 'Held at office', picked_up: 'Picked up',
};
export const HANDLING = {
  notify: 'Just notify me with a photo of the envelope. I will choose what to do with each item',
  scan_all: 'Open and scan everything to my portal (per-scan pricing applies)',
  forward_each: 'Forward each item to me as it arrives ($2.50 per item + postage)',
  forward_weekly: 'Forward my mail once a week ($2.50 per item + postage)',
  forward_biweekly: 'Forward my mail every two weeks ($2.50 per item + postage)',
  forward_monthly: 'Forward my mail once a month ($2.50 per item + postage)',
  hold_pickup: 'Hold my mail for pickup at the office',
};
export const ORDER_STATUS = {
  awaiting_payment: 'Pending payment', received: 'In progress', payment_confirmed: 'In progress', in_review: 'In progress',
  information_needed: 'Action needed', submitted: 'Submitted', final_review: 'Final review', completed: 'Completed', delivered: 'Completed', cancelled: 'Cancelled',
};
// The four stages staff move orders through (plus Cancel)
export const STAFF_STATUSES = [['received', 'To do'], ['information_needed', 'Waiting on client'], ['submitted', 'Filed / submitted'], ['final_review', 'Final review (quality check)'], ['completed', 'Archive (completed)'], ['cancelled', 'Cancelled']];
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
  ? (kind === 'launch' ? 'Delivered for your review' : kind === 'ein' ? 'Submitted to the IRS' : (['llc', 'corp', 'annual_report'].includes(kind) || FILINGS[kind]) ? 'Submitted to the State of Florida' : 'In progress')
  : ORDER_STATUS[status] || status;

// Pipeline columns, in order
export const ARCHIVED = ['completed', 'delivered'];
export const PIPELINE = [
  ['To do', ['received', 'payment_confirmed', 'in_review']], ['Waiting on client', ['information_needed']],
  ['Filed / submitted', ['submitted']], ['Final review', ['final_review']],
];

// Services that can be ordered
export const KINDS = {
  llc: { name: 'Florida LLC Formation', env: 'STRIPE_PRICE_LLC' },
  corp: { name: 'Florida Corporation Formation', env: 'STRIPE_PRICE_CORP' },
  ra: { name: 'Florida Registered Agent', env: 'STRIPE_PRICE_RA', recurring: true },
  annual_report: { name: 'Annual Report Filing', env: 'STRIPE_PRICE_ANNUAL_REPORT' },
  ein: { name: 'EIN Application', env: 'STRIPE_PRICE_EIN' },
  mail: { name: 'Business Address & Mail', env: 'STRIPE_PRICE_MAIL', recurring: true },
  bundle: { name: 'Annual Bundle (agent + annual report + address)', recurring: true },
  launch: { name: 'Launch Pack', env: 'STRIPE_PRICE_LAUNCH' },
  ...Object.fromEntries(Object.entries(FILINGS).map(([k, f]) => [k, { name: f.name, filing: true }])),
  mail_batch: { name: 'Mail forwarding (scheduled shipment)', internal: true },
};

export const CARRIERS = { USPS: 'USPS', UPS: 'UPS', FedEx: 'FedEx', DHLExpress: 'DHL Express' };
export const TRACKING_STATUS = {
  unknown: 'Waiting for carrier scan', pre_transit: 'Label created', in_transit: 'In transit', out_for_delivery: 'Out for delivery',
  delivered: 'Delivered', available_for_pickup: 'Available for pickup', return_to_sender: 'Returned to sender', failure: 'Delivery problem', cancelled: 'Cancelled', error: 'Tracking error',
};
// Carrier's own tracking page, used when no EasyPost link is available
export const carrierUrl = (carrier, n) => !n ? null : ({
  USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  UPS: `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  FedEx: `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHLExpress: `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
}[carrier] || null);

// USPS Form 1583 (June 2024), items 8e and 9g. Two current IDs; the second must show the home address. A driver's/state ID can be used for only one of the two.
export const PRIMARY_IDS = ['U.S. State/Territory/Tribal driver\'s or nondriver\'s ID card', 'Passport', 'Uniformed Service ID', 'U.S. Access Card', 'U.S. University ID card', 'Matricula Consular', 'Certificate of Naturalization', 'U.S. Permanent Resident Card', 'NEXUS card'];
export const SECONDARY_IDS = ['U.S. State/Territory/Tribal driver\'s or nondriver\'s ID card', 'Current lease', 'Home or vehicle insurance policy', 'Mortgage or deed of trust', 'Vehicle registration card', 'Voter card'];
export const CMRA_STATUS = { not_started: 'Not started', in_progress: 'In progress', submitted: 'Submitted for review', needs_changes: 'Changes needed', verified: 'Verified', filed: 'Complete' };
export const WITNESS = { notary: 'In front of a notary near me (I will upload the notarized form)', ron: 'With an online notary (RON) (I will upload the notarized form)', in_person: 'In person at your Florida office' };
