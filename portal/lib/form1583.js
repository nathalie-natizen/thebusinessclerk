import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { OFFICE } from './office';

// Fills the official USPS PS Form 1583 (June 2024 edition, page 1). The form has no fillable fields,
// so values are written at measured positions. We always download the live form from usps.com.
const FORM_URL = 'https://about.usps.com/forms/ps1583.pdf';
const KNOWN_SIZE = 252999; // bytes of the June 2024 edition the positions were measured on
const K = 666 / 612;                                   // measured at 100% zoom: 666px wide page
const P = (sx, sy) => [(sx - 445) / K, 792 - (sy - 48) / K];   // screen px -> PDF points
const fmt = d => { if (!d) return ''; const x = new Date(String(d).slice(0, 10) + 'T12:00:00'); return `${String(x.getMonth() + 1).padStart(2, '0')}/${String(x.getDate()).padStart(2, '0')}/${x.getFullYear()}`; };

// [label x, label y, max width px] — value goes just under the label
const F = {
  d1a: [469, 124, 150], pmb: [704, 172, 70], s2a: [469, 172, 230], c2c: [469, 207, 150], st2d: [626, 207, 55], z2e: [684, 207, 90],
  last: [469, 283, 95], first: [586, 283, 85], mi: [704, 283, 70], phone: [469, 320, 150], email: [626, 320, 150],
  street: [469, 354, 305], city: [469, 388, 150], st: [626, 388, 45], zip: [674, 388, 50], country: [728, 388, 48],
  bname: [469, 728, 190], btype: [665, 728, 110], bstreet: [469, 767, 305], bcity: [469, 801, 150], bst: [626, 801, 45], bzip: [674, 801, 50], bcountry: [728, 801, 48],
  bphone: [469, 836, 150], breg: [626, 836, 150],
  n8a: [782, 124, 150], n8b: [939, 124, 150], n8c: [782, 159, 150], n8d: [939, 159, 150],
  n9a: [782, 283, 305], n9b: [782, 320, 305], c9c: [782, 354, 152], st9d: [939, 354, 45], z9e: [988, 354, 50], co9f: [1041, 354, 50],
  r12: [782, 784, 305],
};
const BOX = {
  business: [473, 255], protectedYes: [662, 425], protectedNo: [709, 425],
  id1: { "U.S. State/Territory/Tribal driver's or nondriver's ID card": [795, 223], 'Uniformed Service ID': [795, 234], Passport: [890, 234], 'Certificate of Naturalization': [974, 234], 'U.S. Access Card': [795, 245], 'Matricula Consular': [890, 245], 'U.S. Permanent Resident Card': [974, 245], 'U.S. University ID card': [795, 256], 'NEXUS card': [890, 256] },
  id2: { "U.S. State/Territory/Tribal driver's or nondriver's ID card": [795, 404], 'Current lease': [795, 416], 'Home or vehicle insurance policy': [926, 416], 'Mortgage or deed of trust': [795, 427], 'Vehicle registration card': [926, 427], 'Voter card': [1041, 427] },
};

export async function fill1583(a, entity) {
  const res = await fetch(FORM_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not download the USPS form');
  const bytes = await res.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPage(0); const font = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.05, 0.1, 0.35);
  const put = (key, text) => {
    if (!text) return; const [lx, ly, w] = F[key]; const [x, y] = P(lx + 1, ly + 15);
    let size = 9; const maxW = w / K - 2; const t = String(text);
    while (size > 5.5 && font.widthOfTextAtSize(t, size) > maxW) size -= 0.5;
    page.drawText(t, { x, y, size, font, color: ink });
  };
  const tick = (c) => { if (!c) return; const [x, y] = P(c[0], c[1]); page.drawText('X', { x: x - 2.6, y: y - 3, size: 8, font, color: ink }); };
  const pmb = entity.file_number;
  if (a.verified_at) put('d1a', fmt(a.verified_at));
  put('pmb', pmb); put('s2a', OFFICE.street); put('c2c', OFFICE.city); put('st2d', OFFICE.street ? OFFICE.state : ''); put('z2e', OFFICE.zip);
  tick(BOX.business);
  put('last', a.last_name); put('first', a.first_name); put('mi', a.middle_initial); put('phone', a.applicant_phone); put('email', a.applicant_email);
  put('street', a.home_street); put('city', a.home_city); put('st', a.home_state); put('zip', a.home_zip); put('country', a.home_country);
  tick(a.protected_individual ? BOX.protectedYes : BOX.protectedNo);
  put('bname', a.business_name || entity.legal_name); put('btype', a.business_type);
  put('bstreet', OFFICE.street ? `${OFFICE.street}, PMB ${pmb}` : ''); put('bcity', OFFICE.city); put('bst', OFFICE.street ? OFFICE.state : ''); put('bzip', OFFICE.zip); put('bcountry', OFFICE.street ? 'USA' : '');
  put('bphone', a.business_phone || a.applicant_phone); put('breg', a.registration_place);
  const name = [a.first_name, a.middle_initial, a.last_name].filter(Boolean).join(' ');
  put('n8a', name); put('n8b', a.id1_number); put('n8c', a.id1_issuer); put('n8d', fmt(a.id1_expires)); tick(BOX.id1[a.id1_type]);
  put('n9a', name); put('n9b', a.home_street); put('c9c', a.home_city); put('st9d', a.home_state); put('z9e', a.home_zip); put('co9f', a.home_country); tick(BOX.id2[a.id2_type]);
  put('r12', a.receivers);
  return { bytes: await pdf.save(), layoutMatches: bytes.byteLength === KNOWN_SIZE };
}
