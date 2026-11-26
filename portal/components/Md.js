// Minimal renderer for agreement text (#, ##, - bullets, **bold**, ---)
const inline = s => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
export default function Md({ text, style }) {
  const blocks = String(text || '').split(/\n\n+/); const out = []; let list = [];
  const flush = k => { if (list.length) { out.push(<ul key={'u' + k} style={{ paddingLeft: 20, margin: '4px 0 10px' }}>{list.map((x, i) => <li key={i}>{inline(x)}</li>)}</ul>); list = []; } };
  blocks.forEach((b, i) => {
    if (b.startsWith('- ')) { list.push(b.slice(2)); return; }
    flush(i);
    if (b === '---') out.push(<hr key={i} />);
    else if (b.startsWith('## ')) out.push(<h4 key={i} style={{ margin: '14px 0 6px' }}>{inline(b.slice(3))}</h4>);
    else if (b.startsWith('# ')) out.push(<h3 key={i} style={{ margin: '18px 0 8px' }}>{inline(b.slice(2))}</h3>);
    else out.push(<p key={i} style={{ margin: '6px 0' }}>{inline(b)}</p>);
  });
  flush('end');
  return <div style={style}>{out}</div>;
}
