'use client';
import { useEffect, useState } from 'react';

// Opens a photo or PDF in a pop-up on the same page. `src` must be a /api/file …&view=1 link.
export default function Preview({ src, pdf = false, title = 'Preview', className, style, children }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = e => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open]);
  const download = src.replace(/&view=1/, '');
  return (<>
    <a href={src} className={className} style={style} onClick={e => { e.preventDefault(); setOpen(true); }}>{children}</a>
    {open && <div role="dialog" aria-modal="true" aria-label={title} onClick={() => setOpen(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(8,20,26,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 14, width: pdf ? 'min(960px, 96vw)' : 'auto', maxWidth: '96vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
          <strong style={{ flex: 1 }}>{title}</strong>
          <a className="btn small sec" href={download}>Download</a>
          <button className="btn small" onClick={() => setOpen(false)} aria-label="Close">Close</button>
        </div>
        {pdf ? <iframe src={src} title={title} style={{ border: 0, width: '100%', height: '82vh' }} />
             : <img src={src} alt={title} style={{ maxWidth: '96vw', maxHeight: '82vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />}
      </div>
    </div>}
  </>);
}
