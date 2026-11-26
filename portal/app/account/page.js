import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';

async function save(formData) {
  'use server';
  const { sb, user } = await requireUser();
  let phone = String(formData.get('phone') || '').replace(/[^\d+]/g, '');
  if (phone && !phone.startsWith('+')) phone = '+1' + phone;
  if (phone && !/^\+\d{10,15}$/.test(phone)) redirect('/account?error=phone');
  await sb.from('profiles').update({ full_name: String(formData.get('full_name') || '').slice(0, 120) || null, phone: phone || null, sms_opt_in: formData.get('sms_opt_in') === 'on' && !!phone }).eq('id', user.id);
  redirect('/account?saved=1');
}

export default async function Account({ searchParams }) {
  const { profile } = await requireUser();
  return (<Shell profile={profile}>
    <h1>Account</h1>
    <p className="sub">Signed in as {profile?.email}. To change your sign-in email, contact us.</p>
    {searchParams?.saved && <p className="ok-msg">Saved.</p>}
    <form className="stack" action={save}>
      <label>Full name<input name="full_name" defaultValue={profile?.full_name || ''} autoComplete="name" /></label>
      <label>Mobile number (for text alerts)<input name="phone" type="tel" defaultValue={profile?.phone || ''} placeholder="+1 407 555 0123" autoComplete="tel" /></label>
      {searchParams?.error === 'phone' && <p className="err">Enter a valid mobile number with country code, e.g. +1 407 555 0123.</p>}
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}><input type="checkbox" name="sms_opt_in" defaultChecked={profile?.sms_opt_in} style={{ minHeight: 'auto', marginTop: 4 }} />
        <span>Text me when mail or legal notices arrive for my companies. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help.</span></label>
      <button className="btn">Save</button>
    </form>
  </Shell>);
}
