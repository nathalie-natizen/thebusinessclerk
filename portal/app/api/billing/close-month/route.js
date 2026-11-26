import { NextResponse } from 'next/server';
import { closeMonth, previousMonth } from '@/lib/billing';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Runs automatically on the 1st of each month (Vercel Cron) and closes the previous month.
// Safe to call twice: statements already charged are never charged again.
export async function GET(req) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Forbidden', { status: 403 });
  const { year, month } = previousMonth();
  const result = await closeMonth(year, month);
  return NextResponse.json({ period: `${year}-${month}`, result });
}
