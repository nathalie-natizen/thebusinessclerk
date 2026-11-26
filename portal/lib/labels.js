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
  forward_monthly: 'Forward my mail once a month ($2.50 per item + postage)',
  hold_pickup: 'Hold my mail for pickup at the office',
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

// USPS Form 1583 (DMM 608.10): two current IDs; the secondary must show the applicant's address. Digital IDs are not accepted.
export const PRIMARY_IDS = ["U.S. driver's license or state ID card", 'U.S. passport or passport card', 'Foreign passport', 'U.S. permanent resident card', 'U.S. military / uniformed service ID', 'U.S. university ID card', 'U.S. access card (e.g. Trusted Traveler / NEXUS)', 'Certificate of naturalization', 'Matricula consular (Mexico)', 'Other government photo ID'];
export const SECONDARY_IDS = ['Current lease, mortgage or deed of trust', 'Voter or vehicle registration card', 'Home or vehicle insurance policy'];
export const CMRA_STATUS = { not_started: 'Not started', in_progress: 'In progress', submitted: 'Submitted for review', needs_changes: 'Changes needed', verified: 'Verified', filed: 'Complete' };
export const WITNESS = { video: 'Live video call with our staff', in_person: 'In person at our Florida office', notary: 'Signed in front of a notary (I will upload the notarized form)' };
