import 'server-only';
import Stripe from 'stripe';
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// Products sold online. mode: subscription (auto-renew) or payment (one time)
export const PRODUCTS = {
  ra: { name: 'Florida Registered Agent', env: 'STRIPE_PRICE_RA', mode: 'subscription' },
  mail: { name: 'Business Address & Mail', env: 'STRIPE_PRICE_MAIL', mode: 'subscription' },
  llc: { name: 'Florida LLC Formation', env: 'STRIPE_PRICE_LLC', mode: 'payment', withRa: true },
  corp: { name: 'Florida Corporation Formation', env: 'STRIPE_PRICE_CORP', mode: 'payment', withRa: true },
  annual_report: { name: 'Annual Report Filing', env: 'STRIPE_PRICE_ANNUAL_REPORT', mode: 'payment' },
  ein: { name: 'EIN Application', env: 'STRIPE_PRICE_EIN', mode: 'payment' },
  launch: { name: 'Launch Pack', env: 'STRIPE_PRICE_LAUNCH', mode: 'payment' },
};
