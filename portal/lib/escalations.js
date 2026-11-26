import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { bizDaysBetween } from './sla';

// Legal papers / state notices the client hasn't opened after 1 business day: the Guidelines require a call.
export async function unopenedLegal() {
  const { data } = await supabaseAdmin().from('mail_items').select('id, category, sender, received_at, entities(file_number, legal_name, contact_name, contact_phone)').in('category', ['service_of_process', 'state_notice']).is('viewed_at', null).order('received_at');
  return (data || []).filter(m => bizDaysBetween(m.received_at, new Date()) >= 1);
}
