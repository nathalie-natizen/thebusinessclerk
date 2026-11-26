import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import AutoSelect from '@/components/AutoSelect';
import { requireStaff } from '@/lib/auth';
import { SOURCES, OPS, runReport, configFromForm } from '@/lib/reports';

// Ready-made reports staff can open, copy and adjust
const PRESETS = [
  ['Failed payments', { source: 'entities', fields: ['file_number', 'legal_name', 'payment_issue', 'contact_name', 'contact_phone'], filters: [{ field: 'payment_issue', op: 'not_empty' }] }],
  ['Orders pending payment', { source: 'orders', fields: ['entity.file_number', 'entity.legal_name', 'kind', 'created_at'], filters: [{ field: 'status', op: 'eq', value: 'awaiting_payment' }] }],
  ['Registered agent clients', { source: 'entities', fields: ['file_number', 'legal_name', 'status', 'contact_name', 'contact_email', 'contact_phone'], filters: [{ field: 'registered_agent', op: 'eq', value: 'yes' }] }],
  ['Legal papers received', { source: 'mail', fields: ['entity.file_number', 'entity.legal_name', 'received_at', 'category', 'sender', 'viewed_at'], filters: [{ field: 'category', op: 'eq', value: 'service_of_process' }] }],
  ['Unpaid mail statements', { source: 'statements', fields: ['entity.file_number', 'entity.legal_name', 'period_start', 'total_cents', 'status'], filters: [{ field: 'status', op: 'neq', value: 'paid' }] }],
  ['Form 1583 not approved', { source: 'compliance', fields: ['entity.file_number', 'entity.legal_name', 'status', 'submitted_at'], filters: [{ field: 'status', op: 'neq', value: 'filed' }] }],
];
const qs = cfg => { const p = new URLSearchParams({ source: cfg.source }); (cfg.fields || []).forEach(f => p.append('fields', f)); (cfg.filters || []).forEach((f, i) => { p.set(`f${i}_field`, f.field); p.set(`f${i}_op`, f.op); if (f.value) p.set(`f${i}_value`, f.value); }); if (cfg.sort?.field) { p.set('sort', cfg.sort.field); p.set('dir', cfg.sort.dir); } p.set('run', '1'); return p.toString(); };
const fromParams = sp => configFromForm({ get: k => sp?.[k] ?? null, getAll: k => [].concat(sp?.[k] ?? []) });

async function save(fd) {
  'use server';
  const { sb, user } = await requireStaff();
  const name = String(fd.get('name') || '').trim().slice(0, 120); const cfg = configFromForm(fd);
  if (!name || !SOURCES[cfg.source] || !cfg.fields.length) redirect(`/staff/reports?${qs(cfg)}&err=${encodeURIComponent('Name the report and choose at least one column.')}`);
  const id = String(fd.get('id') || '');
  if (id && fd.get('as_new') !== '1') { await sb.from('reports').update({ name, config: cfg, updated_at: new Date().toISOString() }).eq('id', id); redirect(`/staff/reports?id=${id}&saved=1`); }
  const { data } = await sb.from('reports').insert({ name, config: cfg, created_by: user.id }).select('id').single();
  redirect(`/staff/reports?id=${data?.id}&saved=1`);
}
async function remove(fd) {
  'use server';
  const { sb } = await requireStaff();
  await sb.from('reports').delete().eq('id', String(fd.get('id')));
  redirect('/staff/reports');
}

export default async function Reports({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const { data: saved } = await sb.from('reports').select('id, name, config, updated_at').order('name');
  const current = searchParams?.id ? (saved || []).find(r => r.id === searchParams.id) : null;
  const cfg = current && !searchParams?.source ? current.config : fromParams(searchParams);
  const src = SOURCES[cfg.source] || null;
  const run = src && (current || searchParams?.run) ? await runReport(sb, cfg) : null;
  const fieldOpts = src ? Object.entries(src.fields) : [];
  const filters = [...(cfg.filters || []), {}, {}, {}].slice(0, Math.max(3, (cfg.filters || []).length + 1));
  const csv = `/api/reports/csv?${qs(cfg)}`;
  return (<Shell profile={profile}>
    <h1>Reports</h1>
    <p className="sub">Build a report from any part of the platform: pick what to report on, the columns, and the filters. Run it, export it to CSV, or name and save it to use again.</p>
    {searchParams?.err && <div className="note" style={{ borderLeftColor: '#C0392B' }}>{searchParams.err}</div>}
    {searchParams?.saved && <p className="ok-msg">Report saved.</p>}
    <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
      <aside className="card">
        <h3 style={{ marginTop: 0 }}>Saved reports</h3>
        {!saved?.length ? <p className="muted">None yet.</p> : <ul style={{ paddingLeft: 18, margin: 0 }}>{saved.map(r => <li key={r.id} style={{ marginBottom: 6 }}><Link href={`/staff/reports?id=${r.id}`} style={{ fontWeight: current?.id === r.id ? 800 : 400 }}>{r.name}</Link> <span className="muted" style={{ fontSize: 12 }}>· {SOURCES[r.config?.source]?.label}</span></li>)}</ul>}
        <h3>Ready-made</h3>
        <ul style={{ paddingLeft: 18, margin: 0 }}>{PRESETS.map(([n, c]) => <li key={n} style={{ marginBottom: 6 }}><Link href={`/staff/reports?${qs(c)}&name=${encodeURIComponent(n)}`}>{n}</Link></li>)}</ul>
        <p style={{ marginBottom: 0 }}><Link className="btn small sec" href="/staff/reports">+ New report</Link></p>
      </aside>
      <div>
        <form method="get" action="/staff/reports" className="card stack" style={{ marginBottom: 16 }}>
          {current && <input type="hidden" name="id" value={current.id} />}
          <input type="hidden" name="run" value="1" />
          <div className="row"><label>Report on<AutoSelect name="source" defaultValue={cfg.source || ''}><option value="" disabled>Choose…</option>{Object.entries(SOURCES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</AutoSelect></label>
            <label>Report name<input name="name" defaultValue={current?.name || searchParams?.name || ''} placeholder="e.g. Annual reports due" /></label></div>
          {src && <>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontWeight: 700 }}>Columns</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 4 }}>{fieldOpts.map(([k, d]) => <label key={k} style={{ display: 'flex', gap: 6, fontWeight: 400, fontSize: 14 }}><input type="checkbox" name="fields" value={k} defaultChecked={(cfg.fields || []).includes(k)} style={{ minHeight: 'auto' }} />{d.label}</label>)}</div></fieldset>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontWeight: 700 }}>Filters (all must match)</legend>
              {filters.map((f, i) => <div className="row" key={i} style={{ gap: 6 }}>
                <select name={`f${i}_field`} defaultValue={f.field || ''}><option value="">—</option>{fieldOpts.map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}</select>
                <select name={`f${i}_op`} defaultValue={f.op || 'eq'}>{Object.entries(OPS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <input name={`f${i}_value`} defaultValue={f.value || ''} placeholder="Value (dates as 2026-12-31, yes/no, amounts in $)" /></div>)}
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Run the report to add another filter row.</p></fieldset>
            <div className="row" style={{ gap: 6 }}><label>Sort by<select name="sort" defaultValue={cfg.sort?.field || src.date}>{fieldOpts.filter(([, d]) => !d.join).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}</select></label><label>Order<select name="dir" defaultValue={cfg.sort?.dir || 'desc'}><option value="desc">Newest / highest first</option><option value="asc">Oldest / lowest first</option></select></label></div>
          </>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" style={{ flex: '0 0 auto' }}>Run report</button>
            {src && <button className="btn sec" style={{ flex: '0 0 auto' }} formAction={save} formMethod="post">{current ? 'Save changes' : 'Save report'}</button>}
            {current && <button className="btn sec" style={{ flex: '0 0 auto' }} formAction={save} formMethod="post" name="as_new" value="1">Save as new</button>}
          </div>
        </form>
        {current && <form action={remove} style={{ marginBottom: 12 }}><input type="hidden" name="id" value={current.id} /><button className="btn small sec">Delete this saved report</button></form>}
        {run && (run.error ? <div className="note">{run.error}</div> : <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><h2 style={{ margin: 0 }}>{current?.name || searchParams?.name || 'Results'} <span className="muted" style={{ fontSize: 15, fontWeight: 400 }}>{run.rows.length} row{run.rows.length === 1 ? '' : 's'}{run.truncated ? ' (first 1,000)' : ''}</span></h2><a className="btn small sec" href={csv}>Export CSV</a></div>
          <div className="scroll"><table><thead><tr>{run.columns.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
            {run.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ textAlign: ['money', 'number'].includes(run.types[j]) ? 'right' : 'left' }}>{c}</td>)}</tr>)}
            {run.totals.some(t => t !== null) && run.rows.length > 0 && <tr style={{ fontWeight: 800 }}>{run.totals.map((t, j) => <td key={j} style={{ textAlign: 'right' }}>{t === null ? (j === 0 ? 'Total' : '') : run.types[j] === 'money' ? `$${t.toFixed(2)}` : t}</td>)}</tr>}
          </tbody></table></div></section>)}
      </div>
    </div>
  </Shell>);
}
