import { COLORS, dayLabel, inr, monthLabel } from '../lib.js';

export default function Ledger({ expenses, month, loading, onDelete }) {
  if (!expenses.length) {
    return (
      <p className="empty">
        {loading
          ? 'Loading…'
          : `Nothing logged for ${monthLabel(month)}. Type what you spent above, like “auto 60 and lunch 120”.`}
      </p>
    );
  }

  // Expenses arrive newest first, so consecutive rows with the same date form one group.
  const days = [];
  for (const e of expenses) {
    const last = days[days.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else days.push({ date: e.date, items: [e] });
  }

  return (
    <section className="ledger" aria-label="Expenses">
      {days.map((day) => (
        <div key={day.date} className="day">
          <h3>
            {dayLabel(day.date)}
            <span className="day-total">{inr.format(day.items.reduce((s, e) => s + e.amount, 0))}</span>
          </h3>
          <ul>
            {day.items.map((e) => (
              <li key={e.id} className="row">
                <span className="row-desc">{e.description}</span>
                <span className="chip">
                  <span className="dot" style={{ background: COLORS[e.category] || COLORS.Other }} aria-hidden="true" />
                  {e.category}
                </span>
                <span className="amount">{inr.format(e.amount)}</span>
                <button
                  className="btn-quiet danger"
                  onClick={() => onDelete(e.id)}
                  aria-label={`Delete ${e.description}, ${inr.format(e.amount)}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
