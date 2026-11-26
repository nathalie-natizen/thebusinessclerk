// Custom reports: what can be reported on, and how a saved report config becomes a query.
import { KINDS, ORDER_STATUS, MAIL_STATUS, MAIL_CATEGORY, CMRA_STATUS } from './labels';

const label = map => v => (map && map[v]) || v;
const ent = { 'entity.file_number': { label: 'File #', type: 'text', col: 'file_number', join: true }, 'entity.legal_name': { label: 'Company', type: 'text', col: 'legal_name', join: true }, 'entity.status': { label: 'Company status', type: 'text', col: 'status', join: true }, 'entity.contact_email': { label: 'Contact email', type: 'text', col: 'contact_email', join: true } };

export const SOURCES = {
  entities: { label: 'Companies', table: 'entities', date: 'created_at', fields: {
    file_number: { label: 'File #', type: 'text' }, legal_name: { label: 'Company', type: 'text' }, entity_type: { label: 'Type', type: 'text' }, status: { label: 'Status', type: 'text' },
    registered_agent: { label: 'Registered agent', type: 'bool' }, mail_service: { label: 'Mail service', type: 'bool' }, sunbiz_doc_number: { label: 'Florida doc #', type: 'text' },
    formation_date: { label: 'Formation date', type: 'date' }, ein: { label: 'EIN', type: 'text' }, contact_name: { label: 'Contact name', type: 'text' }, contact_email: { label: 'Contact email', type: 'text' },
    contact_phone: { label: 'Contact phone', type: 'text' }, language: { label: 'Language', type: 'text' }, principal_address: { label: 'Principal address', type: 'text' },
    payment_issue: { label: 'Failed payment ($)', type: 'issue', filter: 'exists' }, created_at: { label: 'Created', type: 'date' } } },
  orders: { label: 'Orders', table: 'orders', date: 'created_at', fields: {
    ...ent, kind: { label: 'Service', type: 'enum', fmt: label(Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.name]))), options: Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.name])) },
    service: { label: 'Service name', type: 'text' }, status: { label: 'Status', type: 'enum', fmt: label(ORDER_STATUS), options: ORDER_STATUS }, source: { label: 'Source', type: 'text' },
    amount_cents: { label: 'Amount', type: 'money' }, created_at: { label: 'Ordered', type: 'date' }, updated_at: { label: 'Last updated', type: 'date' } } },
  mail: { label: 'Mail items', table: 'mail_items', date: 'received_at', fields: {
    ...ent, received_at: { label: 'Received', type: 'date' }, category: { label: 'Type', type: 'enum', fmt: label(MAIL_CATEGORY), options: MAIL_CATEGORY }, sender: { label: 'Sender', type: 'text' },
    status: { label: 'Status', type: 'enum', fmt: label(MAIL_STATUS), options: MAIL_STATUS }, urgent: { label: 'Urgent', type: 'bool' }, client_request: { label: 'Client request', type: 'text' },
    pages: { label: 'Pages scanned', type: 'number' }, carrier: { label: 'Carrier', type: 'text' }, tracking_number: { label: 'Tracking #', type: 'text' }, postage_cents: { label: 'Postage', type: 'money' },
    notified_at: { label: 'Client notified', type: 'date' }, viewed_at: { label: 'Client viewed', type: 'date' }, delivered_at: { label: 'Delivered', type: 'date' } } },
  statements: { label: 'Mail statements', table: 'mail_statements', date: 'period_start', fields: {
    ...ent, period_start: { label: 'Month', type: 'date' }, items_count: { label: 'Items', type: 'number' }, base_cents: { label: 'Plan', type: 'money' }, total_cents: { label: 'Charged', type: 'money' },
    status: { label: 'Status', type: 'text' }, created_at: { label: 'Created', type: 'date' } } },
  compliance: { label: 'Form 1583', table: 'cmra_applications', date: 'submitted_at', fields: {
    ...ent, status: { label: 'Status', type: 'enum', fmt: label(CMRA_STATUS), options: CMRA_STATUS }, applicant_name: { label: 'Applicant', type: 'text' }, witness_method: { label: 'Signing', type: 'text' },
    submitted_at: { label: 'Submitted', type: 'date' }, updated_at: { label: 'Updated', type: 'date' } } },
};

export const OPS = { eq: 'is', neq: 'is not', contains: 'contains', gt: 'after / more than', lt: 'before / less than', empty: 'is empty', not_empty: 'is not empty' };

// Builds and runs the query for a report config
export async function runReport(sb, cfg, limit = 1000) {
  const src = SOURCES[cfg?.source]; if (!src) return { error: 'Choose what to report on.' };
  const fields = (cfg.fields || []).filter(f => src.fields[f]); if (!fields.length) return { error: 'Choose at least one column.' };
  const filters = (cfg.filters || []).filter(f => src.fields[f.field] && OPS[f.op]);
  const entCols = [...new Set(Object.entries(src.fields).filter(([, d]) => d.join).map(([, d]) => d.col))];
  const joinFilter = filters.some(f => src.fields[f.field].join);
  const sel = src.table === 'entities' ? '*' : `*, entities${joinFilter ? '!inner' : ''}(${entCols.join(', ')})`;
  let q = sb.from(src.table).select(sel);
  for (const f of filters) {
    const d = src.fields[f.field]; const col = d.join ? `entities.${d.col}` : f.field; let v = String(f.value ?? '').trim();
    if (d.type === 'money' && v) v = String(Math.round(parseFloat(v.replace(/[^0-9.]/g, '')) * 100));
    if (d.type === 'bool') v = /^(true|yes|y|1)$/i.test(v) ? 'true' : 'false';
    if (d.options && v) { const hit = Object.entries(d.options).find(([k, l]) => k === v || String(l).toLowerCase() === v.toLowerCase()); if (hit) v = hit[0]; }
    if (d.filter === 'exists') { q = ['empty', 'neq'].includes(f.op) ? q.is(col, null) : q.not(col, 'is', null); continue; }
    if (f.op === 'empty') q = q.is(col, null); else if (f.op === 'not_empty') q = q.not(col, 'is', null);
    else if (f.op === 'contains') q = q.ilike(col, `%${v.replace(/[%_]/g, '')}%`);
    else if (f.op === 'eq') q = d.type === 'text' ? q.ilike(col, v) : q.eq(col, v);
    else if (f.op === 'neq') q = q.neq(col, v);
    else if (f.op === 'gt') q = q.gt(col, v); else if (f.op === 'lt') q = q.lt(col, v);
  }
  const sort = src.fields[cfg.sort?.field] && !src.fields[cfg.sort.field].join ? cfg.sort.field : src.date;
  q = q.order(sort, { ascending: cfg.sort?.dir === 'asc', nullsFirst: false }).limit(limit);
  const { data, error } = await q;
  if (error) return { error: error.message };
  const rows = (data || []).map(r => fields.map(f => { const d = src.fields[f]; const raw = d.join ? (Array.isArray(r.entities) ? r.entities[0] : r.entities)?.[d.col] : r[f]; return fmt(d, raw); }));
  const totals = fields.map((f, i) => ['money', 'number'].includes(src.fields[f].type) ? rows.reduce((a, r) => a + (parseFloat(String(r[i]).replace(/[^0-9.-]/g, '')) || 0), 0) : null);
  return { columns: fields.map(f => src.fields[f].label), types: fields.map(f => src.fields[f].type), rows, totals, truncated: (data || []).length >= limit };
}

function fmt(d, v) {
  if (v === null || v === undefined || v === '') return '';
  if (d.type === 'money') return `$${(v / 100).toFixed(2)}`;
  if (d.type === 'bool') return v ? 'Yes' : 'No';
  if (d.type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : new Date(v).toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  if (d.type === 'issue') return `$${((v.amount || 0) / 100).toFixed(2)} (${v.what || 'payment'})`;
  if (d.fmt) return d.fmt(v);
  return String(v);
}

// Read a report config from a submitted builder form
export function configFromForm(fd) {
  const source = String(fd.get('source') || '');
  const filters = [0, 1, 2, 3, 4].map(i => ({ field: String(fd.get(`f${i}_field`) || ''), op: String(fd.get(`f${i}_op`) || ''), value: String(fd.get(`f${i}_value`) || '').slice(0, 200) })).filter(f => f.field && f.op);
  return { source, fields: fd.getAll('fields').map(String), filters, sort: { field: String(fd.get('sort') || ''), dir: fd.get('dir') === 'asc' ? 'asc' : 'desc' } };
}
export const toCsv = r => [r.columns, ...r.rows].map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
