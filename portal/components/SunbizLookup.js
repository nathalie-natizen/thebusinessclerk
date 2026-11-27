'use client';
import { useEffect, useRef, useState } from 'react';

// "Find your company" search over our copy of the Florida (Sunbiz) records. Picking a result calls onPick(record, form).
const T = {
  en: { h: 'Find your company in the Florida records', help: 'Search and pick your company to fill in its details. Not listed? Type it in below.', byName: 'Search by name', byDoc: 'Search by document number', phName: 'Company name', phDoc: 'e.g. L24000093039', company: 'Company', city: 'City', doc: 'Document #', status: 'Status', A: 'Active', I: 'Inactive', none: 'No Florida company found. Check the spelling, or type the details below.', searching: 'Searching…', down: 'The search isn’t available right now. Please type the details below.', picked: 'Selected', change: 'Change', pick: 'Select' },
  pt: { h: 'Encontre sua empresa nos registros da Flórida', help: 'Pesquise e selecione sua empresa para preencher os dados. Não aparece? Digite abaixo.', byName: 'Buscar pelo nome', byDoc: 'Buscar pelo número do documento', phName: 'Nome da empresa', phDoc: 'ex.: L24000093039', company: 'Empresa', city: 'Cidade', doc: 'Documento nº', status: 'Situação', A: 'Ativa', I: 'Inativa', none: 'Nenhuma empresa da Flórida encontrada. Confira a grafia ou digite os dados abaixo.', searching: 'Buscando…', down: 'A busca não está disponível agora. Digite os dados abaixo.', picked: 'Selecionada', change: 'Trocar', pick: 'Selecionar' },
  es: { h: 'Encuentre su empresa en los registros de Florida', help: 'Busque y seleccione su empresa para completar los datos. ¿No aparece? Escríbala abajo.', byName: 'Buscar por nombre', byDoc: 'Buscar por número de documento', phName: 'Nombre de la empresa', phDoc: 'ej.: L24000093039', company: 'Empresa', city: 'Ciudad', doc: 'Documento n.º', status: 'Estado', A: 'Activa', I: 'Inactiva', none: 'No encontramos ninguna empresa de Florida. Revise la ortografía o escriba los datos abajo.', searching: 'Buscando…', down: 'La búsqueda no está disponible ahora. Escriba los datos abajo.', picked: 'Seleccionada', change: 'Cambiar', pick: 'Seleccionar' },
};

const tab = (on) => ({ flex: 1, minHeight: 40, border: '1.5px solid var(--teal)', background: on ? 'var(--teal)' : 'var(--card)', color: on ? '#fff' : 'var(--teal)', font: '600 14px Inter,sans-serif', cursor: 'pointer' });

export default function SunbizLookup({ lang = 'en', onPick }) {
  const t = T[lang] || T.en;
  const [by, setBy] = useState('name');
  const [q, setQ] = useState('');
  const [state, setState] = useState({ status: 'idle', results: [] });
  const [picked, setPicked] = useState(null);
  const box = useRef(null);

  useEffect(() => {
    const term = q.trim();
    if (picked || (by === 'name' ? term.replace(/[^a-z0-9]/gi, '').length < 3 : term.replace(/[^a-z0-9]/gi, '').length < 6)) { setState({ status: 'idle', results: [] }); return; }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setState(s => ({ ...s, status: 'searching' }));
      try {
        const r = await fetch(`/api/sunbiz/search?${by === 'name' ? 'q' : 'doc'}=${encodeURIComponent(term)}`, { signal: ctl.signal });
        const j = await r.json();
        setState({ status: r.ok ? (j.results.length ? 'done' : 'none') : 'down', results: j.results || [] });
      } catch (e) { if (e.name !== 'AbortError') setState({ status: 'down', results: [] }); }
    }, 300);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [q, by, picked]);

  function choose(r) { setPicked(r); onPick?.(r, box.current?.closest('form')); }

  return (<div ref={box} className="stack" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 16, background: 'var(--sand)' }}>
    <div><p style={{ fontWeight: 700, margin: 0 }}>{t.h}</p><p className="muted" style={{ margin: 0 }}>{t.help}</p></div>
    {picked ? <p className="ok-msg" style={{ margin: 0 }}>✓ {t.picked}: <strong>{picked.name}</strong> · {picked.doc_number}{' '}
      <button type="button" className="btn sec small" onClick={() => setPicked(null)} style={{ marginLeft: 8 }}>{t.change}</button></p> : <>
      <div style={{ display: 'flex' }} role="tablist">
        <button type="button" role="tab" aria-selected={by === 'name'} style={{ ...tab(by === 'name'), borderRadius: '9px 0 0 9px' }} onClick={() => { setBy('name'); setQ(''); }}>{t.byName}</button>
        <button type="button" role="tab" aria-selected={by === 'doc'} style={{ ...tab(by === 'doc'), borderRadius: '0 9px 9px 0' }} onClick={() => { setBy('doc'); setQ(''); }}>{t.byDoc}</button>
      </div>
      <input aria-label={by === 'name' ? t.byName : t.byDoc} placeholder={by === 'name' ? t.phName : t.phDoc} value={q} onChange={e => setQ(e.target.value)} autoComplete="off" style={{ width: '100%' }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (state.results[0]) choose(state.results[0]); } }} />
      {state.status === 'searching' && <p className="muted" style={{ margin: 0 }}>{t.searching}</p>}
      {state.status === 'none' && <p className="muted" style={{ margin: 0 }}>{t.none}</p>}
      {state.status === 'down' && <p className="muted" style={{ margin: 0 }}>{t.down}</p>}
      {state.results.length > 0 && state.status !== 'none' && <div className="scroll"><table>
        <thead><tr><th>{t.company}</th><th>{t.city}</th><th>{t.doc}</th><th>{t.status}</th><th /></tr></thead>
        <tbody>{state.results.map(r => <tr key={r.doc_number} onClick={() => choose(r)} style={{ cursor: 'pointer' }}>
          <td><strong>{r.name}</strong></td><td>{r.principal?.city || ''}{r.principal?.state ? `, ${r.principal.state}` : ''}</td><td>{r.doc_number}</td>
          <td><span className={'pill ' + (r.status === 'A' ? 'ok' : 'warn')}>{t[r.status] || r.status}</span></td>
          <td><button type="button" className="btn small" onClick={e => { e.stopPropagation(); choose(r); }}>{t.pick}</button></td></tr>)}</tbody>
      </table></div>}
    </>}
  </div>);
}
