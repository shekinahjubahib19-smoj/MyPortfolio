import React from 'react';
import './login.css';

const Login = ({ onBack }) => {
  return (
    <div className="login-root">
      {/* Header */}
      <div className="login-header">
        <h2 className="login-title">
         <span className="text-blue-500">Login</span>
        </h2>
        <p className="login-subtitle">
          ESL Operations & Teacher Management Portal
        </p>
      </div>

      {/* Form */}
      <form className="login-form" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="login-field-label">Email</label>
          <input
            type="email"
            placeholder="name@esl-company.com"
            className="login-input"
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '0.25rem' }}>
            <label className="login-field-label">Password</label>
            <a href="#" className="login-forgot">Forgot?</a>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="login-input"
          />
        </div>

        {/* Using your global .btn for the click effects + local utility class */}
        <button className="btn login-submit" type="submit">
          Login
        </button>
      </form>

      {/* Footer / Back Button */}
      <div>
        <button
          onClick={onBack}
          className="login-back"
        >
         Cancel
        </button>
      </div>
    </div>
  );
};

export default Login;