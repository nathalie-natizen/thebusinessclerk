import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { fill1583 } from '@/lib/form1583';

export const dynamic = 'force-dynamic';
// Pre-filled PS Form 1583 for a company: /api/cmra/form?entity=<id>  (sample=1 fills test data to check the layout)
export async function GET(req) {
  const url = new URL(req.url);
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));
  let a, entity;
  if (url.searchParams.get('sample')) {
    entity = { file_number: 'TBC-10000', legal_name: 'SAMPLE COMPANY LLC' };
    a = { last_name: 'Sample', first_name: 'Maria', middle_initial: 'A', applicant_phone: '+1 407 555 0123', applicant_email: 'maria@example.com', home_street: '123 Example Street, Apt 4', home_city: 'Orlando', home_state: 'FL', home_zip: '32801', home_country: 'USA', business_name: 'SAMPLE COMPANY LLC', business_type: 'Consulting', registration_place: 'Orange County, Florida', id1_type: 'Passport', id1_number: 'X1234567', id1_issuer: 'U.S. Department of State', id1_expires: '2030-05-01', id2_type: 'Current lease', receivers: 'John Sample' };
  } else {
    const id = url.searchParams.get('entity');
    ({ data: entity } = await sb.from('entities').select('id, file_number, legal_name').eq('id', id).maybeSingle()); // RLS
    if (!entity) return new NextResponse('Not found', { status: 404 });
    ({ data: a } = await sb.from('cmra_applications').select('*').eq('entity_id', id).maybeSingle());
    if (!a) return new NextResponse('Fill in your details first', { status: 400 });
  }
  const { bytes, layoutMatches } = await fill1583(a, entity);
  return new NextResponse(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="PS-1583-${entity.file_number}.pdf"`, 'X-Form-Layout-Match': String(layoutMatches), 'Cache-Control': 'no-store' } });
}
