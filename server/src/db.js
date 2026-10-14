import { DatabaseSync } from 'node:sqlite'; // built into Node 22+, nothing to compile
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const file = process.env.DB_FILE || './data/expenses.db';
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });

export const db = new DatabaseSync(file);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      REAL NOT NULL CHECK (amount > 0),
    category    TEXT NOT NULL,
    description TEXT NOT NULL,
    date        TEXT NOT NULL,
    raw_text    TEXT,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses (user_id, date);
`);

// Run several statements as one all-or-nothing unit.
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
