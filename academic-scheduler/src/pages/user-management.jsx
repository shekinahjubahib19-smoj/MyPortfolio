import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/user-management.css';
import Registration from '../assets/modals/registration';
import RegisterModal from '../assets/modals/register_modal';
import TeacherProfileModal from '../assets/modals/teacher_profile_modal';
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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileReadOnly, setProfileReadOnly] = useState(false);

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

  useEffect(() => {
    // Defensive cleanup: if no local modals are open, remove any leftover overlays.
    if (isRegOpen || modalOpen || profileModalOpen) return;
    const overlays = document.querySelectorAll('.registration-overlay');
    if (overlays.length === 0) return;
    overlays.forEach((overlay) => overlay.remove());
  }, [isRegOpen, modalOpen, profileModalOpen]);

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
            // ensure both modals/forms are closed and refresh list on success
            setModalOpen(false);
            setRegOpen(false);
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
                  <th style={{ padding: '0.5rem 0.75rem' }}>Teacher Code</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Name</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Max Hours/Day</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => { setSelectedUser(u); setProfileReadOnly(true); setProfileModalOpen(true); }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{u.username}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{u.role}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{u.profile?.teacher_code ?? '-'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{u.profile ? `${u.profile.first_name ?? ''} ${u.profile.last_name ?? ''}`.trim() : '-'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{u.profile?.max_hours_per_day ?? '-'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0.5rem 0.75rem', opacity: 0.6 }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

          <TeacherProfileModal
            isOpen={profileModalOpen}
            readOnly={profileReadOnly}
            onClose={() => { setProfileModalOpen(false); setSelectedUser(null); setProfileReadOnly(false); }}
            user={selectedUser}
            onSaved={() => {
              try {
                // refresh list and close modal
                setProfileModalOpen(false);
                setSelectedUser(null);
                setProfileReadOnly(false);
                if (fetchRef.current) fetchRef.current();
              } catch (err) {
                console.error('onSaved handler error', err);
              }
            }}
          />
      </div>
    </div>
  );
};

export default UserManagement;