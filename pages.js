const C = require('./config');
const P = C.prices, F = C.stateFees;
const { page, md, ctaBand, crumbsSchema, faqSchema, faqHtml, esc } = require('./layout');
const { L } = require('./i18n');

function servicePage(o) {
  const lang = o.lang || 'en', T = L[lang], homeP = lang === 'en' ? 'index.html' : lang + '/index.html';
  const crumbs = [[T.home, lang === 'en' ? '' : lang], [o.crumb || o.h1, o.path.replace(/\.html$/, '')]];
  const schema = [crumbsSchema(crumbs)];
  if (o.service) schema.push({ '@context': 'https://schema.org', '@type': 'Service', name: o.service, serviceType: o.service, areaServed: { '@type': 'State', name: 'Florida' }, provider: { '@type': 'ProfessionalService', name: C.name, url: C.domain }, ...(o.offer ? { offers: { '@type': 'Offer', price: String(o.offer), priceCurrency: 'USD' } } : {}) });
  if (o.faqs) schema.push(faqSchema(o.faqs));
  return { path: o.path, html: page({
    path: o.path, title: o.title, desc: o.desc, schema, lang,
    body: rel => `<section class="pagehead band"><div class="wrap">
<p class="crumbs"><a href="${rel}${homeP}">${T.home}</a> / ${esc(o.crumb || o.h1)}</p>
${o.kicker ? `<p class="kicker">${o.kicker}</p>` : ''}<h1>${o.h1}</h1><p>${o.lead}</p>
${o.noCta ? '' : `<div class="actions"><a class="btn primary" href="${rel}${o.ctaHref || (lang === 'en' ? 'get-started.html' : lang === 'pt' ? 'pt/comecar.html' : 'es/empezar.html')}">${o.cta || T.getStarted}</a>${o.cta2 ? `<a class="btn ghost" href="${rel}${o.cta2[0]}">${o.cta2[1]}</a>` : ''}</div>`}
</div></section>
<section class="band"><div class="wrap ${o.aside ? 'layout' : ''}">
<article class="prose">${md(o.content, rel)}${o.extra ? o.extra(rel) : ''}${o.faqs ? `<h2 id="faq">${T.faq}</h2>${faqHtml(o.faqs, rel)}` : ''}</article>
${o.aside ? `<aside class="aside">${o.aside(rel)}</aside>` : ''}
</div></section>
${o.noCta ? '' : ctaBand(rel, o.ctaH, o.ctaP, lang)}`,
  }) };
}

const priceCard = (title, price, unit, items, href, btn, rel) => `<div class="card plan best"><h3>${title}</h3><p class="price">${price} <small>${unit}</small></p><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul><a class="btn primary" href="${rel}${href}">${btn}</a></div>`;
const linksCard = (title, links, rel) => `<div class="card"><h3>${title}</h3><ul style="padding-left:18px;margin:0">${links.map(([h, t]) => `<li><a href="${rel}${h}">${t}</a></li>`).join('')}</ul></div>`;

const pages = [];

// ---------- Registered agent ----------
pages.push(servicePage({
  path: 'florida-registered-agent.html', service: 'Florida Registered Agent Service', offer: P.raAnnual,
  title: `Florida Registered Agent – $${P.raAnnual}/Year, Same-Day Scans | The Business Clerk`,
  desc: `Florida registered agent for $${P.raAnnual} a year: a staffed Florida office, same-day scans of legal mail, and your annual report filed automatically each year.`,
  kicker: 'Florida registered agent', h1: 'Florida Registered Agent Service', crumb: 'Florida Registered Agent',
  lead: `A staffed Florida office that receives your legal and state mail and scans it the same business day, for $${P.raAnnual} a year.`,
  cta: 'Hire us as your agent', cta2: ['florida-change-registered-agent.html', 'Switch from another agent'],
  content: `
## What a registered agent does
Every Florida LLC and corporation must name a **registered agent** with a physical Florida street address. The agent receives **service of process** (notice of a lawsuit) and official notices from the State of Florida on behalf of your company. The agent's name and address are public on your company's Sunbiz record.
Florida law requires the registered office to be open, with someone available to accept legal papers, at least from 10 a.m. to noon and from 2 p.m. to 4 p.m. on every business day. Our office is staffed for the full business day.
## What's included
- **Our Florida street address** as your registered office on the public record
- **Same-day scans** of service of process and state notices, uploaded to your client account with an email alert
- **Urgent handling**: lawsuits and government notices are flagged and you are contacted right away
- **Auto-renew by default**: your registered agent service renews every year, so your company is never without an agent
- **Annual report filed automatically** every year before May 1, for $${P.annualReport} plus the state fee ($${F.llcAnnual} for LLCs, $${F.corpAnnual} for corporations), charged when we file
- You can turn off auto-renew anytime in your account
- **Client account** with your documents, filings and mail history
## Why not use your own address?
You can serve as your own agent if you live in Florida, but your home address then appears on the public record, and you must be available every business day. Miss a lawsuit and a court can enter a default judgment. Miss the annual report and the state can dissolve your company. A professional agent removes both risks.
## Switching agents is easy
We prepare and file the change for you. The state fee is $${F.llcRaChange} for an LLC and $${F.corpRaChange} for a corporation. There is no gap in coverage. [How changing your agent works](florida-change-registered-agent.html).`,
  aside: rel => priceCard('Florida Registered Agent', `$${P.raAnnual}`, 'per year', ['Florida registered office address', 'Same-day legal mail scans', 'Urgent notice alerts', 'Auto-renew, nothing lapses', `Annual report auto-filed: $${P.annualReport} + state fee`], 'get-started.html', 'Hire us', rel) + linksCard('Guides', [['resources/what-is-a-registered-agent-florida.html', 'What is a registered agent?'], ['resources/florida-annual-report-guide.html', 'Florida annual report guide'], ['resources/registered-agent-vs-virtual-address.html', 'Registered agent vs. virtual address']], rel),
  faqs: [
    ['Who can be a registered agent in Florida?', 'An individual who lives in Florida, or a business authorized to do business in Florida, with a physical Florida street address. A company cannot serve as its own registered agent, and a P.O. box is not allowed.'],
    ['Can I use the registered agent address as my business address?', 'The registered agent address is for legal and state notices. For everyday business mail, banking and marketing, add our [Business Address & Mail](business-address-mail.html) plan.'],
    ['What happens when you receive a lawsuit for my company?', 'We log it with the date and time received, scan it, upload it to your account and contact you the same business day. We do not give legal advice; we recommend you speak with an attorney promptly.'],
    ['How does the annual report work?', `It's automatic. Every year before May 1 we file your annual report and charge $${P.annualReport} plus the state fee ($${F.llcAnnual} for an LLC) at the time of filing. You don't have to do anything. You can turn off auto-filing anytime.`],
  ],
}));

pages.push(servicePage({
  path: 'florida-change-registered-agent.html', service: 'Change of Registered Agent (Florida)',
  title: 'Change Your Florida Registered Agent | The Business Clerk',
  desc: `Switch your Florida registered agent to The Business Clerk. We file the change with Sunbiz for you. State fee $${F.llcRaChange} for LLCs, $${F.corpRaChange} for corporations.`,
  kicker: 'Switch agents', h1: 'Change your Florida registered agent', crumb: 'Change Registered Agent',
  lead: 'Unhappy with your current agent, or tired of having your home address on the public record? We handle the switch with no gap in coverage.',
  cta: 'Switch to us',
  content: `
## How the switch works
1. You sign up for our [registered agent service](florida-registered-agent.html).
2. We prepare the change of registered agent filing, which we sign to accept the appointment.
3. We submit it to the Florida Division of Corporations and pay the state fee on your behalf.
4. Once filed, your Sunbiz record shows THE BUSINESS CLERK LLC as your registered agent.
## Cost
- Our service fee: **$0** when you hire us as your registered agent
- Florida state fee: **$${F.llcRaChange}** for an LLC, **$${F.corpRaChange}** for a corporation
> You can also change your agent on your annual report. If your report is due soon, we can do both in one filing.
## Do I need to tell my old agent?
It's courteous, and you should cancel their billing. The change takes effect when Florida accepts the filing, not when your old agent is notified.`,
  aside: rel => linksCard('Related', [['florida-registered-agent.html', 'Registered agent service'], ['florida-annual-report.html', 'Annual report filing'], ['pricing.html', 'All prices']], rel),
}));

// ---------- Formation ----------
pages.push(servicePage({
  path: 'florida-llc-formation.html', service: 'Florida LLC Formation', offer: P.formation,
  title: `Form a Florida LLC – $${P.formation} All-In with State Fee | The Business Clerk`,
  desc: `Form your Florida LLC for $${P.formation} all-in: Articles of Organization, the $${F.llcArticles} state fee and first-year registered agent. EIN add-on available.`,
  kicker: 'Business formation', h1: 'Form a Florida LLC or corporation', crumb: 'Florida LLC Formation',
  lead: `One price, no surprises: $${P.formation} covers your Articles, the Florida state filing fee and your first year of registered agent service.`,
  cta: 'Form my company', cta2: ['florida-corporation-formation.html', 'Forming a corporation?'],
  content: `
## What's included for $${P.formation}
- **Name check** against the Florida business records
- **Articles of Organization** prepared and filed with the Florida Division of Corporations
- **Florida state filing fee** of $${F.llcArticles} included
- **Standard operating agreement** template
- **First year of registered agent service**, then $${P.raAnnual}/year
- **Digital delivery** of your filed Articles in your client account
Optional add-on: **EIN (federal tax ID) application, $${P.ein}**.
Not included: amendments, DBA (fictitious name) registration, customized legal documents and tax advice.
## What we need from you
- Your company name (and a backup choice)
- Principal office and mailing address (you can use our [business address](business-address-mail.html))
- Names and addresses of the members or managers
- Whether the LLC is member-managed or manager-managed
- For the EIN: the responsible party's details
## How long does it take?
Online filings with Florida are usually processed within a few business days. EINs for owners with a U.S. Social Security number are often issued the same day; owners without one apply by fax or mail, which takes longer. We can't control state or IRS processing times, but we submit promptly and keep you updated.
## After your company is formed
Your company will need a bank account, possibly local business licenses, and its first annual report between January 1 and May 1 of next year. With auto-renew, we file it for you every year for $${P.annualReport} plus the state fee, so you don't have to track the deadline. Want a website and email too? Add a [Launch Pack](launch-pack.html).`,
  aside: rel => priceCard('Florida LLC Formation', `$${P.formation}`, 'one time', ['Articles of Organization', `State fee ($${F.llcArticles}) included`, 'Operating agreement template', 'First-year registered agent', `EIN add-on: $${P.ein}`], 'get-started.html', 'Start my LLC', rel) + linksCard('Guides', [['resources/how-to-form-an-llc-in-florida.html', 'How to form an LLC in Florida'], ['resources/florida-llc-for-non-residents.html', 'Florida LLC for non-residents'], ['resources/llc-vs-corporation-florida.html', 'LLC vs. corporation']], rel),
  faqs: [
    ['How much does it cost to form an LLC in Florida?', `The state fee is $${F.llcArticles} ($100 filing fee plus $25 registered agent designation). Our $${P.formation} package includes that fee, our filing service and a year of registered agent service.`],
    ['Do I need an operating agreement in Florida?', 'Florida does not require you to file one, but having a written operating agreement is strongly recommended, and banks often ask for it. We include a standard template; for custom terms, consult an attorney.'],
    ['Can a non-U.S. resident form a Florida LLC?', 'Yes. You do not need to be a U.S. citizen or resident. See our [international founders](international-founders.html) page.'],
  ],
}));

pages.push(servicePage({
  path: 'florida-corporation-formation.html', service: 'Florida Corporation Formation',
  title: 'Form a Florida Corporation (Inc.) | The Business Clerk',
  desc: `Incorporate in Florida for $${P.formationCorp} all-in: Articles of Incorporation, the $${F.corpArticles} state fee and first-year registered agent.`,
  kicker: 'Business formation', h1: 'Form a Florida corporation', crumb: 'Florida Corporation',
  lead: 'Planning to raise investment, issue shares or elect S-corp status? We file your Articles of Incorporation and handle the setup.',
  cta: 'Incorporate my business',
  content: `
## What's included
- Name check and **Articles of Incorporation** filed with the Florida Division of Corporations
- Florida state filing fee ($${F.corpArticles}) included
- **EIN application** available as a $${P.ein} add-on
- Standard bylaws and organizational resolutions templates
- First year of **registered agent** service
## LLC or corporation?
Most small businesses choose an LLC for its simplicity. A corporation can make sense if you plan to raise venture capital or want a familiar share structure. S-corp status is a tax election available to both LLCs and corporations; talk to a tax professional before choosing. [Compare LLCs and corporations](resources/llc-vs-corporation-florida.html).
## Ongoing requirements
Florida corporations file an annual report between January 1 and May 1 (state fee $${F.corpAnnual}) and keep a registered agent. We serve as your registered agent for $${P.raAnnual}/year and, with auto-renew, file the annual report every year for $${P.annualReport} plus the state fee.`,
  aside: rel => priceCard('Florida Corporation', `$${P.formationCorp}`, 'one time', ['Articles of Incorporation', `State fee ($${F.corpArticles}) included`, 'Bylaws template', 'First-year registered agent', `EIN add-on: $${P.ein}`], 'get-started.html', 'Incorporate', rel),
}));

// ---------- Filings ----------
pages.push(servicePage({
  path: 'florida-annual-report.html', service: 'Florida Annual Report Filing', offer: P.annualReport,
  title: 'Florida Annual Report Filing – Avoid the $400 Late Fee | The Business Clerk',
  desc: `We file your Florida annual report before the May 1 deadline for $${P.annualReport} plus the state fee ($${F.llcAnnual} for LLCs; $${F.llcAnnualLate} after May 1).`,
  kicker: 'Compliance', h1: 'Florida annual report filing', crumb: 'Annual Report Filing',
  lead: 'Every Florida LLC and corporation must file an annual report between January 1 and May 1. We file it accurately and on time, so you never pay the late fee.',
  cta: 'File my annual report',
  content: `
## Deadlines and fees
The annual report is due **between January 1 and May 1** every year, starting the year after your company is formed.
- LLC: **$${F.llcAnnual}** on time, **$${F.llcAnnualLate}** after May 1
- For-profit corporation: **$${F.corpAnnual}** on time, **$${F.corpAnnualLate}** after May 1
Companies that still haven't filed are administratively dissolved later in the year. Reinstating costs more than filing on time.
## What we do
- Review your current Sunbiz record with you
- Update officers, managers, addresses or your registered agent if needed
- File the report and pay the state fee on your behalf
- Upload the filed confirmation to your client account
## Pricing
- **$${P.annualReport}** per filing
- **Auto-renew by default**: we file every year before May 1, so you never pay the late fee. Turn it off anytime.
- Florida state fee billed at cost`,
  aside: rel => priceCard('Annual Report Filing', `$${P.annualReport}`, 'per filing', ['Record review', 'Updates to officers & addresses', 'Filed before May 1', 'Confirmation in your account'], 'get-started.html', 'File now', rel) + linksCard('Guides', [['resources/florida-annual-report-guide.html', 'Florida annual report guide'], ['resources/florida-llc-reinstatement.html', 'Reinstating a dissolved LLC']], rel),
}));

pages.push(servicePage({
  path: 'business-filings.html', service: 'Florida Business Filings',
  title: 'Florida Business Filings: Amendments & Reinstatement | The Business Clerk',
  desc: 'Florida amendments, change of registered agent, reinstatement, dissolution, DBA, certificates of status and certified copies, filed for you at fixed prices.',
  kicker: 'Filings', h1: 'Florida business filings, done right', crumb: 'Business Filings',
  lead: 'Changing your company name, adding a member, closing a business or bringing a dissolved company back? Order any filing individually, at a fixed price.',
  cta: 'Request a filing',
  content: `
## Filings we handle
- **Annual reports** and amended annual reports, see [annual report filing](florida-annual-report.html)
- **Articles of Amendment**: change your company name, management or other details
- **Change of registered agent**, see [switching agents](florida-change-registered-agent.html)
- **Reinstatement** of an administratively dissolved company, see the [reinstatement guide](resources/florida-llc-reinstatement.html)
- **Dissolution** when you close your company
- **DBA / fictitious name** registration (Florida requires a newspaper notice first; the notice cost is additional)
- **Foreign qualification**: register an out-of-state company to do business in Florida
- **Certificate of Status** and **certified copies** for banks, licenses and contracts
Our service fees are listed below. Florida state fees are additional and billed at cost.`,
  extra: rel => `<div class="scroll"><table class="stack"><thead><tr><th>Filing</th><th class="n">Our fee</th></tr></thead><tbody>${C.alaCarte.map(([n, p]) => `<tr><td>${n}</td><td class="n">${typeof p === "number" ? "$" + p : p}</td></tr>`).join('')}</tbody></table></div>`,
  aside: rel => linksCard('Most requested', [['florida-annual-report.html', 'Annual report'], ['florida-change-registered-agent.html', 'Change registered agent'], ['resources/florida-llc-reinstatement.html', 'Reinstatement'], ['pricing.html', 'Full price list']], rel),
}));

// ---------- Address & mail ----------
pages.push(servicePage({
  path: 'business-address-mail.html', service: 'Florida Business Address and Mail Forwarding', offer: P.mailBasic,
  title: `Florida Business Address & Mail Forwarding from $${P.mailBasic}/mo | The Business Clerk`,
  desc: 'A professional Florida business mailing address with mail scanning, forwarding and package receipt. Keep your home address private.',
  kicker: 'Address & mail', h1: 'A Florida business address, with mail handled', crumb: 'Business Address & Mail',
  lead: 'Use our Florida address for your business mail, website and invoices. We receive your mail, scan it and forward it wherever you are.',
  cta: 'Get a Florida address',
  content: `
## Plans
- **Business Address & Mail, $${P.mailBasic}/month**: Florida mailing address, mail arrival alerts and scanning of your mail
Forwarding is billed at postage cost plus a small handling fee. Packages are accepted within size limits and held for pickup or forwarding.
## How it works
1. Sign up and complete **USPS Form 1583**, which authorizes us to receive mail for you. You'll need two forms of ID: a government photo ID and one showing your home address. You can sign in our office, on a live video call with our staff, or in front of a notary.
2. Use your new address in the format **Street Address, Suite, PMB number**.
3. When mail arrives, we log it and notify you. You choose: scan, forward, hold for pickup or shred.
## Registered agent address vs. business address
They are different services. Your **registered agent** address receives legal and state notices. A **business mailing address** handles everyday mail. Many clients use both. [Read the difference](resources/registered-agent-vs-virtual-address.html).
> A mailing address may not be accepted as a physical business location by every bank, licensing agency or tax registration. Ask us before you rely on it for a specific purpose.`,
  aside: rel => priceCard('Address & Mail', `$${P.mailBasic}`, 'per month', ['Florida mailing address', 'Mail arrival alerts', 'Mail scanning', 'Forwarding & package receipt'], 'get-started.html', 'Get my address', rel),
}));

// ---------- Launch ----------
pages.push(servicePage({
  path: 'launch-pack.html', service: 'Business Launch Pack', offer: P.launch,
  title: `Launch Pack: Domain, Business Email & Website from $${P.launch} | The Business Clerk`,
  desc: 'Get your company online: name and trademark search, domain, Google Workspace or Microsoft 365 email, and a website of up to 5 pages, all in your name.',
  kicker: 'Launch', h1: 'Launch Pack: get your company online', crumb: 'Launch Pack',
  lead: 'Your company is filed. Now look the part. We check your name, set up your domain and professional email and build your website, in your name, so you own everything from day one.',
  cta: 'Add a Launch Pack',
  content: `
## What's included, from $${P.launch}
- **Domain research**: we find an available domain that fits your brand
- **Basic trademark search** of your name in the USPTO database, to spot obvious conflicts before you invest in it
- **Domain registration** setup (e.g. yourcompany.com)
- **Professional email** with **Google Workspace** or **Microsoft 365**, your choice, with SPF, DKIM and DMARC configured so your email reaches inboxes
- **Website of up to 5 pages** from a professional template, with your logo, services and contact form
- **Mobile-friendly design**, SSL and basic SEO setup
- **One round of revisions**
- **Handover**: every account is in your name and you keep full control
## You own your accounts
We set things up with you on a screen-share. You create the accounts and add your own payment method, so domain, email and hosting bills go straight to the provider. No lock-in, no markup on third-party costs.
> Our trademark search is a basic availability check, not legal advice or a trademark registration. For a full clearance search or to file a trademark, we refer you to a trademark attorney.`,
  aside: rel => priceCard('Launch Pack', `$${P.launch}`, 'one time', ['Name & trademark search', 'Domain research & setup', 'Google Workspace or Microsoft 365 email', 'Website up to 5 pages', 'Everything in your name'], 'get-started.html', 'Launch my business', rel),
}));

// ---------- International ----------
pages.push(servicePage({
  path: 'international-founders.html', service: 'Florida LLC Formation for Non-U.S. Residents', offer: P.formation,
  title: 'Florida LLC for Non-Residents & International Founders | The Business Clerk',
  desc: 'Form a Florida LLC from anywhere in the world. Registered agent, U.S. business address, EIN without an SSN and service in English, Portuguese and Spanish.',
  kicker: 'International founders', h1: 'Start a U.S. company from anywhere', crumb: 'International Founders',
  lead: 'You don\'t need to live in the U.S. or have a Social Security number to own a Florida LLC. We handle the filings, the address and the paperwork, in English, Portuguese or Spanish.',
  cta: 'Start my U.S. company',
  content: `
## What you get
- **Florida LLC formation** with the state fee included
- **Registered agent** with a staffed Florida office
- **EIN application** for owners without an SSN ($${P.ein} add-on)
- **Florida business address** with mail scanning, so you can receive mail from abroad
- **Launch Pack** option: domain, email and website
## What international owners should know
- **EIN without an SSN**: the IRS processes these applications by fax or mail, which can take several weeks. We prepare the form and submit it for you.
- **Bank accounts**: some U.S. banks require an in-person visit; others open accounts online. We explain the requirements, but we can't guarantee approval.
- **Tax filings**: foreign-owned single-member LLCs generally must file IRS Form 5472 with a pro forma Form 1120 every year, even with no income. Penalties for missing it can reach $25,000. We'll refer you to a qualified tax professional.
- **Immigration**: owning a U.S. company does not by itself give you the right to live or work in the U.S. Ask an immigration attorney.
> We are not a law firm or a CPA firm. For legal, tax or immigration advice we refer you to independent licensed professionals.
## Falamos português. Hablamos español.
Our team works in English, Portuguese and Spanish, so you can understand every step of the process.`,
  aside: rel => priceCard('Florida LLC Formation', `$${P.formation}`, 'one time', ['State fee included', 'First-year registered agent', `EIN for non-SSN owners: +$${P.ein}`, 'Service in EN / PT / ES'], 'get-started.html', 'Start now', rel) + linksCard('Guides', [['resources/florida-llc-for-non-residents.html', 'Florida LLC for non-residents'], ['resources/registered-agent-vs-virtual-address.html', 'Agent vs. virtual address']], rel),
}));

// ---------- Pricing ----------
pages.push(servicePage({
  path: 'pricing.html', title: 'Pricing – Florida Registered Agent, LLC Formation & Filings | The Business Clerk',
  desc: `Published prices: registered agent $${P.raAnnual}/yr, Florida LLC $${P.formation} all-in, annual report filing $${P.annualReport}, mail $${P.mailBasic}/mo, filings from $25.`,
  kicker: 'Pricing', h1: 'Simple, published prices', crumb: 'Pricing',
  lead: 'Our service fees and Florida state fees are always listed separately, except where a package says the state fee is included.',
  cta: 'Get started',
  content: `
## Formation
- **Florida LLC: $${P.formation}** one time. Our $${P.formationService} filing service, the $${F.llcArticles} state filing fee and your first year of registered agent ($${P.raAnnual}). Operating agreement template included.
- **Florida Corporation: $${P.formationCorp}** one time. Our $${P.formationService} filing service, the $${F.corpArticles} state filing fee and your first year of registered agent. Bylaws template included.
- **EIN application add-on: $${P.ein}**
## Ongoing compliance
- **Florida registered agent: $${P.raAnnual}/year**
- **Annual report filing: $${P.annualReport}** per filing, plus the state fee ($${F.llcAnnual} LLC, $${F.corpAnnual} corporation)
> Registered agent service and annual report filing renew automatically by default, so your company stays in good standing without you having to do anything. You can turn off auto-renew anytime.
## Address & mail
- Business address & mail scanning: **$${P.mailBasic}/month** (forwarding at postage cost)
## Launch
- **Launch Pack: from $${P.launch}** (name and trademark search, domain, professional email, website up to 5 pages). Third-party costs paid directly by you.
## Individual filings
Service fee shown; Florida state fees are additional.`,
  extra: rel => `<div class="scroll"><table class="stack"><thead><tr><th>Filing</th><th class="n">Our fee</th></tr></thead><tbody>${C.alaCarte.map(([n, p]) => `<tr><td>${n}</td><td class="n">${typeof p === "number" ? "$" + p : p}</td></tr>`).join('')}</tbody></table></div><p style="margin-top:16px;color:var(--soft)">See our <a href="${rel}refund-policy.html">refund policy</a>. Prices may change; the price shown when you order is the price you pay.</p>`,
}));

// ---------- Company ----------
pages.push(servicePage({
  path: 'how-it-works.html', title: 'How It Works | The Business Clerk',
  desc: 'How we form your Florida company, act as your registered agent and handle your mail, step by step.',
  kicker: 'Process', h1: 'How it works', crumb: 'How it works',
  lead: 'Clear steps, status updates at every stage and your documents in one place.',
  content: `
## Forming a company
1. **Choose your package** and complete a short online form.
2. **We review** your information and confirm your company name is available.
3. **We file** your Articles with the Florida Division of Corporations.
4. **We apply** for your EIN with the IRS, if you added it.
5. **You receive** your filed Articles, operating agreement template and EIN letter in your client account.
## Order status
Every order moves through the same stages, and you get an email at each step: order received, payment confirmed, information needed, under review, submitted to the state, completed, documents delivered.
## Registered agent and mail
1. When legal or state mail arrives at our Florida office, our staff logs it with the date and time.
2. We scan it the same business day.
3. It's uploaded to your client account and you get an email. Lawsuits and state notices are flagged urgent.
4. The original is filed in your folder, or forwarded or shredded on your instructions.
## Staying compliant
Your registered agent service and annual report renew automatically. Every year we file your annual report before May 1 and send you the confirmation. You don't have to do anything, and you can turn off auto-renew anytime.`,
}));

pages.push(servicePage({
  path: 'about.html', title: 'About Us | The Business Clerk',
  desc: 'The Business Clerk is a Florida registered agent and business filing company serving founders in Florida and around the world.',
  kicker: 'About', h1: 'The clerk\'s office for modern founders', crumb: 'About',
  lead: 'We exist to make starting and keeping a Florida company simple, honest and affordable.',
  content: `
## What we believe
Starting a business shouldn't require five different websites, hidden fees and an inbox full of upsells. We bring formation, registered agent service, filings, a business address and your online launch together in one place, with prices you can see before you buy.
## Who we are
THE BUSINESS CLERK LLC is a Florida company with a staffed office in the state. Our founder has a background in bookkeeping, business filings and back-office operations for law firms and small businesses, and our team works in English, Portuguese and Spanish.
## What we are not
We are not a law firm, a CPA firm or a government agency, and we are not affiliated with the Florida Department of State. We provide administrative filing, registered agent and mail-handling services. When you need legal, tax or immigration advice, we refer you to independent licensed professionals.`,
}));

pages.push(servicePage({
  path: 'faq.html', title: 'FAQ: Florida Registered Agent, LLC & Annual Reports | The Business Clerk',
  desc: 'Answers about Florida registered agents, forming an LLC, annual reports, business addresses and our services.',
  kicker: 'Help', h1: 'Frequently asked questions', crumb: 'FAQ',
  lead: 'Quick answers about Florida companies and how we work.',
  content: `## Registered agent`,
  faqs: [
    ['Does every Florida company need a registered agent?', 'Yes. Every Florida LLC and corporation must keep a registered agent with a physical Florida street address, available during business hours to accept legal papers.'],
    ['What hours must a Florida registered agent be available?', 'Florida law requires the registered office to be open at least from 10 a.m. to noon and from 2 p.m. to 4 p.m. on business days. Our office is staffed for the full business day.'],
    ['How do I change my registered agent to you?', `We file a change of registered agent with the state. The state fee is $${F.llcRaChange} for LLCs and $${F.corpRaChange} for corporations. [Learn more](florida-change-registered-agent.html).`],
    ['How much does it cost to form a Florida LLC?', `The state charges $${F.llcArticles}. Our all-in package is $${P.formation}, which includes that fee, our filing service and a year of registered agent service.`],
    ['When is my Florida annual report due?', `Between January 1 and May 1 each year. After May 1, the LLC fee rises from $${F.llcAnnual} to $${F.llcAnnualLate}.`],
    ['What if my company was administratively dissolved?', 'You can usually reinstate it by filing a reinstatement with all missed annual reports and fees. [See the reinstatement guide](resources/florida-llc-reinstatement.html).'],
    ['Is your business address a physical office?', 'Yes, it is our staffed Florida office. Mail is received under your PMB (private mailbox) number. Some banks and agencies have their own rules about addresses, so check before relying on it for a specific registration.'],
    ['Do you give legal or tax advice?', 'No. We are not a law firm or CPA firm. We provide filing, registered agent and mail services, and we can refer you to independent licensed professionals.'],
    ['Which languages do you speak?', 'English, Portuguese and Spanish.'],
    ['How do I get my documents?', 'Everything we file or receive for you is uploaded to your client account, and you get an email notification.'],
  ],
}));

pages.push(servicePage({
  path: 'contact.html', title: 'Contact Us | The Business Clerk', noCta: true,
  desc: 'Contact The Business Clerk about Florida registered agent service, LLC formation, filings or a business address.',
  kicker: 'Contact', h1: 'Contact us', crumb: 'Contact',
  lead: 'Questions about a filing, your registered agent or your mail? Send us a message and we\'ll reply within one business day.',
  content: `
## Email
[${C.email}](mailto:${C.email})
## Office hours
Monday to Friday, 9:00 a.m. to 5:00 p.m. Eastern Time, except holidays.
## Send a message`,
  extra: () => `<form data-mail="Website inquiry">
<label>Name<input name="Name" required autocomplete="name"></label>
<label>Email<input name="Email" type="email" required autocomplete="email"></label>
<label>Company name (if you have one)<input name="Company"></label>
<label>Topic<select name="Topic"><option>Registered agent</option><option>Form a company</option><option>Annual report or filing</option><option>Business address & mail</option><option>Launch Pack</option><option>Other</option></select></label>
<label>Preferred language<select name="Language"><option>English</option><option>Português</option><option>Español</option></select></label>
<label>Message<textarea name="Message" required></textarea></label>
<button class="btn primary" type="submit">Prepare email</button>
<div class="formmsg" role="status">Your message is ready. <a href="#">Open it in your email app</a> to send it, or email us at <strong>${C.email}</strong>.</div>
</form>`,
}));

pages.push(servicePage({
  path: 'get-started.html', title: 'Get Started – Form Your Florida Company | The Business Clerk', noCta: true,
  desc: 'Start your Florida LLC, hire us as your registered agent or order a filing. Tell us what you need and we\'ll take it from there.',
  kicker: 'Get started', h1: 'Let\'s get your business filed', crumb: 'Get started',
  lead: 'Tell us what you need. We\'ll confirm the details and the exact price, including any state fees, before anything is filed.',
  content: `## Your request`,
  extra: () => `<form data-mail="New order request">
<label>What do you need?<select name="Service" required>
<option>Florida LLC formation ($${P.formation})</option><option>Florida Corporation formation ($${P.formationCorp})</option><option>Registered agent ($${P.raAnnual}/yr)</option><option>Change my registered agent</option><option>Annual report filing ($${P.annualReport} + state fee)</option><option>EIN application ($${P.ein})</option><option>Business address & mail</option><option>Launch Pack</option><option>Other filing</option></select></label>
<label>Your full name<input name="Name" required autocomplete="name"></label>
<label>Email<input name="Email" type="email" required autocomplete="email"></label>
<label>Phone / WhatsApp<input name="Phone" type="tel" autocomplete="tel"></label>
<label>Company name (or the name you want)<input name="Company"></label>
<label>Country where you live<input name="Country" autocomplete="country-name"></label>
<label>Preferred language<select name="Language"><option>English</option><option>Português</option><option>Español</option></select></label>
<label>Anything else we should know?<textarea name="Notes"></textarea></label>
<button class="btn primary" type="submit">Prepare my request</button>
<div class="formmsg" role="status">Your request is ready. <a href="#">Open it in your email app</a> to send it, or email the details to <strong>${C.email}</strong>.</div>
</form>`,
}));

// ---------- Legal ----------
const legal = (path, h1, desc, content) => pages.push(servicePage({ path, h1, crumb: h1, title: `${h1} | The Business Clerk`, desc, noCta: true, lead: `Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, content }));

legal('terms.html', 'Terms of Service', 'Terms of service for THE BUSINESS CLERK LLC: registered agent, business filing, mail and launch services, fees, auto-renewal and limits of liability.', `
## 1. Who we are
These terms govern your use of the services of THE BUSINESS CLERK LLC ("we", "us"), a Florida limited liability company. By ordering a service you agree to these terms.
## 2. Our services
We provide administrative business filing, registered agent, mail-handling and business launch services. We are **not a law firm, CPA firm or government agency** and do not give legal, tax, accounting or immigration advice. Using our services does not create an attorney-client or accountant-client relationship.
## 3. Your responsibilities
You are responsible for the accuracy of the information you give us, for choosing the right entity type and for meeting your own legal and tax obligations. We file what you provide; review it carefully before you submit.
## 4. Registered agent service
When we serve as your registered agent, we will accept service of process and official notices for your company at our Florida office during business hours, scan them and notify you through your client account and by email. You must keep your contact details current. We are not responsible for consequences of notices you do not read or act on. If your service lapses for non-payment, we may resign as your registered agent as allowed by Florida law after notice to you.
## 5. Mail services
Mail services require a completed USPS Form 1583 and acceptable identification. We may refuse or return items that are prohibited, hazardous, oversized or addressed to persons not on your account.
## 6. Fees
Service fees are listed on our pricing page. Government fees and third-party costs are separate unless a package says they are included. Registered agent service, annual report filing and mail plans renew automatically by default until you cancel. Annual report filings are charged (${C.prices.annualReport} plus the state fee) when we file each year. You can turn off auto-renew anytime in your account or by emailing us before the renewal date.
## 7. Processing times
We submit filings promptly, but we do not control and cannot guarantee government or IRS processing times, approval of filings, EIN issuance or bank account approval.
## 8. Limitation of liability
To the extent allowed by law, our total liability for any claim is limited to the service fees you paid us for the service in question during the prior 12 months. We are not liable for indirect or consequential damages.
## 9. Governing law
These terms are governed by the laws of the State of Florida.
## 10. Contact
Questions: ${C.email}.`);

legal('privacy.html', 'Privacy Policy', 'How THE BUSINESS CLERK LLC collects, uses, shares and protects your personal and business information, and the choices you have.', `
## Information we collect
- Contact details: name, email, phone, address
- Company information you provide for filings
- Identification documents required for USPS Form 1583 and registered agent services
- Scans of mail we receive on your behalf
- Payment information, processed by our payment provider (we do not store full card numbers)
## How we use it
To provide the services you order, file documents with government agencies, notify you about mail and deadlines, bill you and comply with the law. Information filed with the State of Florida becomes part of the public record.
## Sharing
We share information only with government agencies as needed for your filings, the U.S. Postal Service as required for mail services, service providers who help us operate (hosting, payments, email) under confidentiality obligations, and professionals you ask us to refer you to. We do not sell your personal information.
## Security and retention
Documents are stored in access-restricted systems. We keep records as long as needed to provide the services and as required by law, including USPS record-keeping rules for mail services.
## Your choices
You may request a copy, correction or deletion of your information, subject to legal retention requirements, by emailing ${C.email}.`);

legal('refund-policy.html', 'Refund Policy', 'Refund policy for THE BUSINESS CLERK LLC: cancellations before filing, state fees, recurring services and rejected filings.', `
## Before we file
If you cancel before we submit anything to a government agency, we refund your service fee in full.
## After we file
Government fees are paid to the state and cannot be refunded once submitted. Service fees for work already completed are not refundable.
## Recurring services
Registered agent and mail plans can be cancelled at any time and will not renew. Annual registered agent fees are not prorated after the service year begins.
## Rejected filings
If a filing is rejected because of our error, we correct and refile it at no charge.
## Questions
Email ${C.email}.`);

legal('disclaimer.html', 'Disclaimer', 'THE BUSINESS CLERK LLC is not a law firm, CPA firm or government agency. Information on this site is general, not legal or tax advice.', `
THE BUSINESS CLERK LLC is not a law firm, CPA firm or government agency, and is not affiliated with the Florida Department of State, the Division of Corporations or Sunbiz.
The information on this website is general information, not legal, tax or financial advice. Laws and fees change; confirm current requirements with the relevant agency or a licensed professional before acting.
Any referrals we make to attorneys, accountants or other professionals are to independent providers who are responsible for their own services.`);

module.exports = pages.map(p => p); // array of {html} strings with path inside
module.exports.servicePage = servicePage;
module.exports.linksCard = linksCard;
module.exports.priceCard = priceCard;
