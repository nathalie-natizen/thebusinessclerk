import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';

async function create(formData) {
  'use server';
  const { sb } = await requireStaff();
  const g = k => String(formData.get(k) || '').trim() || null;
  const { data: e, error } = await sb.from('entities').insert({
    legal_name: g('legal_name'), entity_type: g('entity_type') || 'LLC', sunbiz_doc_number: g('sunbiz_doc_number'),
    formation_date: g('formation_date'), status: g('status') || 'active', stripe_customer_id: g('stripe_customer_id'),
    registered_agent: formData.get('registered_agent') === 'on', mail_service: formData.get('mail_service') === 'on',
  }).select().single();
  if (error) redirect('/staff/new?error=' + encodeURIComponent(error.message));
  await sb.from('mail_preferences').insert({ entity_id: e.id });
  if (g('notes')) await sb.from('entity_notes').insert({ entity_id: e.id, notes: g('notes') });
  const emails = String(formData.get('emails') || '').split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(x => /^\S+@\S+\.\S+$/.test(x));
  for (const email of emails) {
    const { data: p } = await sb.from('profiles').select('id').ilike('email', email).maybeSingle();
    if (p) await sb.from('entity_members').upsert({ entity_id: e.id, user_id: p.id });
    else await sb.from('invitations').upsert({ email, entity_id: e.id });
  }
  redirect(`/staff/e/${e.file_number}`);
}

export default async function NewEntity({ searchParams }) {
  const { profile } = await requireStaff();
  return (<Shell profile={profile}>
    <h1>New entity</h1>
    <p className="sub">A file number (TBC-#####) is assigned automatically. Use it on the PMB/suite line, the paper folder label and everywhere else.</p>
    {searchParams?.error && <p className="err">{searchParams.error}</p>}
    <form className="stack" action={create}>
      <label>Legal name<input name="legal_name" required /></label>
      <div className="row"><label>Type<select name="entity_type"><option>LLC</option><option>Corporation</option><option>Nonprofit</option><option>Other</option></select></label>
        <label>Status<select name="status"><option value="active">Active</option><option value="pending">Pending (not filed yet)</option><option value="inactive">Inactive</option><option value="dissolved">Dissolved</option></select></label></div>
      <div className="row"><label>Florida document #<input name="sunbiz_doc_number" /></label><label>Formation date<input name="formation_date" type="date" /></label></div>
      <label>Client emails (they sign in with these)<textarea name="emails" placeholder="owner@example.com, partner@example.com" /></label>
      <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="registered_agent" style={{ minHeight: 'auto' }} /> Registered agent service</label>
      <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name="mail_service" style={{ minHeight: 'auto' }} /> Business address & mail service</label>
      <label>Stripe customer ID (optional)<input name="stripe_customer_id" placeholder="cus_..." /></label>
      <label>Internal notes (staff only)<textarea name="notes" /></label>
      <button className="btn">Create entity</button>
    </form>
  </Shell>);
}
