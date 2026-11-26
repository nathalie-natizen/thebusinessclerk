import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setOrderStatus } from '@/lib/orders';
import { AUTO_APPROVE_DAYS } from '@/lib/guidelines';
import { notifyEntity } from '@/lib/notify';

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com';
const REMIND = ['01-05', '03-01', '04-01', '04-20'];

export const dynamic = 'force-dynamic';

// Daily: Launch Pack orders delivered for review with no answer in AUTO_APPROVE_DAYS are marked complete.
export async function GET(req) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Forbidden', { status: 403 });
  const cutoff = new Date(Date.now() - AUTO_APPROVE_DAYS * 864e5).toISOString();
  const { data } = await supabaseAdmin().from('orders').select('id').eq('kind', 'launch').eq('status', 'submitted').lt('updated_at', cutoff);
  for (const o of data || []) await setOrderStatus({ orderId: o.id, status: 'final_review', note: `No response within ${AUTO_APPROVE_DAYS} days of delivery, so the work was marked approved. Final quality check, then handover.` });
  // Annual report reminders (included with registered agent): active companies with no annual report order this year
  const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const md = `${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
  let reminded = 0;
  if (REMIND.includes(md)) {
    const db = supabaseAdmin(); const year = et.getFullYear();
    const { data: ents } = await db.from('entities').select('id, legal_name, file_number, created_at').eq('registered_agent', true).eq('status', 'active');
    const { data: done } = await db.from('orders').select('entity_id').eq('kind', 'annual_report').gte('created_at', `${year}-01-01`).neq('status', 'cancelled');
    const skip = new Set((done || []).map(o => o.entity_id));
    for (const e of ents || []) {
      if (skip.has(e.id) || new Date(e.created_at).getFullYear() === year) continue; // formed this year: first report is due next year
      await notifyEntity(e.id, { subject: `Florida annual report due by May 1: ${e.legal_name}`, text: `The Florida annual report for ${e.legal_name} is due by May 1, ${year}. After May 1 the State adds a $400 late fee.\n\nOrder it in one click and we file it for you: ${APP}/e/${e.file_number}/orders?order=annual_report`, sms: `THE BUSINESS CLERK: the Florida annual report for ${e.legal_name} is due by May 1. Order it here:` });
      reminded++;
    }
  }
  return NextResponse.json({ autoApproved: (data || []).length, reminded });
}
