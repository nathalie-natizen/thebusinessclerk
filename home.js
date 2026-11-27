const C = require('./config');
const { page, ctaBand, org, faqSchema, faqHtml, md } = require('./layout');

const scene = `<svg class="scene" viewBox="0 0 560 470" role="img" aria-label="A Florida sunrise over the water behind a stamped business record listing The Business Clerk as registered agent">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3A8"/><stop offset=".55" stop-color="#F7B866"/><stop offset="1" stop-color="#E8743B"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A8C8C"/><stop offset="1" stop-color="#0F4C5C"/></linearGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".95"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></radialGradient>
<clipPath id="frame"><rect x="0" y="0" width="560" height="400" rx="28"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="560" height="400" fill="url(#sky)"/>
<circle cx="330" cy="236" r="150" fill="url(#glow)"/>
<g class="sunrise"><circle cx="330" cy="236" r="78" fill="#F2B33D"/><circle cx="330" cy="236" r="78" fill="none" stroke="#FFE9B0" stroke-width="3" opacity=".7"/></g>
<rect y="236" width="560" height="170" fill="url(#sea)"/>
<g stroke="#F7C86A" stroke-linecap="round" opacity=".85"><path d="M250 258h160" stroke-width="5"/><path d="M272 278h116" stroke-width="4"/><path d="M296 298h68" stroke-width="3"/><path d="M314 316h32" stroke-width="3"/></g>
<g fill="#0B3A46"><path d="M478 236c4-46 10-84 22-112l5 2c-11 28-17 64-20 110z"/><path d="M502 124c-22-10-46-6-60 8 20-4 40-2 58 8zM502 124c4-22 20-36 40-38-12 10-22 24-34 40zM502 124c22-4 40 4 50 20-18-8-34-12-50-14zM502 124c-12-18-30-24-50-20 18 2 34 10 46 24z"/></g>
</g>
<g transform="translate(34 118) rotate(-3)">
<rect x="6" y="10" width="300" height="300" rx="16" fill="#0B2A32" opacity=".22"/>
<rect width="300" height="300" rx="16" fill="#FFFDF8"/>
<rect width="300" height="54" rx="16" fill="#0F4C5C"/><rect y="38" width="300" height="16" fill="#0F4C5C"/>
<text x="22" y="34" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Business Entity Record</text>
<g font-family="Inter,Arial,sans-serif" font-size="11" fill="#6B7A7E" font-weight="600">
<text x="22" y="84">ENTITY NAME</text><text x="22" y="134">STATUS</text><text x="152" y="134">FILED</text><text x="22" y="184">REGISTERED AGENT</text><text x="22" y="244">PRINCIPAL ADDRESS</text></g>
<g font-family="Inter,Arial,sans-serif" font-size="15" fill="#1E2A2E" font-weight="700">
<text x="22" y="104">YOUR COMPANY LLC</text><text x="22" y="154" fill="#2A8C8C">ACTIVE</text><text x="152" y="154">Florida</text>
<text x="22" y="204" font-size="14">THE BUSINESS CLERK LLC</text></g>
<rect x="22" y="254" width="150" height="10" rx="5" fill="#E9E1D2"/><rect x="22" y="272" width="110" height="10" rx="5" fill="#E9E1D2"/>
<path d="M22 166h256M22 216h256" stroke="#EEE6D8"/>
<g transform="translate(232 262) rotate(-14)"><circle r="44" fill="none" stroke="#E8743B" stroke-width="4"/><circle r="36" fill="none" stroke="#E8743B" stroke-width="1.5"/>
<text text-anchor="middle" y="7" font-family="Inter,Arial,sans-serif" font-size="19" font-weight="800" fill="#E8743B" letter-spacing="1">FILED</text></g>
</g>
<g transform="translate(372 330)">
<rect x="4" y="8" width="164" height="92" rx="14" fill="#0B2A32" opacity=".22"/>
<rect width="164" height="92" rx="14" fill="#FFFFFF"/>
<path d="M18 22h128v52H18z" fill="#F5EFE4"/><path d="M18 22l64 34 64-34" fill="none" stroke="#0F4C5C" stroke-width="3"/>
<circle cx="146" cy="16" r="15" fill="#E8743B"/><text x="146" y="21" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="800" fill="#fff">1</text>
</g>
</svg>`;

const icon = {
  agent: `<svg viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`,
  form: `<svg viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15l2 2 4-4"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
  launch: `<svg viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15c-1.5 1.3-2 4-2 6 2 0 4.7-.5 6-2"/><path d="M9 15l-3-3c1-4 4.5-8.5 13-9-.5 8.5-5 12-9 13z"/><circle cx="15" cy="9" r="1.6"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>`,
};

const services = [
  ['agent', 'Florida Registered Agent', `Our Florida office receives your legal and state mail during business hours. We scan it and notify you the same day.`, 'florida-registered-agent.html', `$${C.prices.raAnnual}/year`],
  ['form', 'LLC & Corporation Formation', `We file your Articles with the Florida Division of Corporations, serve as your agent and deliver your documents.`, 'florida-llc-formation.html', `$${C.prices.formation} all-in`],
  ['cal', 'Annual Reports & Filings', `Annual reports, amendments, agent changes, reinstatements, dissolutions and certificates.`, 'business-filings.html', `Annual report $${C.prices.annualReport}`],
  ['mail', 'Business Address & Mail', `A professional Florida mailing address. For each piece of mail you choose: forward it, open and scan it to your portal, or shred it.`, 'business-address-mail.html', `from $${C.prices.mailBasic}/month`],
  ['launch', 'Launch Pack', `Name and trademark search, domain, professional email and a website of up to 5 pages, all in your name.`, 'launch-pack.html', `from $${C.prices.launch}`],
  ['globe', 'International Founders', `Living outside the U.S.? Form a Florida LLC remotely, in English, Portuguese or Spanish.`, 'international-founders.html', 'Remote-friendly'],
];

const faqs = [
  ['What does a Florida registered agent do?', 'A registered agent is the person or company named in your state filings to receive service of process (lawsuits) and official notices for your business. Florida requires every LLC and corporation to keep one, at a physical Florida street address. [Read the full guide](resources/what-is-a-registered-agent-florida.html).'],
  ['Can I be my own registered agent?', 'Yes, if you live in Florida and are available at a Florida street address during business hours. Many owners hire a commercial agent instead to keep their home address off the public record and to avoid missing legal mail.'],
  ['What is included in the $' + C.prices.formation + ' formation package?', `Filing your Articles of Organization, the Florida state filing fee ($${C.stateFees.llcArticles}) and your first year of registered agent service. EIN application is available as a $${C.prices.ein} add-on. Amendments and DBA filings are not included.`],
  ['When is the Florida annual report due?', `Between January 1 and May 1 every year. Reports filed after May 1 cost $${C.stateFees.llcAnnualLate} for an LLC instead of $${C.stateFees.llcAnnual}. With auto-renew, we file it for you every year before the deadline ($${C.prices.annualReport} plus the state fee).`],
  ['Do I need to live in the U.S. to form a Florida LLC?', 'No. Non-U.S. residents can own a Florida LLC. You will need a registered agent with a Florida address, which we provide. See our [international founders page](international-founders.html).'],
];

const body = rel => `
<section class="hero band"><div class="wrap">
<div>
<p class="kicker">Florida registered agent &amp; business filings</p>
<h1>Your Florida business, filed, received and ready to launch.</h1>
<p class="lead">We form your LLC, serve as your registered agent, file your annual report and give your company a real Florida address. One office, clear prices, real people who answer.</p>
<div class="actions"><a class="btn primary" href="${rel}get-started.html">Start your business</a><a class="btn ghost" href="${rel}florida-registered-agent.html">Registered agent service</a></div>
<ul class="checks"><li>Florida LLC for $${C.prices.formation}, state fee and first-year agent included</li><li>Registered agent for $${C.prices.raAnnual} a year</li><li>Legal mail scanned and sent to you the same business day</li><li>Service in English, Português and Español</li></ul>
</div>
<div>${require('./pack').packCard('en', rel)}</div>
</div></section>

<section class="band"><div class="wrap">
<div class="section-title"><p class="kicker">What we do</p><h2>Everything a new company needs, from filing to first customer.</h2><p>Most founders juggle a filing site, a mail service, a domain registrar and an email provider. We handle all of it, and we keep your company in good standing year after year.</p></div>
<div class="grid">${services.map(([i, t, d, h, p]) => `<article class="card"><div class="ico">${icon[i]}</div><h3>${t}</h3><p>${d}</p><p><span class="pill">${p}</span></p><a class="more" href="${rel}${h}">Learn more →</a></article>`).join('')}</div>
</div></section>

<section class="band sand"><div class="wrap split">
<div><p class="kicker">Why founders choose us</p><h2 style="margin-top:0">A real Florida office, not a mailbox in a warehouse.</h2>
<p>Our staff is on site every business day, including the hours Florida law requires registered agents to be available. When a process server or the state sends something, a person receives it, logs it, scans it and notifies you the same day.</p>
<p>We are a small, specialized team. You get a clear answer from someone who knows Florida filings, not a ticket number.</p></div>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))">
<div class="card"><h3>Same-day notice</h3><p>Legal mail is scanned and uploaded to your account the day it arrives.</p></div>
<div class="card"><h3>Privacy</h3><p>Our address goes on the public record instead of your home address.</p></div>
<div class="card"><h3>Never miss a deadline</h3><p>Registered agent and annual report renew automatically. We file before May 1, every year.</p></div>
<div class="card"><h3>Fixed prices</h3><p>Service fees and state fees shown separately. No surprise upsells.</p></div>
</div></div></section>

<section class="band"><div class="wrap">
<div class="section-title"><p class="kicker">How it works</p><h2>Four steps to an active Florida company.</h2></div>
<ol class="steps"><li><strong>Choose a service</strong><span>Pick formation, registered agent, filings or a launch pack.</span></li><li><strong>Tell us about your business</strong><span>A short online form. No legal jargon.</span></li><li><strong>We file with Florida</strong><span>We review, submit and track your filing with the Division of Corporations.</span></li><li><strong>Get your documents</strong><span>Filed documents, EIN letter and mail scans arrive in your client account.</span></li></ol>
<p style="margin-top:24px"><a href="${rel}how-it-works.html">See the full process →</a></p>
</div></section>

<section class="band sand"><div class="wrap">
<div class="section-title"><p class="kicker">Pricing</p><h2>Simple, published prices.</h2><p>Florida state fees are listed separately, except where a package says they are included.</p></div>
<div class="grid">
<div class="card plan best"><span class="tag">Most popular</span><h3>Florida LLC Formation</h3><p class="price">$${C.prices.formation} <small>one time</small></p><ul><li>Articles of Organization filed</li><li>State filing fee included</li><li>First year of registered agent</li><li>EIN add-on: $${C.prices.ein}</li></ul><a class="btn primary" href="${rel}get-started.html">Form my LLC</a></div>
<div class="card plan"><h3>Florida Registered Agent</h3><p class="price">$${C.prices.raAnnual} <small>per year</small></p><ul><li>Florida registered agent address</li><li>Same-day legal mail scans</li><li>Auto-renew, so nothing lapses</li><li>Deadline reminders</li><li>Annual report filing: $${C.prices.annualReport} + state fee</li><li>Bundle with business address: $${C.prices.bundle}/year</li></ul><a class="btn ghost" href="${rel}florida-registered-agent.html">Hire us as agent</a></div>
<div class="card plan"><h3>Business Address & Mail</h3><p class="price">$${C.prices.mailBasic} <small>per month</small></p><ul><li>Florida business mailing address</li><li>${C.prices.mailIncluded} items/month logged with envelope photo</li><li>Forwarding: $${C.prices.mailForward}/item + postage</li><li>Open &amp; scan: from $1.50/item</li></ul><a class="btn ghost" href="${rel}business-address-mail.html">See mail plans</a></div>
</div>
<p style="margin-top:20px"><a href="${rel}pricing.html">Full price list, including individual filings →</a></p>
</div></section>

<section class="band"><div class="wrap split">
<div><p class="kicker">Questions</p><h2 style="margin-top:0">Frequently asked</h2><p>Can't find your answer? <a href="${rel}contact.html">Contact us</a> or browse the <a href="${rel}faq.html">full FAQ</a>.</p></div>
<div>${faqHtml(faqs, rel)}</div>
</div></section>
${ctaBand(rel)}`;

module.exports = () => page({
  path: 'index.html',
  title: `Florida Registered Agent, Business Formation & Filings | The Business Clerk`,
  desc: `Florida registered agent for $${C.prices.raAnnual}/yr with same-day mail scans. LLC formation $${C.prices.formation} with state fee, annual reports, business address and mail.`,
  schema: [org, faqSchema(faqs), { '@context': 'https://schema.org', '@type': 'WebSite', name: C.brand, url: C.domain }],
  body,
});
module.exports.icon = icon;
module.exports.scene = scene;
