import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
const COLS = 'doc_number, name, status, filing_type, file_date, fei, principal, mailing, ra, officers, reports';

// Finds Florida companies in our copy of the Sunbiz data files (public record). Used by the order form and staff "New entity".
// ?q=company name  or  ?doc=L24000093039
export async function GET(req) {
  const u = new URL(req.url);
  const q = String(u.searchParams.get('q') || '').trim().slice(0, 120);
  const doc = String(u.searchParams.get('doc') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const db = supabaseAdmin();
  let res;
  if (doc) res = doc.length < 6 ? { data: [] } : await db.from('sunbiz_entities').select(COLS).eq('doc_number', doc).limit(1);
  else if (q.replace(/[^a-z0-9]/gi, '').length >= 2) res = await db.rpc('sunbiz_search', { q, lim: 10 }).select(COLS);
  else res = { data: [] };
  if (res.error) return NextResponse.json({ error: 'unavailable', results: [] }, { status: 503 });
  return NextResponse.json({ results: res.data || [] }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
