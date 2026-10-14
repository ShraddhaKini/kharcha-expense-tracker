import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) {
  throw new Error('JWT_SECRET is missing or too short. Set it in server/.env (see .env.example).');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (user) =>
  jwt.sign({}, SECRET, { subject: String(user.id), expiresIn: '7d' });

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });

  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ error: 'Enter your name (2 to 60 characters).' });
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Choose a password between 8 and 72 characters.' });
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, hash);

  const user = { id: Number(info.lastInsertRowid), name, email };
  res.status(201).json({ token: signToken(user), user });
});

authRouter.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const row = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
  const ok = row && (await bcrypt.compare(password, row.password_hash));
  if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });

  const user = { id: row.id, name: row.name, email: row.email };
  res.json({ token: signToken(user), user });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Account not found. Please log in again.' });
  res.json({ user: { ...user } });
});
