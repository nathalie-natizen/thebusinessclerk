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
