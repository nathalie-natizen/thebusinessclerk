const C = require('./config');
const P = C.prices, F = C.stateFees;
const { servicePage, priceCard, linksCard } = require('./pages');
const { buildGuides } = require('./articles');
const homeL = require('./homeL');
const $ = n => `US$ ${n}`;

const home = homeL('pt', {
  title: 'Agente Registrado na Flórida e Abertura de Empresas | The Business Clerk',
  desc: `Abra sua LLC na Flórida por ${$(P.formation)} com taxa estadual incluída. Agente registrado por ${$(P.raAnnual)}/ano, relatório anual e endereço comercial. Em português.`,
  kicker: 'Agente registrado e abertura de empresas na Flórida',
  h1: 'Sua empresa na Flórida: aberta, registrada e pronta para começar.',
  lead: 'Abrimos sua LLC, atuamos como seu agente registrado, enviamos seu relatório anual e damos à sua empresa um endereço real na Flórida. Um só escritório, preços claros e gente de verdade que responde em português.',
  start: 'pt/comecar.html', cta1: 'Abrir minha empresa', raHref: 'pt/agente-registrado-florida.html', cta2: 'Agente registrado',
  checks: [`LLC na Flórida por ${$(P.formation)}, com taxa estadual e 1º ano de agente incluídos`, `Agente registrado por ${$(P.raAnnual)} por ano`, 'Correspondência legal digitalizada no mesmo dia útil', 'Atendimento em português, inglês e espanhol'],
  svcKicker: 'O que fazemos', svcH: 'Tudo o que uma nova empresa precisa, da abertura ao primeiro cliente.', more: 'Saiba mais →',
  svcP: 'Em vez de contratar vários fornecedores, você resolve tudo em um só lugar e mantém sua empresa em dia, ano após ano.',
  services: [
    ['agent', 'Agente Registrado na Flórida', 'Nosso escritório na Flórida recebe sua correspondência legal e do estado, digitaliza e avisa você no mesmo dia.', 'pt/agente-registrado-florida.html', `${$(P.raAnnual)}/ano`],
    ['form', 'Abertura de LLC e Corporação', 'Registramos seus Articles na Divisão de Corporações da Flórida e atuamos como seu agente registrado.', 'pt/abrir-llc-na-florida.html', `${$(P.formation)} tudo incluído`],
    ['globe', 'Empreendedores Internacionais', 'Mora fora dos EUA? Abra sua LLC na Flórida à distância, com EIN sem SSN.', 'pt/empreendedores-internacionais.html', '100% remoto'],
    ['cal', 'Relatório Anual e Registros', 'Relatório anual automático, alterações, troca de agente, reativação e encerramento.', 'pt/precos.html', `Relatório anual ${$(P.annualReport)}`, 'Ver preços →'],
    ['mail', 'Endereço Comercial e Correspondência', 'Endereço comercial na Flórida com digitalização e reenvio de correspondência.', 'pt/precos.html', `${$(P.mailBasic)}/mês`, 'Ver preços →'],
    ['launch', 'Pacote de Lançamento', 'Pesquisa de nome e marca, domínio, e-mail profissional e site de até 5 páginas, tudo no seu nome.', 'pt/precos.html', `a partir de ${$(P.launch)}`, 'Ver preços →'],
  ],
  whyKicker: 'Por que nos escolher', whyH: 'Um escritório de verdade na Flórida.',
  whyP: ['Nossa equipe fica no escritório todos os dias úteis, inclusive nos horários exigidos por lei para agentes registrados. Quando chega uma citação judicial ou um aviso do estado, uma pessoa recebe, registra, digitaliza e avisa você no mesmo dia.', 'Somos uma equipe pequena e especializada, e falamos a sua língua.'],
  why: [['Aviso no mesmo dia', 'Correspondência legal digitalizada e enviada para sua conta no dia em que chega.'], ['Privacidade', 'Nosso endereço aparece no registro público, e não o da sua casa.'], ['Renovação automática', 'Agente registrado e relatório anual renovam automaticamente. Você não precisa se preocupar com prazos.'], ['Preços fixos', 'Nossas taxas e as taxas do estado aparecem separadas. Sem surpresas.']],
  stepsKicker: 'Como funciona', stepsH: 'Quatro passos até sua empresa ativa na Flórida.',
  steps: [['Escolha o serviço', 'Abertura, agente registrado, registros ou pacote de lançamento.'], ['Conte sobre sua empresa', 'Um formulário curto, sem juridiquês.'], ['Registramos na Flórida', 'Revisamos, enviamos e acompanhamos o registro na Divisão de Corporações.'], ['Receba seus documentos', 'Documentos registrados e correspondências ficam na sua conta.']],
  priceKicker: 'Preços', priceH: 'Preços simples e publicados.', priceP: 'As taxas do estado da Flórida aparecem separadas, exceto quando o pacote diz que estão incluídas.', popular: 'Mais escolhido',
  plans: [
    { h: 'Abertura de LLC na Flórida', price: $(P.formation), unit: 'pagamento único', items: ['Articles of Organization registrados', `Taxa estadual (US$ ${F.llcArticles}) incluída`, '1º ano de agente registrado', `EIN opcional: ${$(P.ein)}`], href: 'pt/comecar.html', btn: 'Abrir minha LLC' },
    { h: 'Agente Registrado na Flórida', price: $(P.raAnnual), unit: 'por ano', items: ['Endereço do agente na Flórida', 'Digitalização no mesmo dia', 'Renovação automática', `Relatório anual automático: ${$(P.annualReport)} + taxa estadual`], href: 'pt/agente-registrado-florida.html', btn: 'Contratar agente' },
    { h: 'Endereço e Correspondência', price: $(P.mailBasic), unit: 'por mês', items: ['Endereço comercial na Flórida', 'Digitalização de correspondência', 'Reenvio pelo custo postal', 'Recebimento de pacotes'], href: 'pt/precos.html', btn: 'Ver detalhes' },
  ],
  pricingHref: 'pt/precos.html', allPrices: 'Ver a tabela completa de preços →',
  faqKicker: 'Dúvidas', faqH: 'Perguntas frequentes', faqP: 'Não encontrou sua resposta? Escreva para hello@thebusinessclerk.com.',
  faqs: [
    ['O que faz um agente registrado na Flórida?', 'O agente registrado é a pessoa ou empresa indicada nos registros do estado para receber citações judiciais e avisos oficiais em nome da sua empresa. Toda LLC e corporação da Flórida precisa ter um, com endereço físico no estado. [Leia o guia completo](pt/guias/o-que-e-agente-registrado.html).'],
    ['Preciso morar nos EUA para abrir uma LLC na Flórida?', 'Não. Estrangeiros podem ser donos de uma LLC na Flórida. Você só precisa de um agente registrado com endereço na Flórida, que nós fornecemos. [Veja como funciona](pt/empreendedores-internacionais.html).'],
    [`O que está incluído nos ${$(P.formation)}?`, `O registro dos Articles of Organization, a taxa estadual da Flórida (US$ ${F.llcArticles}) e o primeiro ano de agente registrado. O EIN é opcional, por ${$(P.ein)}.`],
    ['Quando vence o relatório anual da Flórida?', `Entre 1º de janeiro e 1º de maio de cada ano. Depois de 1º de maio, a taxa de uma LLC sobe de US$ ${F.llcAnnual} para US$ ${F.llcAnnualLate}. Com a renovação automática, nós enviamos por você antes do prazo.`],
  ],
});

const ra = servicePage({
  lang: 'pt', path: 'pt/agente-registrado-florida.html', service: 'Agente Registrado na Flórida', offer: P.raAnnual,
  title: `Agente Registrado na Flórida por ${$(P.raAnnual)}/ano | The Business Clerk`,
  desc: `Agente registrado na Flórida por ${$(P.raAnnual)} por ano: escritório com equipe, digitalização no mesmo dia e relatório anual automático. Atendimento em português.`,
  kicker: 'Agente registrado', h1: 'Agente registrado na Flórida', crumb: 'Agente Registrado',
  lead: `Um escritório com equipe na Flórida que recebe sua correspondência legal e do estado e digitaliza no mesmo dia útil, por ${$(P.raAnnual)} por ano.`,
  cta: 'Contratar agente registrado',
  content: `
## O que faz um agente registrado
Toda LLC e corporação da Flórida precisa nomear um **agente registrado** (registered agent) com endereço físico no estado. O agente recebe **citações judiciais** (service of process) e avisos oficiais do estado da Flórida em nome da empresa. O nome e o endereço do agente ficam públicos no registro da empresa no Sunbiz.
A lei da Flórida exige que o escritório do agente fique aberto, com alguém disponível para receber documentos legais, pelo menos das 10h ao meio-dia e das 14h às 16h em todos os dias úteis. Nosso escritório funciona o dia útil inteiro.
## O que está incluído
- **Nosso endereço na Flórida** como escritório registrado da sua empresa
- **Digitalização no mesmo dia** de citações e avisos do estado, com alerta por e-mail
- **Tratamento urgente**: processos e avisos do governo são sinalizados e você é contatado na hora
- **Renovação automática**: sua empresa nunca fica sem agente
- **Relatório anual automático** todo ano antes de 1º de maio, por ${$(P.annualReport)} mais a taxa estadual (US$ ${F.llcAnnual} para LLC), cobrado no momento do envio
- Você pode desativar a renovação automática quando quiser
## Por que não usar seu próprio endereço?
Se você mora na Flórida, pode ser seu próprio agente, mas o endereço da sua casa fica público e você precisa estar disponível todos os dias úteis. Se perder uma citação, a Justiça pode decidir contra sua empresa sem que você se defenda. Se esquecer o relatório anual, o estado pode dissolver a empresa.
## Trocar de agente é simples
Fazemos a troca para você, sem custo de serviço ao nos contratar como agente. A taxa do estado é de US$ ${F.llcRaChange} para LLC e US$ ${F.corpRaChange} para corporação.`,
  aside: rel => priceCard('Agente Registrado', $(P.raAnnual), 'por ano', ['Endereço do escritório registrado', 'Digitalização no mesmo dia', 'Alertas urgentes', 'Renovação automática', `Relatório anual: ${$(P.annualReport)} + taxa estadual`], 'pt/comecar.html', 'Contratar', rel) + linksCard('Guias', [['pt/guias/o-que-e-agente-registrado.html', 'O que é um agente registrado?'], ['pt/guias/como-abrir-llc-na-florida.html', 'Como abrir uma LLC na Flórida']], rel),
  faqs: [
    ['Quem pode ser agente registrado na Flórida?', 'Uma pessoa que mora na Flórida ou uma empresa autorizada a operar no estado, com endereço físico na Flórida. A própria empresa não pode ser seu agente, e caixa postal não é aceita.'],
    ['Posso usar o endereço do agente como endereço comercial?', 'O endereço do agente é para documentos legais e do estado. Para a correspondência do dia a dia, use nosso plano de Endereço e Correspondência.'],
    ['Como funciona o relatório anual?', `É automático. Todo ano, antes de 1º de maio, enviamos seu relatório anual e cobramos ${$(P.annualReport)} mais a taxa estadual. Você não precisa fazer nada e pode desativar quando quiser.`],
  ],
});

const llc = servicePage({
  lang: 'pt', path: 'pt/abrir-llc-na-florida.html', service: 'Abertura de LLC na Flórida', offer: P.formation,
  title: `Abrir LLC na Flórida por ${$(P.formation)} com Taxa Estadual | The Business Clerk`,
  desc: `Abra sua LLC na Flórida por ${$(P.formation)}: registro dos Articles of Organization, taxa estadual de US$ ${F.llcArticles} e 1º ano de agente registrado. Atendimento em português.`,
  kicker: 'Abertura de empresas', h1: 'Abra sua LLC ou corporação na Flórida', crumb: 'Abrir LLC',
  lead: `Um preço só, sem surpresas: ${$(P.formation)} incluem o registro, a taxa do estado da Flórida e o primeiro ano de agente registrado.`,
  cta: 'Abrir minha empresa',
  content: `
## O que está incluído por ${$(P.formation)}
- **Pesquisa do nome** nos registros da Flórida
- **Articles of Organization** preparados e registrados na Divisão de Corporações da Flórida
- **Taxa estadual** de US$ ${F.llcArticles} incluída
- **Modelo de acordo operacional** (operating agreement)
- **Primeiro ano de agente registrado**, depois ${$(P.raAnnual)}/ano
- **Entrega digital** dos documentos registrados na sua conta
Opcional: **solicitação do EIN** (número de identificação fiscal federal), ${$(P.ein)}.
Não incluído: alterações, registro de nome fantasia (DBA), documentos jurídicos personalizados e consultoria tributária.
## Corporação
Prefere uma corporação (Inc.)? O pacote custa **${$(P.formationCorp)}**, com a taxa estadual de US$ ${F.corpArticles} e o primeiro ano de agente registrado incluídos.
## O que precisamos de você
- Nome da empresa (e uma segunda opção)
- Endereço principal e de correspondência (pode ser o nosso endereço comercial)
- Nomes e endereços dos sócios ou administradores
- Se a LLC será administrada pelos sócios ou por administradores
## Quanto tempo leva?
Os registros online na Flórida costumam ser processados em poucos dias úteis. O EIN para quem não tem SSN é solicitado por fax ou correio e pode levar algumas semanas. Não controlamos os prazos do estado ou do IRS, mas enviamos tudo rapidamente e mantemos você informado.`,
  aside: rel => priceCard('Abertura de LLC', $(P.formation), 'pagamento único', ['Articles of Organization', `Taxa estadual (US$ ${F.llcArticles}) incluída`, 'Modelo de acordo operacional', '1º ano de agente registrado', `EIN opcional: ${$(P.ein)}`], 'pt/comecar.html', 'Abrir minha LLC', rel) + linksCard('Guias', [['pt/guias/como-abrir-llc-na-florida.html', 'Como abrir uma LLC na Flórida'], ['pt/guias/llc-na-florida-para-nao-residentes.html', 'LLC na Flórida para não residentes']], rel),
  faqs: [
    ['Quanto custa abrir uma LLC na Flórida?', `A taxa do estado é de US$ ${F.llcArticles} (US$ 100 de registro mais US$ 25 de designação do agente registrado). Nosso pacote de ${$(P.formation)} inclui essa taxa, nosso serviço e um ano de agente registrado.`],
    ['Preciso de um operating agreement?', 'A Flórida não exige que ele seja registrado, mas é muito recomendado ter um por escrito, e os bancos costumam pedir. Incluímos um modelo padrão; para cláusulas personalizadas, consulte um advogado.'],
  ],
});

const intl = servicePage({
  lang: 'pt', path: 'pt/empreendedores-internacionais.html', service: 'Abertura de LLC na Flórida para não residentes', offer: P.formation,
  title: 'Abrir Empresa nos EUA Morando no Brasil: LLC na Flórida | The Business Clerk',
  desc: 'Abra uma LLC na Flórida morando no Brasil ou em qualquer país. Agente registrado, endereço nos EUA, EIN sem SSN e atendimento em português.',
  kicker: 'Empreendedores internacionais', h1: 'Abra sua empresa nos EUA de qualquer lugar do mundo', crumb: 'Empreendedores Internacionais',
  lead: 'Você não precisa morar nos EUA nem ter Social Security para ser dono de uma LLC na Flórida. Cuidamos dos registros, do endereço e da papelada, em português.',
  cta: 'Abrir minha empresa nos EUA',
  content: `
## O que você recebe
- **Abertura da LLC na Flórida** com a taxa estadual incluída
- **Agente registrado** com escritório e equipe na Flórida
- **Solicitação do EIN** para quem não tem SSN (opcional, ${$(P.ein)})
- **Endereço comercial na Flórida** com digitalização da correspondência
- **Pacote de lançamento** opcional: domínio, e-mail e site
## O que todo estrangeiro deve saber
- **EIN sem SSN**: o IRS processa esses pedidos por fax ou correio, o que pode levar algumas semanas. Preparamos e enviamos o formulário para você.
- **Conta bancária**: alguns bancos americanos exigem visita presencial; outros abrem contas online. Explicamos os requisitos, mas não garantimos a aprovação.
- **Obrigações fiscais**: LLCs de um único sócio estrangeiro geralmente precisam enviar todo ano o Formulário 5472 do IRS com um Formulário 1120 pro forma, mesmo sem receita. A multa por não enviar pode chegar a US$ 25.000. Indicamos um profissional de impostos qualificado.
- **Imigração**: ter uma empresa nos EUA não dá, por si só, direito de morar ou trabalhar no país. Consulte um advogado de imigração.
> Não somos escritório de advocacia nem de contabilidade. Para orientação jurídica, tributária ou de imigração, indicamos profissionais independentes e habilitados.`,
  aside: rel => priceCard('LLC na Flórida', $(P.formation), 'pagamento único', ['Taxa estadual incluída', '1º ano de agente registrado', `EIN sem SSN: +${$(P.ein)}`, 'Atendimento em português'], 'pt/comecar.html', 'Começar agora', rel) + linksCard('Guias', [['pt/guias/llc-na-florida-para-nao-residentes.html', 'LLC na Flórida para não residentes'], ['pt/guias/o-que-e-agente-registrado.html', 'O que é um agente registrado?']], rel),
});

const pricing = servicePage({
  lang: 'pt', path: 'pt/precos.html',
  title: 'Preços: Agente Registrado e LLC na Flórida | The Business Clerk',
  desc: `Preços publicados: agente registrado ${$(P.raAnnual)}/ano, LLC na Flórida ${$(P.formation)} com taxa estadual, relatório anual ${$(P.annualReport)}, correspondência ${$(P.mailBasic)}/mês.`,
  kicker: 'Preços', h1: 'Preços simples e publicados', crumb: 'Preços',
  lead: 'Nossas taxas de serviço e as taxas do estado da Flórida aparecem sempre separadas, exceto quando o pacote diz que a taxa estadual está incluída.',
  content: `
## Abertura de empresa
- **LLC na Flórida: ${$(P.formation)}**, pagamento único. Nosso serviço de ${$(P.formationService)}, a taxa estadual de US$ ${F.llcArticles} e o primeiro ano de agente registrado (${$(P.raAnnual)}). Inclui modelo de acordo operacional.
- **Corporação na Flórida: ${$(P.formationCorp)}**, pagamento único. Nosso serviço de ${$(P.formationService)}, a taxa estadual de US$ ${F.corpArticles} e o primeiro ano de agente registrado.
- **Solicitação do EIN (opcional): ${$(P.ein)}**
## Manutenção anual
- **Agente registrado na Flórida: ${$(P.raAnnual)}/ano**
- **Relatório anual: ${$(P.annualReport)}** por envio, mais a taxa estadual (US$ ${F.llcAnnual} LLC, US$ ${F.corpAnnual} corporação)
> O agente registrado e o relatório anual renovam automaticamente, para sua empresa ficar sempre em dia sem você precisar fazer nada. Você pode desativar a renovação automática quando quiser.
## Endereço e correspondência
- Endereço comercial e digitalização: **${$(P.mailBasic)}/mês** (reenvio pelo custo postal)
## Lançamento
- **Pacote de lançamento: a partir de ${$(P.launch)}** (pesquisa de nome e marca, domínio, e-mail profissional com Google Workspace ou Microsoft 365 e site de até 5 páginas). Custos de terceiros pagos diretamente por você.
## Outros registros
Taxa de serviço; as taxas do estado da Flórida são cobradas à parte.
- Troca de agente registrado: **US$ 0** ao nos contratar como agente
- Alteração dos Articles (Articles of Amendment): **US$ 85**
- Relatório anual retificador: **US$ 65**
- Mudança de endereço: **US$ 65**
- Nome fantasia (DBA): **US$ 75**
- Certificate of Status: **US$ 25**
- Cópia autenticada: **US$ 35**
- Encerramento de LLC: **US$ 95**
- Reativação: **a partir de US$ 175**
- Registro de empresa estrangeira na Flórida: **US$ ${P.formationService}**`,
});

const start = servicePage({
  lang: 'pt', path: 'pt/comecar.html', noCta: true,
  title: 'Começar: Abra Sua Empresa na Flórida | The Business Clerk',
  desc: 'Abra sua LLC na Flórida, contrate nosso agente registrado ou peça um registro. Conte o que você precisa e cuidamos do resto.',
  kicker: 'Começar', h1: 'Vamos registrar sua empresa', crumb: 'Começar',
  lead: 'Conte o que você precisa. Confirmamos os detalhes e o preço exato, incluindo as taxas do estado, antes de registrar qualquer coisa.',
  content: '## Seu pedido',
  extra: () => `<form data-mail="Novo pedido (PT)">
<label>Do que você precisa?<select name="Servico" required><option>Abertura de LLC na Flórida (${$(P.formation)})</option><option>Abertura de corporação (${$(P.formationCorp)})</option><option>Agente registrado (${$(P.raAnnual)}/ano)</option><option>Trocar meu agente registrado</option><option>Relatório anual (${$(P.annualReport)} + taxa estadual)</option><option>EIN (${$(P.ein)})</option><option>Endereço e correspondência</option><option>Pacote de lançamento</option><option>Outro registro</option></select></label>
<label>Nome completo<input name="Nome" required autocomplete="name"></label>
<label>E-mail<input name="Email" type="email" required autocomplete="email"></label>
<label>Telefone / WhatsApp<input name="Telefone" type="tel" autocomplete="tel"></label>
<label>Nome da empresa (ou o nome desejado)<input name="Empresa"></label>
<label>País onde você mora<input name="Pais" autocomplete="country-name"></label>
<label>Algo mais que devemos saber?<textarea name="Observacoes"></textarea></label>
<button class="btn primary" type="submit">Preparar meu pedido</button>
<div class="formmsg" role="status">Seu pedido está pronto. <a href="#">Abra no seu aplicativo de e-mail</a> para enviar, ou mande os detalhes para <strong>${C.email}</strong>.</div>
</form>`,
});

const guides = buildGuides([
{
  slug: 'o-que-e-agente-registrado', cat: 'Agente registrado',
  title: 'O Que É Agente Registrado na Flórida?',
  h1: 'O que é um agente registrado na Flórida?',
  desc: 'O que faz um agente registrado (registered agent) na Flórida, quem pode ser, os horários exigidos e se vale a pena ser seu próprio agente.',
  summary: 'Quem pode ser, o que faz, os horários que a Flórida exige e quanto custa.',
  body: `
O **agente registrado** (registered agent) é a pessoa ou empresa que sua empresa indica para receber documentos legais e avisos oficiais do estado. Na Flórida, toda LLC e corporação precisa ter um, e o nome e o endereço do agente aparecem no registro público da empresa no Sunbiz.
## O que faz um agente registrado?
- Recebe **citações judiciais** (service of process), a entrega formal de um processo contra sua empresa
- Recebe avisos oficiais do Departamento de Estado da Flórida
- Encaminha esses documentos para você rapidamente
## Quem pode ser agente registrado na Flórida?
- uma pessoa que mora na Flórida, ou
- uma empresa autorizada a operar na Flórida.
O agente precisa ter um **endereço físico na Flórida**; caixa postal não vale. A própria empresa não pode ser seu agente.
## Quais horários o agente precisa cumprir?
A lei da Flórida exige que o escritório registrado fique aberto, com alguém disponível para receber documentos legais, **pelo menos das 10h ao meio-dia e das 14h às 16h**, todos os dias, exceto fins de semana e feriados.
## Posso ser meu próprio agente?
Sim, se você mora na Flórida e consegue cumprir esses horários. Mas o endereço da sua casa fica público, e se você estiver viajando quando chegar uma citação, pode perder o prazo de defesa.
## Quanto custa?
Agentes registrados comerciais na Flórida costumam cobrar entre US$ 49 e US$ 300 por ano. Nosso serviço custa **${$(P.raAnnual)} por ano**, com renovação automática. [Conheça o serviço](pt/agente-registrado-florida.html).`,
},
{
  slug: 'como-abrir-llc-na-florida', cat: 'Abertura de empresa',
  title: 'Como Abrir uma LLC na Flórida: Passo a Passo',
  h1: 'Como abrir uma LLC na Flórida: passo a passo',
  desc: `Como abrir uma LLC na Flórida passo a passo: nome, agente registrado, Articles of Organization (US$ ${F.llcArticles}), EIN e relatório anual.`,
  summary: 'Nome, agente registrado, Articles of Organization, EIN e o que vem depois.',
  body: `
Abrir uma LLC na Flórida é um processo simples. Veja cada etapa e quanto custa.
## 1. Escolha o nome
O nome precisa ser diferente dos já registrados na Flórida e terminar com "Limited Liability Company", "LLC" ou "L.L.C.". Pesquise nos registros da Divisão de Corporações antes de decidir.
## 2. Nomeie um agente registrado
Toda LLC da Flórida precisa de um [agente registrado](pt/guias/o-que-e-agente-registrado.html) com endereço físico no estado e disponível no horário comercial.
## 3. Registre os Articles of Organization
O registro é feito na Divisão de Corporações da Flórida. A taxa do estado é de **US$ ${F.llcArticles}** (US$ 100 de registro mais US$ 25 de designação do agente).
## 4. Tire o EIN
O EIN (Employer Identification Number) é o número fiscal federal da empresa, emitido pelo IRS. Você precisa dele para abrir conta bancária e contratar funcionários. A solicitação no IRS é gratuita.
## 5. Prepare um acordo operacional
A Flórida não exige o registro, mas um operating agreement por escrito define a participação de cada sócio e como as decisões são tomadas. Os bancos costumam pedir.
## 6. Mantenha a empresa em dia
- Envie o **relatório anual entre 1º de janeiro e 1º de maio** de cada ano, a partir do ano seguinte à abertura
- Mantenha seu agente registrado ativo
- Verifique se sua cidade ou condado exige licença local
## Quer que a gente faça?
Nosso pacote de **${$(P.formation)}** inclui a taxa estadual, o registro e o primeiro ano de agente registrado. [Abrir minha LLC](pt/abrir-llc-na-florida.html).`,
},
{
  slug: 'llc-na-florida-para-nao-residentes', cat: 'Internacional',
  title: 'LLC na Flórida para Não Residentes: Guia Completo',
  h1: 'LLC na Flórida para não residentes: guia para estrangeiros',
  desc: 'Estrangeiro pode abrir LLC na Flórida? Sim. Veja o que você precisa: agente registrado, endereço, EIN sem SSN, conta bancária e obrigações fiscais.',
  summary: 'Agente registrado, EIN sem SSN, conta bancária e o Formulário 5472.',
  body: `
Você não precisa ser cidadão nem residente dos EUA para ser dono de uma LLC na Flórida. Muitos brasileiros e latino-americanos escolhem a Flórida pela grande comunidade de língua portuguesa e espanhola, pelas regras simples para LLC e pela ausência de imposto de renda estadual sobre pessoa física.
## O que você precisa
- Um **agente registrado** com endereço físico na Flórida (não pode ser um endereço no exterior)
- Um **endereço de correspondência** para a empresa, que pode ser um serviço de endereço comercial nos EUA
- O **nome da empresa** e os dados dos sócios ou administradores
## Como tirar o EIN sem SSN
Sem o Social Security, não dá para usar o pedido online do IRS. É preciso enviar o Formulário SS-4 por fax ou correio, o que pode levar algumas semanas. Você não precisa de ITIN só para tirar o EIN da sua LLC.
## Como abrir conta bancária nos EUA
Os requisitos variam. Alguns bancos exigem visita presencial; alguns bancos digitais e fintechs aceitam sócios não residentes à distância. Tenha em mãos os Articles registrados, a carta do EIN, o operating agreement e o passaporte.
## Obrigações fiscais
Uma LLC de um único sócio estrangeiro geralmente precisa enviar todo ano o **Formulário 5472** do IRS com um Formulário 1120 pro forma, mesmo sem receita. A multa por não enviar pode chegar a US$ 25.000. Trabalhe com um profissional de impostos qualificado.
## Ter uma empresa nos EUA dá visto?
Não. Ser dono de uma empresa nos EUA não dá, por si só, direito de morar ou trabalhar no país. Consulte um advogado de imigração.
## Podemos ajudar, em português
Abrimos sua LLC, atuamos como seu agente registrado, solicitamos seu EIN e fornecemos um endereço comercial na Flórida. [Empreendedores internacionais](pt/empreendedores-internacionais.html).`,
},
], 'pt', 'pt/guias', {
  title: 'Guias para Abrir e Manter Sua Empresa na Flórida | The Business Clerk',
  desc: 'Guias em português sobre agente registrado, abertura de LLC na Flórida e como abrir empresa nos EUA morando fora.',
  h1: 'Guias sobre empresas na Flórida', lead: 'Respostas claras, em português, sobre como abrir e manter uma empresa na Flórida.',
  asideText: 'Abertura de LLC na Flórida com taxa estadual e 1º ano de agente registrado incluídos.',
});

module.exports = [{ path: 'pt/index.html', html: home }, ra, llc, intl, pricing, start, ...guides];
