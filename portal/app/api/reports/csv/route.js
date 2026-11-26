import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { runReport, configFromForm, toCsv } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { sb, profile } = await getSession();
  if (!['staff', 'admin'].includes(profile?.role)) return new NextResponse('Not allowed', { status: 403 });
  const sp = new URL(req.url).searchParams;
  const r = await runReport(sb, configFromForm(sp), 20000);
  if (r.error) return new NextResponse(r.error, { status: 400 });
  return new NextResponse(toCsv(r), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="report-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
