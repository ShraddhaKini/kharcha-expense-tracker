import { daysInMonth } from './dates.js';

const round2 = (n) => Math.round(n * 100) / 100;
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

// rows: [{ amount, category, description, date }] for one month.
export function computeInsights({ month, today, rows, prevTotal }) {
  const days = daysInMonth(month);
  const currentMonth = today.slice(0, 7);
  const isCurrent = month === currentMonth;
  const elapsed = month < currentMonth ? days : isCurrent ? Number(today.slice(8)) : 1;

  const total = round2(rows.reduce((s, r) => s + r.amount, 0));
  const count = rows.length;

  const byCat = new Map();
  for (const r of rows) byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);
  const byCategory = [...byCat.entries()]
    .map(([category, amount]) => ({
      category,
      total: round2(amount),
      pct: total ? Math.round((amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const dailyMap = new Map();
  for (const r of rows) dailyMap.set(r.date, (dailyMap.get(r.date) ?? 0) + r.amount);
  const daily = Array.from({ length: days }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { date, total: round2(dailyMap.get(date) ?? 0) };
  });

  const biggest = rows.reduce((max, r) => (!max || r.amount > max.amount ? r : max), null);
  const changePct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  const projected = isCurrent && count > 0 ? round2((total / elapsed) * days) : null;

  const tips = [];
  if (count >= 3 && byCategory.length) {
    tips.push(`${byCategory[0].category} is your largest category at ${byCategory[0].pct}% of spending.`);
  }
  if (changePct !== null && Math.abs(changePct) >= 10) {
    tips.push(`Spending is ${Math.abs(changePct)}% ${changePct > 0 ? 'higher' : 'lower'} than last month.`);
  }
  if (projected !== null && elapsed >= 5) {
    tips.push(`At this pace you will spend about ${inr.format(projected)} by the end of the month.`);
  }
  if (biggest && count >= 3) {
    tips.push(`Your biggest single expense was ${inr.format(biggest.amount)} on ${biggest.description}.`);
  }

  return {
    month,
    total,
    count,
    avgPerDay: round2(total / elapsed),
    prevTotal: round2(prevTotal),
    changePct,
    projected,
    biggest: biggest && {
      amount: biggest.amount,
      description: biggest.description,
      category: biggest.category,
      date: biggest.date,
    },
    byCategory,
    daily,
    tips,
  };
}
