// Annual Essentials Pack: the main recurring plan. Hero card (home EN/PT/ES) and its own page in each language.
const C = require('./config');
const P = C.prices, F = C.stateFees;
const SEP = P.raAnnual + P.annualReport + 12 * P.mailBasic; // price if bought separately
const SAVE = SEP - P.bundle;
const START = lang => `https://app.thebusinessclerk.com/start?service=bundle&lang=${lang}`;

const T = {
  en: { cur: '$', name: 'Annual Essentials Pack', tag: 'Most popular', per: 'per year', sep: `$${SEP}+ if bought separately`,
    items: ['Florida registered agent, all year', 'Annual report filed for you before May 1', 'Professional Florida business address', 'Mail forwarded on your schedule, or a “no mail” notice', 'Legal documents scanned to your portal same day', 'Renews automatically, nothing to remember'],
    whyH: 'Why owners choose it', incH: 'What’s included',
    why: [['home', 'Home address kept private', 'Our office goes on the public record, not your house.'], ['pin', 'Real Florida business address', 'Look established on your website, invoices and cards.'], ['mail', 'Mail forwarded to you', 'We collect it and forward it on your schedule.'], ['cal', 'No missed deadlines', 'No $400 late fee. We file your annual report for you.']],
    note: 'Plus Florida state fees and forwarding shipping, at cost.', cta: 'Get the pack', more: 'See everything included →', href: 'compliance-pack.html' },
  pt: { cur: 'US$ ', name: 'Pacote Anual Essencial', tag: 'Mais escolhido', per: 'por ano', sep: `US$ ${SEP}+ se contratado separadamente`,
    items: ['Agente registrado na Flórida o ano todo', 'Relatório anual enviado por nós antes de 1º de maio', 'Endereço comercial profissional na Flórida', 'Correspondência encaminhada na sua frequência, ou um aviso de “sem correspondência”', 'Documentos legais digitalizados no seu portal no mesmo dia', 'Renova automaticamente, nada para lembrar'],
    whyH: 'Por que os empresários escolhem', incH: 'O que está incluído',
    why: [['home', 'Endereço residencial em sigilo', 'Nosso escritório vai no registro público, não a sua casa.'], ['pin', 'Endereço comercial na Flórida', 'Mais credibilidade no site, nas faturas e nos cartões.'], ['mail', 'Correspondência encaminhada', 'Recebemos e encaminhamos na frequência que você escolher.'], ['cal', 'Nenhum prazo perdido', 'Sem multa de US$ 400. Enviamos seu relatório anual por você.']],
    note: 'Mais as taxas estaduais da Flórida e o frete do encaminhamento, pelo custo.', cta: 'Quero o pacote', more: 'Veja tudo o que está incluído →', href: 'pt/pacote-anual.html' },
  es: { cur: 'US$ ', name: 'Paquete Anual Esencial', tag: 'El más elegido', per: 'por año', sep: `US$ ${SEP}+ si se contrata por separado`,
    items: ['Agente registrado en Florida todo el año', 'Reporte anual presentado por nosotros antes del 1 de mayo', 'Dirección comercial profesional en Florida', 'Correo reenviado con la frecuencia que elijas, o un aviso de “sin correo”', 'Documentos legales escaneados a tu portal el mismo día', 'Se renueva automáticamente, nada que recordar'],
    whyH: 'Por qué lo eligen los empresarios', incH: 'Qué incluye',
    why: [['home', 'Tu dirección de casa, privada', 'Nuestra oficina va en el registro público, no tu casa.'], ['pin', 'Dirección comercial en Florida', 'Más credibilidad en tu web, facturas y tarjetas.'], ['mail', 'Correo reenviado a ti', 'Lo recibimos y te lo reenviamos con la frecuencia que elijas.'], ['cal', 'Ningún plazo perdido', 'Sin multa de US$ 400. Presentamos tu reporte anual por ti.']],
    note: 'Más las tarifas estatales de Florida y el envío del reenvío, al costo.', cta: 'Quiero el paquete', more: 'Mira todo lo que incluye →', href: 'es/paquete-anual.html' },
};

const ICON = { home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>' };
const icon = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const packCard = (lang, rel) => { const t = T[lang]; return `<div class="packcard"><span class="tag">${t.tag}</span><div class="pk-grid"><div class="pk-top"><p class="pk-name">${t.name}</p><p class="pk-price">${t.cur}${P.bundle} <small>${t.per}</small></p><p class="pk-sep">${t.sep}</p></div><div class="pk-main"><p class="pk-h">${t.incH}</p><ul>${t.items.map(i => `<li>${i}</li>`).join('')}</ul></div><div class="pk-why"><p class="pk-h">${t.whyH}</p><div class="pk-bs">${t.why.map(([k, h, p]) => `<div class="pk-b" title="${p}"><span class="pk-i">${icon(k)}</span><strong>${h}</strong></div>`).join('')}</div></div></div><p class="pk-note">${t.note}</p><a class="btn primary" href="${START(lang)}">${t.cta}</a> <a class="pk-more" href="${rel}${t.href}">${t.more}</a></div>`; };

const CSS = `
.packcard{background:#fff;color:var(--ink,#1d2b2f);border-radius:18px;padding:30px 28px 24px;position:relative;box-shadow:0 18px 50px rgba(0,0,0,.22);border:2px solid var(--orange)}
.packcard .tag{position:absolute;top:-14px;left:24px;background:var(--orange);color:#fff;font-size:13px;font-weight:700;padding:4px 14px;border-radius:20px}
.packcard .pk-name{font-weight:800;font-size:20px;margin:0 0 6px;color:var(--teal)}
.packcard .pk-price{font-size:46px;font-weight:800;line-height:1;margin:0;color:var(--ink,#1d2b2f)}.packcard .pk-price small{font-size:16px;font-weight:600;color:#5b6b6f}
.packcard .pk-sep{margin:8px 0 14px;font-size:14px;color:#2E8B57;font-weight:700}
.packcard ul{list-style:none;padding:0;margin:0 0 12px}.packcard li{padding:5px 0 5px 28px;position:relative;font-size:15.5px}
.packcard li:before{content:"✓";position:absolute;left:0;top:4px;width:20px;height:20px;border-radius:50%;background:#E6F2EE;color:#2E8B57;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
.packcard{container-type:inline-size}
.packcard .pk-grid{display:grid;grid-template-columns:1fr;grid-template-areas:'top' 'why' 'main';gap:6px 22px;align-items:start}.packcard .pk-top{grid-area:top}.packcard .pk-why{grid-area:why;margin:4px 0 10px}.packcard .pk-main{grid-area:main}
@container (min-width:600px){.packcard .pk-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:'top why' 'main why'}.packcard .pk-why{margin:0}}
.packcard .pk-h{font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#5b6b6f;margin:0 0 6px}
.packcard .pk-why{background:var(--sand,#F6F1E7);border-radius:14px;padding:12px 14px}.packcard .pk-bs{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}
.packcard .pk-b{display:flex;gap:9px;align-items:center}.packcard .pk-i{flex:none;width:32px;height:32px;border-radius:10px;background:#fff;color:var(--orange);display:flex;align-items:center;justify-content:center}
.packcard .pk-b strong{font-size:14px;line-height:1.25;color:var(--teal)}
@container (min-width:520px){.packcard ul{display:grid;grid-template-columns:1fr 1fr;column-gap:16px}.packcard li{font-size:14.5px}}
.packcard .pk-note{font-size:13px;color:#5b6b6f;margin:0 0 16px}.packcard .pk-more{font-size:14.5px;margin-left:10px;color:var(--teal)}
.benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:16px;margin:18px 0 26px}
.benefits div{background:var(--sand,#F6F1E7);border-radius:14px;padding:18px}.benefits h3{margin:0 0 6px;font-size:16.5px;font-family:Inter,system-ui,sans-serif;font-weight:800;line-height:1.3}.benefits p{margin:0;font-size:15px}
`;

// Page content per language (markdown + benefits grid)
const PAGE = {
  en: { path: 'compliance-pack.html', crumb: 'Annual Essentials Pack', kicker: 'Our main plan',
    title: `Annual Essentials Pack: Registered Agent, Annual Report & Florida Business Address for $${P.bundle}/year | The Business Clerk`,
    desc: `One yearly subscription that keeps your Florida company compliant: registered agent, annual report filing and a professional business address with mail forwarding. $${P.bundle}/year.`,
    h1: 'Your Florida essentials, handled all year, with one simple subscription.',
    lead: `Registered agent, your annual report filed on time and a professional Florida business address with mail forwarding, for $${P.bundle} a year. Set it once and stop worrying about deadlines.`,
    cta: `Get the pack for $${P.bundle}/year`,
    benefitsH: 'Why business owners choose the pack',
    benefits: [['Work from home, look established', 'Run your business from your home office or anywhere, with a professional Florida street address on your website, invoices and cards.'], ['No commercial location? No problem', 'You don\'t need to rent an office. Your mail comes to ours and we send it to you on your schedule.'], ['Keep your home address private', 'Our address goes on the public Sunbiz record for your company and for its managers and officers, and on your mail, instead of your home address.'], ['Never miss a deadline', `We file your annual report before May 1 every year, so you never pay Florida's $400 late fee or risk dissolution.`], ['Legal papers handled the same day', 'Lawsuits and state notices are scanned to your portal and you are alerted the same business day.'], ['One payment, nothing to remember', 'One yearly charge that renews automatically. Everything is in your client portal.']],
    content: `
## What's included
- **Florida registered agent, all year.** A staffed Florida office receives legal papers and state notices for your company and puts them in your portal the same business day, with email and text alerts.
- **Annual report, filed for you.** Each January we open your annual report in the portal; you confirm any changes and we file it with Florida before May 1. The state fee ($${F.llcAnnual} LLC / $${F.corpAnnual} corporation) is charged at cost when we file.
- **Professional Florida business address.** A real street address with your private mailbox (PMB) number for your website, invoices, bank statements and marketing.
- **Mail forwarding on your schedule.** Choose weekly, every two weeks or monthly. We collect everything that arrives and ship it to you in one package. **You pay only the postage:** no per-envelope, package or forwarding fees.
- **No mail? We let you know.** If nothing arrives in a period, you get a “no mail received” notice in your portal.
- **Your client portal.** Every piece of mail logged with a photo of the envelope, every document and deadline in one place.

## Pricing
| | Separately | Annual Essentials Pack |
|---|---|---|
| Registered agent | $${P.raAnnual}/year | Included |
| Annual report filing | $${P.annualReport}/year | Included |
| Business address & mail | $${P.mailBasic}/month ($${12 * P.mailBasic}/year) | Included |
| Per-envelope, package and forwarding fees | Yes | **None** |
| **Total** | **$${SEP}/year + fees** | **$${P.bundle}/year** |

Not included: the Florida annual report state fee (at cost) and postage for forwarded mail (at cost).

## How it works
1. **Order the pack** online. New company? Form your LLC first; the pack takes over when your included first year of registered agent service ends.
2. **Complete USPS Form 1583** in your portal (two IDs). USPS requires it before we can receive mail for you.
3. **Pick your forwarding address and schedule.** We take care of the rest, every year, until you cancel.`,
    faqs: [['Is it a subscription?', 'Yes. It renews automatically every year on your card on file, so your company stays compliant without you having to remember anything. You can turn off the renewal any time before the renewal date.'], ['What do I pay besides the $' + P.bundle + '?', 'Only the Florida annual report state fee, charged at cost when we file, and postage for the mail we forward to you.'], ['Can our address be used for the managers and members listed on Sunbiz?', 'Yes. Florida asks for a street address for the managers, officers and authorized persons on your annual report, not a home address. With the pack, your company and the people listed on its record can use our Florida address, so their home addresses stay off the public record. Their names are still public, and everyone who receives mail at our address must be listed on your USPS Form 1583.'], ['Can I use the address as my business address?', 'Yes, for your website, invoices, marketing and correspondence. Some banks and licensing agencies require a physical business location; ask us before you rely on it for a specific purpose.'], ['I already have a registered agent. Can I switch?', 'Yes. We file the change of registered agent with Florida within one business day of your order.']] },
  pt: { path: 'pt/pacote-anual.html', crumb: 'Pacote Anual Essencial', kicker: 'Nosso plano principal',
    title: `Pacote Anual Essencial: agente registrado, relatório anual e endereço comercial na Flórida por US$ ${P.bundle}/ano | The Business Clerk`,
    desc: `Uma assinatura anual que mantém sua empresa na Flórida em dia: agente registrado, relatório anual e endereço comercial com encaminhamento de correspondência. US$ ${P.bundle}/ano.`,
    h1: 'O essencial da sua empresa na Flórida resolvido o ano inteiro, com uma única assinatura.',
    lead: `Agente registrado, relatório anual enviado no prazo e um endereço comercial profissional na Flórida com encaminhamento de correspondência, por US$ ${P.bundle} por ano. Você contrata uma vez e esquece os prazos.`,
    cta: `Quero o pacote por US$ ${P.bundle}/ano`,
    benefitsH: 'Por que os empresários escolhem o pacote',
    benefits: [['Trabalhe de casa com cara de empresa estabelecida', 'Toque seu negócio do home office ou de qualquer lugar, com um endereço comercial profissional na Flórida no site, nas faturas e nos cartões.'], ['Não tem ponto comercial? Sem problema', 'Você não precisa alugar escritório. Sua correspondência chega no nosso e enviamos para você na frequência que escolher.'], ['Seu endereço residencial em sigilo', 'O nosso endereço aparece no registro público do Sunbiz, para a empresa e para seus administradores e diretores, e na sua correspondência, no lugar do da sua casa.'], ['Nunca perca um prazo', `Enviamos seu relatório anual antes de 1º de maio, todo ano, para você nunca pagar a multa de US$ 400 nem correr o risco de dissolução.`], ['Documentos judiciais no mesmo dia', 'Processos e avisos do estado são digitalizados no seu portal e você é avisado no mesmo dia útil.'], ['Um pagamento, nada para lembrar', 'Uma cobrança anual com renovação automática. Tudo no seu portal.']],
    content: `
## O que está incluído
- **Agente registrado na Flórida o ano todo.** Um escritório com equipe na Flórida recebe documentos judiciais e avisos do estado da sua empresa e coloca no seu portal no mesmo dia útil, com alertas por e-mail e SMS.
- **Relatório anual enviado por nós.** Todo mês de janeiro abrimos seu relatório anual no portal; você confirma as alterações e enviamos à Flórida antes de 1º de maio. A taxa estadual (US$ ${F.llcAnnual} LLC / US$ ${F.corpAnnual} corporação) é cobrada pelo custo no envio.
- **Endereço comercial profissional na Flórida.** Um endereço real com seu número de caixa postal privada (PMB) para site, faturas, extratos e marketing.
- **Correspondência encaminhada na sua frequência.** Toda semana, a cada 15 dias ou todo mês. Juntamos tudo o que chegar e enviamos em um só pacote. **Você paga só a postagem:** sem taxa por envelope, pacote ou encaminhamento.
- **Não chegou nada? Avisamos você.** Se nenhuma correspondência chegar no período, você recebe um aviso de “nenhuma correspondência recebida” no portal.
- **Seu portal do cliente.** Cada correspondência registrada com foto do envelope; documentos e prazos em um só lugar.

## Preço
| | Separado | Pacote Anual Essencial |
|---|---|---|
| Agente registrado | US$ ${P.raAnnual}/ano | Incluído |
| Relatório anual | US$ ${P.annualReport}/ano | Incluído |
| Endereço comercial e correspondência | US$ ${P.mailBasic}/mês (US$ ${12 * P.mailBasic}/ano) | Incluído |
| Taxas por envelope, pacote e encaminhamento | Sim | **Nenhuma** |
| **Total** | **US$ ${SEP}/ano + taxas** | **US$ ${P.bundle}/ano** |

Não incluído: a taxa estadual do relatório anual (pelo custo) e a postagem da correspondência encaminhada (pelo custo).

## Como funciona
1. **Contrate o pacote** online. Empresa nova? Abra sua LLC primeiro; o pacote assume quando terminar o 1º ano de agente registrado incluído.
2. **Preencha o Formulário USPS 1583** no portal (dois documentos). O USPS exige antes de recebermos correspondência para você.
3. **Escolha o endereço e a frequência de envio.** Nós cuidamos do resto, todo ano, até você cancelar.`,
    faqs: [['É uma assinatura?', 'Sim. Renova automaticamente todo ano no cartão cadastrado, para sua empresa ficar em dia sem você precisar lembrar de nada. Você pode desligar a renovação quando quiser, antes da data de renovação.'], [`O que eu pago além dos US$ ${P.bundle}?`, 'Só a taxa estadual do relatório anual, cobrada pelo custo no envio, e a postagem da correspondência que encaminhamos.'], ['Os administradores e sócios listados no Sunbiz podem usar o endereço de vocês?', 'Sim. A Flórida pede um endereço de rua para os administradores, diretores e pessoas autorizadas no relatório anual, não um endereço residencial. Com o pacote, sua empresa e as pessoas listadas no registro podem usar nosso endereço na Flórida, e o endereço de casa delas não fica público. Os nomes continuam públicos, e todos que recebem correspondência no nosso endereço precisam estar no Formulário USPS 1583 da empresa.'], ['Posso usar o endereço como endereço da empresa?', 'Sim, no site, nas faturas, no marketing e na correspondência. Alguns bancos e órgãos de licença exigem um local físico; consulte-nos antes de usá-lo para um fim específico.'], ['Já tenho agente registrado. Posso trocar?', 'Sim. Registramos a troca de agente na Flórida em até 1 dia útil após o pedido.']] },
  es: { path: 'es/paquete-anual.html', crumb: 'Paquete Anual Esencial', kicker: 'Nuestro plan principal',
    title: `Paquete Anual Esencial: agente registrado, reporte anual y dirección comercial en Florida por US$ ${P.bundle}/año | The Business Clerk`,
    desc: `Una suscripción anual que mantiene tu empresa en Florida al día: agente registrado, reporte anual y dirección comercial con reenvío de correo. US$ ${P.bundle}/año.`,
    h1: 'Lo esencial de tu empresa en Florida resuelto todo el año, con una sola suscripción.',
    lead: `Agente registrado, tu reporte anual presentado a tiempo y una dirección comercial profesional en Florida con reenvío de correo, por US$ ${P.bundle} al año. Lo contratas una vez y te olvidas de los plazos.`,
    cta: `Quiero el paquete por US$ ${P.bundle}/año`,
    benefitsH: 'Por qué los empresarios eligen el paquete',
    benefits: [['Trabaja desde casa con imagen de empresa establecida', 'Maneja tu negocio desde tu oficina en casa o desde cualquier lugar, con una dirección comercial profesional en Florida en tu web, facturas y tarjetas.'], ['¿No tienes local comercial? No hay problema', 'No necesitas alquilar oficina. Tu correo llega a la nuestra y te lo enviamos con la frecuencia que elijas.'], ['Tu dirección de casa, privada', 'Nuestra dirección aparece en el registro público de Sunbiz, para tu empresa y para sus administradores y directivos, y en tu correo, en lugar de la de tu casa.'], ['Nunca pierdas una fecha límite', `Presentamos tu reporte anual antes del 1 de mayo, cada año, para que nunca pagues la multa de US$ 400 ni arriesgues la disolución.`], ['Documentos legales el mismo día', 'Demandas y avisos del estado se escanean a tu portal y te avisamos el mismo día hábil.'], ['Un pago, nada que recordar', 'Un cargo anual con renovación automática. Todo en tu portal.']],
    content: `
## Qué incluye
- **Agente registrado en Florida todo el año.** Una oficina con personal en Florida recibe los documentos legales y avisos del estado de tu empresa y los pone en tu portal el mismo día hábil, con alertas por correo y SMS.
- **Reporte anual presentado por nosotros.** Cada enero abrimos tu reporte anual en el portal; confirmas los cambios y lo presentamos ante Florida antes del 1 de mayo. La tarifa estatal (US$ ${F.llcAnnual} LLC / US$ ${F.corpAnnual} corporación) se cobra al costo al presentar.
- **Dirección comercial profesional en Florida.** Una dirección real con tu número de buzón privado (PMB) para tu web, facturas, estados de cuenta y marketing.
- **Reenvío de correo con tu frecuencia.** Cada semana, cada 15 días o cada mes. Juntamos todo lo que llegue y te lo enviamos en un solo paquete. **Solo pagas el franqueo:** sin cargos por sobre, paquete ni reenvío.
- **¿No llegó nada? Te avisamos.** Si no llega correo en el período, recibes un aviso de “no se recibió correo” en tu portal.
- **Tu portal de cliente.** Cada correo registrado con foto del sobre; documentos y plazos en un solo lugar.

## Precio
| | Por separado | Paquete Anual Esencial |
|---|---|---|
| Agente registrado | US$ ${P.raAnnual}/año | Incluido |
| Reporte anual | US$ ${P.annualReport}/año | Incluido |
| Dirección comercial y correo | US$ ${P.mailBasic}/mes (US$ ${12 * P.mailBasic}/año) | Incluido |
| Cargos por sobre, paquete y reenvío | Sí | **Ninguno** |
| **Total** | **US$ ${SEP}/año + cargos** | **US$ ${P.bundle}/año** |

No incluye: la tarifa estatal del reporte anual (al costo) y el franqueo del correo reenviado (al costo).

## Cómo funciona
1. **Contrata el paquete** en línea. ¿Empresa nueva? Abre tu LLC primero; el paquete continúa cuando termine el primer año de agente registrado incluido.
2. **Completa el Formulario USPS 1583** en tu portal (dos identificaciones). El USPS lo exige antes de recibir correo para ti.
3. **Elige la dirección y la frecuencia de envío.** Nosotros nos encargamos del resto, cada año, hasta que canceles.`,
    faqs: [['¿Es una suscripción?', 'Sí. Se renueva automáticamente cada año con tu tarjeta registrada, para que tu empresa esté al día sin que tengas que recordar nada. Puedes desactivar la renovación cuando quieras, antes de la fecha de renovación.'], [`¿Qué pago además de los US$ ${P.bundle}?`, 'Solo la tarifa estatal del reporte anual, cobrada al costo al presentar, y el franqueo del correo que te reenviamos.'], ['¿Los administradores y socios que aparecen en Sunbiz pueden usar su dirección?', 'Sí. Florida pide una dirección de calle para los administradores, directivos y personas autorizadas en el reporte anual, no una dirección residencial. Con el paquete, tu empresa y las personas que aparecen en su registro pueden usar nuestra dirección en Florida, y su dirección de casa no queda pública. Los nombres siguen siendo públicos, y todas las personas que reciban correo en nuestra dirección deben estar en el Formulario USPS 1583 de la empresa.'], ['¿Puedo usar la dirección como dirección de mi empresa?', 'Sí, en tu web, facturas, marketing y correspondencia. Algunos bancos y agencias de licencias exigen un local físico; consúltanos antes de usarla para un fin específico.'], ['Ya tengo agente registrado. ¿Puedo cambiarme?', 'Sí. Presentamos el cambio de agente ante Florida en 1 día hábil desde tu pedido.']] },
};

module.exports = { packCard, PACK_CSS: CSS, PAGE, START, T, SEP, SAVE };
