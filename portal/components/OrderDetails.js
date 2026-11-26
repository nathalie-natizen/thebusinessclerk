// Shows what the client entered on the website order form (staff only)
export default function OrderDetails({ d }) {
  if (!d || !d.service) return null;
  const row = (k, v) => v ? <tr key={k}><th style={{ width: 170, textAlign: 'left', verticalAlign: 'top' }}>{k}</th><td>{v}</td></tr> : null;
  return (<details style={{ margin: '8px 0' }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Order form details</summary>
    <table style={{ fontSize: 14 }}><tbody>
      {row('Company name', d.company)}{row('Backup name', d.alt_name)}{row('Sunbiz doc #', d.sunbiz_doc_number)}{row('Business purpose', d.purpose)}
      {row('Add-ons', (d.addons || []).join(', '))}{row('Principal address', d.principal_address)}
      {row('Owners / managers', (d.people || []).length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{d.people.map((p, i) => <li key={i}><strong>{p.name}</strong> – {p.title}{p.address ? <div className="muted">{p.address}</div> : null}</li>)}</ul> : null)}
      {row('Contact', [d.contact?.name, d.contact?.email, d.contact?.phone, d.contact?.language?.toUpperCase()].filter(Boolean).join(' · '))}
      {row('Notes', d.notes)}{row('Submitted', d.submitted_at && new Date(d.submitted_at).toLocaleString('en-US', { timeZone: 'America/New_York' }))}
    </tbody></table></details>);
}
