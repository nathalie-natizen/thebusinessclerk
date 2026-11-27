import 'server-only';

// Live lookup on Sunbiz's public search pages (search.sunbiz.org). There is no official API, so this reads the HTML.
// Returns records in the same shape as our copy of the state data files (sunbiz_entities), so the forms work with either.
const BASE = 'https://search.sunbiz.org/Inquiry/CorporationSearch';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; TheBusinessClerk/1.0; +https://thebusinessclerk.com)', Accept: 'text/html' };
const TIMEOUT = 8000;

const decode = s => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const text = s => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const statusCode = s => (/^active/i.test(String(s).trim()) ? 'A' : 'I');
const TYPES = [[/florida limited liability/i, 'FLAL'], [/foreign limited liability/i, 'FORL'], [/florida not for profit/i, 'DOMNP'], [/foreign not for profit/i, 'FORNP'], [/florida profit corporation/i, 'DOMP'], [/foreign profit corporation/i, 'FORP'], [/limited partnership/i, 'LP']];

async function get(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { ...HEADERS, ...(init.headers || {}) }, signal: AbortSignal.timeout(TIMEOUT), cache: 'no-store', redirect: 'follow' });
  if (!r.ok) throw new Error('sunbiz ' + r.status);
  const html = await r.text();
  // A bot check or error page instead of Sunbiz content
  if (!/Division of Corporations|sunbiz/i.test(html) || /captcha|cf-chl|Attention Required/i.test(html)) throw new Error('sunbiz blocked');
  return html;
}

// Address block: lines separated by <br>; the last line is "CITY, ST ZIP" (or a foreign city/country line)
function address(divHtml) {
  const lines = String(divHtml || '').split(/<br\s*\/?>/i).map(text).filter(Boolean);
  if (!lines.length) return null;
  const last = lines[lines.length - 1];
  const m = last.match(/^(.*?),\s*([A-Z]{2})\s+([\d-]{5,10})\s*([A-Z]{2,3})?$/);
  if (m) {
    const street = lines.slice(0, -1);
    return { line1: street[0] || '', line2: street.slice(1).join(', '), city: m[1].trim(), state: m[2], zip: m[3].replace('-', ''), country: m[4] || 'US' };
  }
  return { line1: lines[0] || '', line2: lines.slice(1, -1).join(', '), city: last, state: '', zip: '', country: '' };
}

// Search by company name: Sunbiz lists companies alphabetically from the closest match
export async function liveSearch(q, lim = 10) {
  const name = q.toUpperCase().replace(/[^A-Z0-9 &'.,-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (name.replace(/[^A-Z0-9]/g, '').length < 2) return [];
  const html = await get(`${BASE}/SearchResults/EntityName/${encodeURIComponent(name)}/Page1?searchNameOrder=${encodeURIComponent(name.replace(/[^A-Z0-9]/g, ''))}`);
  const out = [];
  const row = /<td class="large-width">\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/td>\s*<td class="medium-width">([\s\S]*?)<\/td>\s*<td class="small-width">([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = row.exec(html)) && out.length < 40) out.push({ name: text(m[1]), doc_number: text(m[2]), status: statusCode(text(m[3])), partial: true });
  // Rank: names containing every word typed first, then Sunbiz's alphabetical order
  const words = name.split(' ').filter(w => w.length > 1 && !['THE', 'LLC', 'INC', 'CORP'].includes(w));
  const score = r => words.filter(w => r.name.includes(w)).length;
  return out.map((r, i) => ({ r, i, s: score(r) })).filter(x => !words.length || x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, lim).map(x => x.r);
}

// Full record by document number (Sunbiz redirects the document-number search straight to the detail page)
export async function liveByDoc(doc) {
  const html = await get(`${BASE}/ByDocumentNumber`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ SearchTerm: doc, InquiryType: 'DocumentNumber', SearchNameOrder: '' }).toString() });
  return parseDetail(html);
}

export function parseDetail(html) {
  const sections = String(html).split(/<div class="detailSection/i).slice(1);
  if (!sections.length) return null;
  const head = sections[0];
  const ps = [...head.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(m => text(m[1]));
  if (!ps.length) return null;
  const typeLabel = ps[0] || '', name = ps[1] || ps[0];
  const field = label => { const m = html.match(new RegExp(`<label[^>]*>\\s*${label}\\s*</label>\\s*<span[^>]*>([\\s\\S]*?)</span>`, 'i')); return m ? text(m[1]) : ''; };
  const sec = title => sections.find(s => new RegExp(`<span[^>]*>\\s*${title}`, 'i').test(s));
  const firstDiv = s => { const m = s && s.match(/<div>([\s\S]*?)<\/div>/i); return m ? m[1] : ''; };
  const doc = field('Document Number');
  const date = field('Date Filed'); const [mm, dd, yy] = date.split('/');
  const raSec = sec('Registered Agent');
  const raName = raSec ? text((raSec.match(/<\/span>\s*<span[^>]*>([^<]*)<\/span>/i) || [])[1]) : '';
  const peopleSec = sec('Authorized Person') || sec('Officer/Director') || sec('Manager') || sec('General Partner');
  const officers = [];
  if (peopleSec) for (const chunk of peopleSec.split(/Title(?:&nbsp;|\s)+/i).slice(1)) {
    const title = text(chunk.split(/<\/span>/i)[0]);
    const after = chunk.slice(chunk.indexOf('</span>') + 7);
    const nm = text(after.split(/<span/i)[0]);
    const a = address(firstDiv(after));
    if (nm) officers.push({ title, type: nm.includes(',') ? 'P' : 'C', name: nm, ...(a || {}) });
  }
  const repSec = sec('Annual Reports');
  const reports = repSec ? [...repSec.matchAll(/<td>\s*(\d{4})\s*<\/td>\s*<td>\s*([\d/]+)\s*<\/td>/gi)].map(m => ({ year: +m[1], date: m[2] })).slice(-3) : [];
  return {
    doc_number: doc, name, status: statusCode(field('Status')), filing_type: (TYPES.find(([re]) => re.test(typeLabel)) || [null, ''])[1],
    file_date: yy ? `${yy}-${mm}-${dd}` : null, fei: /^\d{2}-\d{7}$/.test(field('FEI/EIN Number')) ? field('FEI/EIN Number') : null,
    principal: address(firstDiv(sec('Principal Address'))), mailing: address(firstDiv(sec('Mailing Address'))),
    ra: raName ? { name: raName, type: raName.includes(',') ? 'P' : 'C', ...(address(firstDiv(raSec)) || {}) } : null,
    officers: officers.slice(0, 6), more_officers: officers.length > 6, reports, source: 'live',
  };
}
