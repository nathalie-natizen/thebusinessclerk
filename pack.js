// Annual Compliance Pack: the main recurring plan. Hero card (home EN/PT/ES) and its own page in each language.
const C = require('./config');
const P = C.prices, F = C.stateFees;
const SEP = P.raAnnual + P.annualReport + 12 * P.mailBasic; // price if bought separately
const SAVE = SEP - P.bundle;
const SCAN = (P.scanLevels.find(l => !l[1]) || P.scanLevels[0])[3];
const START = lang => `https://app.thebusinessclerk.com/start?service=bundle&lang=${lang}`;

const T = {
  en: { cur: '$', name: 'Annual Compliance Pack', tag: 'Most popular', per: 'per year', sep: `$${SEP} if bought separately · save $${SAVE}`,
    items: ['Florida registered agent, all year', 'Annual report filed for you before May 1', 'Professional Florida business address', 'Mail forwarded weekly, every two weeks or monthly: you pay only postage', 'Never miss a deadline: renews automatically'],
    note: 'Plus the Florida annual report state fee, at cost.', cta: 'Get the pack', more: 'See everything included →', href: 'compliance-pack.html' },
  pt: { cur: 'US$ ', name: 'Pacote Anual Empresa em Dia', tag: 'Mais escolhido', per: 'por ano', sep: `US$ ${SEP} se contratado separadamente · economize US$ ${SAVE}`,
    items: ['Agente registrado na Flórida o ano todo', 'Relatório anual enviado por nós antes de 1º de maio', 'Endereço comercial profissional na Flórida', 'Correspondência encaminhada toda semana, a cada 15 dias ou todo mês: você paga só a postagem', 'Nunca perca um prazo: renova automaticamente'],
    note: 'Mais a taxa estadual do relatório anual, pelo custo.', cta: 'Quero o pacote', more: 'Veja tudo o que está incluído →', href: 'pt/pacote-anual.html' },
  es: { cur: 'US$ ', name: 'Paquete Anual Empresa al Día', tag: 'El más elegido', per: 'por año', sep: `US$ ${SEP} si se contrata por separado · ahorras US$ ${SAVE}`,
    items: ['Agente registrado en Florida todo el año', 'Reporte anual presentado por nosotros antes del 1 de mayo', 'Dirección comercial profesional en Florida', 'Correo reenviado cada semana, cada 15 días o cada mes: solo pagas el franqueo', 'Nunca pierdas una fecha límite: se renueva automáticamente'],
    note: 'Más la tarifa estatal del reporte anual, al costo.', cta: 'Quiero el paquete', more: 'Mira todo lo que incluye →', href: 'es/paquete-anual.html' },
};

const packCard = (lang, rel) => { const t = T[lang]; return `<div class="packcard"><span class="tag">${t.tag}</span><p class="pk-name">${t.name}</p><p class="pk-price">${t.cur}${P.bundle} <small>${t.per}</small></p><p class="pk-sep">${t.sep}</p><ul>${t.items.map(i => `<li>${i}</li>`).join('')}</ul><p class="pk-note">${t.note}</p><a class="btn primary" href="${START(lang)}">${t.cta}</a> <a class="pk-more" href="${rel}${t.href}">${t.more}</a></div>`; };

const CSS = `
.packcard{background:#fff;color:var(--ink,#1d2b2f);border-radius:18px;padding:30px 28px 24px;position:relative;box-shadow:0 18px 50px rgba(0,0,0,.22);border:2px solid var(--orange)}
.packcard .tag{position:absolute;top:-14px;left:24px;background:var(--orange);color:#fff;font-size:13px;font-weight:700;padding:4px 14px;border-radius:20px}
.packcard .pk-name{font-weight:800;font-size:20px;margin:0 0 6px;color:var(--teal)}
.packcard .pk-price{font-size:46px;font-weight:800;line-height:1;margin:0;color:var(--ink,#1d2b2f)}.packcard .pk-price small{font-size:16px;font-weight:600;color:#5b6b6f}
.packcard .pk-sep{margin:8px 0 14px;font-size:14px;color:#2E8B57;font-weight:700}
.packcard ul{list-style:none;padding:0;margin:0 0 12px}.packcard li{padding:5px 0 5px 28px;position:relative;font-size:15.5px}
.packcard li:before{content:"✓";position:absolute;left:0;top:4px;width:20px;height:20px;border-radius:50%;background:#E6F2EE;color:#2E8B57;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
.packcard .pk-note{font-size:13px;color:#5b6b6f;margin:0 0 16px}.packcard .pk-more{font-size:14.5px;margin-left:10px;color:var(--teal)}
.benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:16px;margin:18px 0 26px}
.benefits div{background:var(--sand,#F6F1E7);border-radius:14px;padding:18px}.benefits h3{margin:0 0 6px;font-size:16.5px;font-family:Inter,system-ui,sans-serif;font-weight:800;line-height:1.3}.benefits p{margin:0;font-size:15px}
`;

// Page content per language (markdown + benefits grid)
const PAGE = {
  en: { path: 'compliance-pack.html', crumb: 'Annual Compliance Pack', kicker: 'Our main plan',
    title: `Annual Compliance Pack: Registered Agent, Annual Report & Florida Business Address for $${P.bundle}/year | The Business Clerk`,
    desc: `One yearly subscription that keeps your Florida company compliant: registered agent, annual report filing and a professional business address with mail forwarding. $${P.bundle}/year.`,
    h1: 'Stay compliant all year, with one simple subscription.',
    lead: `Registered agent, your annual report filed on time and a professional Florida business address with mail forwarding, for $${P.bundle} a year. Set it once and stop worrying about deadlines.`,
    cta: `Get the pack for $${P.bundle}/year`,
    benefitsH: 'Why business owners choose the pack',
    benefits: [['Work from home, look established', 'Run your business from your home office or anywhere, with a professional Florida street address on your website, invoices and cards.'], ['No commercial location? No problem', 'You don\'t need to rent an office. Your mail comes to ours and we send it to you on your schedule.'], ['Keep your home address private', 'Our address goes on the public state record and your mail instead of your home address.'], ['Never miss a deadline', `We file your annual report before May 1 every year, so you never pay Florida's $400 late fee or risk dissolution.`], ['Legal papers handled the same day', 'Lawsuits and state notices are scanned to your portal and you are alerted the same business day.'], ['One payment, nothing to remember', 'One yearly charge that renews automatically. Everything is in your client portal, in English, Português or Español.']],
    content: `
## What's included
- **Florida registered agent, all year.** A staffed Florida office receives legal papers and state notices for your company and puts them in your portal the same business day, with email and text alerts.
- **Annual report, filed for you.** Each January we open your annual report in the portal; you confirm any changes and we file it with Florida before May 1. The state fee ($${F.llcAnnual} LLC / $${F.corpAnnual} corporation) is charged at cost when we file.
- **Professional Florida business address.** A real street address with your private mailbox (PMB) number for your website, invoices, bank statements and marketing.
- **Mail forwarding on your schedule.** Choose weekly, every two weeks or monthly. We collect everything that arrives and ship it to you in one package. **You pay only the postage:** no per-envelope, package or forwarding fees.
- **Your client portal.** Every piece of mail logged with a photo of the envelope, every document and deadline in one place.

## Pricing
| | Separately | Annual Compliance Pack |
|---|---|---|
| Registered agent | $${P.raAnnual}/year | Included |
| Annual report filing | $${P.annualReport}/year | Included |
| Business address & mail | $${P.mailBasic}/month ($${12 * P.mailBasic}/year) | Included |
| Per-envelope, package and forwarding fees | Yes | **None** |
| **Total** | **$${SEP}/year + fees** | **$${P.bundle}/year** |

Not included: the Florida annual report state fee (at cost), postage for forwarded mail (at cost), and optional open & scan if you ask us to scan an item ($${SCAN} each).

## How it works
1. **Order the pack** online. New company? Form your LLC first; the pack takes over when your included first year of registered agent service ends.
2. **Complete USPS Form 1583** in your portal (two IDs). USPS requires it before we can receive mail for you.
3. **Pick your forwarding address and schedule.** We take care of the rest, every year, until you cancel.`,
    faqs: [['Is it a subscription?', 'Yes. It renews automatically every year on your card on file, so your company stays compliant without you having to remember anything. You can turn off the renewal any time before the renewal date.'], ['What do I pay besides the $' + P.bundle + '?', 'Only the Florida annual report state fee, charged at cost when we file, and postage for the mail we forward to you. Scanning an item is optional and only charged if you ask for it.'], ['Can I use the address as my business address?', 'Yes, for your website, invoices, marketing and correspondence. Some banks and licensing agencies require a physical business location; ask us before you rely on it for a specific purpose.'], ['I already have a registered agent. Can I switch?', 'Yes. We file the change of registered agent with Florida within one business day of your order.']] },
  pt: { path: 'pt/pacote-anual.html', crumb: 'Pacote Anual Empresa em Dia', kicker: 'Nosso plano principal',
    title: `Pacote Anual Empresa em Dia: agente registrado, relatório anual e endereço comercial na Flórida por US$ ${P.bundle}/ano | The Business Clerk`,
    desc: `Uma assinatura anual que mantém sua empresa na Flórida em dia: agente registrado, relatório anual e endereço comercial com encaminhamento de correspondência. US$ ${P.bundle}/ano.`,
    h1: 'Sua empresa em dia o ano inteiro, com uma única assinatura.',
    lead: `Agente registrado, relatório anual enviado no prazo e um endereço comercial profissional na Flórida com encaminhamento de correspondência, por US$ ${P.bundle} por ano. Você contrata uma vez e esquece os prazos.`,
    cta: `Quero o pacote por US$ ${P.bundle}/ano`,
    benefitsH: 'Por que os empresários escolhem o pacote',
    benefits: [['Trabalhe de casa com cara de empresa estabelecida', 'Toque seu negócio do home office ou de qualquer lugar, com um endereço comercial profissional na Flórida no site, nas faturas e nos cartões.'], ['Não tem ponto comercial? Sem problema', 'Você não precisa alugar escritório. Sua correspondência chega no nosso e enviamos para você na frequência que escolher.'], ['Seu endereço residencial em sigilo', 'O nosso endereço aparece no registro público do estado e na sua correspondência, no lugar do da sua casa.'], ['Nunca perca um prazo', `Enviamos seu relatório anual antes de 1º de maio, todo ano, para você nunca pagar a multa de US$ 400 nem correr o risco de dissolução.`], ['Documentos judiciais no mesmo dia', 'Processos e avisos do estado são digitalizados no seu portal e você é avisado no mesmo dia útil.'], ['Um pagamento, nada para lembrar', 'Uma cobrança anual com renovação automática. Tudo no seu portal, em português, inglês ou espanhol.']],
    content: `
## O que está incluído
- **Agente registrado na Flórida o ano todo.** Um escritório com equipe na Flórida recebe documentos judiciais e avisos do estado da sua empresa e coloca no seu portal no mesmo dia útil, com alertas por e-mail e SMS.
- **Relatório anual enviado por nós.** Todo mês de janeiro abrimos seu relatório anual no portal; você confirma as alterações e enviamos à Flórida antes de 1º de maio. A taxa estadual (US$ ${F.llcAnnual} LLC / US$ ${F.corpAnnual} corporação) é cobrada pelo custo no envio.
- **Endereço comercial profissional na Flórida.** Um endereço real com seu número de caixa postal privada (PMB) para site, faturas, extratos e marketing.
- **Correspondência encaminhada na sua frequência.** Toda semana, a cada 15 dias ou todo mês. Juntamos tudo o que chegar e enviamos em um só pacote. **Você paga só a postagem:** sem taxa por envelope, pacote ou encaminhamento.
- **Seu portal do cliente.** Cada correspondência registrada com foto do envelope; documentos e prazos em um só lugar.

## Preço
| | Separado | Pacote Anual Empresa em Dia |
|---|---|---|
| Agente registrado | US$ ${P.raAnnual}/ano | Incluído |
| Relatório anual | US$ ${P.annualReport}/ano | Incluído |
| Endereço comercial e correspondência | US$ ${P.mailBasic}/mês (US$ ${12 * P.mailBasic}/ano) | Incluído |
| Taxas por envelope, pacote e encaminhamento | Sim | **Nenhuma** |
| **Total** | **US$ ${SEP}/ano + taxas** | **US$ ${P.bundle}/ano** |

Não incluído: a taxa estadual do relatório anual (pelo custo), a postagem da correspondência encaminhada (pelo custo) e, se você pedir, abrir e digitalizar um item (US$ ${SCAN} cada).

## Como funciona
1. **Contrate o pacote** online. Empresa nova? Abra sua LLC primeiro; o pacote assume quando terminar o 1º ano de agente registrado incluído.
2. **Preencha o Formulário USPS 1583** no portal (dois documentos). O USPS exige antes de recebermos correspondência para você.
3. **Escolha o endereço e a frequência de envio.** Nós cuidamos do resto, todo ano, até você cancelar.`,
    faqs: [['É uma assinatura?', 'Sim. Renova automaticamente todo ano no cartão cadastrado, para sua empresa ficar em dia sem você precisar lembrar de nada. Você pode desligar a renovação quando quiser, antes da data de renovação.'], [`O que eu pago além dos US$ ${P.bundle}?`, 'Só a taxa estadual do relatório anual, cobrada pelo custo no envio, e a postagem da correspondência que encaminhamos. Digitalizar um item é opcional e só é cobrado se você pedir.'], ['Posso usar o endereço como endereço da empresa?', 'Sim, no site, nas faturas, no marketing e na correspondência. Alguns bancos e órgãos de licença exigem um local físico; consulte-nos antes de usá-lo para um fim específico.'], ['Já tenho agente registrado. Posso trocar?', 'Sim. Registramos a troca de agente na Flórida em até 1 dia útil após o pedido.']] },
  es: { path: 'es/paquete-anual.html', crumb: 'Paquete Anual Empresa al Día', kicker: 'Nuestro plan principal',
    title: `Paquete Anual Empresa al Día: agente registrado, reporte anual y dirección comercial en Florida por US$ ${P.bundle}/año | The Business Clerk`,
    desc: `Una suscripción anual que mantiene tu empresa en Florida al día: agente registrado, reporte anual y dirección comercial con reenvío de correo. US$ ${P.bundle}/año.`,
    h1: 'Tu empresa al día todo el año, con una sola suscripción.',
    lead: `Agente registrado, tu reporte anual presentado a tiempo y una dirección comercial profesional en Florida con reenvío de correo, por US$ ${P.bundle} al año. Lo contratas una vez y te olvidas de los plazos.`,
    cta: `Quiero el paquete por US$ ${P.bundle}/año`,
    benefitsH: 'Por qué los empresarios eligen el paquete',
    benefits: [['Trabaja desde casa con imagen de empresa establecida', 'Maneja tu negocio desde tu oficina en casa o desde cualquier lugar, con una dirección comercial profesional en Florida en tu web, facturas y tarjetas.'], ['¿No tienes local comercial? No hay problema', 'No necesitas alquilar oficina. Tu correo llega a la nuestra y te lo enviamos con la frecuencia que elijas.'], ['Tu dirección de casa, privada', 'Nuestra dirección aparece en el registro público del estado y en tu correo, en lugar de la de tu casa.'], ['Nunca pierdas una fecha límite', `Presentamos tu reporte anual antes del 1 de mayo, cada año, para que nunca pagues la multa de US$ 400 ni arriesgues la disolución.`], ['Documentos legales el mismo día', 'Demandas y avisos del estado se escanean a tu portal y te avisamos el mismo día hábil.'], ['Un pago, nada que recordar', 'Un cargo anual con renovación automática. Todo en tu portal, en español, inglés o portugués.']],
    content: `
## Qué incluye
- **Agente registrado en Florida todo el año.** Una oficina con personal en Florida recibe los documentos legales y avisos del estado de tu empresa y los pone en tu portal el mismo día hábil, con alertas por correo y SMS.
- **Reporte anual presentado por nosotros.** Cada enero abrimos tu reporte anual en el portal; confirmas los cambios y lo presentamos ante Florida antes del 1 de mayo. La tarifa estatal (US$ ${F.llcAnnual} LLC / US$ ${F.corpAnnual} corporación) se cobra al costo al presentar.
- **Dirección comercial profesional en Florida.** Una dirección real con tu número de buzón privado (PMB) para tu web, facturas, estados de cuenta y marketing.
- **Reenvío de correo con tu frecuencia.** Cada semana, cada 15 días o cada mes. Juntamos todo lo que llegue y te lo enviamos en un solo paquete. **Solo pagas el franqueo:** sin cargos por sobre, paquete ni reenvío.
- **Tu portal de cliente.** Cada correo registrado con foto del sobre; documentos y plazos en un solo lugar.

## Precio
| | Por separado | Paquete Anual Empresa al Día |
|---|---|---|
| Agente registrado | US$ ${P.raAnnual}/año | Incluido |
| Reporte anual | US$ ${P.annualReport}/año | Incluido |
| Dirección comercial y correo | US$ ${P.mailBasic}/mes (US$ ${12 * P.mailBasic}/año) | Incluido |
| Cargos por sobre, paquete y reenvío | Sí | **Ninguno** |
| **Total** | **US$ ${SEP}/año + cargos** | **US$ ${P.bundle}/año** |

No incluye: la tarifa estatal del reporte anual (al costo), el franqueo del correo reenviado (al costo) y, si lo pides, abrir y escanear un artículo (US$ ${SCAN} cada uno).

## Cómo funciona
1. **Contrata el paquete** en línea. ¿Empresa nueva? Abre tu LLC primero; el paquete continúa cuando termine el primer año de agente registrado incluido.
2. **Completa el Formulario USPS 1583** en tu portal (dos identificaciones). El USPS lo exige antes de recibir correo para ti.
3. **Elige la dirección y la frecuencia de envío.** Nosotros nos encargamos del resto, cada año, hasta que canceles.`,
    faqs: [['¿Es una suscripción?', 'Sí. Se renueva automáticamente cada año con tu tarjeta registrada, para que tu empresa esté al día sin que tengas que recordar nada. Puedes desactivar la renovación cuando quieras, antes de la fecha de renovación.'], [`¿Qué pago además de los US$ ${P.bundle}?`, 'Solo la tarifa estatal del reporte anual, cobrada al costo al presentar, y el franqueo del correo que te reenviamos. Escanear un artículo es opcional y solo se cobra si lo pides.'], ['¿Puedo usar la dirección como dirección de mi empresa?', 'Sí, en tu web, facturas, marketing y correspondencia. Algunos bancos y agencias de licencias exigen un local físico; consúltanos antes de usarla para un fin específico.'], ['Ya tengo agente registrado. ¿Puedo cambiarme?', 'Sí. Presentamos el cambio de agente ante Florida en 1 día hábil desde tu pedido.']] },
};

module.exports = { packCard, PACK_CSS: CSS, PAGE, START, T, SEP, SAVE };
