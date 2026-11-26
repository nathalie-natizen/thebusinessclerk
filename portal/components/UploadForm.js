'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

// Uploads the PDF straight to private storage (no size limit from the server), then records it.
export default function UploadForm({ bucket, entityId, action, children, submitLabel, requireFile = false }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState('');
  async function onSubmit(e) {
    e.preventDefault(); setErr(''); setDone('');
    const form = e.currentTarget; const fd = new FormData(form);
    const files = [...fd.entries()].filter(([k, v]) => k.endsWith('file') && v && typeof v === 'object');
    const main = fd.get('file');
    if (requireFile && (!main || !main.size)) { setErr('Choose a PDF or image to upload.'); return; }
    if (files.some(([, f]) => f.size > 50 * 1024 * 1024)) { setErr('File is larger than 50 MB.'); return; }
    setBusy(true);
    try {
      for (const [name, file] of files) {
        fd.delete(name);
        if (!file.size) continue;
        const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${entityId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabaseBrowser().storage.from(bucket).upload(path, file, { contentType: file.type || 'application/pdf' });
        if (error) throw error;
        fd.set(name.replace(/file$/, 'path'), path);
      }
      const r = await action(fd);
      if (r?.error) throw new Error(r.error);
      form.reset(); setDone(r?.message || 'Saved.');
    } catch (x) { setErr(x.message || 'Upload failed.'); }
    setBusy(false);
  }
  return (<form className="stack wide" onSubmit={onSubmit} noValidate>
    {children}
    {err && <p className="err">{err}</p>}{done && <p className="ok-msg">{done}</p>}
    <button className="btn" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
  </form>);
}
