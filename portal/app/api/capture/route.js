import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkToken, SLOTS } from '@/lib/capture';

// Receives a photo taken on the client's phone (one-time link). The image is compressed on the phone first.
export async function POST(req) {
  const fd = await req.formData();
  const t = await checkToken(fd.get('token'));
  if (!t) return NextResponse.json({ error: 'This link has expired. Open a new one from your portal.' }, { status: 401 });
  const slot = String(fd.get('slot')); const col = SLOTS[slot];
  const img = fd.get('image');
  if (!col || !img || typeof img === 'string' || !img.size) return NextResponse.json({ error: 'No photo received.' }, { status: 400 });
  if (img.size > 4 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(img.type)) return NextResponse.json({ error: 'Please retake the photo.' }, { status: 400 });
  const db = supabaseAdmin();
  const path = `${t.entity_id}/phone-${slot}-${Date.now()}.jpg`;
  const { error } = await db.storage.from('compliance').upload(path, Buffer.from(await img.arrayBuffer()), { contentType: img.type });
  if (error) return NextResponse.json({ error: 'Upload failed. Try again.' }, { status: 500 });
  await db.from('cmra_applications').upsert({ entity_id: t.entity_id, [col]: path, status: 'in_progress', updated_at: new Date().toISOString() }, { onConflict: 'entity_id' });
  return NextResponse.json({ ok: true });
}
