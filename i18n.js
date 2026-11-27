// Equivalent pages across languages (used for hreflang and the language switcher)
const ALT = [
  { en: 'index.html', pt: 'pt/index.html', es: 'es/index.html' },
  { en: 'florida-registered-agent.html', pt: 'pt/agente-registrado-florida.html', es: 'es/agente-registrado-florida.html' },
  { en: 'florida-llc-formation.html', pt: 'pt/abrir-llc-na-florida.html', es: 'es/abrir-llc-en-florida.html' },
  { en: 'pricing.html', pt: 'pt/precos.html', es: 'es/precios.html' },
  { en: 'international-founders.html', pt: 'pt/empreendedores-internacionais.html', es: 'es/emprendedores-internacionales.html' },
  { en: 'get-started.html', pt: 'pt/comecar.html', es: 'es/empezar.html' },
  { en: 'resources/index.html', pt: 'pt/guias/index.html', es: 'es/guias/index.html' },
  { en: 'resources/what-is-a-registered-agent-florida.html', pt: 'pt/guias/o-que-e-agente-registrado.html', es: 'es/guias/que-es-un-agente-registrado.html' },
  { en: 'resources/how-to-form-an-llc-in-florida.html', pt: 'pt/guias/como-abrir-llc-na-florida.html', es: 'es/guias/como-abrir-una-llc-en-florida.html' },
  { en: 'resources/florida-llc-for-non-residents.html', pt: 'pt/guias/llc-na-florida-para-nao-residentes.html', es: 'es/guias/llc-en-florida-para-no-residentes.html' },
];
const altsFor = path => ALT.find(g => Object.values(g).includes(path)) || null;

const L = {
  en: {
    locale: 'en_US', home: 'Home', faq: 'Frequently asked questions', getStarted: 'Get started', portal: 'Client login', menu: 'Menu', skip: 'Skip to content',
    subtitle: 'Florida Registered Agent & Business Filings',
    nav: [{ label: 'Start a business', items: [['florida-llc-formation.html', 'Form a Florida LLC'], ['florida-corporation-formation.html', 'Form a Florida corporation'], ['international-founders.html', 'International founders']] }, { label: 'Stay compliant', items: [['compliance-pack.html', 'Annual Essentials Pack', 1], ['florida-registered-agent.html', 'Registered agent'], ['florida-annual-report.html', 'Annual report'], ['business-filings.html', 'Other Florida filings']] }, ['business-address-mail.html', 'Address & Mail'], ['pricing.html', 'Pricing'], ['resources/index.html', 'Guides']],
    ctaH: 'Ready to make it official?', ctaP: 'Form your Florida company, name us as your registered agent and get a real business address, all in one place.',
    footAbout: 'Florida registered agent, business formation and filing services for founders in the U.S. and abroad.', email: 'Email',
    fServices: 'Services', fCompany: 'Company', fLegal: 'Legal',
    services: [['florida-registered-agent.html', 'Florida Registered Agent'], ['florida-llc-formation.html', 'Florida LLC Formation'], ['florida-annual-report.html', 'Annual Report Filing'], ['business-filings.html', 'Amendments & Filings'], ['business-address-mail.html', 'Business Address & Mail'], ['launch-pack.html', 'Launch Pack'], ['international-founders.html', 'International Founders']],
    company: [['about.html', 'About'], ['how-it-works.html', 'How it works'], ['pricing.html', 'Pricing'], ['faq.html', 'FAQ'], ['contact.html', 'Contact'], ['resources/index.html', 'Guides']],
    legal: [['terms.html', 'Terms of Service'], ['privacy.html', 'Privacy Policy'], ['refund-policy.html', 'Refund Policy'], ['disclaimer.html', 'Disclaimer']],
    legalLine: 'We are not a law firm or a CPA firm and do not provide legal, tax or accounting advice. Our services are administrative filing, registered agent and mail-handling services. We are not affiliated with the Florida Department of State or Sunbiz.',
    guides: 'Guides', moreGuides: 'More guides', readGuide: 'Read the guide →', needIt: 'Need it done for you?',
    guideNote: d => `This guide is general information, not legal or tax advice. Fees and rules can change; confirm current requirements with the Florida Division of Corporations or a licensed professional. Last reviewed ${d}.`,
  },
  pt: {
    locale: 'pt_BR', home: 'Início', faq: 'Perguntas frequentes', getStarted: 'Começar', portal: 'Área do cliente', menu: 'Menu', skip: 'Ir para o conteúdo',
    subtitle: 'Agente Registrado e Registros Empresariais na Flórida',
    nav: [{ label: 'Abrir empresa', items: [['pt/abrir-llc-na-florida.html', 'Abrir uma LLC na Flórida'], ['pt/empreendedores-internacionais.html', 'Empreendedores internacionais']] }, { label: 'Empresa em dia', items: [['pt/pacote-anual.html', 'Pacote Anual Essencial', 1], ['pt/agente-registrado-florida.html', 'Agente registrado']] }, ['pt/precos.html', 'Preços'], ['pt/guias/index.html', 'Guias']],
    ctaH: 'Pronto para oficializar sua empresa?', ctaP: 'Abra sua empresa na Flórida, nomeie-nos como agente registrado e tenha um endereço comercial real, tudo em um só lugar.',
    footAbout: 'Agente registrado, abertura de empresas e registros na Flórida para empreendedores nos EUA e no exterior.', email: 'E-mail',
    fServices: 'Serviços', fCompany: 'Empresa', fLegal: 'Legal (em inglês)',
    services: [['pt/agente-registrado-florida.html', 'Agente Registrado na Flórida'], ['pt/abrir-llc-na-florida.html', 'Abrir LLC na Flórida'], ['pt/empreendedores-internacionais.html', 'Empreendedores Internacionais'], ['pt/precos.html', 'Preços']],
    company: [['pt/guias/index.html', 'Guias'], ['pt/comecar.html', 'Começar'], ['about.html', 'Sobre nós (em inglês)'], ['contact.html', 'Contato (em inglês)']],
    legal: [['terms.html', 'Termos de Serviço'], ['privacy.html', 'Política de Privacidade'], ['refund-policy.html', 'Política de Reembolso'], ['disclaimer.html', 'Aviso Legal']],
    legalLine: 'Não somos um escritório de advocacia nem de contabilidade e não prestamos consultoria jurídica, tributária ou contábil. Prestamos serviços administrativos de registro, agente registrado e recebimento de correspondência. Não somos afiliados ao Departamento de Estado da Flórida nem ao Sunbiz.',
    guides: 'Guias', moreGuides: 'Mais guias', readGuide: 'Ler o guia →', needIt: 'Quer que a gente faça por você?',
    guideNote: d => `Este guia é informativo e não constitui consultoria jurídica ou tributária. Taxas e regras podem mudar; confirme os requisitos atuais com a Divisão de Corporações da Flórida ou um profissional habilitado. Revisado em ${d}.`,
  },
  es: {
    locale: 'es_US', home: 'Inicio', faq: 'Preguntas frecuentes', getStarted: 'Empezar', portal: 'Portal del cliente', menu: 'Menú', skip: 'Ir al contenido',
    subtitle: 'Agente Registrado y Trámites Empresariales en Florida',
    nav: [{ label: 'Abrir empresa', items: [['es/abrir-llc-en-florida.html', 'Abrir una LLC en Florida'], ['es/emprendedores-internacionales.html', 'Emprendedores internacionales']] }, { label: 'Empresa al día', items: [['es/paquete-anual.html', 'Paquete Anual Esencial', 1], ['es/agente-registrado-florida.html', 'Agente registrado']] }, ['es/precios.html', 'Precios'], ['es/guias/index.html', 'Guías']],
    ctaH: '¿Listo para formalizar tu empresa?', ctaP: 'Forma tu empresa en Florida, nómbranos tu agente registrado y obtén una dirección comercial real, todo en un solo lugar.',
    footAbout: 'Agente registrado, formación de empresas y trámites en Florida para emprendedores en EE. UU. y el extranjero.', email: 'Correo',
    fServices: 'Servicios', fCompany: 'Empresa', fLegal: 'Legal (en inglés)',
    services: [['es/agente-registrado-florida.html', 'Agente Registrado en Florida'], ['es/abrir-llc-en-florida.html', 'Abrir una LLC en Florida'], ['es/emprendedores-internacionales.html', 'Emprendedores Internacionales'], ['es/precios.html', 'Precios']],
    company: [['es/guias/index.html', 'Guías'], ['es/empezar.html', 'Empezar'], ['about.html', 'Nosotros (en inglés)'], ['contact.html', 'Contacto (en inglés)']],
    legal: [['terms.html', 'Términos del Servicio'], ['privacy.html', 'Política de Privacidad'], ['refund-policy.html', 'Política de Reembolso'], ['disclaimer.html', 'Aviso Legal']],
    legalLine: 'No somos un bufete de abogados ni una firma de contadores y no brindamos asesoría legal, fiscal ni contable. Prestamos servicios administrativos de trámites, agente registrado y manejo de correo. No estamos afiliados al Departamento de Estado de Florida ni a Sunbiz.',
    guides: 'Guías', moreGuides: 'Más guías', readGuide: 'Leer la guía →', needIt: '¿Quieres que lo hagamos por ti?',
    guideNote: d => `Esta guía es información general, no asesoría legal ni fiscal. Las tarifas y reglas pueden cambiar; confirma los requisitos actuales con la División de Corporaciones de Florida o un profesional autorizado. Revisada el ${d}.`,
  },
};

module.exports = { ALT, altsFor, L };
