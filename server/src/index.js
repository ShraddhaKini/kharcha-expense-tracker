import 'dotenv/config'; // must stay first so env vars exist before other modules read them
import express from 'express';
import cors from 'cors';
import { authRouter, requireAuth } from './auth.js';
import { expensesRouter } from './routes/expenses.js';
import { insightsRouter } from './routes/insights.js';
import { authLimiter } from './limiters.js';
import { aiEnabled } from './llm.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, ai: aiEnabled() }));
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/expenses', requireAuth, expensesRouter);
app.use('/api/insights', requireAuth, insightsRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Express 5 forwards errors from async handlers here automatically.
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ error: 'Invalid request.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(aiEnabled() ? 'AI parsing: on' : 'AI parsing: off (using the built-in rule-based parser)');
});
