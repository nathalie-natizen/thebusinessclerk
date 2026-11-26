import 'server-only';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase/admin';

export const SLOTS = { id1: 'id1_path', id1_back: 'id1_back_path', id2: 'id2_path', selfie: 'selfie_path' };
const TTL_MIN = 30;

export async function newCaptureToken(entityId, userId) {
  const token = crypto.randomBytes(24).toString('base64url');
  await supabaseAdmin().from('capture_tokens').insert({ token, entity_id: entityId, created_by: userId, expires_at: new Date(Date.now() + TTL_MIN * 60000).toISOString() });
  return token;
}
export async function checkToken(token) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(String(token || ''))) return null;
  const { data } = await supabaseAdmin().from('capture_tokens').select('token, entity_id, expires_at, entities(file_number, legal_name)').eq('token', token).maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data;
}
