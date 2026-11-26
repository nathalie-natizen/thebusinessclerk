'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

const friendly = (m = '') => /rate limit/i.test(m) ? 'Too many sign-in emails were sent in the last hour. Please wait a bit and try again, or sign in with your password.'
  : /invalid login/i.test(m) ? 'That email and password don’t match. If you haven’t set a password yet, use the email link instead.' : m;

export default function Login() {
  const [mode, setMode] = useState('link');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [state, setState] = useState('idle'); const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Enter the email address on file.'); return; }
    setState('sending');
    const sb = supabaseBrowser();
    if (mode === 'password') {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) { setErr(friendly(error.message)); setState('idle'); } else location.href = '/';
      return;
    }
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/auth/callback` } });
    if (error) { setErr(friendly(error.message)); setState('idle'); } else setState('sent');
  }
  return (<main style={{ maxWidth: 440, paddingTop: 70 }}>
    <div className="card">
      <p className="file">THE BUSINESS CLERK</p>
      <h1 style={{ marginTop: 12 }}>Sign in to your portal</h1>
      {state === 'sent' ? <p className="ok-msg">Check your inbox. We sent a secure sign-in link to <strong>{email}</strong>. The link expires in 1 hour.</p> : (
      <form className="stack" onSubmit={submit} noValidate>
        <p className="sub">{mode === 'link' ? 'Enter the email address on file for your company. We’ll email you a secure sign-in link. No password needed.' : 'Sign in with your email and the password you set in your Account page.'}</p>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} /></label>
        {mode === 'password' && <label>Password<input type="password" autoComplete="current-password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} /></label>}
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'One moment…' : mode === 'link' ? 'Email me a sign-in link' : 'Sign in'}</button>
        <button type="button" className="btn sec" onClick={() => { setMode(mode === 'link' ? 'password' : 'link'); setErr(''); }}>{mode === 'link' ? 'Use a password instead' : 'Email me a link instead'}</button>
      </form>)}
    </div>
    <p className="muted" style={{ textAlign: 'center' }}>Need help? hello@thebusinessclerk.com</p>
  </main>);
}
