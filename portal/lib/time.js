// Eastern-time helpers for <input type="datetime-local"> (the server runs in UTC)
const TZ = 'America/New_York';
const parts = d => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(p => [p.type, p.value]));
export function etInputNow(d = new Date()) { const p = parts(d); return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`; }
// "2026-11-26T16:05" typed in Eastern time -> ISO string
export function etInputToISO(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(v || '')); if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const p = parts(new Date(guess)); const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return new Date(guess + (guess - shown)).toISOString();
}
