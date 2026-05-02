import React, { useState } from 'react';
import './login.css';
import { useAuth } from '../context/AuthContext';
import { submitLogin } from '../assets/js/login.js';

const Login = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitLogin({ email, password, login, onBack, setError, setLoading });
  };

  return (
    <div className="login-root">
      <div className="login-header">
        <h2 className="login-title"><span className="text-blue-500">Login</span></h2>
        <p className="login-subtitle">ESL Operations & Teacher Management Portal</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div>
          <label className="login-field-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@esl-company.com"
            className="login-input"
            required
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '0.25rem' }}>
            <label className="login-field-label">Password</label>
            <a href="#" className="login-forgot">Forgot?</a>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="login-input"
            required
          />
        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <button className="btn login-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <div>
        <button onClick={onBack} className="login-back">Cancel</button>
      </div>
    </div>
  );
};

export default Login;