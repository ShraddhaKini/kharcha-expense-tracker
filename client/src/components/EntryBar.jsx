import { useRef, useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES, inr, todayISO } from '../lib.js';

const EXAMPLES = [
  'spent 450 on groceries yesterday',
  'auto 60 and lunch 120 today',
  'netflix 649 last friday',
];

export default function EntryBar({ aiEnabled, onSaved }) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState(null); // { items, source, warning } while reviewing
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function parse(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api.parseText(text.trim(), todayISO());
      setDraft({ ...result, items: result.items.map((item, i) => ({ ...item, key: i })) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const edit = (key, field, value) =>
    setDraft((d) => ({ ...d, items: d.items.map((it) => (it.key === key ? { ...it, [field]: value } : it)) }));

  const remove = (key) =>
    setDraft((d) => {
      const items = d.items.filter((it) => it.key !== key);
      return items.length ? { ...d, items } : null;
    });

  async function save() {
    setBusy(true);
    setError('');
    try {
      const items = draft.items.map(({ key, ...rest }) => rest);
      await api.saveExpenses(items, text.trim(), todayISO());
      const dates = items.map((i) => i.date);
      setDraft(null);
      setText('');
      onSaved(dates);
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const total = draft ? draft.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0) : 0;

  return (
    <section className="entry" aria-label="Add expenses">
      <form onSubmit={parse}>
        <label htmlFor="note" className="entry-label">
          What did you spend?
        </label>
        <div className="entry-row">
          <input
            id="note"
            ref={inputRef}
            className="entry-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="spent 450 on groceries yesterday"
            maxLength={500}
            autoComplete="off"
            disabled={Boolean(draft)}
          />
          <button className="btn" disabled={busy || !text.trim() || Boolean(draft)}>
            {busy && !draft ? 'Reading…' : 'Add'}
          </button>
        </div>

        <p className="entry-meta">
          {aiEnabled ? 'AI reads your note.' : 'Basic parser on. Add an API key on the server for AI parsing.'}
          {!draft && (
            <>
              {' '}
              Try:{' '}
              {EXAMPLES.map((ex) => (
                <button
                  type="button"
                  key={ex}
                  className="example"
                  onClick={() => {
                    setText(ex);
                    inputRef.current?.focus();
                  }}
                >
                  {ex}
                </button>
              ))}
            </>
          )}
        </p>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {draft && (
        <div className="slip" role="group" aria-label="Review before saving">
          <p className="slip-title">Check these before saving</p>
          {draft.warning && <p className="warning">{draft.warning}</p>}

          <ul className="slip-rows">
            {draft.items.map((it) => (
              <li key={it.key} className="slip-row">
                <input
                  aria-label="Description"
                  value={it.description}
                  onChange={(e) => edit(it.key, 'description', e.target.value)}
                  maxLength={120}
                />
                <select aria-label="Category" value={it.category} onChange={(e) => edit(it.key, 'category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  aria-label="Date"
                  type="date"
                  value={it.date}
                  onChange={(e) => edit(it.key, 'date', e.target.value)}
                />
                <input
                  aria-label="Amount in rupees"
                  className="num"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={it.amount}
                  onChange={(e) => edit(it.key, 'amount', e.target.value)}
                />
                <button type="button" className="btn-quiet danger" onClick={() => remove(it.key)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="slip-actions">
            <button className="btn" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : `Save ${draft.items.length === 1 ? 'expense' : `${draft.items.length} expenses`} (${inr.format(total)})`}
            </button>
            <button className="btn-quiet" onClick={() => setDraft(null)} disabled={busy}>
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
