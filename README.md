# THE BUSINESS CLERK LLC – website

Static site for thebusinessclerk.com, generated with plain Node (no dependencies).

- Prices, contact email and state fees: `config.js`
- English pages: `home.js`, `pages.js`, `articles.js`
- Portuguese / Spanish pages: `pt.js`, `es.js` (shared text in `i18n.js`)
- Build locally: `node build.js` → output in `dist/`

Vercel runs `node build.js` on every push and serves `dist/`.
