import React, { useState } from 'react';
import { login } from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ username, password });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">☀️</div>
        <h2>PM Tracker</h2>
        <p className="login-sub">Solar Panel Manufacturing — Preventive Maintenance</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Logging in...' : 'Login'}
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>
        <div className="login-hint">
          Admin: admin / admin123 &nbsp;|&nbsp; Viewer: any other credentials (view-only)
        </div>
      </div>
    </div>
  );
}

export default Login;
