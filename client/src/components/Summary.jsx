import { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { api } from '../api.js';
import { COLORS, inr, monthLabel, shiftMonth, todayISO } from '../lib.js';

export default function Summary({ stats, month, aiEnabled }) {
  const [summary, setSummary] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');

  // A new month or new data makes an old written summary stale.
  useEffect(() => {
    setSummary('');
    setAiError('');
  }, [month, stats?.total, stats?.count]);

  async function writeSummary() {
    setAiBusy(true);
    setAiError('');
    try {
      const data = await api.aiSummary(month, todayISO());
      setSummary(data.summary);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiBusy(false);
    }
  }

  if (!stats) return <p className="empty">Loading summary…</p>;

  const prevName = monthLabel(shiftMonth(month, -1)).split(' ')[0];
  const daily = stats.daily.map((d) => ({ day: Number(d.date.slice(8)), total: d.total }));

  return (
    <div className="summary">
      <p className="summary-month">{monthLabel(month)}</p>
      <p className="summary-total">{inr.format(stats.total)}</p>
      <p className="summary-delta">
        {stats.changePct === null
          ? `No spending in ${prevName} to compare with.`
          : stats.changePct === 0
            ? `Same as ${prevName}.`
            : `${Math.abs(stats.changePct)}% ${stats.changePct > 0 ? 'more' : 'less'} than ${prevName}.`}
      </p>

      <dl className="facts">
        <div>
          <dt>Entries</dt>
          <dd>{stats.count}</dd>
        </div>
        <div>
          <dt>Per day</dt>
          <dd>{inr.format(stats.avgPerDay)}</dd>
        </div>
        {stats.projected !== null && (
          <div>
            <dt>On track for</dt>
            <dd>{inr.format(stats.projected)}</dd>
          </div>
        )}
      </dl>

      {stats.count === 0 ? (
        <p className="empty">Charts and insights appear once you add an expense.</p>
      ) : (
        <>
          <h3>Where it went</h3>
          <div className="chart" role="img" aria-label="Spending by category">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={1}
                  stroke="none"
                >
                  {stats.byCategory.map((c) => (
                    <Cell key={c.category} fill={COLORS[c.category] || COLORS.Other} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => inr.format(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="legend">
            {stats.byCategory.map((c) => (
              <li key={c.category}>
                <span className="dot" style={{ background: COLORS[c.category] || COLORS.Other }} aria-hidden="true" />
                <span className="legend-name">{c.category}</span>
                <span className="legend-pct">{c.pct}%</span>
                <span className="legend-amt">{inr.format(c.total)}</span>
              </li>
            ))}
          </ul>

          <h3>Day by day</h3>
          <div className="chart" role="img" aria-label="Spending per day">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={daily} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" interval={4} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(11,110,91,0.08)' }}
                  formatter={(v) => [inr.format(v), 'Spent']}
                  labelFormatter={(d) => `Day ${d}`}
                />
                <Bar dataKey="total" fill="#0B6E5B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3>Insights</h3>
          {stats.tips.length > 0 ? (
            <ul className="tips">
              {stats.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">Add a few more entries to see patterns.</p>
          )}

          {aiEnabled && (
            <div className="ai-box">
              {summary ? (
                <p className="ai-text">{summary}</p>
              ) : (
                <button className="btn-outline" onClick={writeSummary} disabled={aiBusy}>
                  {aiBusy ? 'Writing…' : 'Write my summary'}
                </button>
              )}
              {aiError && (
                <p className="error" role="alert">
                  {aiError}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
