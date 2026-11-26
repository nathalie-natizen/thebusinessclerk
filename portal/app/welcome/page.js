export const metadata = { title: 'Thank you | The Business Clerk' };
export default function Welcome() {
  return (<main style={{ maxWidth: 560, paddingTop: 70 }}><div className="card">
    <p className="file">THE BUSINESS CLERK</p>
    <h1 style={{ marginTop: 12 }}>Thank you, your order is in.</h1>
    <p>We've received your payment and opened your company file. Here's what happens next:</p>
    <ol><li>You'll get a receipt from Stripe by email.</li><li>We review your order within one business day and contact you if we need anything.</li><li>Sign in to your portal with the same email you used at checkout to follow your order and see your documents.</li></ol>
    <p><a className="btn" href="/login">Sign in to your portal</a></p>
    <p className="muted">Questions? hello@thebusinessclerk.com</p>
  </div></main>);
}
