import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { liveSearch, liveByDoc } from '@/lib/sunbiz-live';

export const dynamic = 'force-dynamic';
const COLS = 'doc_number, name, status, filing_type, file_date, fei, principal, mailing, ra, officers, reports';

// Finds Florida companies (public record). Used by the order form and staff "New entity".
// ?q=company name  or  ?doc=L24000093039
// 1) Live lookup on Sunbiz's public search pages. 2) If Sunbiz is unreachable or blocks us, our copy of the state data files (if loaded).
export async function GET(req) {
  const u = new URL(req.url);
  const q = String(u.searchParams.get('q') || '').trim().slice(0, 120);
  const doc = String(u.searchParams.get('doc') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  if (doc ? doc.length < 6 : q.replace(/[^a-z0-9]/gi, '').length < 2) return NextResponse.json({ results: [] });

  try {
    const results = doc ? [await liveByDoc(doc)].filter(r => r?.doc_number) : await liveSearch(q, 10);
    return NextResponse.json({ results, source: 'live' }, { headers: { 'Cache-Control': 'public, max-age=600' } });
  } catch (e) {
    console.error('Sunbiz live lookup failed:', e.message);
  }

  const db = supabaseAdmin();
  const res = doc ? await db.from('sunbiz_entities').select(COLS).eq('doc_number', doc).limit(1) : await db.rpc('sunbiz_search', { q, lim: 10 }).select(COLS);
  if (res.error) return NextResponse.json({ error: 'unavailable', results: [] }, { status: 503 });
  return NextResponse.json({ results: res.data || [], source: 'files' }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
