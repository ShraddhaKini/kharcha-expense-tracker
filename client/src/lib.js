export const CATEGORIES = [
  'Groceries',
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Rent',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Other',
];

export const COLORS = {
  Groceries: '#0B6E5B',
  'Food & Dining': '#D2823A',
  Transport: '#2F6DB5',
  Shopping: '#B8446F',
  'Bills & Utilities': '#7A5BA6',
  Rent: '#8A6F4E',
  Entertainment: '#C4572F',
  Health: '#3E9BA8',
  Education: '#6E8B3D',
  Travel: '#E0A100',
  Other: '#7C8B94',
};

export const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  return toISO(new Date(y, m - 1 + delta, 1)).slice(0, 7);
}

export function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
