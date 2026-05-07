import React from 'react';
import '../css/set-up-profile.css';

const SetupProfileResult = ({ isOpen, isError, message, onOk }) => {
  if (!isOpen) return null;

  return (
    <div className="setup-result-overlay" role="dialog" aria-modal="true" onClick={onOk}>
      <div className="setup-result-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`setup-result-icon ${isError ? 'error' : 'success'}`} aria-hidden="true">
          {isError ? (
            <svg viewBox="0 0 24 24" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="12" fill="#ff4d4d" fillOpacity="0.12"></circle>
              <path d="M7 7l10 10M17 7L7 17" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="12" fill="#47d147" fillOpacity="0.12"></circle>
              <path d="M6.5 12.5l3 3L17.5 8" stroke="#47d147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </div>
        <h3 className="setup-result-title">{isError ? 'Failed to save' : 'Save successful'}</h3>
        <p className={`setup-result-message ${isError ? 'error' : 'success'}`}>{message}</p>
        <div className="setup-result-actions">
          <button className="btn primary" onClick={onOk}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default SetupProfileResult;
