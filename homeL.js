// Localized home page template (PT / ES)
const C = require('./config');
const { page, ctaBand, org, faqSchema, faqHtml } = require('./layout');
const { icon, scene } = require('./home');

module.exports = (lang, t) => page({
  path: `${lang}/index.html`, lang, title: t.title, desc: t.desc,
  schema: [{ ...org, inLanguage: lang }, faqSchema(t.faqs)],
  body: rel => `
<section class="hero band"><div class="wrap">
<div>
<p class="kicker">${t.kicker}</p>
<h1>${t.h1}</h1>
<p class="lead">${t.lead}</p>
<div class="actions"><a class="btn primary" href="${rel}${t.start}">${t.cta1}</a><a class="btn ghost" href="${rel}${t.raHref}">${t.cta2}</a></div>
<ul class="checks">${t.checks.map(c => `<li>${c}</li>`).join('')}</ul>
</div>
<div>${scene}</div>
</div></section>

<section class="band"><div class="wrap">
<div class="section-title"><p class="kicker">${t.svcKicker}</p><h2>${t.svcH}</h2><p>${t.svcP}</p></div>
<div class="grid">${t.services.map(([i, ti, d, h, p, more]) => `<article class="card"><div class="ico">${icon[i]}</div><h3>${ti}</h3><p>${d}</p><p><span class="pill">${p}</span></p><a class="more" href="${rel}${h}">${more || t.more}</a></article>`).join('')}</div>
</div></section>

<section class="band sand"><div class="wrap split">
<div><p class="kicker">${t.whyKicker}</p><h2 style="margin-top:0">${t.whyH}</h2>${t.whyP.map(p => `<p>${p}</p>`).join('')}</div>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))">${t.why.map(([h, p]) => `<div class="card"><h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
</div></section>

<section class="band"><div class="wrap">
<div class="section-title"><p class="kicker">${t.stepsKicker}</p><h2>${t.stepsH}</h2></div>
<ol class="steps">${t.steps.map(([a, b]) => `<li><strong>${a}</strong><span>${b}</span></li>`).join('')}</ol>
</div></section>

<section class="band sand"><div class="wrap">
<div class="section-title"><p class="kicker">${t.priceKicker}</p><h2>${t.priceH}</h2><p>${t.priceP}</p></div>
<div class="grid">${t.plans.map((pl, i) => `<div class="card plan${i === 0 ? ' best' : ''}">${i === 0 ? `<span class="tag">${t.popular}</span>` : ''}<h3>${pl.h}</h3><p class="price">${pl.price} <small>${pl.unit}</small></p><ul>${pl.items.map(x => `<li>${x}</li>`).join('')}</ul><a class="btn ${i === 0 ? 'primary' : 'ghost'}" href="${rel}${pl.href}">${pl.btn}</a></div>`).join('')}</div>
<p style="margin-top:20px"><a href="${rel}${t.pricingHref}">${t.allPrices}</a></p>
</div></section>

<section class="band"><div class="wrap split">
<div><p class="kicker">${t.faqKicker}</p><h2 style="margin-top:0">${t.faqH}</h2><p>${t.faqP}</p></div>
<div>${faqHtml(t.faqs, rel)}</div>
</div></section>
${ctaBand(rel, null, null, lang)}`,
});
