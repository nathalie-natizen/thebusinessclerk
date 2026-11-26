import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// Temporary helper: text positions on the official USPS PS Form 1583 (public form)
export async function GET() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
  const r = await fetch('https://about.usps.com/forms/ps1583.pdf', { cache: 'no-store' });
  const data = new Uint8Array(await r.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, disableWorker: true, isEvalSupported: false }).promise;
  const out = [];
  for (let p = 1; p <= Math.min(doc.numPages, 1); p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    for (const it of tc.items) if (it.str.trim()) out.push([p, Math.round(it.transform[4]), Math.round(it.transform[5]), it.str.slice(0, 60)]);
  }
  return NextResponse.json({ pages: doc.numPages, items: out });
}
