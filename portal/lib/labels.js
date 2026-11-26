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
  received: 'Order received', payment_confirmed: 'Payment confirmed', information_needed: 'Information needed',
  in_review: 'Under review', submitted: 'Submitted to the State of Florida', completed: 'Completed',
  delivered: 'Documents delivered', cancelled: 'Cancelled',
};
export const DOC_CATEGORY = {
  formation: 'Formation', filing: 'Filing', annual_report: 'Annual report', ein: 'EIN letter',
  certificate: 'Certificate', agreement: 'Agreement', other: 'Other',
};
export const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
export const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' }) : '—';
