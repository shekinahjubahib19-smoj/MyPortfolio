import React from 'react';
import '../assets/css/sidebar.css';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const [route, setRoute] = React.useState(() => {
    try {
      return (window.location.hash || '').replace('#/', '');
    } catch {
      return '';
    }
  });

  React.useEffect(() => {
    const onHash = () => setRoute((window.location.hash || '').replace('#/', ''));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const isActive = (name) => {
    if (!route || route === '') return name === 'dashboard';
    return route === name;
  };

  return (
    <aside className={`sidebar-root ${isAuthenticated ? 'is-visible' : 'is-hidden'}`} aria-hidden={!isAuthenticated}>
      <nav className="sidebar-nav" aria-label="Main sidebar">
        <a href="#/dashboard" className={`sidebar-link ${isActive('dashboard') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="8" height="8" rx="1" />
              <rect x="13" y="3" width="8" height="4" rx="1" />
              <rect x="13" y="9" width="8" height="12" rx="1" />
              <rect x="3" y="13" width="8" height="6" rx="1" />
            </svg>
          </span>
          Dashboard
        </a>

        <a href="#/master-scheduler" className={`sidebar-link ${isActive('master-scheduler') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <rect x="7" y="2" width="2" height="4" rx="1" />
              <rect x="15" y="2" width="2" height="4" rx="1" />
            </svg>
          </span>
          Master Scheduler
        </a>

        <a href="#/teacher-allocation" className={`sidebar-link ${isActive('teacher-allocation') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 20c1.5-4 6-6 7-6s5.5 2 7 6" />
            </svg>
          </span>
          Teacher Allocation
        </a>

        <a href="#/student-assignments" className={`sidebar-link ${isActive('student-assignments') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="4" width="14" height="16" rx="2" />
              <rect x="17" y="6" width="4" height="4" rx="1" />
            </svg>
          </span>
          Student Assignments
        </a>

        <a href="#/distribution" className={`sidebar-link ${isActive('distribution') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="10" width="4" height="11" rx="1" />
              <rect x="9" y="6" width="4" height="15" rx="1" />
              <rect x="15" y="2" width="4" height="19" rx="1" />
            </svg>
          </span>
          Distribution
        </a>

        <a href="#/room-mgmt" className={`sidebar-link ${isActive('room-mgmt') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="7" y="7" width="6" height="6" rx="1" />
            </svg>
          </span>
          Room Management
        </a>

        {user?.role === 'ADMIN' && (
          <a href="#/users" className={`sidebar-link ${isActive('users') ? 'is-active' : ''}`}>
            <span className="sidebar-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="8" r="3" />
                <path d="M2 20c2-4 7-6 9-6s7 2 9 6" />
              </svg>
            </span>
            User Management
          </a>
        )}
      </nav>

      {isAuthenticated && (
        <div className="sidebar-footer">
          <div className="sidebar-user">{user.email}</div>
          <button className="btn small" onClick={logout}>Logout</button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
