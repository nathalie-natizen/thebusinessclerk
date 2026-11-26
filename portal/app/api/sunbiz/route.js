import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
const BASE = 'https://search.sunbiz.org';
const FALLBACK = `${BASE}/Inquiry/CorporationSearch/ByDocumentNumber`;

// Opens the company's live Sunbiz detail page. Finds it once (search by name, match the document number), then remembers it.
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('entity');
  const sb = supabaseServer();
  const { data: e } = await sb.from('entities').select('id, legal_name, sunbiz_doc_number, sunbiz_url').eq('id', id).maybeSingle(); // RLS
  if (!e) return new NextResponse('Not found', { status: 404 });
  if (e.sunbiz_url) return NextResponse.redirect(e.sunbiz_url);
  const doc = String(e.sunbiz_doc_number || '').trim().toUpperCase();
  if (!doc) return NextResponse.redirect(FALLBACK);
  try {
    const name = e.legal_name.toUpperCase().replace(/[^A-Z0-9 &]/g, ' ').replace(/\s+/g, ' ').trim();
    const order = name.replace(/[^A-Z0-9]/g, '');
    const r = await fetch(`${BASE}/Inquiry/CorporationSearch/SearchResults/EntityName/${encodeURIComponent(name)}/Page1?searchNameOrder=${order}`, { headers: { 'User-Agent': 'Mozilla/5.0 (THE BUSINESS CLERK portal)' }, cache: 'no-store' });
    const html = await r.text();
    // Each result row: <a href="/Inquiry/CorporationSearch/SearchResultDetail?...">NAME</a> … <td>DOCUMENT NUMBER</td>
    for (const row of html.split(/<tr[\s>]/i)) {
      if (!row.includes(doc)) continue;
      const m = row.match(/href="(\/Inquiry\/CorporationSearch\/SearchResultDetail\?[^"]+)"/i);
      if (m) {
        const url = BASE + m[1].replace(/&amp;/g, '&');
        await supabaseAdmin().from('entities').update({ sunbiz_url: url }).eq('id', e.id);
        return NextResponse.redirect(url);
      }
    }
  } catch { /* fall through */ }
  return NextResponse.redirect(FALLBACK);
}
