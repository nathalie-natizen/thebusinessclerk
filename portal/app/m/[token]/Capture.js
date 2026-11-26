'use client';
import { useState } from 'react';

// Shrinks the photo on the phone (max 1800px, JPEG) so uploads are fast and small
async function compress(file) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
}

export default function Capture({ token, slots }) {
  const [st, setSt] = useState({});
  async function take(slot, file) {
    if (!file) return;
    setSt(s => ({ ...s, [slot]: 'Uploading…' }));
    try {
      const fd = new FormData(); fd.set('token', token); fd.set('slot', slot); fd.set('image', await compress(file), `${slot}.jpg`);
      const r = await fetch('/api/capture', { method: 'POST', body: fd }); const j = await r.json();
      setSt(s => ({ ...s, [slot]: r.ok ? '✓ Saved' : j.error || 'Failed' }));
    } catch { setSt(s => ({ ...s, [slot]: 'Failed. Try again.' })); }
  }
  return (<div className="stack">
    {slots.map(([slot, title, help, cam]) => <div className="card" key={slot}>
      <h3 style={{ marginTop: 0 }}>{title} {st[slot]?.startsWith('✓') && <span className="pill ok">Saved</span>}</h3>
      <p className="muted">{help}</p>
      <label className="btn" style={{ display: 'flex' }}>{st[slot]?.startsWith('✓') ? 'Retake photo' : 'Take photo'}
        <input type="file" accept="image/*" capture={cam} style={{ display: 'none' }} onChange={e => take(slot, e.target.files?.[0])} /></label>
      {st[slot] && !st[slot].startsWith('✓') && <p className="muted">{st[slot]}</p>}
    </div>)}
    <p className="muted" style={{ textAlign: 'center' }}>When you're done, go back to your computer and refresh the Compliance page.</p>
  </div>);
}
