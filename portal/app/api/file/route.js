import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Download a scan or document. Access is checked with the user's own session (row level security),
// then a short-lived signed link (60 seconds) is created.
export async function GET(req) {
  const url = new URL(req.url); const type = url.searchParams.get('type'); const id = url.searchParams.get('id');
  // Compliance files (IDs, signed Form 1583): ?type=compliance&id=<entity id>&part=id1|id2|form
  if (type === 'compliance') {
    const part = { id1: 'id1_path', id2: 'id2_path', form: 'form_path' }[url.searchParams.get('part')];
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.redirect(new URL('/login', req.url));
    const { data: row } = part ? await sb.from('cmra_applications').select(part).eq('entity_id', id).maybeSingle() : { data: null }; // RLS: members/staff only
    if (!row?.[part]) return new NextResponse('Not found', { status: 404 });
    const { data, error } = await supabaseAdmin().storage.from('compliance').createSignedUrl(row[part], 60);
    if (error) return new NextResponse('File unavailable', { status: 404 });
    return NextResponse.redirect(data.signedUrl);
  }
  const table = type === 'mail' ? 'mail_items' : type === 'document' ? 'documents' : null;
  if (!table || !id) return new NextResponse('Bad request', { status: 400 });
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));
  const part = type === 'mail' && url.searchParams.get('part') === 'content' ? 'content_path' : 'file_path';
  const { data: row } = await sb.from(table).select(`id, ${part}`).eq('id', id).single();
  const path = row?.[part];
  if (!path) return new NextResponse('Not found', { status: 404 });
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage.from(type === 'mail' ? 'mail' : 'documents').createSignedUrl(path, 60, { download: true });
  if (error) return new NextResponse('File unavailable', { status: 404 });
  if (type === 'mail') {
    const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
    if (p?.role === 'client' && part === 'content_path') await admin.from('mail_items').update({ viewed_at: new Date().toISOString() }).eq('id', id).is('viewed_at', null);
  }
  return NextResponse.redirect(data.signedUrl);
}
