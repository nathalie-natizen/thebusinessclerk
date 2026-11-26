import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export async function getSession() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, profile: null };
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return { sb, user, profile };
}

export async function requireUser() {
  const s = await getSession();
  if (!s.user) redirect('/login');
  return s;
}

export async function requireStaff() {
  const s = await requireUser();
  if (!['staff', 'admin'].includes(s.profile?.role)) redirect('/dashboard');
  return s;
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.profile?.role !== 'admin') redirect('/staff/pipeline');
  return s;
}

// Loads an entity by file number if the signed-in user may see it (RLS enforces access)
export async function getEntity(sb, file) {
  const { data } = await sb.from('entities').select('*').eq('file_number', String(file).toUpperCase()).single();
  return data;
}
