import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { monthLabel, shiftMonth, todayISO } from '../lib.js';
import EntryBar from '../components/EntryBar.jsx';
import Ledger from '../components/Ledger.jsx';
import Summary from '../components/Summary.jsx';

export default function Dashboard({ user, onLogout }) {
  const currentMonth = todayISO().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [version, setVersion] = useState(0); // bump to reload after a change
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.health().then((h) => setAiEnabled(Boolean(h.ai))).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.listExpenses(month), api.insights(month, todayISO())])
      .then(([list, summary]) => {
        if (cancelled) return;
        setExpenses(list.expenses);
        setStats(summary);
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month, version]);

  // After saving, jump to the month of the new entry so it is visible straight away.
  function handleSaved(dates) {
    setMonth(dates[0].slice(0, 7));
    setVersion((v) => v + 1);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Kharcha</span>

        <nav className="month-nav" aria-label="Choose month">
          <button className="icon-btn" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">
            ‹
          </button>
          <span className="month-name" aria-live="polite">
            {monthLabel(month)}
          </span>
          <button
            className="icon-btn"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            disabled={month >= currentMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </nav>

        <div className="who">
          <span>{user.name}</span>
          <button className="btn-quiet" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="layout" aria-busy={loading}>
        <section className="main">
          <EntryBar aiEnabled={aiEnabled} onSaved={handleSaved} />

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <Ledger expenses={expenses} month={month} loading={loading} onDelete={handleDelete} />
        </section>

        <aside className="side">
          <Summary stats={stats} month={month} aiEnabled={aiEnabled} />
        </aside>
      </main>
    </div>
  );
}
