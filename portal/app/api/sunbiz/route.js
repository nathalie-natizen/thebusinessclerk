import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const BASE = 'https://search.sunbiz.org/Inquiry/CorporationSearch';

// Opens the company's live Sunbiz page: the exact detail page if staff saved it, otherwise Sunbiz's results for the company name.
// (Sunbiz blocks automated lookups, so the detail link can't be fetched by the server.)
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('entity');
  const sb = supabaseServer();
  const { data: e } = await sb.from('entities').select('legal_name, sunbiz_url').eq('id', id).maybeSingle(); // RLS
  if (!e) return new NextResponse('Not found', { status: 404 });
  if (e.sunbiz_url) return NextResponse.redirect(e.sunbiz_url);
  const name = e.legal_name.toUpperCase().replace(/[^A-Z0-9 &]/g, ' ').replace(/\s+/g, ' ').trim();
  return NextResponse.redirect(`${BASE}/SearchResults/EntityName/${encodeURIComponent(name)}/Page1?searchNameOrder=${name.replace(/[^A-Z0-9]/g, '')}`);
}
