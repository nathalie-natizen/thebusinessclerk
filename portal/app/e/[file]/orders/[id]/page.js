import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Shell, { EntityTabs } from '@/components/Shell';
import UploadForm from '@/components/UploadForm';
import QuestionFields from '@/components/QuestionFields';
import { requireUser, getEntity } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setOrderStatus, logRevision } from '@/lib/orders';
import { notifyStaff } from '@/lib/notify';
const staffLink = o => `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thebusinessclerk.com'}/staff/pipeline`;
const ping = (o, what) => notifyStaff({ subject: `${what}: ${o.entities?.legal_name} (${o.entities?.file_number})`, text: `${o.service}: ${what.toLowerCase()}.\n\n${staffLink(o)}` }).catch(() => {});
import ServiceTerms from '@/components/ServiceTerms';
import { revisions, AUTO_APPROVE_DAYS } from '@/lib/guidelines';
import { KINDS } from '@/lib/labels';
import { fmtDate, statusLabel } from '@/lib/labels';
import { QUESTIONNAIRES, collect } from '@/lib/questionnaires';

async function loadOrder(id) {
  const { data } = await supabaseServer().from('orders').select('*, entities(id, file_number, legal_name)').eq('id', id).maybeSingle(); // RLS: members/staff
  return data;
}

async function saveQuestionnaire(fd) {
  'use server';
  const { user } = await requireUser();
  const o = await loadOrder(String(fd.get('order_id'))); if (!o) return { error: 'Not allowed.' };
  if (['submitted', 'final_review', 'completed', 'delivered', 'cancelled'].includes(o.status)) return { error: 'This order is already being filed. Reply below if something changed.' };
  const def = QUESTIONNAIRES[o.kind]; if (!def) return { error: 'No questionnaire for this order.' };
  const { q, missing } = collect(def, fd);
  for (const f of def.fields.filter(f => f.type === 'file')) if (!q[f.name] && o.details?.q?.[f.name]) q[f.name] = o.details.q[f.name];
  if (missing.length) return { error: `Please complete: ${missing.join('; ')}` };
  await supabaseAdmin().from('orders').update({ details: { ...(o.details || {}), q, q_submitted_at: new Date().toISOString() } }).eq('id', o.id);
  if (o.status === 'information_needed') await setOrderStatus({ orderId: o.id, status: 'received', note: 'Questionnaire completed by client.', notify: false, userId: user.id });
  await ping(o, 'Questionnaire completed');
  revalidatePath('/e/[file]/orders/[id]', 'page');
  return { message: 'Thank you! Your answers are saved and our team has been notified.' };
}

async function reply(fd) {
  'use server';
  const { user } = await requireUser();
  const o = await loadOrder(String(fd.get('order_id'))); if (!o) return { error: 'Not allowed.' };
  const text = String(fd.get('message') || '').trim().slice(0, 3000); const path = String(fd.get('file_path') || '');
  if (!text && !path) return { error: 'Write your answer or attach a file.' };
  const db = supabaseAdmin();
  const replies = [...(o.details?.replies || []), { at: new Date().toISOString(), text, file: path || null }];
  await db.from('orders').update({ details: { ...(o.details || {}), replies } }).eq('id', o.id);
  if (o.status === 'information_needed') await setOrderStatus({ orderId: o.id, status: 'received', note: `Client replied: ${text || '(file attached)'}`, notify: false, userId: user.id });
  else await db.from('order_events').insert({ order_id: o.id, status: o.status, note: `Client message: ${text || '(file attached)'}`, created_by: user.id });
  await ping(o, 'Client replied');
  revalidatePath('/e/[file]/orders/[id]', 'page');
  return { message: 'Sent. Our team will pick it up right away.' };
}


async function approve(fd) {
  'use server';
  const { user } = await requireUser();
  const o = await loadOrder(String(fd.get('order_id'))); if (!o || o.kind !== 'launch' || o.status !== 'submitted') return;
  await setOrderStatus({ orderId: o.id, status: 'final_review', note: 'Approved by client. Final quality check, then handover.', notify: false, userId: user.id });
  await ping(o, 'Client approved the Launch Pack');
  revalidatePath('/e/[file]/orders/[id]', 'page');
}

async function requestRevision(fd) {
  'use server';
  const { user } = await requireUser();
  const o = await loadOrder(String(fd.get('order_id'))); if (!o || o.kind !== 'launch') return { error: 'Not allowed.' };
  if (o.status !== 'submitted') return { error: 'You can request a revision once we deliver your work for review.' };
  const text = String(fd.get('message') || '').trim().slice(0, 5000); const path = String(fd.get('file_path') || '') || null;
  if (!text && !path) return { error: 'Describe all the changes you want in this revision.' };
  const r = await logRevision({ order: o, text, file: path, by: 'client', userId: user.id });
  if (r.error) return r;
  await ping(o, `Revision ${r.n} of ${r.allowed} requested`);
  revalidatePath('/e/[file]/orders/[id]', 'page');
  return { message: `Revision ${r.n} of ${r.allowed} sent. We'll deliver the update within 3 business days.` };
}

export default async function OrderPage({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: o } = await sb.from('orders').select('*, order_events(*)').eq('id', params.id).eq('entity_id', e.id).maybeSingle();
  if (!o) notFound();
  const def = QUESTIONNAIRES[o.kind]; const q = o.details?.q;
  const events = (o.order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const ask = o.status === 'information_needed' ? events.find(ev => ev.status === 'information_needed' && ev.note) : null;
  const locked = ['submitted', 'final_review', 'completed', 'delivered', 'cancelled'].includes(o.status);
  const rev = o.kind === 'launch' ? revisions(o.details) : null; const left = rev ? rev.allowed - rev.used : 0;
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="orders" />
    <p><Link href={`/e/${e.file_number}/orders`}>← All orders</Link></p>
    <h2 style={{ marginTop: 0 }}>{o.service}</h2>
    <p><span className={`pill ${o.status === 'information_needed' ? 'urgent' : ['completed', 'delivered'].includes(o.status) ? 'ok' : ''}`}>{statusLabel(o.status, o.kind)}</span> <span className="muted">Ordered {fmtDate(o.created_at)}</span></p>
    {searchParams?.new && <div className="note">Payment received. Please complete the questionnaire below so we can start.</div>}
    {ask && <div className="note"><strong>Action needed:</strong> {ask.note}</div>}


    {rev && <section className="card" style={{ marginBottom: 18 }}>
      <h3 style={{ marginTop: 0 }}>Revisions: {left} of {rev.allowed} left</h3>
      {rev.log.length > 0 && <ul className="timeline">{rev.log.map(x => <li key={x.n}><strong>Revision {x.n} of {rev.allowed}</strong> <span className="muted">{fmtDate(x.at)}</span>{x.text && <div className="muted">{x.text}</div>}</li>)}</ul>}
      {o.status === 'submitted' ? <>
        <p>Your work is ready for review. Approve it, or request a revision with all your changes in one message.{' '}<span className="muted">If we don't hear from you within {AUTO_APPROVE_DAYS} days, the order is marked complete.</span></p>
        <form action={approve}><input type="hidden" name="order_id" value={o.id} /><button className="btn">Approve: everything looks good</button></form>
        {left > 0 ? <div style={{ marginTop: 14 }}><UploadForm bucket="uploads" entityId={e.id} action={requestRevision} submitLabel={`Request revision ${rev.used + 1} of ${rev.allowed}`}>
          <input type="hidden" name="order_id" value={o.id} />
          <label>All the changes you want in this revision<textarea name="message" rows={5} placeholder="List every change at once: one revision covers as many changes as you like." /></label>
          <label>Attach a file (optional)<input name="file" type="file" accept="image/*,application/pdf" /></label>
        </UploadForm></div> : <p className="note">You've used both revisions. Further changes are quoted separately: send us a message below.</p>}
      </> : <p className="muted">{o.status === 'final_review' ? 'Approved. We are doing a final quality check and preparing your handover sheet.' : o.status === 'completed' ? 'This order is complete.' : 'You can approve or request a revision once we deliver your work for review.'}</p>}
    </section>}
    {def && <section className="card" style={{ marginBottom: 18 }}>
      <h3 style={{ marginTop: 0 }}>{def.title}{q ? ' ✓' : ''}</h3>
      <p className="muted">{def.intro}</p>
      <UploadForm bucket="uploads" entityId={e.id} action={saveQuestionnaire} submitLabel={q ? 'Update answers' : 'Submit answers'}>
        <input type="hidden" name="order_id" value={o.id} />
        <QuestionFields def={def} values={q} disabled={locked} />
      </UploadForm>
    </section>}

    {!locked && <section className="card" style={{ marginBottom: 18 }}>
      <h3 style={{ marginTop: 0 }}>{ask ? 'Your answer' : 'Message our team about this order'}</h3>
      <UploadForm bucket="uploads" entityId={e.id} action={reply} submitLabel="Send">
        <input type="hidden" name="order_id" value={o.id} />
        <label>{ask ? 'Your decision or answer' : 'Message'}<textarea name="message" rows={3} placeholder={ask ? 'e.g. Please use the second name, or here are 3 new names: …' : ''} /></label>
        <label>Attach a file (optional)<input name="file" type="file" accept="image/*,application/pdf" /></label>
      </UploadForm>
    </section>}


    <details style={{ margin: '18px 0' }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Terms for this service</summary><div style={{ marginTop: 10 }}><ServiceTerms kinds={[o.kind]} names={{ [o.kind]: KINDS[o.kind]?.name || o.service }} /></div></details>
    <h3>Timeline</h3>
    <ul className="timeline">{events.map(ev => <li key={ev.id}><strong>{statusLabel(ev.status, o.kind)}</strong> <span className="muted">{fmtDate(ev.created_at)}</span>{ev.note && <div className="muted">{ev.note}</div>}</li>)}</ul>
  </Shell>);
}
