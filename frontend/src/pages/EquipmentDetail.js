import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEquipmentById, createTask, updateTask, deleteTask, completeTask, getDropdownOptions } from '../api';

/* ── Inline‑cell style (Excel look) ── */
const cell = {
  width: '100%', background: 'transparent', border: '1px solid transparent',
  color: 'var(--text-primary)', padding: '6px 8px', fontSize: '13px',
  outline: 'none', borderRadius: '3px', boxSizing: 'border-box',
};
const cellFocus = { border: '1px solid var(--primary)', background: 'var(--bg-input)' };

function InlineInput({ value, onChange, type = 'text', placeholder = '', style: extra = {}, disabled = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value ?? ''}
      placeholder={focused ? placeholder : ''}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...cell, ...(focused ? cellFocus : {}), ...extra }}
      disabled={disabled}
    />
  );
}

function InlineTextarea({ value, onChange, placeholder = '', disabled = false, rows = 2 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value ?? ''}
      placeholder={focused ? placeholder : ''}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      rows={rows}
      style={{
        ...cell, ...(focused ? cellFocus : {}),
        resize: 'vertical', minHeight: '36px', fontFamily: 'inherit',
      }}
      disabled={disabled}
    />
  );
}

function InlineSelect({ value, onChange, options = [], placeholder = '', disabled = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...cell, ...(focused ? cellFocus : {}), cursor: disabled ? 'not-allowed' : 'pointer' }}
      disabled={disabled}
    >
      <option value="">{placeholder || '— Select —'}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

/* Multi-select dropdown with checkboxes for consumables / spare parts */
function InlineMultiSelect({ value, onChange, options = [], placeholder = '', disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  // value is comma-separated string → array
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggle = (opt) => {
    let next;
    if (selected.includes(opt)) {
      next = selected.filter(s => s !== opt);
    } else {
      next = [...selected, opt];
    }
    onChange(next.join(', '));
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => { if (!disabled) setOpen(!open); }}
        style={{
          ...cell,
          ...(open ? cellFocus : {}),
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '34px', display: 'flex', alignItems: 'center',
          flexWrap: 'wrap', gap: '3px'
        }}
      >
        {selected.length === 0
          ? <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{placeholder || '— Select —'}</span>
          : selected.map(s => (
              <span key={s} style={{
                background: 'var(--primary)', color: '#fff', fontSize: '11px',
                padding: '1px 7px', borderRadius: '10px', display: 'inline-flex',
                alignItems: 'center', gap: '3px'
              }}>
                {s}
                <span onClick={e => { e.stopPropagation(); toggle(s); }}
                  style={{ cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>×</span>
              </span>
            ))
        }
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--primary)',
          borderRadius: '0 0 6px 6px', maxHeight: '180px', overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,.25)'
        }}>
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px', cursor: 'pointer', fontSize: '12px',
              color: 'var(--text-primary)',
              background: selected.includes(opt) ? 'rgba(99,102,241,.12)' : 'transparent'
            }}>
              <input type="checkbox" checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: 'var(--primary)' }} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function EquipmentDetail({ isAdmin = false }) {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpts, setDropdownOpts] = useState({
    spare_parts: [], consumables: [], done_by: [], verified_by: []
  });

  /* editing rows: { [taskId]: { ...fields } } */
  const [editRows, setEditRows] = useState({});
  /* new empty row being typed */
  const emptyRow = {
    pm_task_description: '', frequency_days: '', tolerance_days: '',
    next_due_date: '', consumables: '', spare_parts: '',
    done_by: '', verified_by: '', remarks: ''
  };
  const [newRow, setNewRow] = useState({ ...emptyRow });
  const [saving, setSaving] = useState({});          // { taskId: true }
  const [showCompleteTask, setShowCompleteTask] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    actual_done_date: new Date().toISOString().split('T')[0],
    consumables: '', spare_parts: '', done_by: '', verified_by: '', remarks: ''
  });
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEquipmentById(id);
      setEquipment(res.data);
      setTasks(res.data.tasks || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  // Fetch dropdown options
  useEffect(() => {
    const fetchOpts = async () => {
      try {
        const res = await getDropdownOptions();
        setDropdownOpts(res.data);
      } catch (err) { console.error('Failed to load dropdown options:', err); }
    };
    fetchOpts();
  }, []);

  /* ── Inline editing helpers ── */
  const startEdit = (task) => {
    setEditRows(prev => ({
      ...prev,
      [task.id]: {
        pm_task_description: task.pm_task_description || '',
        frequency_days: task.frequency_days ?? '',
        tolerance_days: task.tolerance_days ?? '',
        next_due_date: task.next_due_date || '',
        consumables: task.consumables || '',
        spare_parts: task.spare_parts || '',
        done_by: task.done_by || '',
        verified_by: task.verified_by || '',
        remarks: task.remarks || ''
      }
    }));
  };

  const cancelEdit = (taskId) => {
    setEditRows(prev => { const n = { ...prev }; delete n[taskId]; return n; });
  };

  const updateEditField = (taskId, field, value) => {
    setEditRows(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value }
    }));
  };

  const saveEdit = async (taskId) => {
    const row = editRows[taskId];
    if (!row) return;
    setSaving(p => ({ ...p, [taskId]: true }));
    try {
      await updateTask(taskId, {
        ...row,
        frequency_days: row.frequency_days ? parseInt(row.frequency_days) : null,
        tolerance_days: row.tolerance_days ? parseInt(row.tolerance_days) : 0
      });
      cancelEdit(taskId);
      notify('Task updated!');
      fetchEquipment();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(p => ({ ...p, [taskId]: false })); }
  };

  /* ── Add new row (bottom empty row → save) ── */
  const handleNewRowSave = async () => {
    if (!newRow.pm_task_description.trim()) return;
    setSaving(p => ({ ...p, new: true }));
    try {
      await createTask(id, {
        ...newRow,
        frequency_days: newRow.frequency_days ? parseInt(newRow.frequency_days) : null,
        tolerance_days: newRow.tolerance_days ? parseInt(newRow.tolerance_days) : 0
      });
      setNewRow({ ...emptyRow });
      notify('New task added!');
      fetchEquipment();
    } catch (err) {
      alert('Add failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(p => ({ ...p, new: false })); }
  };

  /* ── Delete ── */
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this PM task?')) return;
    try { await deleteTask(taskId); notify('Task deleted'); fetchEquipment(); }
    catch { alert('Delete failed'); }
  };

  /* ── Complete ── */
  const openCompleteTask = (task) => {
    setCompleteForm({
      actual_done_date: new Date().toISOString().split('T')[0],
      consumables: task.consumables || '', spare_parts: task.spare_parts || '',
      done_by: task.done_by || '', verified_by: task.verified_by || '', remarks: task.remarks || ''
    });
    setShowCompleteTask(task);
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    try {
      await completeTask(showCompleteTask.id, completeForm);
      setShowCompleteTask(null);
      notify('Task marked complete!');
      fetchEquipment();
    } catch (err) { alert('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'green': return 'green'; case 'orange': return 'orange'; case 'red': return 'red';
      default: return 'green';
    }
  };
  const getStatusClass = (s) => {
    switch (s?.toLowerCase()) {
      case 'done': return 'done'; case 'overdue': return 'overdue';
      default: return 'pending';
    }
  };

  if (loading) return <div className="loading">Loading equipment details...</div>;
  if (!equipment) return <div className="empty-state"><p>Equipment not found</p></div>;

  /* ── Spreadsheet‑style CSS (scoped) ── */
  const sheetBorder = '1px solid var(--border-color)';
  const headerCell = {
    padding: '10px 8px', fontWeight: 700, fontSize: '12px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'var(--text-secondary)', borderBottom: '2px solid var(--primary)',
    background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 2,
    whiteSpace: 'nowrap', textAlign: 'left',
  };
  const tdStyle = { padding: '2px 4px', borderBottom: sheetBorder, verticalAlign: 'middle' };

  return (
    <div>
      <Link to="/equipment" className="back-link">← Back to Equipment List</Link>

      {/* ── Notification Toast ── */}
      {notification && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 24px',
          borderRadius: '8px', fontSize: '14px', fontWeight: 600,
          background: notification.type === 'success' ? 'var(--green)' : 'var(--red)',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          animation: 'fadeIn .3s ease'
        }}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.msg}
        </div>
      )}

      {/* ── Excel-style Equipment ID Header ── */}
      <div style={{
        background: 'var(--bg-card)', border: sheetBorder, borderRadius: '8px 8px 0 0',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
        marginTop: '16px'
      }}>
        <span style={{
          fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '1px', minWidth: '110px'
        }}>
          Equipment ID
        </span>
        <span style={{
          fontSize: '22px', fontWeight: 800, color: 'var(--primary)',
          letterSpacing: '0.5px'
        }}>
          {equipment.equipment_id}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {equipment.factory_section} &bull; {equipment.equipment_name} &bull; Line {equipment.line}
          </span>
          <span className={`status-badge ${getStatusColor(equipment.overall_pm_status)}`}>
            <span className={`status-dot ${getStatusColor(equipment.overall_pm_status)}`}></span>
            {equipment.overall_pm_status}
          </span>
        </div>
      </div>

      {/* ── PM Tasks Spreadsheet ── */}
      <div style={{
        background: 'var(--bg-card)', border: sheetBorder, borderTop: 'none',
        borderRadius: '0 0 8px 8px', overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
            <thead>
              <tr>
                <th style={{ ...headerCell, width: '60px', textAlign: 'center' }}>Task No</th>
                <th style={{ ...headerCell, minWidth: '220px' }}>PM Task Description</th>
                <th style={{ ...headerCell, width: '100px' }}>Frequency (Days)</th>
                <th style={{ ...headerCell, width: '100px' }}>Tolerance (Days)</th>
                <th style={{ ...headerCell, width: '130px' }}>Next Due Date</th>
                <th style={{ ...headerCell, width: '90px', textAlign: 'center' }}>Status</th>
                <th style={{ ...headerCell, width: '130px' }}>Actual Done Date</th>
                <th style={{ ...headerCell, width: '140px' }}>Consumables</th>
                <th style={{ ...headerCell, width: '140px' }}>Spare Parts</th>
                <th style={{ ...headerCell, width: '110px' }}>Done By</th>
                <th style={{ ...headerCell, width: '110px' }}>Verified By</th>
                <th style={{ ...headerCell, minWidth: '150px' }}>Remarks / Observation</th>
                <th style={{ ...headerCell, width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* ── Existing task rows ── */}
              {tasks.map(task => {
                const isEditing = !!editRows[task.id];
                const row = editRows[task.id] || {};
                return (
                  <tr key={task.id} style={{
                    background: isEditing ? 'rgba(99,102,241,.08)' : 'transparent',
                    transition: 'background .2s'
                  }}
                  onDoubleClick={() => { if (!isEditing && isAdmin) startEdit(task); }}
                  title={!isEditing ? (isAdmin ? 'Double-click to edit' : 'View only (admin can edit)') : ''}
                  >
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {task.task_no}
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineTextarea value={row.pm_task_description} onChange={v => updateEditField(task.id, 'pm_task_description', v)} placeholder="Task description" rows={2} />
                        : <span style={{ padding: '6px 8px', display: 'block' }}>{task.pm_task_description}</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineInput type="number" value={row.frequency_days} onChange={v => updateEditField(task.id, 'frequency_days', v)} placeholder="30" style={{ textAlign: 'center' }} />
                        : <span style={{ padding: '6px 8px', display: 'block', textAlign: 'center' }}>{task.frequency_days || '—'}</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineInput type="number" value={row.tolerance_days} onChange={v => updateEditField(task.id, 'tolerance_days', v)} placeholder="3" style={{ textAlign: 'center' }} />
                        : <span style={{ padding: '6px 8px', display: 'block', textAlign: 'center' }}>{task.tolerance_days || '—'}</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineInput type="date" value={row.next_due_date} onChange={v => updateEditField(task.id, 'next_due_date', v)} />
                        : <span style={{ padding: '6px 8px', display: 'block' }}>{task.next_due_date || '—'}</span>
                      }
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span className={`status-badge ${getStatusClass(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: '6px 8px', display: 'block' }}>
                        {task.actual_done_date || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineMultiSelect value={row.consumables} onChange={v => updateEditField(task.id, 'consumables', v)} options={dropdownOpts.consumables} placeholder="Select consumables" />
                        : <span style={{ padding: '6px 8px', display: 'block' }}>{task.consumables || '—'}</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineMultiSelect value={row.spare_parts} onChange={v => updateEditField(task.id, 'spare_parts', v)} options={dropdownOpts.spare_parts} placeholder="Select spare parts" />
                        : <span style={{ padding: '6px 8px', display: 'block' }}>{task.spare_parts || '—'}</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineSelect value={row.done_by} onChange={v => updateEditField(task.id, 'done_by', v)} options={dropdownOpts.done_by} placeholder="Select person" />
                        : <span style={{ padding: '6px 8px', display: 'block' }}>{task.done_by || '—'}</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineSelect value={row.verified_by} onChange={v => updateEditField(task.id, 'verified_by', v)} options={dropdownOpts.verified_by} placeholder="Select verifier" />
                        : <span style={{ padding: '6px 8px', display: 'block' }}>{task.verified_by || '—'}</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {isEditing
                        ? <InlineTextarea value={row.remarks} onChange={v => updateEditField(task.id, 'remarks', v)} placeholder="Remarks / observations..." rows={2} />
                        : <span style={{ padding: '6px 8px', display: 'block' }}>{task.remarks || '—'}</span>
                      }
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {isEditing ? (
                          <>
                            <button className="btn-icon" onClick={() => saveEdit(task.id)} title="Save"
                              disabled={saving[task.id]}
                              style={{ color: 'var(--green)', fontSize: '16px' }}>
                              {saving[task.id] ? '⏳' : '💾'}
                            </button>
                            <button className="btn-icon" onClick={() => cancelEdit(task.id)} title="Cancel"
                              style={{ color: 'var(--red)', fontSize: '16px' }}>
                              ✖
                            </button>
                          </>
                        ) : (
                          <>
                            {isAdmin && (
                              <button className="btn-icon" onClick={() => startEdit(task)} title="Edit row">
                                ✏️
                              </button>
                            )}
                            {isAdmin && (
                              <button className="btn-icon" onClick={() => openCompleteTask(task)} title="Mark Complete">
                                ✅
                              </button>
                            )}
                            {isAdmin && (
                              <button className="btn-icon" onClick={() => handleDeleteTask(task.id)} title="Delete">
                                🗑️
                              </button>
                            )}
                            {!isAdmin && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View only</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* ── New row (always at bottom, like adding in Excel) — Admin only ── */}
              {isAdmin && (
              <tr style={{ background: 'rgba(34,197,94,.06)' }}>
                <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--green)', fontWeight: 700 }}>
                  +
                </td>
                <td style={tdStyle}>
                  <InlineTextarea
                    value={newRow.pm_task_description}
                    onChange={v => setNewRow({ ...newRow, pm_task_description: v })}
                    placeholder="Type new task description..."
                    rows={2}
                  />
                </td>
                <td style={tdStyle}>
                  <InlineInput type="number" value={newRow.frequency_days}
                    onChange={v => setNewRow({ ...newRow, frequency_days: v })} placeholder="30" />
                </td>
                <td style={tdStyle}>
                  <InlineInput type="number" value={newRow.tolerance_days}
                    onChange={v => setNewRow({ ...newRow, tolerance_days: v })} placeholder="3" />
                </td>
                <td style={tdStyle}>
                  <InlineInput type="date" value={newRow.next_due_date}
                    onChange={v => setNewRow({ ...newRow, next_due_date: v })} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>—</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>—</span>
                </td>
                <td style={tdStyle}>
                  <InlineMultiSelect value={newRow.consumables}
                    onChange={v => setNewRow({ ...newRow, consumables: v })}
                    options={dropdownOpts.consumables} placeholder="Select consumables" />
                </td>
                <td style={tdStyle}>
                  <InlineMultiSelect value={newRow.spare_parts}
                    onChange={v => setNewRow({ ...newRow, spare_parts: v })}
                    options={dropdownOpts.spare_parts} placeholder="Select spare parts" />
                </td>
                <td style={tdStyle}>
                  <InlineSelect value={newRow.done_by}
                    onChange={v => setNewRow({ ...newRow, done_by: v })}
                    options={dropdownOpts.done_by} placeholder="Select person" />
                </td>
                <td style={tdStyle}>
                  <InlineSelect value={newRow.verified_by}
                    onChange={v => setNewRow({ ...newRow, verified_by: v })}
                    options={dropdownOpts.verified_by} placeholder="Select verifier" />
                </td>
                <td style={tdStyle}>
                  <InlineTextarea value={newRow.remarks}
                    onChange={v => setNewRow({ ...newRow, remarks: v })} placeholder="Remarks / observations..." rows={2} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleNewRowSave}
                    disabled={!newRow.pm_task_description.trim() || saving.new}
                    style={{ fontSize: '12px', padding: '5px 12px', whiteSpace: 'nowrap' }}
                  >
                    {saving.new ? '⏳' : '➕ Add'}
                  </button>
                </td>
              </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div style={{
          padding: '12px 20px', borderTop: sheetBorder,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '13px', color: 'var(--text-secondary)'
        }}>
          <span>Total Tasks: <strong style={{ color: 'var(--text-primary)' }}>{tasks.length}</strong></span>
          <span style={{ fontSize: '11px' }}>
            {isAdmin
              ? 'Double-click any row to edit inline • Fill bottom row to add new task'
              : '🔒 View-only mode — login as admin to edit tasks'}
          </span>
        </div>
      </div>

      {/* ── Complete Task Modal ── */}
      {showCompleteTask && (
        <div className="modal-overlay" onClick={() => setShowCompleteTask(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Complete PM Task</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Task #{showCompleteTask.task_no}: {showCompleteTask.pm_task_description}
            </p>
            <form onSubmit={handleCompleteTask}>
              <div className="form-group">
                <label>Actual Done Date *</label>
                <input type="date" required value={completeForm.actual_done_date}
                  onChange={e => setCompleteForm({ ...completeForm, actual_done_date: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Consumables Used</label>
                  <InlineMultiSelect
                    value={completeForm.consumables}
                    onChange={v => setCompleteForm({ ...completeForm, consumables: v })}
                    options={dropdownOpts.consumables}
                    placeholder="Select consumables"
                  />
                </div>
                <div className="form-group">
                  <label>Spare Parts Used</label>
                  <InlineMultiSelect
                    value={completeForm.spare_parts}
                    onChange={v => setCompleteForm({ ...completeForm, spare_parts: v })}
                    options={dropdownOpts.spare_parts}
                    placeholder="Select spare parts"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Done By *</label>
                  <select required value={completeForm.done_by}
                    onChange={e => setCompleteForm({ ...completeForm, done_by: e.target.value })}>
                    <option value="">— Select —</option>
                    {dropdownOpts.done_by.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Verified By *</label>
                  <select required value={completeForm.verified_by}
                    onChange={e => setCompleteForm({ ...completeForm, verified_by: e.target.value })}>
                    <option value="">— Select —</option>
                    {dropdownOpts.verified_by.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Remarks / Observations</label>
                <textarea rows={3} placeholder="Any remarks or observations..."
                  value={completeForm.remarks}
                  onChange={e => setCompleteForm({ ...completeForm, remarks: e.target.value })}
                  style={{ resize: 'vertical', minHeight: '60px' }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-success">✅ Complete Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentDetail;
