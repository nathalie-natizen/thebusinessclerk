import Md from './Md';
// Scrollable agreement or addendum text shown before signing
export default function AgreementBox({ text }) {
  return <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--line, #ddd)', borderRadius: 10, padding: '6px 16px', background: '#fff', fontSize: 14.5 }}><Md text={text} /></div>;
}
