import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { requireStaff } from '@/lib/auth';

async function add(formData) {
  'use server';
  const { sb } = await requireStaff();
  const g = k => String(formData.get(k) || '').trim();
  const { error } = await sb.from('resources').insert({ title: g('title'), url: g('url'), description: g('description') || null, audience: g('audience') === 'staff' ? 'staff' : 'client', sort: Number(g('sort')) || 100 });
  if (error) redirect('/staff/resources?error=' + encodeURIComponent(error.message.includes('url') ? 'The link must start with https://' : error.message));
  revalidatePath('/resources'); redirect('/staff/resources');
}
async function remove(formData) {
  'use server';
  const { sb } = await requireStaff();
  await sb.from('resources').delete().eq('id', String(formData.get('id')));
  revalidatePath('/resources'); redirect('/staff/resources');
}

export default async function ManageResources({ searchParams }) {
  const { sb, profile } = await requireStaff();
  const { data: rows } = await sb.from('resources').select('*').order('audience').order('sort');
  return (<Shell profile={profile}>
    <h1>Resources</h1>
    <section className="card" style={{ marginBottom: 18 }}><h3 style={{ marginTop: 0 }}>Staff quick links</h3><ul style={{ margin: 0, paddingLeft: 18 }}>
      <li><a href="https://search.sunbiz.org/Inquiry/CorporationSearch/ByName" target="_blank" rel="noopener noreferrer">Sunbiz name search</a> (name availability, company records)</li>
      <li><a href="https://dos.fl.gov/sunbiz/" target="_blank" rel="noopener noreferrer">Sunbiz home</a> (e-filing, forms, fees)</li>
      <li><a href="https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number" target="_blank" rel="noopener noreferrer">IRS: get an EIN</a> (online application and SS-4)</li>
    </ul><p className="muted" style={{ marginBottom: 0 }}>Add the Sunbiz prepaid account login page, the USPS CMRA customer database and your county court lookups below as "Staff only".</p></section>
    <h2>Manage links</h2>
    <p className="sub">"Clients and staff" links show on everyone's Resources page. "Staff only" links show only to staff.</p>
    {searchParams?.error && <div className="note">{searchParams.error}</div>}
    <form action={add} className="card" style={{ marginBottom: 18 }}>
      <h3>Add a link</h3>
      <label>Title<input name="title" required /></label>
      <label>Link (https://…)<input name="url" type="url" required placeholder="https://" /></label>
      <label>Short description<input name="description" /></label>
      <label>Who sees it<select name="audience"><option value="client">Clients and staff</option><option value="staff">Staff only</option></select></label>
      <label>Order (lower shows first)<input name="sort" type="number" defaultValue="100" /></label>
      <button className="btn">Add link</button>
    </form>
    <div className="scroll"><table><thead><tr><th>Title</th><th>Who sees it</th><th>Order</th><th></th></tr></thead><tbody>
      {(rows || []).map(r => <tr key={r.id}><td><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>{r.description && <div className="muted">{r.description}</div>}</td>
        <td>{r.audience === 'staff' ? 'Staff only' : 'Clients and staff'}</td><td>{r.sort}</td>
        <td><form action={remove}><input type="hidden" name="id" value={r.id} /><button className="btn small sec">Remove</button></form></td></tr>)}
    </tbody></table></div>
  </Shell>);
}
