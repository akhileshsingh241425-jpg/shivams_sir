import React, { useState, useEffect } from 'react';
import { getPredictions } from '../api';

function Predictions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPredictions();
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch predictions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="loading">Loading Predictions</div>;
  if (!data) return <div className="empty-state"><p>Failed to load prediction data</p></div>;

  const { overdue_now, upcoming_7_days, upcoming_30_days, workload_forecast, recurring_predictions, summary } = data;

  // Build sorted workload entries for the bar chart
  const workloadEntries = Object.entries(workload_forecast)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 14); // next 14 days
  const maxLoad = Math.max(1, ...workloadEntries.map(([, v]) => v));

  const getDaysLabel = (days) => {
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    return `${days}d left`;
  };

  const getDaysClass = (days) => {
    if (days < 0) return 'urgent';
    if (days <= 3) return 'warning';
    return 'ok';
  };

  return (
    <div>
      <div className="page-header">
        <h2>🔮 PM Predictions & Forecast</h2>
        <p>Upcoming maintenance tasks, overdue alerts, and workload planning</p>
      </div>

      {/* Summary cards */}
      <div className="dashboard-grid">
        <div className="stat-card red">
          <div className="stat-icon">🚨</div>
          <div className="stat-label">Overdue Now</div>
          <div className="stat-value">{summary.total_overdue}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏰</div>
          <div className="stat-label">Due This Week</div>
          <div className="stat-value">{summary.due_this_week}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">📅</div>
          <div className="stat-label">Due This Month</div>
          <div className="stat-value">{summary.due_this_month}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Tasks Tracked</div>
          <div className="stat-value">{summary.total_tasks_tracked}</div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="pred-grid">
        {/* Overdue Now */}
        <div className="pred-card">
          <div className="pred-card-header" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
            🚨 Overdue Tasks ({overdue_now.length})
          </div>
          <div className="pred-card-body">
            {overdue_now.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                ✅ No overdue tasks — great job!
              </div>
            ) : (
              overdue_now.map(t => (
                <div className="pred-item" key={t.task_id}>
                  <div className="pred-eq">{t.equipment_id} — {t.equipment_name}</div>
                  <div className="pred-desc">{t.description}</div>
                  <div className="pred-meta">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.section}</span>
                    <span className={`pred-days ${getDaysClass(t.days_until_due)}`}>
                      {getDaysLabel(t.days_until_due)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Due This Week */}
        <div className="pred-card">
          <div className="pred-card-header" style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}>
            ⏰ Due This Week ({upcoming_7_days.length})
          </div>
          <div className="pred-card-body">
            {upcoming_7_days.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No tasks due this week
              </div>
            ) : (
              upcoming_7_days.map(t => (
                <div className="pred-item" key={t.task_id}>
                  <div className="pred-eq">{t.equipment_id} — {t.equipment_name}</div>
                  <div className="pred-desc">{t.description}</div>
                  <div className="pred-meta">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.section}</span>
                    <span className={`pred-days ${getDaysClass(t.days_until_due)}`}>
                      {getDaysLabel(t.days_until_due)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Due This Month */}
        <div className="pred-card">
          <div className="pred-card-header" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            📅 Due This Month ({upcoming_30_days.length})
          </div>
          <div className="pred-card-body">
            {upcoming_30_days.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No tasks due this month
              </div>
            ) : (
              upcoming_30_days.map(t => (
                <div className="pred-item" key={t.task_id}>
                  <div className="pred-eq">{t.equipment_id} — {t.equipment_name}</div>
                  <div className="pred-desc">{t.description}</div>
                  <div className="pred-meta">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.section}</span>
                    <span className={`pred-days ${getDaysClass(t.days_until_due)}`}>
                      {getDaysLabel(t.days_until_due)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recurring Predictions */}
        <div className="pred-card">
          <div className="pred-card-header" style={{ background: 'rgba(124,58,237,.08)', color: '#7c3aed' }}>
            🔄 Recurring Tasks (Next 90 Days)
          </div>
          <div className="pred-card-body">
            {recurring_predictions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No recurring tasks found
              </div>
            ) : (
              recurring_predictions.map((r, i) => (
                <div className="pred-item" key={i}>
                  <div className="pred-eq">{r.equipment_id}</div>
                  <div className="pred-desc">{r.description} — Every {r.frequency_days} days</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {r.upcoming_dates.map(d => (
                      <span key={d} style={{
                        fontSize: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                        padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)'
                      }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Workload Forecast Bar Chart */}
      {workloadEntries.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div className="table-container">
            <div className="table-header">
              <h3>📊 Daily Workload Forecast (Next 14 Days)</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '140px' }}>
                {workloadEntries.map(([day, count]) => {
                  const pct = (count / maxLoad) * 100;
                  const dayName = new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  return (
                    <div key={day} style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'flex-end', height: '100%'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                        {count}
                      </span>
                      <div style={{
                        width: '100%', maxWidth: '40px', borderRadius: '4px 4px 0 0',
                        height: `${Math.max(pct, 5)}%`,
                        background: count > maxLoad * 0.7 ? 'var(--red)' : count > maxLoad * 0.4 ? 'var(--orange)' : 'var(--primary)',
                        transition: 'height .3s'
                      }} />
                      <span style={{
                        fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px',
                        writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '50px'
                      }}>
                        {dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Predictions;
