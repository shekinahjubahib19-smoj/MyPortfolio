import React from 'react';
import '../assets/css/user-management.css';
import '../assets/css/student-assignments.css';
import { MOCK_USERS } from '../assets/js/login.js';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();

  if (!user || user?.role !== 'ADMIN') {
    return (
      <div className="sa-root">
        <header className="sa-header">
          <h1>User Management</h1>
          <p className="sa-sub">Access restricted — admin only</p>
        </header>
        <div className="sa-list">
          <div className="sa-card">Access denied — admin only</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-root">
      <header className="sa-header">
        <h1>User Management</h1>
        <p className="sa-sub">Role-based users and account actions (mock)</p>
      </header>

      <div className="sa-list">
        {MOCK_USERS.map((u) => (
          <div className="sa-card" key={u.email}>
            <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
              <div style={{width:40,height:40,borderRadius:6,background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{u.email.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{fontWeight:700}}>{u.email}</div>
                <div style={{color:'rgba(255,255,255,0.75)'}}>Role: {u.role}</div>
              </div>
            </div>
            <div style={{marginLeft:'auto', display:'flex', gap:'0.5rem'}}>
              <button className="btn small">Edit</button>
              <button className="btn small secondary">Disable</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
