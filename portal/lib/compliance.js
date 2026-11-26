import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { supabaseServer } from './supabase/server';

// Confirms the signed-in user may act for this company (RLS read with their own session)
export async function canActFor(entityId) {
  const sb = supabaseServer();
  const { data } = await sb.from('entities').select('id').eq('id', entityId).maybeSingle();
  return !!data;
}
export async function upsertCmra(entityId, patch) {
  return supabaseAdmin().from('cmra_applications').upsert({ entity_id: entityId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'entity_id' });
}

// When everything required is in, send the file to staff automatically (no submit button)
export async function maybeSubmit(entityId) {
  const db = supabaseAdmin();
  const { data: a } = await db.from('cmra_applications').select('*').eq('entity_id', entityId).maybeSingle();
  if (!a || ['submitted', 'verified', 'filed'].includes(a.status)) return false;
  const complete = a.last_name && a.first_name && a.home_street && a.id1_path && a.id1_type && a.id1_number && a.id2_path && a.id2_type && a.witness_method
    && (a.witness_method === 'in_person' || a.form_path);
  if (!complete) return false;
  await db.from('cmra_applications').update({ status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('entity_id', entityId);
  return true;
}
