// Our CMRA office (USPS Form 1583, section 2). Set these in Vercel env vars once the office lease is signed.
export const OFFICE = {
  street: process.env.OFFICE_STREET || '',
  city: process.env.OFFICE_CITY || '',
  state: process.env.OFFICE_STATE || 'FL',
  zip: process.env.OFFICE_ZIP || '',
  phone: process.env.OFFICE_PHONE || '',
};
export const officeLine = (pmb) => OFFICE.street ? `${OFFICE.street}, PMB ${pmb}, ${OFFICE.city}, ${OFFICE.state} ${OFFICE.zip}` : `Our Florida office address, PMB ${pmb} (filled in automatically)`;
