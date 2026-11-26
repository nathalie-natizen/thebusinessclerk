import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Shell, { EntityTabs } from '@/components/Shell';
import UploadForm from '@/components/UploadForm';
import QuestionFields from '@/components/QuestionFields';
import { requireUser, getEntity } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setOrderStatus } from '@/lib/orders';
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
  if (['submitted', 'completed', 'delivered', 'cancelled'].includes(o.status)) return { error: 'This order is already being filed. Reply below if something changed.' };
  const def = QUESTIONNAIRES[o.kind]; if (!def) return { error: 'No questionnaire for this order.' };
  const { q, missing } = collect(def, fd);
  for (const f of def.fields.filter(f => f.type === 'file')) if (!q[f.name] && o.details?.q?.[f.name]) q[f.name] = o.details.q[f.name];
  if (missing.length) return { error: `Please complete: ${missing.join('; ')}` };
  await supabaseAdmin().from('orders').update({ details: { ...(o.details || {}), q, q_submitted_at: new Date().toISOString() } }).eq('id', o.id);
  if (o.status === 'information_needed') await setOrderStatus({ orderId: o.id, status: 'received', note: 'Questionnaire completed by client.', notify: false, userId: user.id });
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
  revalidatePath('/e/[file]/orders/[id]', 'page');
  return { message: 'Sent. Our team will pick it up right away.' };
}

export default async function OrderPage({ params, searchParams }) {
  const { sb, profile } = await requireUser();
  const e = await getEntity(sb, params.file); if (!e) notFound();
  const { data: o } = await sb.from('orders').select('*, order_events(*)').eq('id', params.id).eq('entity_id', e.id).maybeSingle();
  if (!o) notFound();
  const def = QUESTIONNAIRES[o.kind]; const q = o.details?.q;
  const events = (o.order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const ask = o.status === 'information_needed' ? events.find(ev => ev.status === 'information_needed' && ev.note) : null;
  const locked = ['submitted', 'completed', 'delivered', 'cancelled'].includes(o.status);
  return (<Shell profile={profile}>
    <span className="file">{e.file_number}</span><h1 style={{ marginTop: 8 }}>{e.legal_name}</h1>
    <EntityTabs file={e.file_number} active="orders" />
    <p><Link href={`/e/${e.file_number}/orders`}>← All orders</Link></p>
    <h2 style={{ marginTop: 0 }}>{o.service}</h2>
    <p><span className={`pill ${o.status === 'information_needed' ? 'urgent' : ['completed', 'delivered'].includes(o.status) ? 'ok' : ''}`}>{statusLabel(o.status, o.kind)}</span> <span className="muted">Ordered {fmtDate(o.created_at)}</span></p>
    {searchParams?.new && <div className="note">Payment received. Please complete the questionnaire below so we can start.</div>}
    {ask && <div className="note"><strong>Action needed:</strong> {ask.note}</div>}

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

    <h3>Timeline</h3>
    <ul className="timeline">{events.map(ev => <li key={ev.id}><strong>{statusLabel(ev.status, o.kind)}</strong> <span className="muted">{fmtDate(ev.created_at)}</span>{ev.note && <div className="muted">{ev.note}</div>}</li>)}</ul>
  </Shell>);
}
