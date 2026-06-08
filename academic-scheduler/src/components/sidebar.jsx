import React from "react";
import "../assets/css/sidebar.css";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/img/logo.png";

const Sidebar = ({ collapsed = false, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const [route, setRoute] = React.useState(() => {
    try {
      return (window.location.hash || "").replace("#/", "");
    } catch {
      return "";
    }
  });

  React.useEffect(() => {
    const onHash = () =>
      setRoute((window.location.hash || "").replace("#/", ""));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const isActive = (name) => {
    if (!route || route === "") return name === "master-scheduler";
    return route === name;
  };

  return (
    <aside
      className={`sidebar-root ${isAuthenticated ? "is-visible" : "is-hidden"} ${collapsed ? "is-collapsed" : ""}`}
      aria-hidden={!isAuthenticated}
    >
      <div className="sidebar-header">
        <div className="sidebar-brand" aria-label="SCHED">
          <img src={logo} alt="SCHED logo" className="sidebar-logo" />
          <span className="sidebar-brand-text">Sched</span>
        </div>
        <button
          type="button"
          className="sidebar-collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="sidebar-icon" aria-hidden="true">
            {collapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 6l6 6-6 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14 6l-6 6 6 6" />
              </svg>
            )}
          </span>
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Main sidebar">
        {/* Dashboard removed - not required */}

        <a
          href="#/master-scheduler"
          className={`sidebar-link ${isActive("master-scheduler") ? "is-active" : ""}`}
        >
          <span className="sidebar-icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <rect x="7" y="2" width="2" height="4" rx="1" />
              <rect x="15" y="2" width="2" height="4" rx="1" />
            </svg>
          </span>
          <span className="sidebar-label">Master Scheduler</span>
        </a>

        {/* Admin-only links: show only for ADMIN users */}
        {user?.role === "ADMIN" && (
          <>
            <a
              href="#/teacher-allocation"
              className={`sidebar-link ${isActive("teacher-allocation") ? "is-active" : ""}`}
            >
              <span className="sidebar-icon" aria-hidden="true">
                {/* Clipboard with person — assigning/scheduling teachers */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="3" width="12" height="18" rx="2" />
                  <rect x="8" y="1" width="3" height="3" rx="1" />
                  <rect x="13" y="1" width="3" height="3" rx="1" />
                  <circle cx="12" cy="11" r="2.2" fill="white" opacity=".85" />
                  <path
                    d="M7.5 16c.7-1.8 2.3-2.8 4.5-2.8s3.8 1 4.5 2.8H7.5z"
                    fill="white"
                    opacity=".85"
                  />
                </svg>
              </span>
              <span className="sidebar-label">Teacher Allocation</span>
            </a>

            <a
              href="#/teachers"
              className={`sidebar-link ${isActive("teachers") ? "is-active" : ""}`}
            >
              <span className="sidebar-icon" aria-hidden="true">
                {/* Person with badge — teacher/educator card */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="7" r="4" />
                  <path d="M4 21v-2a6 6 0 0112 0v2" />
                  <rect x="16" y="13" width="6" height="8" rx="1.5" fill="currentColor" opacity=".7" />
                  <path d="M17 15h4M17 18h2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="sidebar-label">Teachers</span>
            </a>
          </>
        )}

        {/* Hidden: Student Assignments, Distribution, Room Management (archived) */}

        <a
          href="#/subjects"
          className={`sidebar-link ${isActive("subjects") ? "is-active" : ""}`}
        >
          <span className="sidebar-icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </span>
          <span className="sidebar-label">Subjects</span>
        </a>

        <a
          href="#/students"
          className={`sidebar-link ${isActive("students") ? "is-active" : ""}`}
        >
          <span className="sidebar-icon" aria-hidden="true">
            {/* Graduation cap — students */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              <path d="M5 13.18V17l7 4 7-4v-3.82L12 17l-7-3.82z" />
            </svg>
          </span>
          <span className="sidebar-label">Students</span>
        </a>

        {user?.role === "ADMIN" && (
          <a
            href="#/users"
            className={`sidebar-link ${isActive("users") ? "is-active" : ""}`}
          >
            <span className="sidebar-icon" aria-hidden="true">
              {/* Shield with person — admin/permissions */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4z"
                  opacity=".35"
                />
                <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm0 4a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 10c-2.5 0-4.71-1.29-6-3.22C6.03 10.12 9.5 9 12 9s5.97 1.12 6 2.78A7.11 7.11 0 0112 15z" />
              </svg>
            </span>
            <span className="sidebar-label">User Management</span>
          </a>
        )}

        {/* Profile link: last nav row for all authenticated users */}
        {isAuthenticated && (
          <a
            href="#/profile"
            className={`sidebar-link ${isActive("profile") ? "is-active" : ""}`}
          >
            <span className="sidebar-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
                <path d="M3 20a9 9 0 0118 0H3z" />
              </svg>
            </span>
            <span className="sidebar-label">Profile</span>
          </a>
        )}
      </nav>

      {isAuthenticated && (
        <div className="sidebar-footer">
          <div className="sidebar-user">{user.email}</div>
          <div className="sidebar-logout-wrap">
            <button className="btn small sidebar-logout-text" onClick={logout}>
              Logout
            </button>
            <button
              className="sidebar-logout-icon"
              onClick={logout}
              aria-label="Logout"
            >
              <span className="sidebar-icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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
