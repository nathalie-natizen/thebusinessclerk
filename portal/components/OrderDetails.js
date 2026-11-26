import { QUESTIONNAIRES } from '@/lib/questionnaires';

// Staff view of what the client entered: website order form, questionnaire answers and replies
export default function OrderDetails({ d, kind, orderId }) {
  if (!d) return null;
  const row = (k, v) => v ? <tr key={k}><th style={{ width: 170, textAlign: 'left', verticalAlign: 'top' }}>{k}</th><td style={{ whiteSpace: 'pre-wrap' }}>{v}</td></tr> : null;
  const def = QUESTIONNAIRES[kind]; const q = d.q;
  const names = d.names || (d.company ? [d.company, d.alt_name].filter(Boolean) : []);
  return (<details style={{ margin: '8px 0' }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Order details{q ? ' + questionnaire ✓' : ''}{d.replies?.length ? ` + ${d.replies.length} repl${d.replies.length > 1 ? 'ies' : 'y'}` : ''}</summary>
    <table style={{ fontSize: 14 }}><tbody>
      {d.service && <>
        {row('Names (in order)', names.length ? names.map((n, i) => `${i + 1}. ${n}${d.ending ? ' ' + d.ending : ''}`).join('\n') : null)}
        {row('If first name taken', d.use_backup === false ? 'Ask me first' : names.length > 1 ? 'File with the next choice' : null)}
        {row('Sunbiz doc #', d.sunbiz_doc_number)}{row('Business purpose', d.purpose)}{row('Management', d.management)}
        {row('Shares / par value', d.shares ? `${d.shares} shares, par ${d.par || 'none'}` : null)}{row('Incorporator', d.incorporator)}{row('S-corp election', d.s_corp)}
        {row('Effective date', d.effective_date)}{row('Authorized signer', d.signer)}
        {row('Add-ons', (d.addons || []).join(', '))}{row('Principal address', d.principal_address)}{row('Mailing address', d.mailing_address)}
        {row('People', (d.people || []).length ? d.people.map(p => `${p.name} (${p.title})${p.address ? ' · ' + p.address : ''}`).join('\n') : null)}
        {row('Contact', [d.contact?.name, d.contact?.email, d.contact?.phone, d.contact?.language?.toUpperCase()].filter(Boolean).join(' · '))}
        {row('Notes', d.notes)}{row('Submitted', d.submitted_at && new Date(d.submitted_at).toLocaleString('en-US', { timeZone: 'America/New_York' }))}
      </>}
      {def && q && def.fields.filter(f => f.name).map(f => {
        const v = q[f.name]; if (!v || (Array.isArray(v) && !v.length)) return null;
        if (f.type === 'rows') return row(f.label, v.map(r => Object.values(r).filter(Boolean).join(' · ')).join('\n'));
        if (f.type === 'file') return row(f.label, <a href={`/api/file?type=upload&id=${orderId}&key=${f.name}&view=1`} target="_blank" rel="noopener noreferrer">Open file</a>);
        return row(f.label, Array.isArray(v) ? v.join(', ') : v);
      })}
      {(d.replies || []).map((r, i) => row(`Client reply ${new Date(r.at).toLocaleDateString('en-US')}`, <>{r.text}{r.file && <> · <a href={`/api/file?type=upload&id=${orderId}&key=reply${i}&view=1`} target="_blank" rel="noopener noreferrer">attachment</a></>}</>))}
    </tbody></table></details>);
}
