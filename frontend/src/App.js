import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import EquipmentDetail from './pages/EquipmentDetail';
import PMHistory from './pages/PMHistory';
import Predictions from './pages/Predictions';
import Login from './pages/Login';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pm_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('pm_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pm_user');
  };

  const isAdmin = user?.role === 'admin';

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="logo-icon">☀️</div>
            <h1>PM Tracker</h1>
            <p className="subtitle">Solar Panel Maintenance</p>
          </div>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon">📊</span>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/equipment" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon">⚙️</span>
                Equipment Master
              </NavLink>
            </li>
            <li>
              <NavLink to="/predictions" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon">🔮</span>
                Predictions
              </NavLink>
            </li>
            <li>
              <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon">📋</span>
                PM History
              </NavLink>
            </li>
          </ul>
          <div className="sidebar-footer">
            <div className="user-info">
              <span className={`role-badge ${isAdmin ? 'admin' : 'viewer'}`}>
                {isAdmin ? '🔑 Admin' : '👁️ Viewer'}
              </span>
              <span className="user-name">{user.username}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard isAdmin={isAdmin} />} />
            <Route path="/equipment" element={<EquipmentList isAdmin={isAdmin} />} />
            <Route path="/equipment/:id" element={<EquipmentDetail isAdmin={isAdmin} />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/history" element={<PMHistory />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
