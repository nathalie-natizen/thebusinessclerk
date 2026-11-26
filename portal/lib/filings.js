// Florida filings for existing companies (the à la carte list on the website pricing page).
// Service fee charged when ordered; the Florida state fee is charged at cost when we file (Staff: "Charge state fee").
export const FILINGS = {
  amendment: { name: 'Articles of Amendment', cents: 8500, pt: 'Alteração do contrato (Articles of Amendment)', es: 'Enmienda de Artículos (Articles of Amendment)',
    ask: 'What needs to change? (name, members/managers, officers, purpose, other)', staff: 'Prepare Articles of Amendment with the changes; get client signature if required; file on Sunbiz.' },
  amended_ar: { name: 'Amended Annual Report', cents: 6500, pt: 'Relatório anual retificado', es: 'Reporte anual enmendado',
    ask: 'What needs to be corrected or updated on this year’s annual report?', staff: 'File the amended annual report on Sunbiz with the changes.' },
  address_change: { name: 'Business Address Change', cents: 6500, pt: 'Alteração de endereço da empresa', es: 'Cambio de dirección de la empresa',
    ask: 'New principal and/or mailing address (full address, and which one changes)', staff: 'File the address change on Sunbiz (amended annual report or amendment, whichever applies).' },
  dba: { name: 'DBA / Fictitious Name Registration', cents: 7500, pt: 'Registro de nome fantasia (DBA)', es: 'Registro de nombre ficticio (DBA)',
    ask: 'Fictitious name you want, the county where the business is located, and confirmation the required newspaper notice has been (or should be) published', staff: 'Check the name on Sunbiz fictitious name search; confirm the newspaper notice; file the registration.' },
  cert_status: { name: 'Certificate of Status', cents: 2500, pt: 'Certidão de regularidade (Certificate of Status)', es: 'Certificado de estado (Certificate of Status)',
    ask: 'What is it for, and do you need it apostilled or certified? (apostille quoted separately)', staff: 'Order the certificate on Sunbiz; upload it to Documents.' },
  certified_copy: { name: 'Certified Copy', cents: 3500, pt: 'Cópia autenticada', es: 'Copia certificada',
    ask: 'Which document(s) do you need certified copies of?', staff: 'Order the certified copy from the Division of Corporations; upload when received.' },
  dissolution: { name: 'Dissolution', cents: 9500, pt: 'Encerramento da empresa (dissolução)', es: 'Disolución de la empresa',
    ask: 'Effective date wanted, reason (optional), and confirmation that members/shareholders approved the dissolution', staff: 'Confirm approval; file Articles of Dissolution on Sunbiz; cancel the client’s recurring services after the effective date.' },
  reinstatement: { name: 'Reinstatement', cents: 17500, note: 'State fees for all missed years are charged at cost when we file', pt: 'Reativação da empresa (reinstatement)', es: 'Reinstalación de la empresa',
    ask: 'Since when has the company been inactive, and has anything changed (address, people)?', staff: 'Check years due on Sunbiz; tell the client the total state fees before filing; file the reinstatement with all due reports.' },
  foreign: { name: 'Foreign Qualification in Florida', cents: 8800, withRa: true, pt: 'Registro de empresa de outro estado na Flórida (inclui o 1º ano de agente registrado)', es: 'Registro de empresa de otro estado en Florida (incluye el 1er año de agente registrado)',
    ask: 'Home state, date formed there, and the name to use in Florida. Upload a Certificate of Status from the home state (dated within 90 days)', staff: 'Check the name in Florida; file the Application for Authorization to Transact Business with the home-state certificate; we are named registered agent.' },
};
export const FILING_KINDS = Object.keys(FILINGS);

// Short questionnaire used for every filing
export const filingQuestionnaire = k => ({
  title: `${FILINGS[k].name}: details`,
  intro: 'Tell us exactly what to file. We review it and contact you if anything is unclear. The Florida state fee is charged at cost when we file.',
  fields: [
    { name: 'details', label: FILINGS[k].ask, type: 'textarea', required: true },
    { name: 'effective_date', label: 'Effective date (optional; blank = when filed)', type: 'date' },
    { name: 'authorized_by', label: 'Name and title of the person authorizing this filing', type: 'text', required: true },
    { name: 'file', label: 'Supporting document (optional)', type: 'file' },
  ],
});
