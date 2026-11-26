const C = require('./config');
const P = C.prices, F = C.stateFees;
const { servicePage, priceCard, linksCard } = require('./pages');
const { buildGuides } = require('./articles');
const homeL = require('./homeL');
const $ = n => `US$ ${n}`;

const home = homeL('es', {
  title: 'Agente Registrado en Florida y Formación de Empresas | The Business Clerk',
  desc: `Abre tu LLC en Florida por ${$(P.formation)} con tarifa estatal incluida. Agente registrado por ${$(P.raAnnual)}/año, reporte anual y dirección comercial. En español.`,
  kicker: 'Agente registrado y formación de empresas en Florida',
  h1: 'Tu empresa en Florida: registrada, al día y lista para crecer.',
  lead: 'Formamos tu LLC, somos tu agente registrado, presentamos tu reporte anual y le damos a tu empresa una dirección real en Florida. Una sola oficina, precios claros y personas reales que te responden en español.',
  start: 'es/empezar.html', cta1: 'Abrir mi empresa', raHref: 'es/agente-registrado-florida.html', cta2: 'Agente registrado',
  checks: [`LLC en Florida por ${$(P.formation)}, con tarifa estatal y primer año de agente incluidos`, `Agente registrado por ${$(P.raAnnual)} al año`, 'Correo legal escaneado el mismo día hábil', 'Atención en español, inglés y portugués'],
  svcKicker: 'Lo que hacemos', svcH: 'Todo lo que una nueva empresa necesita, desde la formación hasta el primer cliente.', more: 'Más información →',
  svcP: 'En lugar de contratar a varios proveedores, resuelves todo en un solo lugar y mantienes tu empresa al día, año tras año.',
  services: [
    ['agent', 'Agente Registrado en Florida', 'Nuestra oficina en Florida recibe tu correo legal y del estado, lo escanea y te avisa el mismo día.', 'es/agente-registrado-florida.html', `${$(P.raAnnual)}/año`],
    ['form', 'Formación de LLC y Corporación', 'Presentamos tus Articles ante la División de Corporaciones de Florida y somos tu agente registrado.', 'es/abrir-llc-en-florida.html', `${$(P.formation)} todo incluido`],
    ['globe', 'Emprendedores Internacionales', '¿Vives fuera de EE. UU.? Abre tu LLC en Florida a distancia, con EIN sin SSN.', 'es/emprendedores-internacionales.html', '100% remoto'],
    ['cal', 'Reporte Anual y Trámites', 'Reporte anual automático, enmiendas, cambio de agente, reinstalación y disolución.', 'es/precios.html', `Reporte anual ${$(P.annualReport)}`, 'Ver precios →'],
    ['mail', 'Dirección Comercial y Correo', 'Dirección comercial en Florida con escaneo y reenvío de correo.', 'es/precios.html', `${$(P.mailBasic)}/mes`, 'Ver precios →'],
    ['launch', 'Paquete de Lanzamiento', 'Búsqueda de nombre y marca, dominio, correo profesional y sitio web de hasta 5 páginas, todo a tu nombre.', 'es/precios.html', `desde ${$(P.launch)}`, 'Ver precios →'],
  ],
  whyKicker: 'Por qué elegirnos', whyH: 'Una oficina real en Florida.',
  whyP: ['Nuestro equipo está en la oficina todos los días hábiles, incluso en el horario que la ley exige a los agentes registrados. Cuando llega una demanda o un aviso del estado, una persona lo recibe, lo registra, lo escanea y te avisa el mismo día.', 'Somos un equipo pequeño y especializado, y hablamos tu idioma.'],
  why: [['Aviso el mismo día', 'El correo legal se escanea y se sube a tu cuenta el día que llega.'], ['Privacidad', 'Nuestra dirección aparece en el registro público, no la de tu casa.'], ['Renovación automática', 'El agente registrado y el reporte anual se renuevan solos. No tienes que preocuparte por fechas límite.'], ['Precios fijos', 'Nuestras tarifas y las del estado se muestran por separado. Sin sorpresas.']],
  stepsKicker: 'Cómo funciona', stepsH: 'Cuatro pasos para tener tu empresa activa en Florida.',
  steps: [['Elige el servicio', 'Formación, agente registrado, trámites o paquete de lanzamiento.'], ['Cuéntanos sobre tu empresa', 'Un formulario corto, sin lenguaje legal complicado.'], ['Presentamos ante Florida', 'Revisamos, presentamos y damos seguimiento ante la División de Corporaciones.'], ['Recibe tus documentos', 'Tus documentos presentados y tu correo quedan en tu cuenta.']],
  priceKicker: 'Precios', priceH: 'Precios simples y publicados.', priceP: 'Las tarifas del estado de Florida se muestran por separado, excepto cuando el paquete indica que están incluidas.', popular: 'El más elegido',
  plans: [
    { h: 'Formación de LLC en Florida', price: $(P.formation), unit: 'pago único', items: ['Articles of Organization presentados', `Tarifa estatal (US$ ${F.llcArticles}) incluida`, 'Primer año de agente registrado', `EIN opcional: ${$(P.ein)}`], href: 'es/empezar.html', btn: 'Abrir mi LLC' },
    { h: 'Agente Registrado en Florida', price: $(P.raAnnual), unit: 'por año', items: ['Dirección del agente en Florida', 'Escaneo el mismo día', 'Renovación automática', `Reporte anual automático: ${$(P.annualReport)} + tarifa estatal`], href: 'es/agente-registrado-florida.html', btn: 'Contratar agente' },
    { h: 'Dirección y Correo', price: $(P.mailBasic), unit: 'por mes', items: ['Dirección comercial en Florida', 'Escaneo de correo', 'Reenvío al costo postal', 'Recepción de paquetes'], href: 'es/precios.html', btn: 'Ver detalles' },
  ],
  pricingHref: 'es/precios.html', allPrices: 'Ver la lista completa de precios →',
  faqKicker: 'Dudas', faqH: 'Preguntas frecuentes', faqP: '¿No encuentras tu respuesta? Escríbenos a hello@thebusinessclerk.com.',
  faqs: [
    ['¿Qué hace un agente registrado en Florida?', 'El agente registrado es la persona o empresa designada en los registros del estado para recibir demandas y avisos oficiales en nombre de tu empresa. Toda LLC y corporación de Florida debe tener uno, con dirección física en el estado. [Lee la guía completa](es/guias/que-es-un-agente-registrado.html).'],
    ['¿Necesito vivir en EE. UU. para abrir una LLC en Florida?', 'No. Los extranjeros pueden ser dueños de una LLC en Florida. Solo necesitas un agente registrado con dirección en Florida, que nosotros te damos. [Mira cómo funciona](es/emprendedores-internacionales.html).'],
    [`¿Qué incluyen los ${$(P.formation)}?`, `La presentación de los Articles of Organization, la tarifa estatal de Florida (US$ ${F.llcArticles}) y el primer año de agente registrado. El EIN es opcional, por ${$(P.ein)}.`],
    ['¿Cuándo vence el reporte anual de Florida?', `Entre el 1 de enero y el 1 de mayo de cada año. Después del 1 de mayo, la tarifa de una LLC sube de US$ ${F.llcAnnual} a US$ ${F.llcAnnualLate}. Con la renovación automática, lo presentamos por ti antes de la fecha límite.`],
  ],
});

const ra = servicePage({
  lang: 'es', path: 'es/agente-registrado-florida.html', service: 'Agente Registrado en Florida', offer: P.raAnnual,
  title: `Agente Registrado en Florida por ${$(P.raAnnual)}/año | The Business Clerk`,
  desc: `Agente registrado en Florida por ${$(P.raAnnual)} al año: oficina con personal, escaneo el mismo día y reporte anual automático. Atención en español.`,
  kicker: 'Agente registrado', h1: 'Agente registrado en Florida', crumb: 'Agente Registrado',
  lead: `Una oficina con personal en Florida que recibe tu correo legal y del estado y lo escanea el mismo día hábil, por ${$(P.raAnnual)} al año.`,
  cta: 'Contratar agente registrado',
  content: `
## Qué hace un agente registrado
Toda LLC y corporación de Florida debe designar un **agente registrado** (registered agent) con dirección física en el estado. El agente recibe **notificaciones de demandas** (service of process) y avisos oficiales del estado de Florida en nombre de la empresa. El nombre y la dirección del agente son públicos en el registro de la empresa en Sunbiz.
La ley de Florida exige que la oficina del agente esté abierta, con alguien disponible para recibir documentos legales, al menos de 10 a. m. a 12 p. m. y de 2 p. m. a 4 p. m. todos los días hábiles. Nuestra oficina funciona el día hábil completo.
## Qué incluye
- **Nuestra dirección en Florida** como oficina registrada de tu empresa
- **Escaneo el mismo día** de demandas y avisos del estado, con alerta por correo electrónico
- **Atención urgente**: las demandas y avisos del gobierno se marcan como urgentes y te contactamos de inmediato
- **Renovación automática**: tu empresa nunca se queda sin agente
- **Reporte anual automático** cada año antes del 1 de mayo, por ${$(P.annualReport)} más la tarifa estatal (US$ ${F.llcAnnual} para LLC), que se cobra al presentarlo
- Puedes desactivar la renovación automática cuando quieras
## ¿Por qué no usar tu propia dirección?
Si vives en Florida puedes ser tu propio agente, pero la dirección de tu casa queda pública y debes estar disponible todos los días hábiles. Si no recibes una demanda, un tribunal puede fallar en contra de tu empresa sin que te defiendas. Si olvidas el reporte anual, el estado puede disolver la empresa.
## Cambiar de agente es fácil
Hacemos el cambio por ti sin costo de servicio al contratarnos como agente. La tarifa del estado es de US$ ${F.llcRaChange} para LLC y US$ ${F.corpRaChange} para corporaciones.`,
  aside: rel => priceCard('Agente Registrado', $(P.raAnnual), 'por año', ['Dirección de oficina registrada', 'Escaneo el mismo día', 'Alertas urgentes', 'Renovación automática', `Reporte anual: ${$(P.annualReport)} + tarifa estatal`], 'es/empezar.html', 'Contratar', rel) + linksCard('Guías', [['es/guias/que-es-un-agente-registrado.html', '¿Qué es un agente registrado?'], ['es/guias/como-abrir-una-llc-en-florida.html', 'Cómo abrir una LLC en Florida']], rel),
  faqs: [
    ['¿Quién puede ser agente registrado en Florida?', 'Una persona que vive en Florida o una empresa autorizada para operar en el estado, con dirección física en Florida. La empresa no puede ser su propio agente y no se aceptan apartados postales.'],
    ['¿Puedo usar la dirección del agente como dirección comercial?', 'La dirección del agente es para documentos legales y del estado. Para el correo del día a día, usa nuestro plan de Dirección y Correo.'],
    ['¿Cómo funciona el reporte anual?', `Es automático. Cada año, antes del 1 de mayo, presentamos tu reporte anual y cobramos ${$(P.annualReport)} más la tarifa estatal. No tienes que hacer nada y puedes desactivarlo cuando quieras.`],
  ],
});

const llc = servicePage({
  lang: 'es', path: 'es/abrir-llc-en-florida.html', service: 'Formación de LLC en Florida', offer: P.formation,
  title: `Abrir una LLC en Florida por ${$(P.formation)} con Tarifa Estatal | The Business Clerk`,
  desc: `Abre tu LLC en Florida por ${$(P.formation)}: Articles of Organization, tarifa estatal de US$ ${F.llcArticles} y primer año de agente registrado. En español.`,
  kicker: 'Formación de empresas', h1: 'Abre tu LLC o corporación en Florida', crumb: 'Abrir LLC',
  lead: `Un solo precio, sin sorpresas: ${$(P.formation)} incluyen la presentación, la tarifa del estado de Florida y el primer año de agente registrado.`,
  cta: 'Abrir mi empresa',
  content: `
## Qué incluye por ${$(P.formation)}
- **Búsqueda del nombre** en los registros de Florida
- **Articles of Organization** preparados y presentados ante la División de Corporaciones de Florida
- **Tarifa estatal** de US$ ${F.llcArticles} incluida
- **Modelo de acuerdo operativo** (operating agreement)
- **Primer año de agente registrado**, luego ${$(P.raAnnual)}/año
- **Entrega digital** de tus documentos en tu cuenta
Opcional: **solicitud del EIN** (número de identificación fiscal federal), ${$(P.ein)}.
No incluye: enmiendas, registro de nombre comercial (DBA), documentos legales personalizados ni asesoría fiscal.
## Corporación
¿Prefieres una corporación (Inc.)? El paquete cuesta **${$(P.formationCorp)}**, con la tarifa estatal de US$ ${F.corpArticles} y el primer año de agente registrado incluidos.
## Qué necesitamos de ti
- Nombre de la empresa (y una segunda opción)
- Dirección principal y de correo (puede ser nuestra dirección comercial)
- Nombres y direcciones de los socios o gerentes
- Si la LLC será administrada por los socios o por gerentes
## ¿Cuánto tarda?
Las presentaciones en línea en Florida suelen procesarse en pocos días hábiles. El EIN para quien no tiene SSN se solicita por fax o correo y puede tardar algunas semanas. No controlamos los tiempos del estado ni del IRS, pero presentamos todo rápido y te mantenemos informado.`,
  aside: rel => priceCard('Formación de LLC', $(P.formation), 'pago único', ['Articles of Organization', `Tarifa estatal (US$ ${F.llcArticles}) incluida`, 'Modelo de acuerdo operativo', 'Primer año de agente registrado', `EIN opcional: ${$(P.ein)}`], 'es/empezar.html', 'Abrir mi LLC', rel) + linksCard('Guías', [['es/guias/como-abrir-una-llc-en-florida.html', 'Cómo abrir una LLC en Florida'], ['es/guias/llc-en-florida-para-no-residentes.html', 'LLC en Florida para no residentes']], rel),
  faqs: [
    ['¿Cuánto cuesta abrir una LLC en Florida?', `La tarifa del estado es de US$ ${F.llcArticles} (US$ 100 de presentación más US$ 25 por la designación del agente registrado). Nuestro paquete de ${$(P.formation)} incluye esa tarifa, nuestro servicio y un año de agente registrado.`],
    ['¿Necesito un operating agreement?', 'Florida no exige presentarlo, pero es muy recomendable tener uno por escrito, y los bancos suelen pedirlo. Incluimos un modelo estándar; para cláusulas personalizadas, consulta a un abogado.'],
  ],
});

const intl = servicePage({
  lang: 'es', path: 'es/emprendedores-internacionales.html', service: 'Formación de LLC en Florida para no residentes', offer: P.formation,
  title: 'Abrir una Empresa en EE. UU. desde el Extranjero | The Business Clerk',
  desc: 'Abre una LLC en Florida desde cualquier país. Agente registrado, dirección en EE. UU., EIN sin SSN y atención en español.',
  kicker: 'Emprendedores internacionales', h1: 'Abre tu empresa en EE. UU. desde cualquier lugar del mundo', crumb: 'Emprendedores Internacionales',
  lead: 'No necesitas vivir en EE. UU. ni tener Seguro Social para ser dueño de una LLC en Florida. Nos encargamos de los trámites, la dirección y el papeleo, en español.',
  cta: 'Abrir mi empresa en EE. UU.',
  content: `
## Qué recibes
- **Formación de tu LLC en Florida** con la tarifa estatal incluida
- **Agente registrado** con oficina y personal en Florida
- **Solicitud del EIN** para quien no tiene SSN (opcional, ${$(P.ein)})
- **Dirección comercial en Florida** con escaneo de correo
- **Paquete de lanzamiento** opcional: dominio, correo y sitio web
## Lo que todo extranjero debe saber
- **EIN sin SSN**: el IRS procesa estas solicitudes por fax o correo, lo que puede tardar algunas semanas. Preparamos y enviamos el formulario por ti.
- **Cuenta bancaria**: algunos bancos estadounidenses exigen una visita en persona; otros abren cuentas en línea. Te explicamos los requisitos, pero no podemos garantizar la aprobación.
- **Obligaciones fiscales**: las LLC de un solo dueño extranjero generalmente deben presentar cada año el Formulario 5472 del IRS con un Formulario 1120 pro forma, aunque no tengan ingresos. La multa por no presentarlo puede llegar a US$ 25,000. Te referimos a un profesional de impuestos calificado.
- **Inmigración**: tener una empresa en EE. UU. no te da, por sí solo, derecho a vivir o trabajar en el país. Consulta con un abogado de inmigración.
> No somos un bufete de abogados ni una firma de contadores. Para asesoría legal, fiscal o migratoria, te referimos a profesionales independientes y autorizados.`,
  aside: rel => priceCard('LLC en Florida', $(P.formation), 'pago único', ['Tarifa estatal incluida', 'Primer año de agente registrado', `EIN sin SSN: +${$(P.ein)}`, 'Atención en español'], 'es/empezar.html', 'Empezar ahora', rel) + linksCard('Guías', [['es/guias/llc-en-florida-para-no-residentes.html', 'LLC en Florida para no residentes'], ['es/guias/que-es-un-agente-registrado.html', '¿Qué es un agente registrado?']], rel),
});

const pricing = servicePage({
  lang: 'es', path: 'es/precios.html',
  title: 'Precios: Agente Registrado y LLC en Florida | The Business Clerk',
  desc: `Precios publicados: agente registrado ${$(P.raAnnual)}/año, LLC en Florida ${$(P.formation)} con tarifa estatal, reporte anual ${$(P.annualReport)}, correo ${$(P.mailBasic)}/mes.`,
  kicker: 'Precios', h1: 'Precios simples y publicados', crumb: 'Precios',
  lead: 'Nuestras tarifas de servicio y las tarifas del estado de Florida siempre se muestran por separado, excepto cuando el paquete indica que la tarifa estatal está incluida.',
  content: `
## Formación de empresas
- **LLC en Florida: ${$(P.formation)}**, pago único. Nuestro servicio de ${$(P.formationService)}, la tarifa estatal de US$ ${F.llcArticles} y el primer año de agente registrado (${$(P.raAnnual)}). Incluye modelo de acuerdo operativo.
- **Corporación en Florida: ${$(P.formationCorp)}**, pago único. Nuestro servicio de ${$(P.formationService)}, la tarifa estatal de US$ ${F.corpArticles} y el primer año de agente registrado.
- **Solicitud del EIN (opcional): ${$(P.ein)}**
## Mantenimiento anual
- **Agente registrado en Florida: ${$(P.raAnnual)}/año**
- **Reporte anual: ${$(P.annualReport)}** por presentación, más la tarifa estatal (US$ ${F.llcAnnual} LLC, US$ ${F.corpAnnual} corporación)
> El agente registrado y el reporte anual se renuevan automáticamente, para que tu empresa esté siempre al día sin que tengas que hacer nada. Puedes desactivar la renovación automática cuando quieras.
## Dirección y correo
- Dirección comercial y escaneo: **${$(P.mailBasic)}/mes** (reenvío al costo postal)
## Lanzamiento
- **Paquete de lanzamiento: desde ${$(P.launch)}** (búsqueda de nombre y marca, dominio, correo profesional con Google Workspace o Microsoft 365 y sitio web de hasta 5 páginas). Los costos de terceros los pagas directamente.
## Otros trámites
Tarifa de servicio; las tarifas del estado de Florida se cobran aparte.
- Cambio de agente registrado: **US$ 0** al contratarnos como agente
- Enmienda de los Articles (Articles of Amendment): **US$ 85**
- Reporte anual enmendado: **US$ 65**
- Cambio de dirección: **US$ 65**
- Nombre comercial (DBA): **US$ 75**
- Certificate of Status: **US$ 25**
- Copia certificada: **US$ 35**
- Disolución de LLC: **US$ 95**
- Reinstalación: **desde US$ 175**
- Registro de empresa extranjera en Florida: **US$ ${P.formationService}**`,
});

const start = servicePage({
  lang: 'es', path: 'es/empezar.html', noCta: true,
  title: 'Empezar: Abre Tu Empresa en Florida | The Business Clerk',
  desc: 'Abre tu LLC en Florida, contrata nuestro agente registrado o solicita un trámite. Cuéntanos qué necesitas y nos encargamos del resto.',
  kicker: 'Empezar', h1: 'Registremos tu empresa', crumb: 'Empezar',
  lead: 'Cuéntanos qué necesitas. Confirmamos los detalles y el precio exacto, incluidas las tarifas del estado, antes de presentar cualquier cosa.',
  content: '## Tu solicitud',
  extra: () => `<form data-mail="Nueva solicitud (ES)">
<label>¿Qué necesitas?<select name="Servicio" required><option>Formación de LLC en Florida (${$(P.formation)})</option><option>Formación de corporación (${$(P.formationCorp)})</option><option>Agente registrado (${$(P.raAnnual)}/año)</option><option>Cambiar mi agente registrado</option><option>Reporte anual (${$(P.annualReport)} + tarifa estatal)</option><option>EIN (${$(P.ein)})</option><option>Dirección y correo</option><option>Paquete de lanzamiento</option><option>Otro trámite</option></select></label>
<label>Nombre completo<input name="Nombre" required autocomplete="name"></label>
<label>Correo electrónico<input name="Email" type="email" required autocomplete="email"></label>
<label>Teléfono / WhatsApp<input name="Telefono" type="tel" autocomplete="tel"></label>
<label>Nombre de la empresa (o el nombre que quieres)<input name="Empresa"></label>
<label>País donde vives<input name="Pais" autocomplete="country-name"></label>
<label>¿Algo más que debamos saber?<textarea name="Notas"></textarea></label>
<button class="btn primary" type="submit">Preparar mi solicitud</button>
<div class="formmsg" role="status">Tu solicitud está lista. <a href="#">Ábrela en tu aplicación de correo</a> para enviarla, o envía los detalles a <strong>${C.email}</strong>.</div>
</form>`,
});

const guides = buildGuides([
{
  slug: 'que-es-un-agente-registrado', cat: 'Agente registrado',
  title: '¿Qué Es un Agente Registrado en Florida?',
  h1: '¿Qué es un agente registrado en Florida?',
  desc: 'Qué hace un agente registrado (registered agent) en Florida, quién puede serlo, el horario que exige la ley y si conviene ser tu propio agente.',
  summary: 'Quién puede serlo, qué hace, el horario que exige Florida y cuánto cuesta.',
  body: `
El **agente registrado** (registered agent) es la persona o empresa que tu empresa designa para recibir documentos legales y avisos oficiales del estado. En Florida, toda LLC y corporación debe tener uno, y su nombre y dirección aparecen en el registro público de la empresa en Sunbiz.
## ¿Qué hace un agente registrado?
- Recibe **notificaciones de demandas** (service of process), la entrega formal de una demanda contra tu empresa
- Recibe avisos oficiales del Departamento de Estado de Florida
- Te envía esos documentos rápidamente
## ¿Quién puede ser agente registrado en Florida?
- una persona que vive en Florida, o
- una empresa autorizada para operar en Florida.
El agente debe tener una **dirección física en Florida**; no se aceptan apartados postales. La empresa no puede ser su propio agente.
## ¿Qué horario debe cumplir?
La ley de Florida exige que la oficina registrada esté abierta, con alguien disponible para recibir documentos legales, **al menos de 10 a. m. a 12 p. m. y de 2 p. m. a 4 p. m.**, todos los días excepto fines de semana y feriados.
## ¿Puedo ser mi propio agente?
Sí, si vives en Florida y puedes cumplir ese horario. Pero la dirección de tu casa queda pública, y si estás de viaje cuando llega una demanda, podrías perder el plazo para defenderte.
## ¿Cuánto cuesta?
Los agentes registrados comerciales en Florida suelen cobrar entre US$ 49 y US$ 300 al año. Nuestro servicio cuesta **${$(P.raAnnual)} al año**, con renovación automática. [Conoce el servicio](es/agente-registrado-florida.html).`,
},
{
  slug: 'como-abrir-una-llc-en-florida', cat: 'Formación de empresas',
  title: 'Cómo Abrir una LLC en Florida: Paso a Paso',
  h1: 'Cómo abrir una LLC en Florida: paso a paso',
  desc: `Cómo abrir una LLC en Florida paso a paso: nombre, agente registrado, Articles of Organization (US$ ${F.llcArticles}), EIN y reporte anual.`,
  summary: 'Nombre, agente registrado, Articles of Organization, EIN y lo que sigue.',
  body: `
Abrir una LLC en Florida es un proceso sencillo. Aquí tienes cada paso y lo que cuesta.
## 1. Elige el nombre
El nombre debe distinguirse de los ya registrados en Florida y terminar en "Limited Liability Company", "LLC" o "L.L.C.". Busca en los registros de la División de Corporaciones antes de decidir.
## 2. Designa un agente registrado
Toda LLC de Florida necesita un [agente registrado](es/guias/que-es-un-agente-registrado.html) con dirección física en el estado y disponible en horario hábil.
## 3. Presenta los Articles of Organization
Se presentan ante la División de Corporaciones de Florida. La tarifa del estado es de **US$ ${F.llcArticles}** (US$ 100 de presentación más US$ 25 por la designación del agente).
## 4. Obtén el EIN
El EIN (Employer Identification Number) es el número fiscal federal de la empresa, emitido por el IRS. Lo necesitas para abrir una cuenta bancaria y contratar empleados. La solicitud ante el IRS es gratuita.
## 5. Prepara un acuerdo operativo
Florida no exige presentarlo, pero un operating agreement por escrito define la participación de cada socio y cómo se toman las decisiones. Los bancos suelen pedirlo.
## 6. Mantén tu empresa al día
- Presenta el **reporte anual entre el 1 de enero y el 1 de mayo** de cada año, a partir del año siguiente a la formación
- Mantén tu agente registrado activo
- Verifica si tu ciudad o condado exige una licencia local
## ¿Quieres que lo hagamos por ti?
Nuestro paquete de **${$(P.formation)}** incluye la tarifa estatal, la presentación y el primer año de agente registrado. [Abrir mi LLC](es/abrir-llc-en-florida.html).`,
},
{
  slug: 'llc-en-florida-para-no-residentes', cat: 'Internacional',
  title: 'LLC en Florida para No Residentes: Guía para Extranjeros',
  h1: 'LLC en Florida para no residentes: guía para extranjeros',
  desc: '¿Un extranjero puede abrir una LLC en Florida? Sí. Esto es lo que necesitas: agente registrado, dirección, EIN sin SSN, cuenta bancaria y obligaciones fiscales.',
  summary: 'Agente registrado, EIN sin SSN, cuenta bancaria y el Formulario 5472.',
  body: `
No necesitas ser ciudadano ni residente de EE. UU. para ser dueño de una LLC en Florida. Muchos emprendedores latinoamericanos eligen Florida por su gran comunidad hispanohablante, sus reglas sencillas para las LLC y porque el estado no cobra impuesto sobre la renta a personas físicas.
## Lo que necesitas
- Un **agente registrado** con dirección física en Florida (no puede ser una dirección en el extranjero)
- Una **dirección de correo** para la empresa, que puede ser un servicio de dirección comercial en EE. UU.
- El **nombre de la empresa** y los datos de los socios o gerentes
## Cómo obtener el EIN sin SSN
Sin número de Seguro Social no puedes usar la solicitud en línea del IRS. Debes enviar el Formulario SS-4 por fax o correo, lo que puede tardar algunas semanas. No necesitas un ITIN solo para obtener el EIN de tu LLC.
## Cómo abrir una cuenta bancaria en EE. UU.
Los requisitos varían. Algunos bancos exigen una visita en persona; algunos bancos digitales y fintechs aceptan socios no residentes a distancia. Ten a mano los Articles presentados, la carta del EIN, el operating agreement y tu pasaporte.
## Obligaciones fiscales
Una LLC de un solo dueño extranjero generalmente debe presentar cada año el **Formulario 5472** del IRS con un Formulario 1120 pro forma, aunque no tenga ingresos. La multa por no presentarlo puede llegar a US$ 25,000. Trabaja con un profesional de impuestos calificado.
## ¿Tener una empresa en EE. UU. me da una visa?
No. Ser dueño de una empresa en EE. UU. no te da, por sí solo, derecho a vivir o trabajar en el país. Consulta con un abogado de inmigración.
## Te ayudamos en español
Formamos tu LLC, somos tu agente registrado, solicitamos tu EIN y te damos una dirección comercial en Florida. [Emprendedores internacionales](es/emprendedores-internacionales.html).`,
},
], 'es', 'es/guias', {
  title: 'Guías para Abrir y Mantener Tu Empresa en Florida | The Business Clerk',
  desc: 'Guías en español sobre agente registrado, cómo abrir una LLC en Florida y cómo abrir una empresa en EE. UU. desde el extranjero.',
  h1: 'Guías sobre empresas en Florida', lead: 'Respuestas claras, en español, sobre cómo abrir y mantener una empresa en Florida.',
  asideText: 'Formación de LLC en Florida con tarifa estatal y primer año de agente registrado incluidos.',
});

module.exports = [{ path: 'es/index.html', html: home }, ra, llc, intl, pricing, start, ...guides];
