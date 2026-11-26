const fs = require('fs'), path = require('path');
const C = require('./config');
const { CSS, logo, page, ctaBand } = require('./layout');
const OUT = path.join(__dirname, 'dist');
fs.rmSync(OUT, { recursive: true, force: true });

const all = [{ path: 'index.html', html: require('./home')() }, ...require('./pages'), ...require('./articles'), ...require('./pt'), ...require('./es')];
all.push({ path: '404.html', html: page({ path: '404.html', title: 'Page not found | The Business Clerk', desc: 'Page not found.', body: rel => `<section class="pagehead band"><div class="wrap"><h1>We couldn't find that page.</h1><p>It may have moved. Try the <a style="color:#fff" href="${rel}index.html">home page</a> or our <a style="color:#fff" href="${rel}resources/index.html">guides</a>.</p></div></section>${ctaBand(rel)}` }) });

for (const p of all) { const f = path.join(OUT, p.path); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, p.html); }
fs.writeFileSync(path.join(OUT, 'styles.css'), CSS);
fs.writeFileSync(path.join(OUT, 'favicon.svg'), logo.replace('class="mark" ', 'xmlns="http://www.w3.org/2000/svg" ').replace('currentColor', '#0F4C5C'));
const today = new Date().toISOString().slice(0, 10);
const urls = all.filter(p => p.path !== '404.html').map(p => C.domain + '/' + p.path.replace(/index\.html$/, '').replace(/\.html$/, ''));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${C.domain}/sitemap.xml\n`);

console.log(all.length, 'pages');
