import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/user-management.css';
import Registration from '../assets/modals/registration';
import RegisterModal from '../assets/modals/register_modal';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  
  const [isRegOpen, setRegOpen] = useState(false);
  const [regKey, setRegKey] = useState(0);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalIsError, setModalIsError] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const fetchRef = useRef(null);

  useEffect(() => {
    fetchRef.current = async () => {
      try {
        const res = await fetch('http://localhost/Portfolio/academic-scheduler/backend/api/list_users.php');
        const json = await res.json();
        if (json.success) setUsers(json.users || []);
      } catch (e) {
        console.error('Failed to fetch users', e);
      }
    };

    // initial load
    fetchRef.current();
  }, []);

  if (!user || user?.role !== 'ADMIN') {
    return (
      <div className="um-root">
        <header className="um-header">
          <h1>User Management</h1>
          <p className="um-sub">Access restricted — admin only</p>
        </header>
        <div className="um-list">
          <div className="um-panel">Access denied — admin only</div>
        </div>
      </div>
    );
  }

  // Registration modal control: opens the `Registration` component

  return (
    <div className="um-root">
      <header className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>User Management</h1>
          <p className="um-sub">Create and manage faculty accounts</p>
        </div>
        <div>
          <button className="btn" onClick={() => setRegOpen(true)} style={{ position: 'relative', zIndex: 20 }}>New</button>
        </div>
      </header>

      {/* Registration Form Section */}
      <>
        <Registration
          key={regKey}
          isOpen={isRegOpen}
          onClose={() => setRegOpen(false)}
          onShowResult={({ title, message, isError = false, success = false }) => {
            // close the registration modal and show the result modal in this page
            setRegOpen(false);
            setModalTitle(title);
            setModalMessage(message);
            setModalIsError(isError);
            setModalSuccess(!!success);
            setModalOpen(true);
          }}
        />
        <RegisterModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            if (modalSuccess && fetchRef.current) fetchRef.current();
            // bump regKey to force remount/refresh of Registration component
            setRegKey((k) => k + 1);
          }}
          title={modalTitle}
          message={modalMessage}
          isError={modalIsError}
        />
      </>

      <div className="um-list">
        <div style={{ padding: '0 0rem' }}>
          <p>Users count: {users.length}</p>

          <div style={{ marginTop: '0.5rem', maxHeight: '75vh', overflowY: 'auto', overflowX: 'auto' }}>
            <table className="um-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Username</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{u.username}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{u.role}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: '0.5rem 0.75rem', opacity: 0.6 }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;