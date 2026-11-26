import { NextResponse } from 'next/server';
import { applyTrackerUpdate } from '@/lib/tracking';

// EasyPost → portal. Webhook URL: https://app.thebusinessclerk.com/api/tracking/webhook
// We never trust the payload: we re-read the tracker from EasyPost with our own API key, so a forged call can't change anything.
export async function POST(req) {
  const ev = await req.json().catch(() => null);
  const id = ev?.result?.object === 'Tracker' ? ev.result.id : null;
  if (!id || !/^trk_[A-Za-z0-9]+$/.test(id) || !process.env.EASYPOST_API_KEY) return NextResponse.json({ received: true });
  const r = await fetch(`https://api.easypost.com/v2/trackers/${id}`, {
    headers: { Authorization: 'Basic ' + Buffer.from(process.env.EASYPOST_API_KEY + ':').toString('base64') },
  });
  if (r.ok) await applyTrackerUpdate(await r.json());
  return NextResponse.json({ received: true });
}
