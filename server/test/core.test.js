import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWithRules, cleanItem } from '../src/parser.js';
import { computeInsights } from '../src/insights.js';
import { addDays, isISODate, monthRange, prevMonth } from '../src/dates.js';

const TODAY = '2026-10-14'; // a Wednesday

test('dates helpers', () => {
  assert.equal(addDays(TODAY, -1), '2026-10-13');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.ok(isISODate('2026-02-28'));
  assert.ok(!isISODate('2026-02-30'));
  assert.deepEqual(monthRange('2026-12'), ['2026-12-01', '2027-01-01']);
  assert.equal(prevMonth('2026-01'), '2025-12');
});

test('single expense with relative date', () => {
  const [item] = parseWithRules('spent 450 on groceries yesterday', TODAY);
  assert.deepEqual(item, { amount: 450, category: 'Groceries', description: 'Groceries', date: '2026-10-13' });
});

test('multiple expenses share a trailing date', () => {
  const items = parseWithRules('spent 450 on groceries and 120 on auto yesterday', TODAY);
  assert.equal(items.length, 2);
  assert.deepEqual(items.map((i) => i.amount), [450, 120]);
  assert.deepEqual(items.map((i) => i.category), ['Groceries', 'Transport']);
  assert.ok(items.every((i) => i.date === '2026-10-13'));
});

test('own dates win over the shared one', () => {
  const items = parseWithRules('lunch 120 today, auto 50 yesterday', TODAY);
  assert.deepEqual(items.map((i) => i.date), [TODAY, '2026-10-13']);
});

test('amount formats: rupee sign, commas, k suffix', () => {
  assert.equal(parseWithRules('₹1,200 netflix and movie', TODAY)[0].amount, 1200);
  assert.equal(parseWithRules('rent 8k', TODAY)[0].amount, 8000);
  assert.equal(parseWithRules('rs. 99.50 coffee', TODAY)[0].amount, 99.5);
});

test('weekday and "days ago" dates', () => {
  assert.equal(parseWithRules('petrol 500 last monday', TODAY)[0].date, '2026-10-12');
  assert.equal(parseWithRules('petrol 500 on wednesday', TODAY)[0].date, '2026-10-07');
  assert.equal(parseWithRules('book 300 3 days ago', TODAY)[0].date, '2026-10-11');
});

test('"3 days ago" is not mistaken for an amount', () => {
  const items = parseWithRules('coffee 50 3 days ago', TODAY);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, 50);
});

test('no amount means no expense', () => {
  assert.deepEqual(parseWithRules('went for a walk', TODAY), []);
});

test('cleanItem rejects bad amounts and repairs the rest', () => {
  assert.equal(cleanItem({ amount: -5, category: 'Food & Dining' }, TODAY), null);
  assert.equal(cleanItem({ amount: 'abc' }, TODAY), null);
  assert.deepEqual(cleanItem({ amount: '1,250.456', category: 'Nonsense', date: 'bad' }, TODAY), {
    amount: 1250.46,
    category: 'Other',
    description: 'Other',
    date: TODAY,
  });
});

test('insights: totals, categories, change and projection', () => {
  const rows = [
    { amount: 500, category: 'Groceries', description: 'Vegetables', date: '2026-10-02' },
    { amount: 200, category: 'Transport', description: 'Cab', date: '2026-10-05' },
    { amount: 300, category: 'Groceries', description: 'Milk', date: '2026-10-09' },
  ];
  const r = computeInsights({ month: '2026-10', today: TODAY, rows, prevTotal: 500 });
  assert.equal(r.total, 1000);
  assert.equal(r.count, 3);
  assert.equal(r.byCategory[0].category, 'Groceries');
  assert.equal(r.byCategory[0].pct, 80);
  assert.equal(r.changePct, 100);
  assert.equal(r.daily.length, 31);
  assert.equal(r.daily[1].total, 500);
  assert.equal(r.projected, Math.round((1000 / 14) * 31 * 100) / 100);
  assert.ok(r.tips.length >= 3);
});

test('insights: empty month and no previous data', () => {
  const r = computeInsights({ month: '2026-09', today: TODAY, rows: [], prevTotal: 0 });
  assert.equal(r.total, 0);
  assert.equal(r.changePct, null);
  assert.equal(r.biggest, null);
  assert.deepEqual(r.tips, []);
});
