const C = require('./config');
const { L, altsFor } = require('./i18n');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Tiny markdown: ## h2, ### h3, - list, > callout, **bold**, [text](link)
function md(src, rel) {
  const inline = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (m, a, h) => `<a href="${/^(https?:|mailto:|#)/.test(h) ? h : rel + h}"${/^https?:/.test(h) ? ' rel="noopener"' : ''}>${a}</a>`);
  const out = []; let list = null, tag = 'ul';
  const flush = () => { if (list) { out.push(`<${tag}>${list.join('')}</${tag}>`); list = null; } };
  for (const raw of src.trim().split('\n')) {
    const l = raw.trim();
    if (!l) { flush(); continue; }
    if (l.startsWith('- ')) { if (list && tag !== 'ul') flush(); tag = 'ul'; (list ||= []).push(`<li>${inline(l.slice(2))}</li>`); continue; }
    const om = l.match(/^\d+\. (.*)/);
    if (om) { if (list && tag !== 'ol') flush(); tag = 'ol'; (list ||= []).push(`<li>${inline(om[1])}</li>`); continue; }
    flush();
    if (l.startsWith('### ')) out.push(`<h3>${inline(l.slice(4))}</h3>`);
    else if (l.startsWith('## ')) { const t = l.slice(3); out.push(`<h2 id="${t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">${inline(t)}</h2>`); }
    else if (l.startsWith('> ')) out.push(`<p class="note">${inline(l.slice(2))}</p>`);
    else out.push(`<p>${inline(l)}</p>`);
  }
  flush();
  return out.join('\n');
}


const logo = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="9" fill="#F2B33D"/><g stroke="#F2B33D" stroke-width="2.4" stroke-linecap="round"><path d="M20 5v5M7 11l3.5 3.5M33 11l-3.5 3.5M3 22h5M32 22h5"/></g><rect x="2" y="27" width="36" height="11" rx="2" fill="currentColor"/><path d="M9 32.5h22" stroke="#F2B33D" stroke-width="2" stroke-linecap="round"/></svg>`;

const CSS = `/*
VOICE: confident, plain-spoken Florida clerk's office; formal enough to trust with legal mail, warm enough for first-time founders.
IDEA: the stamped state filing record, set in morning Florida light.
PICTURE: a sunrise over the Gulf behind a stamped business record naming us as registered agent.
COLOUR and TYPE: deep teal ground, sunshine gold, citrus orange accent on warm sand; DM Serif Display titles with Inter text.
LAYOUT: full-width bands, 1200px content, cards in balanced grids, stacked on phones.
*/
:root{color-scheme:light dark;
--bg:light-dark(#FBF8F2,#0B2027);--sand:light-dark(#F5EFE4,#11303A);--card:light-dark(#FFFFFF,#123640);
--ink:light-dark(#1E2A2E,#EEF3F2);--soft:light-dark(#4D5C60,#B8C8C8);--line:light-dark(#E4DACA,#25505A);
--teal:#0F4C5C;--teal2:#2A8C8C;--gold:#F2B33D;--orange:#E8743B;--orangeInk:light-dark(#B8501F,#F4A276);--link:light-dark(#0F4C5C,#8FD3D0)}
:root[data-theme=light]{color-scheme:light}:root[data-theme=dark]{color-scheme:dark}
*{box-sizing:border-box;min-width:0}
html{scroll-padding-top:84px;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:16.5px/1.65 Inter,system-ui,-apple-system,Segoe UI,sans-serif;overflow-x:clip}
a{color:var(--link);text-underline-offset:3px}
h1,h2,h3{font-family:"DM Serif Display",Georgia,serif;font-weight:400;line-height:1.1;text-wrap:balance;margin:0 0 .5em}
h1{font-size:clamp(34px,5vw,54px)}h2{font-size:clamp(26px,3.2vw,36px);margin-top:1.4em}h3{font-size:22px;margin-top:1.2em}
p{margin:0 0 1em}
.wrap{max-width:1200px;margin:0 auto}
.band{padding:clamp(40px,6vw,88px) max(5vw,18px)}
.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;background:#fff;padding:8px 12px;z-index:9}
/* header */
.top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:20px;padding:12px max(5vw,18px);max-width:1300px}
.brand{flex:0 1 auto;display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--teal);font-weight:800;letter-spacing:.02em;font-size:15px;line-height:1.1}
:root:not([data-theme=light]) .brand{color:light-dark(var(--teal),#EEF3F2)}
.brand small{display:block;font-weight:500;color:var(--soft);font-size:11px;letter-spacing:0;margin-top:3px;max-width:300px;line-height:1.35}
.mark{width:36px;height:36px;color:var(--teal);flex:none}
nav.main{margin-left:auto;display:flex;gap:2px;flex-wrap:nowrap;flex:none}
nav.main a{color:var(--ink);text-decoration:none;font-size:14.5px;font-weight:500;padding:10px 9px;border-radius:8px;white-space:nowrap}
nav.main a:hover,nav.main a[aria-current]{background:var(--sand);color:var(--link)}
.btn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:12px 22px;border-radius:10px;font-weight:700;font-size:15.5px;text-decoration:none;border:2px solid transparent;cursor:pointer;font-family:inherit}
.btn.primary{background:var(--orange);color:#fff}.btn.primary:hover{background:#D4632B}
.btn.ghost{border-color:currentColor;color:var(--link);background:transparent}
.btn.light{background:#fff;color:var(--teal)}
.navlangs{display:none}.navlangs a{font-weight:700}
@media(max-width:600px){nav.main.open .navlangs{display:flex;gap:6px;border-top:1px solid var(--line);margin-top:6px;padding-top:6px}}
.langs{flex:none;display:flex;gap:2px;font-size:13px;font-weight:700;margin-left:6px}.langs a{color:var(--soft);text-decoration:none;padding:10px 6px;border-radius:6px}.langs a[aria-current]{color:var(--link);background:var(--sand)}
.menu{flex:none;display:none;margin-left:8px;background:none;border:1px solid var(--line);border-radius:8px;min-height:44px;padding:0 14px;color:var(--ink);font:600 15px Inter,sans-serif}
@media(max-width:1300px){nav.main{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:var(--bg);padding:10px max(5vw,18px) 18px;border-bottom:1px solid var(--line)}nav.main.open{display:flex}.menu{display:block}.top .cta{display:none}.langs{margin-left:auto}}
/* hero */
.hero{background:var(--teal);color:#F3F7F6;position:relative;overflow:hidden}
.hero .wrap{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:center}
.hero h1{color:#fff}.hero p.lead{font-size:clamp(17px,1.6vw,19.5px);color:#D6E6E4;max-width:34em}
.hero .actions{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0 22px}
.hero .ghost{color:#fff}
.checks{list-style:none;padding:0;margin:0;display:grid;gap:8px;color:#D6E6E4;font-size:15px}
.checks li{padding-left:28px;position:relative}.checks li:before{content:"";position:absolute;left:2px;top:.42em;width:14px;height:8px;border-left:3px solid var(--gold);border-bottom:3px solid var(--gold);transform:rotate(-45deg)}
.scene{width:100%;height:auto;display:block;filter:drop-shadow(0 24px 40px rgba(0,0,0,.25))}
@media(max-width:860px){.hero .wrap{grid-template-columns:1fr}}
.kicker{font-weight:700;color:var(--orangeInk);font-size:15px;margin-bottom:6px}
.hero .kicker,.pagehead .kicker{color:var(--gold)}
/* page head */
.pagehead{background:var(--teal);color:#E3EEEC}
.pagehead h1{color:#fff;max-width:20em}.pagehead p{max-width:40em;font-size:18px}
.crumbs{font-size:13.5px;margin-bottom:14px;color:#BFD6D3}.crumbs a{color:#fff}
.pagehead .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.pagehead .ghost{color:#fff}
/* grids & cards */
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px;display:flex;flex-direction:column}
.card h3{margin-top:0}.card p{color:var(--soft)}.card .more{margin-top:auto;font-weight:700;text-decoration:none}
.ico{width:46px;height:46px;border-radius:12px;background:var(--sand);display:grid;place-items:center;margin-bottom:16px}
.ico svg{width:26px;height:26px}
.sand{background:var(--sand)}
.split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,5vw,64px);align-items:start}
@media(max-width:820px){.split{grid-template-columns:1fr}}
.section-title{max-width:44em;margin-bottom:28px}.section-title h2{margin-top:0}.section-title p{color:var(--soft);font-size:17.5px}
/* steps */
.steps{counter-reset:s;display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}
.steps li{list-style:none;counter-increment:s;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px}
.steps li:before{content:counter(s);display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--gold);color:#1E2A2E;font-weight:800;margin-bottom:12px}
.steps{padding:0;margin:0}.steps strong{display:block;font-size:17px;margin-bottom:4px}.steps span{color:var(--soft)}
/* pricing */
.price{font-family:"DM Serif Display",Georgia,serif;font-size:46px;line-height:1;color:var(--link);white-space:nowrap}
.price small{font:500 15px Inter,sans-serif;color:var(--soft)}
.plan ul{padding-left:20px;margin:16px 0 20px}.plan li{margin-bottom:6px}
.plan.best{border:2px solid var(--orange);position:relative}
.plan .tag{position:absolute;top:-13px;left:22px;background:var(--orange);color:#fff;font-size:13px;font-weight:700;padding:3px 12px;border-radius:20px}
.plan .btn{margin-top:auto}
table{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden;border:1px solid var(--line)}
th,td{padding:13px 16px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{background:var(--sand);font-size:14px}td.n,th.n{text-align:right;white-space:nowrap}
/* prose */
.prose{max-width:760px}.prose ul{padding-left:22px}.prose li{margin-bottom:6px}
.note{background:var(--sand);border-left:4px solid var(--gold);padding:14px 18px;border-radius:0 10px 10px 0}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:clamp(28px,5vw,64px);align-items:start}
.aside{position:sticky;top:96px;display:grid;gap:18px}
@media(max-width:960px){.layout{grid-template-columns:1fr}.aside{position:static}}
/* faq */
details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:0 20px;margin-bottom:10px}
summary{cursor:pointer;font-weight:700;padding:18px 0;min-height:44px;list-style-position:outside}
details[open] summary{border-bottom:1px solid var(--line);margin-bottom:12px}
details p{color:var(--soft)}
/* cta band */
.ctaband{background:var(--orange);color:#fff}
.ctaband .wrap{display:flex;gap:24px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.ctaband h2{margin:0;color:#fff}.ctaband p{margin:.4em 0 0;color:#FFEDE2}
/* forms */
form{display:grid;gap:16px;max-width:640px}
label{font-weight:600;font-size:15px;display:grid;gap:6px}
input,select,textarea{font:16px Inter,sans-serif;padding:12px 14px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);min-height:46px}
textarea{min-height:130px}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.formmsg{display:none;background:var(--sand);padding:16px 18px;border-radius:12px;border-left:4px solid var(--teal2)}
/* footer */
footer{background:#0A333E;color:#BFD3D1;font-size:15px}
footer .wrap{display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:32px}
footer h4{color:#fff;font:700 15px Inter,sans-serif;margin:0 0 12px}
footer ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}footer a{color:#E3EEEC;text-decoration:none}footer a:hover{text-decoration:underline}
footer .brand{color:#fff}footer .mark{color:#E3EEEC}
.legal{border-top:1px solid #1C5361;margin-top:36px;padding-top:20px;font-size:13.5px;color:#9FB9B6;grid-column:1/-1}
@media(max-width:820px){footer .wrap{grid-template-columns:1fr 1fr}}
@media(max-width:520px){footer .wrap{grid-template-columns:1fr}}
.pill{display:inline-block;background:var(--sand);color:var(--ink);border-radius:20px;padding:4px 12px;font-size:13.5px;font-weight:600;margin:0 6px 6px 0}
.scroll{overflow-x:auto}
@media(max-width:600px){.brand small{display:none}.brand{font-size:13px;white-space:nowrap;gap:8px}.mark{width:30px;height:30px}.top .wrap{gap:8px}.langs{display:none}.top .wrap{justify-content:space-between}.menu{padding:0 10px;margin-left:2px}table{font-size:14px}.stack thead{display:none}.stack tr{display:grid;padding-block:10px}.stack td{display:flow-root;border:0;padding:3px 16px;padding-inline-start:9em;text-align:start}.stack td::before{content:attr(data-l);float:inline-start;width:8.5em;margin-inline-start:-8.5em;font-weight:600;white-space:normal}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.sunrise{animation:none!important}}
.sunrise{animation:rise 1.6s ease-out both}@keyframes rise{from{transform:translateY(40px);opacity:.2}to{transform:none;opacity:1}}
`;

const urlOf = p => C.domain + '/' + p.replace(/index\.html$/, '').replace(/\.html$/, '');

function head({ title, desc, path, schema = [], rel, lang }) {
  const url = urlOf(path), alts = altsFor(path);
  const hl = alts ? Object.entries(alts).map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${urlOf(p)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${urlOf(alts.en)}">` : '';
  return `<!DOCTYPE html>
<html lang="${lang === 'pt' ? 'pt-BR' : lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${hl}
<meta property="og:type" content="website"><meta property="og:site_name" content="${C.brand}"><meta property="og:locale" content="${L[lang].locale}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0F4C5C">
<link rel="icon" href="${rel}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}styles.css">
${schema.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
</head>`;
}

function header(path, rel, lang) {
  const T = L[lang], alts = altsFor(path), home = { en: 'index.html', pt: 'pt/index.html', es: 'es/index.html' };
  const start = { en: 'get-started.html', pt: 'pt/comecar.html', es: 'es/empezar.html' }[lang];
  const sw = ['en', 'pt', 'es'].map(l => `<a href="${rel}${(alts && alts[l]) || home[l]}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`).join('');
  const section = p => p.split('/').slice(0, -1).join('/');
  return `<a class="skip" href="#main">${T.skip}</a>
<header class="top"><div class="wrap">
<a class="brand" href="${rel}${home[lang]}">${logo}<span>THE BUSINESS CLERK<small>${esc(T.subtitle)}</small></span></a>
<nav class="main" id="nav" aria-label="Main">${''}${T.nav.map(([h, t]) => `<a href="${rel}${h}"${path === h || (h.endsWith('index.html') && h !== home[lang] && section(h) && path.startsWith(section(h) + '/')) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}<div class="navlangs">${sw}</div></nav>
<div class="langs" aria-label="Language">${sw}</div>
<button class="menu" aria-expanded="false" aria-controls="nav">${T.menu}</button>
<a class="btn primary cta" href="${rel}${start}">${T.getStarted}</a>
</div></header>`;
}

function footer(rel, lang) {
  const T = L[lang];
  const col = (t, links) => `<div><h4>${t}</h4><ul>${links.map(([h, x]) => `<li><a href="${rel}${h}">${x}</a></li>`).join('')}</ul></div>`;
  return `<footer class="band"><div class="wrap">
<div><a class="brand" href="${rel}${lang === 'en' ? '' : lang + '/'}index.html">${logo}<span>THE BUSINESS CLERK</span></a>
<p style="margin-top:14px">${esc(T.subtitle)}</p><p>${T.footAbout}</p>
<p>${T.email}: <a href="mailto:${C.email}">${C.email}</a></p></div>
${col(T.fServices, T.services)}
${col(T.fCompany, T.company)}
${col(T.fLegal, T.legal)}
<p class="legal">© ${new Date().getFullYear()} THE BUSINESS CLERK LLC. ${T.legalLine}</p>
</div></footer>
<script>{const b=document.querySelector('.menu'),n=document.getElementById('nav');b&&b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)});
for(const f of document.querySelectorAll('form[data-mail]')){f.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(f),lines=[];for(const [k,v] of d)if(v)lines.push(k+': '+v);const subj=encodeURIComponent(f.dataset.mail),body=encodeURIComponent(lines.join('\\n'));const m=f.querySelector('.formmsg');m.style.display='block';m.querySelector('a').href='mailto:${C.email}?subject='+subj+'&body='+body;m.scrollIntoView({block:'nearest'})})}}</script>
</body></html>`;
}

const ctaBand = (rel, h, p, lang = 'en') => {
  const T = L[lang], start = { en: 'get-started.html', pt: 'pt/comecar.html', es: 'es/empezar.html' }[lang];
  return `<section class="ctaband band"><div class="wrap"><div><h2>${h || T.ctaH}</h2><p>${p || T.ctaP}</p></div><a class="btn light" href="${rel}${start}">${T.getStarted}</a></div></section>`;
};

function page({ path, title, desc, schema = [], body, lang = 'en' }) {
  const depth = path.split('/').length - 1;
  const rel = depth ? '../'.repeat(depth) : '';
  return head({ title, desc, path, schema, rel, lang }) + '\n<body>\n' + header(path, rel, lang) + `\n<main id="main">\n${body(rel)}\n</main>\n` + footer(rel, lang);
}

const org = {
  '@context': 'https://schema.org', '@type': 'ProfessionalService', name: C.name, alternateName: C.brand,
  url: C.domain, email: C.email, areaServed: { '@type': 'State', name: 'Florida' },
  description: 'Florida registered agent, LLC and corporation formation, annual report filing, business address and mail forwarding, and business launch services.',
  knowsLanguage: ['en', 'pt', 'es'],
};

const crumbsSchema = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: C.domain + '/' + u })) });
const faqSchema = (faqs) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/\[(.+?)\]\(.+?\)/g, '$1').replace(/\*\*/g, '') } })) });
const faqHtml = (faqs, rel) => faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary>${md(a, rel)}</details>`).join('\n');

module.exports = { esc, md, page, CSS, logo, ctaBand, org, crumbsSchema, faqSchema, faqHtml };
