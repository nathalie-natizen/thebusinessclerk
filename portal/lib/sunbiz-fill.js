// Turns a Florida (Sunbiz) record into form values. Used in the browser after a client or staff member picks their company.
export const isCorp = r => /^(DOMP|FORP|DOMNP|FORNP)/.test(r?.filing_type || '');
const zip = z => (/^\d{9}$/.test(z || '') ? (z.endsWith('0000') ? z.slice(0, 5) : `${z.slice(0, 5)}-${z.slice(5)}`) : z || '');
export const personName = o => { if (o.type === 'P' && o.name.includes(',')) { const [last, first] = o.name.split(/,\s*/, 2); return `${first} ${last}`.trim(); } return o.name; };
export const oneLine = a => (a ? [a.line1, a.line2, a.city, [a.state, zip(a.zip)].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '');
const COUNTRY = { US: 'United States', CA: 'Canada', BR: 'Brazil', MX: 'Mexico' };
export const country = c => COUNTRY[c] || c || '';
// Position of the matching option in the form's role list (corp: President, Director, Secretary, Treasurer; LLC: Manager, Authorized member)
export function roleIndex(title, corp) {
  const t = String(title || '').toUpperCase();
  if (corp) { const c = { P: 0, D: 1, C: 1, S: 2, T: 3 }[t]; if (c !== undefined) return c; if (/^PRES|^CEO|^VP|^VICE/.test(t)) return 0; if (/^DIR|^CHAIR/.test(t)) return 1; if (/^SEC/.test(t)) return 2; if (/^TREAS|^CFO/.test(t)) return 3; return undefined; }
  if (t.startsWith('MGR')) return 0;
  if (['AMBR', 'MBR', 'AP', 'MEM', 'MMBR'].includes(t)) return 1;
  return undefined;
}
// Sets values by field name; select fields take a number (option position)
export function fillForm(form, values) {
  if (!form) return;
  for (const [name, v] of Object.entries(values)) {
    const el = form.elements.namedItem(name);
    if (!el || v === undefined || v === null || typeof el.length === 'number' && !el.tagName) continue;
    if (el.tagName === 'SELECT' && typeof v === 'number') el.selectedIndex = v; else el.value = v;
  }
}
