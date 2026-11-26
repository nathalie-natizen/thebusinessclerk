import { NextResponse } from 'next/server';
import { applyTrackerUpdate } from '@/lib/tracking';

// EasyPost → portal. Webhook URL: https://app.thebusinessclerk.com/api/tracking/webhook?token=EASYPOST_WEBHOOK_TOKEN
export async function POST(req) {
  const token = new URL(req.url).searchParams.get('token');
  if (!process.env.EASYPOST_WEBHOOK_TOKEN || token !== process.env.EASYPOST_WEBHOOK_TOKEN) return new NextResponse('Forbidden', { status: 403 });
  const ev = await req.json().catch(() => null);
  if (ev?.description?.startsWith('tracker.') && ev.result?.object === 'Tracker') await applyTrackerUpdate(ev.result);
  return NextResponse.json({ received: true });
}
