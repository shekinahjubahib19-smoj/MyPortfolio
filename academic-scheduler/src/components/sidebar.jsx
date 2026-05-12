import React from 'react';
import '../assets/css/sidebar.css';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/img/logo.png';

const Sidebar = ({ collapsed = false, onToggleCollapse }) => {
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
    <aside className={`sidebar-root ${isAuthenticated ? 'is-visible' : 'is-hidden'} ${collapsed ? 'is-collapsed' : ''}`} aria-hidden={!isAuthenticated}>
      <div className="sidebar-header">
        <div className="sidebar-brand" aria-label="SCHED">
          <img src={logo} alt="SCHED logo" className="sidebar-logo" />
          <span className="sidebar-brand-text">Sched</span>
        </div>
        <button
          type="button"
          className="sidebar-collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sidebar-icon" aria-hidden="true">
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6l6 6-6 6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 6l-6 6 6 6" />
              </svg>
            )}
          </span>
        </button>
      </div>
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
          <span className="sidebar-label">Dashboard</span>
        </a>

        <a href="#/master-scheduler" className={`sidebar-link ${isActive('master-scheduler') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <rect x="7" y="2" width="2" height="4" rx="1" />
              <rect x="15" y="2" width="2" height="4" rx="1" />
            </svg>
          </span>
          <span className="sidebar-label">Master Scheduler</span>
        </a>

        <a href="#/teacher-allocation" className={`sidebar-link ${isActive('teacher-allocation') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 20c1.5-4 6-6 7-6s5.5 2 7 6" />
            </svg>
          </span>
          <span className="sidebar-label">Teacher Allocation</span>
        </a>

        <a href="#/subjects" className={`sidebar-link ${isActive('subjects') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </span>
          <span className="sidebar-label">Subjects</span>
        </a>

        <a href="#/students" className={`sidebar-link ${isActive('students') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a4 4 0 100 8 4 4 0 000-8zM4 20a8 8 0 0116 0H4z" />
            </svg>
          </span>
          <span className="sidebar-label">Students</span>
        </a>

        <a href="#/student-assignments" className={`sidebar-link ${isActive('student-assignments') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="4" width="14" height="16" rx="2" />
              <rect x="17" y="6" width="4" height="4" rx="1" />
            </svg>
          </span>
          <span className="sidebar-label">Student Assignments</span>
        </a>

        <a href="#/distribution" className={`sidebar-link ${isActive('distribution') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="10" width="4" height="11" rx="1" />
              <rect x="9" y="6" width="4" height="15" rx="1" />
              <rect x="15" y="2" width="4" height="19" rx="1" />
            </svg>
          </span>
          <span className="sidebar-label">Distribution</span>
        </a>

        <a href="#/room-mgmt" className={`sidebar-link ${isActive('room-mgmt') ? 'is-active' : ''}`}>
          <span className="sidebar-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="7" y="7" width="6" height="6" rx="1" />
            </svg>
          </span>
          <span className="sidebar-label">Room Management</span>
        </a>

        {user?.role === 'ADMIN' && (
          <a href="#/users" className={`sidebar-link ${isActive('users') ? 'is-active' : ''}`}>
            <span className="sidebar-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="8" r="3" />
                <path d="M2 20c2-4 7-6 9-6s7 2 9 6" />
              </svg>
            </span>
            <span className="sidebar-label">User Management</span>
          </a>
        )}
      </nav>

      {isAuthenticated && (
        <div className="sidebar-footer">
          <div className="sidebar-user">{user.email}</div>
          <div className="sidebar-logout-wrap">
            <button className="btn small sidebar-logout-text" onClick={logout}>Logout</button>
            <button className="sidebar-logout-icon" onClick={logout} aria-label="Logout">
              <span className="sidebar-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 3a1 1 0 011 1v4h-2V5H5v14h4v-3h2v4a1 1 0 01-1 1H5a2 2 0 01-2-2V5a2 2 0 012-2h5z" />
                  <path d="M21 12l-4-4v3h-6v2h6v3l4-4z" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
