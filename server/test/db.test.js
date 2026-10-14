import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_FILE = ':memory:';
const { db, transaction } = await import('../src/db.js');

test('schema, constraints and transactions', () => {
  db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run('A', 'a@x.com', 'h');
  const ins = db.prepare('INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)');

  assert.throws(() => ins.run(1, 0, 'Other', 'x', '2026-10-01')); // CHECK amount > 0
  assert.throws(() => ins.run(99, 10, 'Other', 'x', '2026-10-01')); // foreign key

  assert.throws(() =>
    transaction(() => {
      ins.run(1, 10, 'Other', 'ok', '2026-10-01');
      ins.run(1, -1, 'Other', 'bad', '2026-10-01');
    })
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM expenses').get().n, 0); // rolled back

  transaction(() => {
    ins.run(1, 10, 'Other', 'a', '2026-10-01');
    ins.run(1, 20, 'Other', 'b', '2026-10-02');
  });
  assert.equal(db.prepare('SELECT SUM(amount) AS s FROM expenses').get().s, 30);

  db.prepare('DELETE FROM users WHERE id = 1').run(); // cascade
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM expenses').get().n, 0);
});
