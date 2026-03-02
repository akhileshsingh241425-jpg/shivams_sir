import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api';

function Dashboard({ isAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Dashboard</div>;
  if (!data) return <div className="empty-state"><p>Failed to load dashboard data</p></div>;

  const totalTasks = data.total_tasks || 0;
  const totalCompleted = data.total_completed || 0;
  const completionPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const overdueList = data.overdue_equipment_list || [];

  return (
    <div>
      <div className="page-header">
        <h2>📊 PM Dashboard</h2>
        <p>Solar Panel Manufacturing — Preventive Maintenance Overview</p>
      </div>

      {/* Main Stats */}
      <div className="dashboard-grid">
        <div className="stat-card blue">
          <div className="stat-icon">🏭</div>
          <div className="stat-label">Total Equipment</div>
          <div className="stat-value">{data.total_equipment}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Green (On Track)</div>
          <div className="stat-value">{data.status_summary.green}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Orange (Warning)</div>
          <div className="stat-value">{data.status_summary.orange}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🔴</div>
          <div className="stat-label">Red (Critical)</div>
          <div className="stat-value">{data.status_summary.red}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📋</div>
          <div className="stat-label">Total PM Tasks</div>
          <div className="stat-value">{totalTasks}</div>
        </div>
      </div>

      {/* Completion Progress */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Overall PM Completion</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>{completionPct}%</span>
        </div>
        <div style={{
          height: '10px', background: 'var(--bg-primary)', borderRadius: '5px', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: `${completionPct}%`,
            background: completionPct > 80 ? 'var(--green)' : completionPct > 50 ? 'var(--orange)' : 'var(--red)',
            borderRadius: '5px', transition: 'width .5s'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>{totalCompleted} completed</span>
          <span>{totalTasks - totalCompleted} remaining</span>
        </div>
      </div>

      {/* Overdue Aging Section */}
      <div className="page-header" style={{ marginTop: '8px' }}>
        <h2 style={{ fontSize: '20px' }}>Overdue Aging</h2>
        <p>Critical Equipment Overdue: {data.critical_equipment_overdue}</p>
      </div>

      <div className="overdue-grid">
        <div className="overdue-card warning">
          <div className="overdue-label">Overdue Aging 1–3 Days</div>
          <div className="overdue-value">{data.overdue_aging.days_1_3}</div>
        </div>
        <div className="overdue-card danger">
          <div className="overdue-label">Overdue Aging 4–7 Days</div>
          <div className="overdue-value">{data.overdue_aging.days_4_7}</div>
        </div>
        <div className="overdue-card critical">
          <div className="overdue-label">Overdue Aging &gt;7 Days</div>
          <div className="overdue-value">{data.overdue_aging.days_gt_7}</div>
        </div>
      </div>

      {/* Overdue Equipment List Table */}
      {overdueList.length > 0 && (
        <div className="overdue-table-container">
          <div className="table-container">
            <div className="table-header">
              <h3>🚨 Overdue Equipment ({overdueList.length})</h3>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Equipment ID</th>
                    <th>Equipment Name</th>
                    <th>Section</th>
                    <th>Line</th>
                    <th>Criticality</th>
                    <th>Overdue Tasks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueList.map((eq, i) => (
                    <tr key={i} className="clickable-row row-red"
                      onClick={() => navigate(`/equipment/${eq.db_id}`)}>
                      <td><strong>{eq.equipment_id}</strong></td>
                      <td>{eq.equipment_name}</td>
                      <td>{eq.section}</td>
                      <td>{eq.line}</td>
                      <td>{eq.criticality || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--red)' }}>{eq.overdue_count}</td>
                      <td>
                        <span className="status-badge red">
                          <span className="status-dot red"></span>
                          Red
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Sections */}
      <div className="section-grid">
        <div className="section-card">
          <h4>📍 Factory Sections</h4>
          {Object.entries(data.sections).map(([section, count]) => (
            <div className="section-item" key={section}>
              <span>{section}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
        <div className="section-card">
          <h4>⚙️ Equipment Types</h4>
          {Object.entries(data.equipment_types)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => (
              <div className="section-item" key={name}>
                <span>{name}</span>
                <span>{count}</span>
              </div>
            ))}
        </div>
        <div className="section-card">
          <h4>🔧 Production Lines</h4>
          {Object.entries(data.lines).map(([line, count]) => (
            <div className="section-item" key={line}>
              <span>Line {line}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
