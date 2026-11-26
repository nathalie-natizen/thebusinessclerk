import { clientTerms, headings } from '@/lib/guidelines';

// Terms for the chosen services only (client side). Works in server and client components.
export default function ServiceTerms({ kinds, names, lang = 'en', open = true }) {
  const h = headings(lang); const list = [...new Set(kinds)].filter(k => clientTerms(k, lang));
  if (!list.length) return null;
  const sec = (label, items) => items?.length ? <><p style={{ fontWeight: 700, margin: '10px 0 4px' }}>{label}</p><ul style={{ margin: 0, paddingLeft: 20 }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></> : null;
  return (<div className="stack" style={{ gap: 8 }}>{list.map(k => { const t = clientTerms(k, lang);
    return (<details key={k} open={open} style={{ border: '1px solid var(--line, #ddd)', borderRadius: 10, padding: '8px 14px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{names?.[k] || k}</summary>
      {sec(h.inc, t.inc)}{sec(h.exc, t.exc)}{sec(h.you, t.you)}{sec(h.time, t.time)}{sec(h.rev, t.rev)}{sec(h.refund, t.refund)}
    </details>); })}</div>);
}
