// All dates are plain "YYYY-MM-DD" strings in local time, so there are no
// timezone surprises around midnight.

const pad = (n) => String(n).padStart(2, '0');

export function localISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return localISO(new Date(y, m - 1, d + n));
}

export function weekdayIndex(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0 = Sunday
}

export function isMonth(s) {
  return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

// [start, end) where end is the first day of the next month.
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  return [`${month}-01`, localISO(new Date(y, m, 1))];
}

export function prevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return localISO(new Date(y, m - 2, 1)).slice(0, 7);
}

export function daysInMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
