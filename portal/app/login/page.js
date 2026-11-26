'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function Login() {
  const [email, setEmail] = useState(''); const [state, setState] = useState('idle'); const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Enter the email address on file.'); return; }
    setState('sending');
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/auth/callback` } });
    if (error) { setErr(error.message); setState('idle'); } else setState('sent');
  }
  return (<main style={{ maxWidth: 440, paddingTop: 70 }}>
    <div className="card">
      <p className="file">THE BUSINESS CLERK</p>
      <h1 style={{ marginTop: 12 }}>Sign in to your portal</h1>
      {state === 'sent' ? <p className="ok-msg">Check your inbox. We sent a secure sign-in link to <strong>{email}</strong>. The link expires in 1 hour.</p> : (
      <form className="stack" onSubmit={submit} noValidate>
        <p className="sub">Enter the email address on file for your company. We'll email you a secure sign-in link. No password needed.</p>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}</button>
      </form>)}
    </div>
    <p className="muted" style={{ textAlign: 'center' }}>Need help? hello@thebusinessclerk.com</p>
  </main>);
}
