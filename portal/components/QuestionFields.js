// Renders questionnaire fields (used inside an UploadForm so file fields upload directly)
export default function QuestionFields({ def, values = {}, disabled = false }) {
  const v = values || {};
  return (<fieldset disabled={disabled} className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
    {def.fields.map((f, i) => {
      if (f.section) return <h3 key={i} style={{ margin: '14px 0 0' }}>{f.section}</h3>;
      const req = f.required ? ' *' : ''; const val = v[f.name] ?? f.default;
      const help = f.help && <span className="muted" style={{ fontWeight: 400, display: 'block', fontSize: 14 }}>{f.help}</span>;
      if (f.type === 'radio') return <fieldset key={f.name} style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontWeight: 600 }}>{f.label}{req}</legend>{help}
        {f.options.map(o => <label key={o} style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="radio" name={f.name} value={o} defaultChecked={val === o} style={{ minHeight: 'auto' }} />{o}</label>)}</fieldset>;
      if (f.type === 'checkboxes') return <fieldset key={f.name} style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontWeight: 600 }}>{f.label}{req}</legend>{help}
        <div className="row" style={{ gap: 6 }}>{f.options.map(o => <label key={o} style={{ display: 'flex', gap: 6, fontWeight: 400, flex: '0 0 auto' }}><input type="checkbox" name={f.name} value={o} defaultChecked={(val || []).includes(o)} style={{ minHeight: 'auto' }} />{o}</label>)}</div></fieldset>;
      if (f.type === 'select') return <label key={f.name}>{f.label}{req}{help}<select name={f.name} defaultValue={val || ''}><option value="" disabled>Choose…</option>{f.options.map(o => <option key={o}>{o}</option>)}</select></label>;
      if (f.type === 'textarea') return <label key={f.name}>{f.label}{req}{help}<textarea name={f.name} rows={3} defaultValue={val || ''} /></label>;
      if (f.type === 'rows') { const rows = Array.isArray(val) ? val : []; const n = Math.max(rows.length + 2, 3, f.min || 1);
        return <div key={f.name}><p style={{ fontWeight: 600, margin: '0 0 4px' }}>{f.label}{f.min ? ' *' : ''}</p>{help}
          {Array.from({ length: Math.min(n, f.max || 10) }, (_, r) => <div className="row" key={r} style={{ gap: 8 }}>{f.columns.map(([c, l]) => <label key={c} style={{ fontWeight: 400 }}>{r === 0 ? l : <span className="sr-only">{l}</span>}<input name={`${f.name}_${r}_${c}`} defaultValue={rows[r]?.[c] || ''} /></label>)}</div>)}</div>; }
      if (f.type === 'file') return <label key={f.name}>{f.label}{help}{v[f.name] && <span className="muted" style={{ fontWeight: 400 }}> (file received; upload again to replace)</span>}<input name={f.name} type="file" accept="image/*,application/pdf,.svg" /></label>;
      return <label key={f.name}>{f.label}{req}{help}<input name={f.name} type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} defaultValue={val || ''} /></label>;
    })}
  </fieldset>);
}
