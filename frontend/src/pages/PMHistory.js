import React, { useState, useEffect, useCallback } from 'react';
import { getHistory } from '../api';

function PMHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterEquipment, setFilterEquipment] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 25 };
      if (filterEquipment) params.equipment_id = filterEquipment;

      const res = await getHistory(params);
      setHistory(res.data.items);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterEquipment]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = (e) => {
    setFilterEquipment(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <h2>PM History</h2>
        <p>Historical log of all completed preventive maintenance tasks</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Filter by Equipment ID..."
          value={filterEquipment}
          onChange={handleSearch}
        />
        <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          Total records: {total}
        </span>
      </div>

      {/* History Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Completed PM Tasks</h3>
        </div>
        <div className="table-scroll">
          {loading ? (
            <div className="loading">Loading history</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No PM history records yet. Complete PM tasks to see history here.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Equipment ID</th>
                  <th>Task No</th>
                  <th>PM Task</th>
                  <th>Frequency (Days)</th>
                  <th>Tolerance (Days)</th>
                  <th>Old Next Due Date</th>
                  <th>Actual Done Date</th>
                  <th>Consumables</th>
                  <th>Spare Parts</th>
                  <th>Done By</th>
                  <th>Verified By</th>
                  <th>Remarks</th>
                  <th>Completion Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td><strong>{h.equipment_id}</strong></td>
                    <td>{h.task_no}</td>
                    <td>{h.pm_task}</td>
                    <td>{h.frequency_days || '—'}</td>
                    <td>{h.tolerance_days || '—'}</td>
                    <td>{h.old_next_due_date || '—'}</td>
                    <td>{h.actual_done_date || '—'}</td>
                    <td>{h.consumables || '—'}</td>
                    <td>{h.spare_parts || '—'}</td>
                    <td>{h.done_by || '—'}</td>
                    <td>{h.verified_by || '—'}</td>
                    <td>{h.remarks || '—'}</td>
                    <td>{h.completion_timestamp ? new Date(h.completion_timestamp).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PMHistory;
