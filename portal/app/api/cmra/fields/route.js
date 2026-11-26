import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';
// Staff-only helper: lists the fillable fields on the current official USPS PS Form 1583
export async function GET() {
  await requireStaff();
  const r = await fetch('https://about.usps.com/forms/ps1583.pdf', { cache: 'no-store' });
  const bytes = await r.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const fields = pdf.getForm().getFields().map(f => {
    const w = f.acroField.getWidgets()[0]; const rect = w?.getRectangle();
    return { name: f.getName(), type: f.constructor.name, rect: rect && [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)], page: pdf.getPages().findIndex(p => p.ref === w?.P()) };
  });
  return NextResponse.json({ status: r.status, bytes: bytes.byteLength, pages: pdf.getPageCount(), size: pdf.getPage(0).getSize(), count: fields.length, fields });
}
