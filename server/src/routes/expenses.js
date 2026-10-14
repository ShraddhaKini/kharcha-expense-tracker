import { Router } from 'express';
import { db, transaction } from '../db.js';
import { isISODate, isMonth, localISO, monthRange } from '../dates.js';
import { cleanItem, parseExpenses } from '../parser.js';
import { aiLimiter } from '../limiters.js';

export const expensesRouter = Router();

const todayFrom = (value) => (isISODate(value) ? value : localISO());

// List one month of expenses.
expensesRouter.get('/', (req, res) => {
  const month = isMonth(req.query.month) ? req.query.month : localISO().slice(0, 7);
  const [start, end] = monthRange(month);
  const rows = db
    .prepare(
      `SELECT id, amount, category, description, date
         FROM expenses
        WHERE user_id = ? AND date >= ? AND date < ?
        ORDER BY date DESC, id DESC`
    )
    .all(req.userId, start, end);
  res.json({ expenses: rows.map((r) => ({ ...r })) });
});

// Turn a sentence into a preview. Nothing is saved here.
expensesRouter.post('/parse', aiLimiter, async (req, res) => {
  const text = String(req.body?.text ?? '').trim();
  if (!text) return res.status(400).json({ error: 'Type what you spent first.' });
  if (text.length > 500) return res.status(400).json({ error: 'Keep it under 500 characters.' });

  const result = await parseExpenses(text, todayFrom(req.body?.today));
  if (!result.items.length) {
    return res.status(422).json({
      error: 'Could not find an amount. Try something like "spent 450 on groceries yesterday".',
    });
  }
  res.json(result);
});

// Save the reviewed items.
expensesRouter.post('/', (req, res) => {
  const incoming = Array.isArray(req.body?.items) ? req.body.items.slice(0, 20) : [];
  const today = todayFrom(req.body?.today);
  const items = incoming.map((i) => cleanItem(i, today));

  if (!items.length || items.some((i) => i === null)) {
    return res.status(400).json({ error: 'Check each expense: the amount must be greater than zero.' });
  }

  const rawText = String(req.body?.rawText ?? '').slice(0, 500);
  const insert = db.prepare(
    `INSERT INTO expenses (user_id, amount, category, description, date, raw_text)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const saved = transaction(() =>
    items.map((i) => {
      const info = insert.run(req.userId, i.amount, i.category, i.description, i.date, rawText);
      return { id: Number(info.lastInsertRowid), ...i };
    })
  );

  res.status(201).json({ expenses: saved });
});

expensesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid expense.' });

  const info = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Expense not found.' });
  res.json({ ok: true });
});
