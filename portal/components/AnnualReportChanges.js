'use client';
import { useState } from 'react';
import { personName, oneLine, country, roleIndex } from '@/lib/sunbiz-fill';

// Annual report order: show what Florida has on record, and open fields only for what changed.
const T = {
  en: { cur: 'Current information on Sunbiz', curHelp: 'This is what Florida has on record for your company today.', none: 'We’ll check your current record on Sunbiz before filing.',
    principal: 'Principal address', mailing: 'Mailing address', ra: 'Registered agent', people: 'Managers / officers', fein: 'FEIN (federal tax ID)', notOnFile: 'Not on file',
    changed: 'What changed since last year?', changedHelp: 'Check only what’s different. Leave everything unchecked if nothing changed and we’ll file with the information above.',
    c: { principal: 'Principal address', mailing: 'Mailing address', people: 'Managers, members or officers (names, titles or addresses)', fein: 'FEIN (add or correct it)' },
    newPrincipal: 'New principal address', newMailing: 'New mailing address', newPeople: 'Updated list: edit, add or clear a row to remove someone', newFein: 'FEIN', raNote: 'Changing your registered agent? Choose “Registered agent” as a separate order and we file the change for you.',
    line1: 'Street address', line2: 'Apt, suite (optional)', city: 'City', state: 'State', postal: 'ZIP', country: 'Country', pname: 'Full legal name', ptitle: 'Title', paddr: 'Full address',
    signer: 'Name of the person authorizing this filing', nothing: 'No changes: file it as it is on record.' },
  pt: { cur: 'Informações atuais no Sunbiz', curHelp: 'É o que a Flórida tem registrado hoje para a sua empresa.', none: 'Vamos conferir o registro atual no Sunbiz antes de enviar.',
    principal: 'Endereço principal', mailing: 'Endereço de correspondência', ra: 'Agente registrado', people: 'Administradores / diretores', fein: 'FEIN (identificação fiscal federal)', notOnFile: 'Não informado',
    changed: 'O que mudou desde o ano passado?', changedHelp: 'Marque só o que mudou. Se nada mudou, deixe tudo desmarcado e enviamos com as informações acima.',
    c: { principal: 'Endereço principal', mailing: 'Endereço de correspondência', people: 'Administradores, sócios ou diretores (nomes, cargos ou endereços)', fein: 'FEIN (incluir ou corrigir)' },
    newPrincipal: 'Novo endereço principal', newMailing: 'Novo endereço de correspondência', newPeople: 'Lista atualizada: edite, inclua ou apague uma linha para remover alguém', newFein: 'FEIN', raNote: 'Vai trocar de agente registrado? Escolha “Agente registrado” como pedido separado e registramos a troca para você.',
    line1: 'Endereço', line2: 'Apto, sala (opcional)', city: 'Cidade', state: 'Estado', postal: 'CEP / ZIP', country: 'País', pname: 'Nome legal completo', ptitle: 'Cargo', paddr: 'Endereço completo',
    signer: 'Nome de quem autoriza este registro', nothing: 'Nenhuma mudança: enviar como está registrado.' },
  es: { cur: 'Información actual en Sunbiz', curHelp: 'Es lo que Florida tiene registrado hoy para su empresa.', none: 'Revisaremos su registro actual en Sunbiz antes de presentar.',
    principal: 'Dirección principal', mailing: 'Dirección postal', ra: 'Agente registrado', people: 'Administradores / directivos', fein: 'FEIN (identificación fiscal federal)', notOnFile: 'No registrado',
    changed: '¿Qué cambió desde el año pasado?', changedHelp: 'Marque solo lo que cambió. Si nada cambió, deje todo sin marcar y presentamos con la información de arriba.',
    c: { principal: 'Dirección principal', mailing: 'Dirección postal', people: 'Administradores, socios o directivos (nombres, cargos o direcciones)', fein: 'FEIN (agregar o corregir)' },
    newPrincipal: 'Nueva dirección principal', newMailing: 'Nueva dirección postal', newPeople: 'Lista actualizada: edite, agregue o borre una fila para quitar a alguien', newFein: 'FEIN', raNote: '¿Va a cambiar de agente registrado? Elija “Agente registrado” como pedido aparte y presentamos el cambio por usted.',
    line1: 'Dirección', line2: 'Apto, suite (opcional)', city: 'Ciudad', state: 'Estado', postal: 'Código postal', country: 'País', pname: 'Nombre legal completo', ptitle: 'Cargo', paddr: 'Dirección completa',
    signer: 'Nombre de quien autoriza esta presentación', nothing: 'Sin cambios: presentar como está registrado.' },
};

export default function AnnualReportChanges({ lang = 'en', record, roles, corp }) {
  const t = T[lang] || T.en;
  const [chg, setChg] = useState({});
  const r = record || null;
  const p = r?.principal || {};
  const people = r?.officers || [];
  const k = r?.doc_number || 'manual'; // re-render inputs with new defaults when another company is picked
  const any = Object.values(chg).some(Boolean);
  const row = (label, value) => <div><dt style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</dt><dd style={{ margin: '2px 0 10px', whiteSpace: 'pre-line' }}>{value || <span className="muted">{t.notOnFile}</span>}</dd></div>;

  return (<div className="stack">
    {r ? <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
      <p style={{ fontWeight: 700, margin: 0 }}>{t.cur}</p><p className="muted" style={{ margin: '0 0 10px' }}>{t.curHelp}</p>
      <dl style={{ margin: 0 }}>
        {row(t.principal, oneLine(r.principal))}
        {row(t.mailing, oneLine(r.mailing))}
        {row(t.ra, r.ra ? `${personName(r.ra)}\n${oneLine(r.ra)}` : '')}
        {row(t.people, people.map(o => `${o.title} · ${personName(o)} · ${oneLine(o)}`).join('\n'))}
        {row(t.fein, r.fei)}
      </dl>
    </div> : <p className="muted" style={{ margin: 0 }}>{t.none}</p>}

    <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{t.changed}</legend>
      <p className="muted" style={{ margin: 0 }}>{t.changedHelp}</p>
      {Object.entries(t.c).map(([key, label]) => <label key={key} style={{ display: 'flex', gap: 10, fontWeight: 400 }}>
        <input type="checkbox" name={'ar_' + key} checked={!!chg[key]} onChange={e => setChg({ ...chg, [key]: e.target.checked })} style={{ minHeight: 'auto' }} />{label}</label>)}
      {!any && <p className="ok-msg" style={{ margin: 0 }}>✓ {t.nothing}</p>}
      <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>{t.raNote}</p>
    </fieldset>

    {chg.principal && <div key={'p' + k} className="stack">
      <p style={{ fontWeight: 700, margin: 0 }}>{t.newPrincipal}</p>
      <label>{t.line1}<input name="line1" defaultValue={p.line1 || ''} autoComplete="address-line1" /></label>
      <label>{t.line2}<input name="line2" defaultValue={p.line2 || ''} autoComplete="address-line2" /></label>
      <div className="row"><label>{t.city}<input name="city" defaultValue={p.city || ''} /></label><label>{t.state}<input name="state" defaultValue={p.state || ''} /></label></div>
      <div className="row"><label>{t.postal}<input name="postal" defaultValue={p.zip || ''} /></label><label>{t.country}<input name="country" defaultValue={country(p.country) || 'United States'} /></label></div>
    </div>}

    {chg.mailing && <label key={'m' + k}>{t.newMailing}<input name="mailing_address" defaultValue={oneLine(r?.mailing)} /></label>}

    {chg.people && <div key={'o' + k} className="stack">
      <p style={{ fontWeight: 700, margin: 0 }}>{t.newPeople}</p>
      {[0, 1, 2, 3, 4, 5].map(i => { const o = people[i]; const ri = o ? roleIndex(o.title, corp) : undefined;
        return <div key={i} className="row" style={{ alignItems: 'end' }}>
          <label>{t.pname}<input name={`p${i + 1}_name`} defaultValue={o ? personName(o) : ''} /></label>
          <label style={{ maxWidth: 220 }}>{t.ptitle}<select name={`p${i + 1}_title`} defaultValue={roles[ri ?? 0]}>{roles.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>{t.paddr}<input name={`p${i + 1}_address`} defaultValue={o ? oneLine(o) : ''} /></label>
        </div>; })}
    </div>}

    {chg.fein && <label key={'f' + k}>{t.newFein}<input name="fein" defaultValue={r?.fei || ''} placeholder="12-3456789" maxLength={10} /></label>}

    <label>{t.signer} *<input name="ar_signer" required maxLength={120} autoComplete="name" /></label>
  </div>);
}
