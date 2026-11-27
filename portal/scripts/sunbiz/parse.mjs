// Reads one line of the Florida Division of Corporations corporate data file (fixed width, 1,440 characters).
// Layout: https://dos.fl.gov/sunbiz/other-services/data-downloads/corporate-data-file/file-structure/
const f = (line, start, len) => line.substr(start - 1, len).trim();

// Dates come as 8 digits; accept MMDDYYYY or YYYYMMDD and drop anything that isn't a real date
export function toDate(s) {
  if (!/^\d{8}$/.test(s)) return null;
  let y, m, d;
  const head = +s.slice(0, 4);
  if (head >= 1800 && head <= 2100 && +s.slice(4, 6) >= 1 && +s.slice(4, 6) <= 12) { y = head; m = +s.slice(4, 6); d = +s.slice(6, 8); }
  else { m = +s.slice(0, 2); d = +s.slice(2, 4); y = +s.slice(4, 8); }
  if (y < 1800 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return dt.toISOString().slice(0, 10);
}

const addr = (o) => (Object.values(o).some(Boolean) ? o : null);

export function parseLine(raw) {
  const line = raw.replace(/[\r\n]+$/, '');
  if (line.length < 220) return null;
  const doc = f(line, 1, 12).toUpperCase();
  const name = f(line, 13, 192);
  if (!doc || !name) return null;
  const officers = [];
  for (let i = 0; i < 6; i++) {
    const b = 669 + i * 128;
    const o = { title: f(line, b, 4), type: f(line, b + 4, 1), name: f(line, b + 5, 42), line1: f(line, b + 47, 42), city: f(line, b + 89, 28), state: f(line, b + 117, 2), zip: f(line, b + 119, 9) };
    if (o.name) officers.push(o);
  }
  const reports = [];
  for (let i = 0; i < 3; i++) {
    const b = 506 + i * 13;
    const year = f(line, b, 4);
    if (/^\d{4}$/.test(year)) reports.push({ year: +year, date: toDate(f(line, b + 5, 8)) });
  }
  return {
    doc_number: doc,
    name,
    status: f(line, 205, 1) || null,
    filing_type: f(line, 206, 15) || null,
    principal: addr({ line1: f(line, 221, 42), line2: f(line, 263, 42), city: f(line, 305, 28), state: f(line, 333, 2), zip: f(line, 335, 10), country: f(line, 345, 2) }),
    mailing: addr({ line1: f(line, 347, 42), line2: f(line, 389, 42), city: f(line, 431, 28), state: f(line, 459, 2), zip: f(line, 461, 10), country: f(line, 471, 2) }),
    file_date: toDate(f(line, 473, 8)),
    fei: f(line, 481, 14) || null,
    more_officers: f(line, 495, 1) === 'Y',
    last_txn_date: toDate(f(line, 496, 8)),
    reports,
    ra: addr({ name: f(line, 545, 42), type: f(line, 587, 1), line1: f(line, 588, 42), city: f(line, 630, 28), state: f(line, 658, 2), zip: f(line, 660, 9) }),
    officers,
  };
}

// Inactive companies are kept only if something happened in the last `years` years (enough for reinstatements)
export function keep(r, years, today = new Date()) {
  if (r.status !== 'I') return true;
  const d = r.last_txn_date || r.file_date;
  if (!d) return false;
  const cutoff = new Date(today); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  return d >= cutoff.toISOString().slice(0, 10);
}

// One row for Postgres COPY (text format)
const esc = (v) => (v === null || v === undefined ? '\\N' : String(v).replace(/\\/g, '\\\\').replace(/\t/g, ' ').replace(/[\r\n]/g, ' '));
export const COLS = ['seq', 'doc_number', 'name', 'status', 'filing_type', 'file_date', 'last_txn_date', 'fei', 'principal', 'mailing', 'ra', 'officers', 'more_officers', 'reports'];
export function copyRow(r, seq) {
  return [seq, r.doc_number, r.name, r.status, r.filing_type, r.file_date, r.last_txn_date, r.fei,
    r.principal && JSON.stringify(r.principal), r.mailing && JSON.stringify(r.mailing), r.ra && JSON.stringify(r.ra),
    JSON.stringify(r.officers), r.more_officers, JSON.stringify(r.reports)].map(esc).join('\t') + '\n';
}
