import { Router } from 'express';
import { db } from '../db.js';
import { isISODate, isMonth, localISO, monthRange, prevMonth } from '../dates.js';
import { computeInsights } from '../insights.js';
import { askClaude, aiEnabled } from '../llm.js';
import { aiLimiter } from '../limiters.js';

export const insightsRouter = Router();

function buildStats(req) {
  const today = isISODate(req.query.today) ? req.query.today : localISO();
  const month = isMonth(req.query.month) ? req.query.month : today.slice(0, 7);

  const [start, end] = monthRange(month);
  const rows = db
    .prepare(
      `SELECT amount, category, description, date
         FROM expenses
        WHERE user_id = ? AND date >= ? AND date < ?`
    )
    .all(req.userId, start, end)
    .map((r) => ({ ...r }));

  const [pStart, pEnd] = monthRange(prevMonth(month));
  const prev = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
        WHERE user_id = ? AND date >= ? AND date < ?`
    )
    .get(req.userId, pStart, pEnd);

  return computeInsights({ month, today, rows, prevTotal: prev.total });
}

insightsRouter.get('/', (req, res) => {
  res.json(buildStats(req));
});

// Optional: a short written summary from Claude. Only totals are sent, never raw notes.
insightsRouter.get('/ai-summary', aiLimiter, async (req, res) => {
  if (!aiEnabled()) {
    return res.status(503).json({ error: 'Add ANTHROPIC_API_KEY to server/.env to turn on AI summaries.' });
  }

  const { daily, tips, ...stats } = buildStats(req);
  if (!stats.count) return res.status(422).json({ error: 'Add a few expenses first.' });

  try {
    const summary = await askClaude({
      system:
        'You are a calm, practical money coach for a student. You get one month of spending totals as JSON, in Indian rupees. ' +
        'Write 3 to 4 short sentences in plain language: where the money went, one notable pattern or change, and one specific, realistic suggestion. ' +
        'Use the ₹ symbol. No headings, bullet points or markdown.',
      user: JSON.stringify(stats),
      maxTokens: 400,
    });
    res.json({ summary: summary.trim() });
  } catch (err) {
    console.error('AI summary failed:', err.message);
    res.status(502).json({ error: 'The AI summary is unavailable right now. Try again in a moment.' });
  }
});
