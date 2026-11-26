'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Type a file number or company name; pick from the list to open that company
export default function EntityPicker({ entities, base = '/staff/record?file=', autoFocus = true }) {
  const router = useRouter(); const [v, setV] = useState('');
  const go = val => { const m = entities.find(e => `${e.file_number} · ${e.legal_name}` === val) || entities.find(e => e.file_number.toLowerCase() === val.trim().toLowerCase());
    if (m) router.push(base + m.file_number); };
  const term = v.trim().toLowerCase();
  const hits = term ? entities.filter(e => e.file_number.toLowerCase().includes(term) || e.legal_name.toLowerCase().includes(term)).slice(0, 8) : [];
  return (<div style={{ position: 'relative' }}>
    <input autoFocus={autoFocus} value={v} onChange={e => { setV(e.target.value); go(e.target.value); }} onKeyDown={e => { if (e.key === 'Enter' && hits[0]) { e.preventDefault(); router.push(base + hits[0].file_number); } }}
      placeholder="Type the file number (TBC-…) or company name" style={{ width: '100%', fontSize: 18, padding: '14px 16px' }} aria-label="Find company" />
    {hits.length > 0 && <div className="card" style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, top: '100%', marginTop: 4, padding: 6 }}>
      {hits.map(e => <button key={e.file_number} type="button" onClick={() => router.push(base + e.file_number)} style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', background: 'none', border: 0, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit' }}
        onMouseOver={x => x.currentTarget.style.background = '#F4EFE6'} onMouseOut={x => x.currentTarget.style.background = 'none'}>
        <span className="file">{e.file_number}</span><strong>{e.legal_name}</strong><span className="muted" style={{ marginLeft: 'auto' }}>{[e.registered_agent && 'RA', e.mail_service && 'Mail'].filter(Boolean).join(' + ') || 'No mail service'}</span></button>)}
    </div>}
  </div>);
}
