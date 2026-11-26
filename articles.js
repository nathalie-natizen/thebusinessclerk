const C = require('./config');
const P = C.prices, F = C.stateFees;
const { page, md, ctaBand, crumbsSchema, esc } = require('./layout');
const { L } = require('./i18n');

const updated = new Date().toISOString().slice(0, 10);
const A = [
{
  slug: 'what-is-a-registered-agent-florida', cat: 'Registered agent',
  title: 'What Is a Registered Agent in Florida?',
  h1: 'What is a registered agent in Florida?',
  desc: 'What a Florida registered agent does, who can serve, the required office hours, and whether you should be your own agent.',
  summary: 'Who can serve, what the job involves, the hours Florida requires and what it costs.',
  body: `
A **registered agent** is the person or business your company names to receive legal papers and official state notices. In Florida every LLC and corporation must have one, and the agent's name and address appear on your company's public record at Sunbiz.
## What does a registered agent do?
- Receives **service of process**, the formal delivery of a lawsuit or subpoena against your company
- Receives official notices from the Florida Department of State
- Forwards those documents to you promptly
## Who can be a registered agent in Florida?
Your registered agent must be either:
- an individual who lives in Florida, or
- a business entity authorized to do business in Florida.
The agent must have a **physical Florida street address**; a P.O. box doesn't qualify. A company cannot act as its own registered agent.
## What hours must a Florida registered agent keep?
Florida law requires the registered office to be open, with someone available to accept legal papers, **at least from 10 a.m. to 12 noon and from 2 p.m. to 4 p.m.** every day except weekends and legal holidays. If you are your own agent, that means being at your registered address during those hours every business day.
## Can I be my own registered agent?
Yes, if you live in Florida and can meet the hours. The trade-offs:
- Your home address becomes public on Sunbiz
- If you're traveling or busy when a process server arrives, you may miss a lawsuit, and a court can enter a default judgment against your company
- You have to track state notices and deadlines yourself
## How much does a registered agent cost?
Commercial registered agents in Florida commonly charge between about $49 and $300 a year. Compare what's included: same-day scans, a staffed office, annual report filing and how quickly a real person answers you.
Our registered agent service is **$${P.raAnnual} a year**, and we file your annual report automatically every year for $${P.annualReport} plus the state fee. [See the registered agent service](florida-registered-agent.html).`,
},
{
  slug: 'how-to-form-an-llc-in-florida', cat: 'Formation',
  title: 'How to Form an LLC in Florida (Step by Step)',
  h1: 'How to form an LLC in Florida: step by step',
  desc: `The steps to start a Florida LLC: choose a name, appoint a registered agent, file Articles of Organization ($${F.llcArticles}), get an EIN and stay compliant.`,
  summary: 'Name, registered agent, Articles of Organization, EIN and what comes after.',
  body: `
Forming a Florida LLC is a straightforward process. Here is each step and what it costs.
## 1. Choose a name
Your LLC name must be distinguishable from other companies on the Florida record and must end with "Limited Liability Company", "LLC" or "L.L.C.". Search the Florida Division of Corporations records before you decide.
## 2. Appoint a registered agent
Every Florida LLC needs a [registered agent](resources/what-is-a-registered-agent-florida.html) with a physical Florida street address who is available during business hours.
## 3. File Articles of Organization
You file the Articles with the Florida Division of Corporations. The state fee is **$${F.llcArticles}** ($100 filing fee plus $25 for the registered agent designation). Certified copies and a certificate of status are optional extras.
The Articles include your LLC's name, principal and mailing addresses, registered agent (who signs to accept), and the names of managers or authorized representatives.
## 4. Get an EIN
An Employer Identification Number (EIN) from the IRS is your company's federal tax ID. You need it to open a bank account and hire employees. The application is free from the IRS.
## 5. Prepare an operating agreement
Florida doesn't require you to file one, but a written operating agreement sets out ownership and how decisions are made. Banks often ask for it.
## 6. Stay compliant
- File your **annual report between January 1 and May 1** each year, starting the year after formation
- Keep your registered agent current
- Check whether your city or county requires a local business tax receipt
## Want us to handle it?
Our **$${P.formation}** package covers the state fee, filing and your first year of registered agent service. EIN application is a $${P.ein} add-on. [Form your LLC](florida-llc-formation.html).`,
},
{
  slug: 'florida-annual-report-guide', cat: 'Compliance',
  title: 'Florida Annual Report: Deadline, Fees and Late Penalty',
  h1: 'Florida annual report: deadline, fees and late penalty',
  desc: `Florida annual reports are due January 1 to May 1. LLC fee $${F.llcAnnual}, corporation $${F.corpAnnual}. After May 1 the LLC fee becomes $${F.llcAnnualLate}.`,
  summary: 'When it\'s due, what it costs, the late fee and what happens if you miss it.',
  body: `
Every active Florida LLC and corporation must file an annual report to stay in good standing, even if nothing has changed.
## When is it due?
The filing window opens **January 1** and the deadline is **May 1**. Your first report is due the year after your company is formed.
## How much does it cost?
- LLC: **$${F.llcAnnual}**
- For-profit corporation: **$${F.corpAnnual}**
## What is the late fee?
Reports received after May 1 cost **$${F.llcAnnualLate}** for an LLC and **$${F.corpAnnualLate}** for a for-profit corporation, a $400 increase.
## What if I don't file at all?
Companies that still haven't filed are **administratively dissolved** by the state later in the year. A dissolved company loses its good standing, and reinstating it means paying the reinstatement fee plus every missed annual report. [How reinstatement works](resources/florida-llc-reinstatement.html).
## What does the report include?
- Principal and mailing addresses
- Registered agent name and address
- Names and addresses of managers, members or officers
- Federal EIN
You can use the annual report to update these details, including changing your registered agent.
## Let us file it
Our clients never have to remember the deadline: with auto-renew, we file your annual report every year before May 1 for $${P.annualReport} plus the state fee. Pair it with our [registered agent service](florida-registered-agent.html) ($${P.raAnnual}/year). [Annual report service](florida-annual-report.html).`,
},
{
  slug: 'florida-llc-for-non-residents', cat: 'International',
  title: 'Florida LLC for Non-Residents: Complete Guide',
  h1: 'Florida LLC for non-residents: a guide for international founders',
  desc: 'Can a foreigner open an LLC in Florida? Yes. Here\'s what non-U.S. residents need: registered agent, address, EIN without SSN, bank account and tax filings.',
  summary: 'Registered agent, EIN without an SSN, banking and the Form 5472 filing.',
  body: `
You don't need to be a U.S. citizen or resident to own a Florida LLC. Many international founders choose Florida for its large Spanish- and Portuguese-speaking business community, simple LLC rules and no state personal income tax.
## What you need
- A **registered agent** with a physical Florida address (you can't use an address abroad)
- A **mailing address** for your company, which can be a U.S. business address service
- A **company name** and the details of the owners or managers
## Getting an EIN without an SSN
Without a U.S. Social Security number you can't use the IRS online EIN application. You submit Form SS-4 by fax or mail instead, which can take several weeks. You don't need an ITIN just to get an EIN for your LLC.
## Opening a U.S. bank account
Requirements vary by bank. Some require an in-person visit; some online banks and fintech providers accept non-resident owners remotely. Have your filed Articles, EIN letter, operating agreement and passport ready.
## Tax filings to know about
A single-member LLC owned by a foreign person generally must file **IRS Form 5472** with a pro forma Form 1120 every year, even if it had no income. The penalty for not filing can be $25,000. Work with a qualified tax professional.
## Does a U.S. company give me a visa?
No. Owning a U.S. company doesn't by itself allow you to live or work in the U.S. Speak with an immigration attorney about visa options.
## We can help, in your language
We form your LLC, act as your registered agent, apply for your EIN and provide a Florida business address, in English, Portuguese or Spanish. [International founders](international-founders.html).`,
},
{
  slug: 'registered-agent-vs-virtual-address', cat: 'Registered agent',
  title: 'Registered Agent vs. Virtual Address: The Difference',
  h1: 'Registered agent vs. virtual business address',
  desc: 'A registered agent receives legal and state notices; a virtual business address handles everyday mail. Learn the difference and when you need both.',
  summary: 'Two different services with two different jobs. When you need one, the other or both.',
  body: `
They both involve an address and mail, so they're often confused. They do different jobs.
## Registered agent
- **Required by law** for every Florida LLC and corporation
- Receives **service of process** and **state notices**
- Must be at a physical Florida street address and available during business hours
- Appears on your public Sunbiz record
## Virtual business address
- **Optional**
- Receives your **everyday business mail**: bank statements, invoices, checks, packages
- Requires a signed USPS Form 1583 and two forms of ID
- Can be used on your website, invoices and business cards
## Do I need both?
If you don't want your home address used for business mail, yes. Your registered agent address is meant for legal and state notices, not your everyday mail.
## A note on "physical location"
A mailing address may not count as a physical business location for every bank, license or tax registration. Check the specific requirement first.
We offer both: [registered agent](florida-registered-agent.html) and [business address & mail](business-address-mail.html).`,
},
{
  slug: 'florida-llc-reinstatement', cat: 'Compliance',
  title: 'How to Reinstate a Dissolved Florida LLC',
  h1: 'How to reinstate an administratively dissolved Florida LLC',
  desc: `Missed your annual report and your Florida LLC was dissolved? How reinstatement works, what it costs ($${F.llcReinstate} plus missed reports) and how to avoid it.`,
  summary: 'Why companies get dissolved and how to bring yours back.',
  body: `
If a Florida company doesn't file its annual report, the state **administratively dissolves** it. The good news: in most cases you can reinstate it and continue as if the dissolution never happened.
## Why companies get dissolved
- Not filing the annual report
- Not keeping a registered agent
- Not paying required fees
## How to reinstate a Florida LLC
1. File an application for reinstatement with the Florida Division of Corporations.
2. Include an annual report for each year you missed.
3. Pay the **$${F.llcReinstate}** reinstatement fee plus the annual report fee for each missed year.
4. If your name was taken by another company while you were dissolved, you may need to choose a new name.
## How to avoid it next time
Use a registered agent that files your annual report automatically. With our auto-renew, we file it every year before May 1 for $${P.annualReport} plus the state fee.
## Need help?
We prepare and file reinstatements for $175 plus the state fees for all missed years, charged at cost. [Business filings](business-filings.html).`,
},
{
  slug: 'llc-vs-corporation-florida', cat: 'Formation',
  title: 'LLC vs. Corporation in Florida: Which Should You Choose?',
  h1: 'LLC vs. corporation in Florida: which should you choose?',
  desc: 'Compare Florida LLCs and corporations: formation cost, annual fees, management, taxes and which fits your business.',
  summary: 'Costs, management, taxes and the businesses each one suits.',
  body: `
Both protect your personal assets from business debts when properly maintained. The differences are in structure, cost and how investors see them.
## Costs in Florida
- **LLC**: $${F.llcArticles} to form, $${F.llcAnnual} annual report
- **Corporation**: $${F.corpArticles} to form, $${F.corpAnnual} annual report
## Management
An **LLC** is run by its members or by managers, under an operating agreement. A **corporation** has shareholders, a board of directors and officers, with more formalities such as bylaws and meeting minutes.
## Taxes
By default, a single-member LLC is taxed as a disregarded entity and a multi-member LLC as a partnership. A corporation is taxed as a C-corp unless it elects S-corp status. An LLC can also elect to be taxed as an S-corp. Speak with a tax professional about which is best for you.
## Which should you choose?
- **Most small businesses, freelancers and real estate holders**: an LLC is simpler.
- **Startups raising venture capital or issuing stock options**: a corporation is usually expected by investors.
Ready to start? [Form an LLC](florida-llc-formation.html) or [form a corporation](florida-corporation-formation.html).`,
},
];

function buildGuides(A, lang, base, idx) {
  const T = L[lang], homeP = lang === 'en' ? 'index.html' : lang + '/index.html';
  const startP = { en: 'get-started.html', pt: 'pt/comecar.html', es: 'es/empezar.html' }[lang];
  const formP = { en: 'florida-llc-formation.html', pt: 'pt/abrir-llc-na-florida.html', es: 'es/abrir-llc-en-florida.html' }[lang];
  const pages = A.map(a => {
    const path = `${base}/${a.slug}.html`;
    const crumbs = [[T.home, lang === 'en' ? '' : lang], [T.guides, base], [a.h1, `${base}/${a.slug}`]];
    const schema = [crumbsSchema(crumbs), { '@context': 'https://schema.org', '@type': 'Article', inLanguage: lang, headline: a.h1, description: a.desc, dateModified: updated, author: { '@type': 'Organization', name: C.name }, publisher: { '@type': 'Organization', name: C.name }, mainEntityOfPage: `${C.domain}/${base}/${a.slug}` }];
    return { path, html: page({ path, lang, title: `${a.title} | The Business Clerk`, desc: a.desc, schema, body: rel => `<section class="pagehead band"><div class="wrap">
<p class="crumbs"><a href="${rel}${homeP}">${T.home}</a> / <a href="${rel}${base}/index.html">${T.guides}</a></p>
<p class="kicker">${a.cat}</p><h1>${a.h1}</h1><p>${a.summary}</p></div></section>
<section class="band"><div class="wrap layout"><article class="prose">${md(a.body, rel)}<p class="note">${T.guideNote(updated)}</p></article>
<aside class="aside"><div class="card plan best"><h3>${T.needIt}</h3><p>${idx.asideText}</p><p class="price">$${P.formation}</p><a class="btn primary" href="${rel}${startP}">${T.getStarted}</a></div>
<div class="card"><h3>${T.moreGuides}</h3><ul style="padding-left:18px;margin:0">${A.filter(x => x !== a).slice(0, 5).map(x => `<li><a href="${rel}${base}/${x.slug}.html">${esc(x.h1)}</a></li>`).join('')}</ul></div></aside></div></section>
${ctaBand(rel, null, null, lang)}` }) };
  });
  const ipath = `${base}/index.html`;
  const index = { path: ipath, html: page({ path: ipath, lang, title: idx.title, desc: idx.desc,
    schema: [crumbsSchema([[T.home, lang === 'en' ? '' : lang], [T.guides, base]])],
    body: rel => `<section class="pagehead band"><div class="wrap"><p class="crumbs"><a href="${rel}${homeP}">${T.home}</a> / ${T.guides}</p><p class="kicker">${T.guides}</p><h1>${idx.h1}</h1><p>${idx.lead}</p></div></section>
<section class="band"><div class="wrap"><div class="grid">${A.map(a => `<article class="card"><p class="kicker" style="color:var(--orangeInk)">${a.cat}</p><h3>${esc(a.h1)}</h3><p>${esc(a.summary)}</p><a class="more" href="${rel}${base}/${a.slug}.html">${T.readGuide}</a></article>`).join('')}</div></div></section>${ctaBand(rel, null, null, lang)}` }) };
  return [index, ...pages];
}

module.exports = buildGuides(A, 'en', 'resources', {
  title: 'Florida Business Guides: Agents, LLCs & Reports | The Business Clerk',
  desc: 'Plain-English guides to Florida registered agents, LLC formation, annual reports, reinstatement and starting a U.S. company from abroad.',
  h1: 'Florida business guides', lead: 'Plain-English answers about forming and maintaining a Florida company.',
  asideText: 'Florida LLC formation, state fee and first-year registered agent included.',
});
module.exports.buildGuides = buildGuides;
