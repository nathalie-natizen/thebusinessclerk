'use client';
import { useEffect, useState } from 'react';

// Staff: open the client's portal for this company in a pop-up (what the client sees), close to return
export default function ClientView({ file }) {
  const [page, setPage] = useState(null);
  useEffect(() => {
    if (!page) return;
    const k = e => e.key === 'Escape' && setPage(null);
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [page]);
  return (<>
    <button type="button" onClick={() => setPage('')} style={{ background: '#E8732A', color: '#fff', border: 0, borderRadius: 20, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>👁 Client view</button>
    {page !== null && <div role="dialog" aria-modal="true" aria-label="Client view" onClick={() => setPage(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(8,20,26,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 'min(1240px, 97vw)', height: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '4px solid #E8732A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFF1E6', borderBottom: '1px solid #F2C9A8', flexWrap: 'wrap' }}>
          <strong style={{ color: '#B4511A', marginRight: 8 }}>CLIENT VIEW · {file}</strong>
          <span className="muted" style={{ fontSize: 13 }}>Exactly what the client sees. Use the tabs inside the page.</span>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn small" onClick={() => setPage(null)}>Close and return to staff file</button>
        </div>
        <iframe src={`/e/${file}${page ? '/' + page : ''}`} title="Client view" style={{ border: 0, width: '100%', flex: 1 }} />
      </div>
    </div>}
  </>);
}
