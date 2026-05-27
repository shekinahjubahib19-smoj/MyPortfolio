import React, { useEffect, useState } from 'react';
import '../css/registration.css';

const ChangePassModal = ({ isOpen, user, onChanged, onLogout }) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setMessage('');
    setWorking(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const passwordRules = {
    length: (value) => value.length >= 8 && value.length <= 12,
    upper: (value) => /[A-Z]/.test(value),
    lower: (value) => /[a-z]/.test(value),
    number: (value) => /\d/.test(value),
    special: (value) => /[^A-Za-z0-9]/.test(value),
  };

  const ruleState = {
    length: passwordRules.length(newPass),
    upper: passwordRules.upper(newPass),
    lower: passwordRules.lower(newPass),
    number: passwordRules.number(newPass),
    special: passwordRules.special(newPass),
  };

  const isPasswordValid = Object.values(ruleState).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!currentPass || !newPass || !confirmPass) {
      setMessage('Please fill in all fields.');
      return;
    }

    if (!isPasswordValid) {
      setMessage('Password must meet all requirements.');
      return;
    }

    if (newPass !== confirmPass) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    setWorking(true);
    try {
      const res = await fetch('http://localhost/MyPortfolio/academic-scheduler/backend/api/change_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          current_password: currentPass,
          new_password: newPass,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setMessage('Password updated successfully.');
        if (typeof onChanged === 'function') onChanged();
      } else {
        setMessage(json?.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Change password failed', err);
      setMessage('Failed to connect to server.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="registration-overlay" role="dialog" aria-modal="true">
      <div className="registration-modal">
        <h3 style={{ marginTop: 0, textAlign: 'center' }}>Change Password</h3>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.75)', marginTop: '-0.25rem' }}>
          Please update your temporary password to continue.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-row">
            <label>Current password</label>
            <input
              type="password"
              className="input-field"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Temporary password"
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <label>New password</label>
            <input
              type="password"
              className="input-field"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="New password"
              required
            />
          </div>

          <div className="form-row">
            <label>Confirm new password</label>
            <input
              type="password"
              className="input-field"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.35rem' }}>Password requirements</div>
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              <div style={{ color: ruleState.upper ? '#47d147' : '#ff8f8f' }}>• At least 1 capital letter</div>
              <div style={{ color: ruleState.lower ? '#47d147' : '#ff8f8f' }}>• At least 1 small letter</div>
              <div style={{ color: ruleState.number ? '#47d147' : '#ff8f8f' }}>• At least 1 number</div>
              <div style={{ color: ruleState.special ? '#47d147' : '#ff8f8f' }}>• At least 1 special character</div>
              <div style={{ color: ruleState.length ? '#47d147' : '#ff8f8f' }}>• 8 to 12 characters</div>
            </div>
          </div>

          {message && (
            <p style={{ fontSize: '0.85rem', color: message.toLowerCase().includes('success') ? '#47d147' : '#ff4d4d' }}>
              {message}
            </p>
          )}

          <div className="actions">
            <button type="button" className="btn secondary" onClick={onLogout} disabled={working}>Logout</button>
            <button type="submit" className="btn primary" disabled={working}>{working ? 'Saving…' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassModal;
