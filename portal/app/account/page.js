import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireUser } from '@/lib/auth';

async function setPassword(formData) {
  'use server';
  const { sb } = await requireUser();
  const pw = String(formData.get('password') || ''), pw2 = String(formData.get('password2') || '');
  if (pw.length < 10) redirect('/account?pw=short');
  if (pw !== pw2) redirect('/account?pw=mismatch');
  const { error } = await sb.auth.updateUser({ password: pw });
  redirect(error ? '/account?pw=error' : '/account?pw=ok');
}

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
    <form className="stack" action={setPassword} style={{ marginTop: 28 }}>
      <h2 style={{ margin: 0 }}>Password (optional)</h2>
      <p className="muted">Set a password if you'd rather not wait for an email link each time. You can always sign in with an email link too.</p>
      {searchParams?.pw === 'ok' && <p className="ok-msg">Password saved.</p>}
      {searchParams?.pw === 'short' && <p className="err">Use at least 10 characters.</p>}
      {searchParams?.pw === 'mismatch' && <p className="err">The two passwords don't match.</p>}
      {searchParams?.pw === 'error' && <p className="err">We couldn't save that password. Try a different one.</p>}
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} /></label>
      <label>Repeat new password<input name="password2" type="password" autoComplete="new-password" minLength={10} /></label>
      <button className="btn sec">Save password</button>
    </form>
  </Shell>);
}
