'use client';
import SunbizLookup from '@/components/SunbizLookup';
import { isCorp, fillForm } from '@/lib/sunbiz-fill';

// Picking the company from the Florida records fills legal name, type, status, document # and formation date
export default function StaffLookup() {
  return <SunbizLookup lang="en" onPick={(r, form) => fillForm(form, {
    legal_name: r.name, sunbiz_doc_number: r.doc_number, formation_date: r.file_date || '',
    entity_type: /^(DOMNP|FORNP)/.test(r.filing_type || '') ? 2 : isCorp(r) ? 1 : /^(FLAL|FORL)/.test(r.filing_type || '') ? 0 : 3,
    status: r.status === 'A' ? 1 : 2,
  })} />;
}
