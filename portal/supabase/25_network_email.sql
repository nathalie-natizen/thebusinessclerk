-- Partner email (client requests from the portal network page go to the partner, copy to staff) and languages shown as tags
alter table public.network_partners add column if not exists email text;
alter table public.network_partners add column if not exists languages text[];
update public.network_partners set languages = array['English','Spanish'] where firm = 'MEDINA & ASSOCIATES LAW FIRM PLLC' and languages is null;
update public.network_partners set languages = array['English','Portuguese','Spanish'], bio = 'Remote bookkeeping for U.S. small businesses, ongoing or catch-up, and IOLTA trust accounting for Florida law firms. Fixed fees agreed upfront.' where firm = 'THE LEDGER PRACTICE LLC';
