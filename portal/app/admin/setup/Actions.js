'use client';
import { useFormState, useFormStatus } from 'react-dom';
function Btn({ label }) { const { pending } = useFormStatus(); return <button className="btn small" disabled={pending}>{pending ? 'Working…' : label}</button>; }
export default function Action({ action, label, hint }) {
  const [state, run] = useFormState(action, null);
  return (<form action={run} className="stack" style={{ gap: 6 }}>
    <div><Btn label={label} /> {hint && <span className="muted" style={{ fontSize: 14 }}>{hint}</span>}</div>
    {state?.error && <p className="err" style={{ margin: 0 }}>{state.error}</p>}
    {state?.message && <p className="ok-msg" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{state.message}</p>}
    {state?.secret && <p className="note" style={{ margin: 0 }}>Copy this signing secret now and add it in Vercel as <code>STRIPE_WEBHOOK_SECRET</code>, then redeploy. It is shown only once:<br /><code style={{ userSelect: 'all', wordBreak: 'break-all' }}>{state.secret}</code></p>}
  </form>);
}
