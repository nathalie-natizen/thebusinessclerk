'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireStaff } from './auth';
import { supabaseAdmin } from './supabase/admin';
import { setOrderStatus, archiveCheck } from './orders';
import { chargeStateFee } from './charge';
import { STAFF_STATUSES, KINDS } from './labels';

const back = (fd, extra = '') => { const b = String(fd.get('back') || '/staff/pipeline'); const safe = b.startsWith('/staff') ? b : '/staff/pipeline'; return safe + (extra ? (safe.includes('?') ? '&' : '?') + extra : ''); };
const err = (fd, id, msg) => redirect(back(fd, `open=${id}&err=${encodeURIComponent(msg)}`));

// Move an order to another stage (Pipeline and the company Orders tab use the same rules)
export async function moveOrder(fd) {
  const { user } = await requireStaff();
  const id = String(fd.get('order_id')); const status = String(fd.get('status'));
  if (!STAFF_STATUSES.some(([k]) => k === status)) err(fd, id, 'Choose a stage.');
  const note = String(fd.get('note') || '').trim().slice(0, 1000);
  if (status === 'information_needed' && !note) err(fd, id, 'Write the note to the client: what we need from them. It is required for Waiting on client.');
  if (status === 'completed') { const miss = await archiveCheck(id); if (miss.length) err(fd, id, `Can't archive yet. Missing: ${miss.join('; ')}.`); }
  await setOrderStatus({ orderId: id, status, note: note || null, notify: fd.get('notify') === 'on', userId: user.id });
  revalidatePath('/staff/pipeline'); revalidatePath('/staff/e/[file]', 'page');
  redirect(back(fd, `moved=${id}`));
}

// Internal record (staff only, never shown to the client)
export async function saveInternal(fd) {
  const { user } = await requireStaff();
  const db = supabaseAdmin(); const id = String(fd.get('order_id'));
  const { data: o } = await db.from('orders').select('details').eq('id', id).single(); if (!o) return;
  const g = (k, n = 120) => String(fd.get(k) || '').trim().slice(0, n) || undefined;
  const internal = { ...(o.details?.internal || {}), tracking: g('tracking'), doc_number: g('doc_number', 40), filed_name: g('filed_name', 200), filed_date: g('filed_date', 10), confirmation: g('confirmation'), ein: g('ein', 20), note: g('internal_note', 1000), by: user.id, at: new Date().toISOString() };
  await db.from('orders').update({ details: { ...(o.details || {}), internal } }).eq('id', id);
  revalidatePath('/staff/pipeline'); revalidatePath('/staff/e/[file]', 'page');
  redirect(back(fd, `open=${id}&saved=1`));
}

// Charge the Florida state fee at cost, when we file
export async function stateFee(fd) {
  const { user } = await requireStaff();
  const db = supabaseAdmin(); const id = String(fd.get('order_id'));
  const { data: o } = await db.from('orders').select('*, entities(*)').eq('id', id).single();
  if (!o || !(o.kind === 'annual_report' || KINDS[o.kind]?.filing)) return;
  if (fd.get('confirm') !== 'on') err(fd, id, 'Confirm the amount matches Sunbiz before charging.');
  const cents = Math.round(parseFloat(String(fd.get('amount') || '').replace(/[^0-9.]/g, '')) * 100);
  if (!cents || cents < 0) err(fd, id, 'Enter the state fee amount.');
  const r = await chargeStateFee(o.entities, o, cents);
  await db.from('order_events').insert({ order_id: o.id, status: o.status, note: r.ok ? (r.already ? 'State fee was already charged.' : `Florida state fee charged: $${(r.cents / 100).toFixed(2)}.`) : `State fee not charged: ${r.reason}`, created_by: user.id, notified: false });
  revalidatePath('/staff/pipeline'); revalidatePath('/staff/e/[file]', 'page');
  if (!r.ok) err(fd, id, `State fee not charged: ${r.reason}`);
  redirect(back(fd, `open=${id}`));
}
