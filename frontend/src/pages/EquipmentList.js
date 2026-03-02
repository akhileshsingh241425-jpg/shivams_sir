import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, getSections, getEquipmentNames, getLines, createEquipment, deleteEquipment, importExcel, exportExcel } from '../api';

function EquipmentList({ isAdmin = false }) {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [equipmentNames, setEquipmentNames] = useState([]);
  const [lines, setLines] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Filters
  const [filters, setFilters] = useState({
    section: '',
    name: '',
    line: '',
    status: '',
    search: ''
  });

  // New equipment form
  const [newEquipment, setNewEquipment] = useState({
    equipment_id: '',
    factory_section: '',
    equipment_name: '',
    line: '',
    equipment_criticality: ''
  });

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.section) params.section = filters.section;
      if (filters.name) params.name = filters.name;
      if (filters.line) params.line = filters.line;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const res = await getEquipment(params);
      setEquipment(res.data);
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [secRes, nameRes, lineRes] = await Promise.all([
          getSections(),
          getEquipmentNames(),
          getLines()
        ]);
        setSections(secRes.data);
        setEquipmentNames(nameRes.data);
        setLines(lineRes.data);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      await createEquipment(newEquipment);
      setShowAddModal(false);
      setNewEquipment({
        equipment_id: '',
        factory_section: '',
        equipment_name: '',
        line: '',
        equipment_criticality: ''
      });
      fetchEquipment();
    } catch (err) {
      alert('Failed to create equipment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, eqId) => {
    if (window.confirm(`Delete equipment "${eqId}"? All its PM tasks will also be deleted.`)) {
      try {
        await deleteEquipment(id);
        fetchEquipment();
      } catch (err) {
        alert('Failed to delete equipment');
      }
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const res = await importExcel(file);
      setImportResult(res.data);
      fetchEquipment();
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'PM_Tracker_Export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'green': return 'green';
      case 'orange': return 'orange';
      case 'red': return 'red';
      default: return 'green';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Equipment Master</h2>
        <p>All solar panel manufacturing equipment - mirrors the Master sheet</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by Equipment ID or Name..."
          value={filters.search}
          onChange={e => handleFilterChange('search', e.target.value)}
        />
        <div className="filter-group">
          <label>Section</label>
          <select
            className="filter-select"
            value={filters.section}
            onChange={e => handleFilterChange('section', e.target.value)}
          >
            <option value="">All Sections</option>
            {sections.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Equipment</label>
          <select
            className="filter-select"
            value={filters.name}
            onChange={e => handleFilterChange('name', e.target.value)}
          >
            <option value="">All Equipment</option>
            {equipmentNames.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Line</label>
          <select
            className="filter-select"
            value={filters.line}
            onChange={e => handleFilterChange('line', e.target.value)}
          >
            <option value="">All Lines</option>
            {lines.map(l => (
              <option key={l} value={l}>Line {l}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Green">Green</option>
            <option value="Orange">Orange</option>
            <option value="Red">Red</option>
          </select>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: 'auto' }}>
            + Add Equipment
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xlsm,.xls"
          style={{ display: 'none' }}
          onChange={handleImportExcel}
        />
        <button
          className="btn btn-success"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          style={{ marginTop: 'auto' }}
        >
          {importing ? '⏳ Importing...' : '📥 Import Excel'}
        </button>
        <button className="btn btn-secondary" onClick={handleExportExcel} style={{ marginTop: 'auto' }}>
          📤 Export Excel
        </button>
      </div>

      {/* Import Result */}
      {importResult && (
        <div style={{
          background: 'var(--green-bg)', border: '1px solid var(--green)',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
          color: 'var(--green)', fontSize: '14px'
        }}>
          ✅ Import Complete — Tasks imported: {importResult.tasks_imported} | 
          History imported: {importResult.history_imported} | 
          Sheets skipped: {importResult.skipped_sheets}
          <button onClick={() => setImportResult(null)} style={{
            marginLeft: '16px', background: 'none', border: 'none',
            color: 'var(--green)', cursor: 'pointer', fontSize: '16px'
          }}>×</button>
        </div>
      )}

      {/* Equipment Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Equipment ({equipment.length})</h3>
        </div>
        <div className="table-scroll">
          {loading ? (
            <div className="loading">Loading equipment</div>
          ) : equipment.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <p>No equipment found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipment ID</th>
                  <th>Factory Section</th>
                  <th>Equipment Name</th>
                  <th>Line</th>
                  <th>Criticality</th>
                  <th>PM Status</th>
                  <th>Overdue Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((eq, index) => {
                  const rowClass = eq.overall_pm_status?.toLowerCase() === 'red'
                    ? 'clickable-row row-red'
                    : eq.overall_pm_status?.toLowerCase() === 'orange'
                    ? 'clickable-row row-orange'
                    : 'clickable-row';
                  return (
                  <tr key={eq.id} className={rowClass} onClick={() => navigate(`/equipment/${eq.id}`)}>
                    <td>{index + 1}</td>
                    <td><strong>{eq.equipment_id}</strong></td>
                    <td>{eq.factory_section}</td>
                    <td>{eq.equipment_name}</td>
                    <td>{eq.line}</td>
                    <td>{eq.equipment_criticality || '—'}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(eq.overall_pm_status)}`}>
                        <span className={`status-dot ${getStatusColor(eq.overall_pm_status)}`}></span>
                        {eq.overall_pm_status}
                      </span>
                    </td>
                    <td>{eq.overdue_pm_count}</td>
                    <td>
                      <div className="actions-cell" onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" onClick={() => navigate(`/equipment/${eq.id}`)} title="View">
                          👁️
                        </button>
                        {isAdmin && (
                          <button className="btn-icon" onClick={() => handleDelete(eq.id, eq.equipment_id)} title="Delete">
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add New Equipment</h3>
            <form onSubmit={handleAddEquipment}>
              <div className="form-group">
                <label>Equipment ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Stringer-5-A"
                  value={newEquipment.equipment_id}
                  onChange={e => setNewEquipment({ ...newEquipment, equipment_id: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Factory Section</label>
                  <select
                    value={newEquipment.factory_section}
                    onChange={e => setNewEquipment({ ...newEquipment, factory_section: e.target.value })}
                  >
                    <option value="">Select Section</option>
                    <option value="Pre-Lamination Area">Pre-Lamination Area</option>
                    <option value="Lamination Area">Lamination Area</option>
                    <option value="Post-Lamination Area">Post-Lamination Area</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Equipment Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Stringer"
                    value={newEquipment.equipment_name}
                    onChange={e => setNewEquipment({ ...newEquipment, equipment_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Line</label>
                  <select
                    value={newEquipment.line}
                    onChange={e => setNewEquipment({ ...newEquipment, line: e.target.value })}
                  >
                    <option value="">Select Line</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="PDI">PDI</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Equipment Criticality</label>
                  <select
                    value={newEquipment.equipment_criticality}
                    onChange={e => setNewEquipment({ ...newEquipment, equipment_criticality: e.target.value })}
                  >
                    <option value="">Select Criticality</option>
                    <option value="Critical">Critical</option>
                    <option value="Non-Critical">Non-Critical</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentList;
