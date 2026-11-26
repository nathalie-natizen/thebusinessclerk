import 'server-only';
import { headers } from 'next/headers';
import { supabaseAdmin } from './supabase/admin';
import { buildAgreement, buildAddendum, signatureLine, sortKinds, AGREEMENT_VERSION } from './agreement';

// What the client must sign for these services: the full Agreement the first time, a dated Addendum after that.
export async function draftFor(entity, kinds) {
  const db = supabaseAdmin();
  const { data: docs } = await db.from('agreements').select('doc_type, number, services, accepted_at').eq('entity_id', entity.id).order('accepted_at');
  const base = (docs || []).find(d => d.doc_type === 'agreement');
  const covered = new Set((docs || []).flatMap(d => d.services));
  const ks = sortKinds(kinds).filter(k => !covered.has(k) && !(k === 'corp' && covered.has('llc')) && !(k === 'llc' && covered.has('corp')));
  if (!ks.length) return { type: 'none', kinds: [] };
  if (!base) return { type: 'agreement', kinds: ks, number: 0, text: buildAgreement({ clientName: entity.legal_name, file: entity.file_number, kinds: ks }) };
  const number = (docs || []).filter(d => d.doc_type === 'addendum').length + 1;
  return { type: 'addendum', kinds: ks, number, text: buildAddendum({ clientName: entity.legal_name, file: entity.file_number, kinds: ks, number, baseDate: base.accepted_at }) };
}

// Store the signed text exactly as shown, with the e-signature record
export async function recordAcceptance(entity, kinds, { name, email = null, userId = null }) {
  const d = await draftFor(entity, kinds);
  if (d.type === 'none') return null;
  const at = new Date().toISOString(); const ip = headers().get('x-forwarded-for')?.split(',')[0] || null;
  const content = `${d.text}\n\n${signatureLine({ name, email, at, ip })}`;
  const { data } = await supabaseAdmin().from('agreements').insert({ entity_id: entity.id, doc_type: d.type, number: d.number, services: d.kinds, version: AGREEMENT_VERSION, content, signer_name: name, signer_email: email, user_id: userId, ip, accepted_at: at }).select().single();
  return data;
}
