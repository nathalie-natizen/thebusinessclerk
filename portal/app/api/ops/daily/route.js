import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setOrderStatus } from '@/lib/orders';
import { AUTO_APPROVE_DAYS } from '@/lib/guidelines';

export const dynamic = 'force-dynamic';

// Daily: Launch Pack orders delivered for review with no answer in AUTO_APPROVE_DAYS are marked complete.
export async function GET(req) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Forbidden', { status: 403 });
  const cutoff = new Date(Date.now() - AUTO_APPROVE_DAYS * 864e5).toISOString();
  const { data } = await supabaseAdmin().from('orders').select('id').eq('kind', 'launch').eq('status', 'submitted').lt('updated_at', cutoff);
  for (const o of data || []) await setOrderStatus({ orderId: o.id, status: 'completed', note: `No response within ${AUTO_APPROVE_DAYS} days of delivery, so the work was marked approved and complete.` });
  return NextResponse.json({ autoApproved: (data || []).length });
}
