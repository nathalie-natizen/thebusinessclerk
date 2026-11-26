import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setOrderStatus } from '@/lib/orders';
import { AUTO_APPROVE_DAYS } from '@/lib/guidelines';
import { notifyEntity, notifyStaff } from '@/lib/notify';
import { unopenedLegal } from '@/lib/escalations';
import { createDueBatches } from '@/lib/batches';

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
    const { data: ents } = await db.from('entities').select('id, legal_name, file_number, created_at').eq('registered_agent', true).eq('status', 'active').eq('bundle', false);
    const { data: done } = await db.from('orders').select('entity_id').eq('kind', 'annual_report').gte('created_at', `${year}-01-01`).neq('status', 'cancelled');
    const skip = new Set((done || []).map(o => o.entity_id));
    for (const e of ents || []) {
      if (skip.has(e.id) || new Date(e.created_at).getFullYear() === year) continue; // formed this year: first report is due next year
      await notifyEntity(e.id, { category: 'compliance', subject: `Florida annual report due by May 1: ${e.legal_name}`, text: `The Florida annual report for ${e.legal_name} is due by May 1, ${year}. After May 1 the State adds a $400 late fee.\n\nOrder it in one click and we file it for you: ${APP}/e/${e.file_number}/orders?order=annual_report`, sms: `THE BUSINESS CLERK: the Florida annual report for ${e.legal_name} is due by May 1. Order it here:` });
      reminded++;
    }
  }
  // Annual bundle: open the year's annual report order automatically (service fee included; state fee charged at cost when filed)
  let bundleReports = 0;
  if (et.getMonth() < 4 || (et.getMonth() === 4 && et.getDate() === 1)) {
    const db = supabaseAdmin(); const year = et.getFullYear();
    const { data: bents } = await db.from('entities').select('id, legal_name, file_number, created_at').eq('bundle', true).eq('status', 'active');
    const { data: bdone } = await db.from('orders').select('entity_id').eq('kind', 'annual_report').gte('created_at', `${year}-01-01`).neq('status', 'cancelled');
    const bskip = new Set((bdone || []).map(o => o.entity_id));
    for (const e of bents || []) {
      if (bskip.has(e.id) || new Date(e.created_at).getFullYear() === year) continue;
      const { data: o } = await db.from('orders').insert({ entity_id: e.id, kind: 'annual_report', service: `Annual Report Filing ${year} (included in your annual bundle)`, status: 'information_needed', amount_cents: 0, source: 'bundle' }).select().single();
      if (!o) continue;
      await db.from('order_events').insert({ order_id: o.id, status: 'information_needed', note: 'Included in your annual bundle. Please answer the short annual report questions so we can file. The Florida state fee is charged at cost when we file.', notified: true });
      await notifyEntity(e.id, { category: 'compliance', subject: `Your ${year} Florida annual report: please confirm your information`, text: `Your annual bundle includes the ${year} Florida annual report for ${e.legal_name}. Please answer a few short questions in your portal so we can file it before May 1: ${APP}/e/${e.file_number}/orders/${o.id}\n\nThe Florida state fee is charged at cost when we file.`, sms: `THE BUSINESS CLERK: please confirm your ${year} annual report info for ${e.legal_name}:` });
      bundleReports++;
    }
  }
  // Mail held 30 days with no instruction: one notice per company; staff may shred ordinary mail 15 days later (Mail queue)
  const db2 = supabaseAdmin();
  const { data: old } = await db2.from('mail_items').select('id, entity_id').eq('status', 'received').eq('category', 'general').is('hold_notice_at', null).lt('received_at', new Date(Date.now() - 30 * 864e5).toISOString());
  const byEnt = {}; for (const m of old || []) (byEnt[m.entity_id] ||= []).push(m.id);
  for (const [eid, ids] of Object.entries(byEnt)) {
    await notifyEntity(eid, { category: 'mail', subject: 'Mail waiting for your instructions', text: `You have ${ids.length} mail item${ids.length > 1 ? 's' : ''} we've held for 30 days with no instruction. Please choose scan, forward, shred or hold in your portal within 15 days. After that, ordinary mail may be shredded (never checks, legal papers or packages).\n\n${APP}/dashboard`, sms: `THE BUSINESS CLERK: ${ids.length} mail item(s) need your instructions within 15 days:` });
    await db2.from('mail_items').update({ hold_notice_at: new Date().toISOString() }).in('id', ids);
  }
  const batches = await createDueBatches();
  const legal = await unopenedLegal();
  if (legal.length) await notifyStaff({ subject: `Call clients: ${legal.length} legal item(s) unopened after 1 business day`, text: legal.map(m => `${m.entities?.file_number} ${m.entities?.legal_name}: ${m.category === 'service_of_process' ? 'lawsuit papers' : 'state notice'} received ${new Date(m.received_at).toLocaleDateString('en-US')} · ${m.entities?.contact_phone || 'no phone on file'}`).join('\n') + `\n\n${APP}/staff/pipeline` }).catch(() => {});
  return NextResponse.json({ bundleReports, legalEscalations: legal.length,  autoApproved: (data || []).length, reminded, holdNotices: Object.keys(byEnt).length, batches });
}
