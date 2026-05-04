import React from 'react';
import '../css/registration.css';

const RegisterModal = ({ isOpen, onClose, title = 'Notice', message = '', isError = false }) => {
  if (!isOpen) return null;

  const handleOk = () => {
    onClose();
  };

  return (
    <div className="registration-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="registration-modal" onClick={(e) => e.stopPropagation()}>
        <button className="registration-close" onClick={onClose} aria-label="Close">×</button>
        <div className={`modal-icon ${isError ? 'error' : 'success'}`} aria-hidden>
          {isError ? (
            <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="12" fill="#ff4d4d" fillOpacity="0.12"></circle>
              <path d="M7 7l10 10M17 7L7 17" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="12" fill="#47d147" fillOpacity="0.12"></circle>
              <path d="M6.5 12.5l3 3L17.5 8" stroke="#47d147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </div>
        <h3 style={{ marginTop: 0, textAlign: 'center' }}>{title}</h3>
        <div style={{ minHeight: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
          <p style={{ color: isError ? '#ff4d4d' : '#47d147', margin: 0 }}>{message}</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={handleOk}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
