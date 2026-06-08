/** 
security: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

..\node-v24.15.0-win-x64\npm.cmd install **/
/**Run daily: ..\node-v24.15.0-win-x64\npm.cmd run dev 

..\node-v24.15.0-win-x64\npm.cmd install @tailwindcss/postcss postcss

short cut:

1. cd academic-scheduler

2. $env:Path += ";C:\xampp\htdocs\Portfolio\node-v24.15.0-win-x64"

3. npm.cmd run dev

4. change pass_hash: php -r "echo password_hash('admin123', PASSWORD_DEFAULT

**/

import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import bgImage from "./assets/img/bg-3d.jpg";
import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";
import Hero from "./sections/hero";
import Login from "./sections/login";
import UserManagement from "./pages/user-management";
import MasterScheduler from "./pages/master-scheduler";
import TeacherAllocation from "./pages/teacher-allocation";
import SubjectList from "./pages/subject-list";
import Teachers from "./pages/teachers";
import Profile from "./pages/profile";
import Students from "./pages/students";
import ChangePassModal from "./assets/modals/change-pass";
import "./assets/css/landing.css";
import { useLandingState } from "./assets/js/landing";

function AppInner() {
  const { user, logout, updateUser } = useAuth();
  const {
    mousePos,
    showLogin,
    isLeaving,
    isHeroLeaving,
    setShowLogin,
    handleMouseMove,
    handleClose,
  } = useLandingState();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

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

  React.useEffect(() => {
    // Keep routing consistent on login/logout and prevent non-admins
    // from remaining on admin-only pages.
    try {
      if (!user) {
        // When signed out, reset to landing root (no route)
        if ((window.location.hash || "").replace("#/", "") !== "") {
          window.location.hash = "#/";
        }
        return;
      }

      const current = (window.location.hash || "").replace("#/", "");

      if (user.must_change_password) {
        if (current !== "master-scheduler") {
          window.location.hash = "#/master-scheduler";
        }
        return;
      }

      // If user just signed in and there's no route, default to dashboard
      if (user && (current === "" || current === "/")) {
        // If profile incomplete, send to setup first
        if (
          (user.role === "TEACHER" || user.role === "ADMIN") &&
          !user.is_profile_complete
        ) {
          window.location.hash = "#/profile";
        } else {
          window.location.hash = "#/master-scheduler";
        }
        return;
      }

      // If a non-admin user is on the admin-only `users` route, redirect
      if (user && user.role !== "ADMIN" && current === "users") {
        window.location.hash = "#/master-scheduler";
      }

      // If a user hasn't completed profile, always redirect to setup
      if (
        user &&
        (user.role === "TEACHER" || user.role === "ADMIN") &&
        !user.is_profile_complete &&
        current !== "profile"
      ) {
        window.location.hash = "#/profile";
      }
    } catch {
      // ignore - window may be unavailable in some environments
    }
  }, [user, route]);

  const showChangePass = !!user?.must_change_password;

  const handlePasswordChanged = () => {
    if (typeof updateUser === "function") {
      updateUser({ must_change_password: false });
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="landing-root relative min-h-screen w-full overflow-hidden bg-black"
    >
      <Navbar />
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Background layers (always present) */}
      <div
        className="landing-bg-layer absolute inset-0 z-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)`,
        }}
      >
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/90 via-[#0f172a]/40 to-[#0f172a]" />
      </div>

      <div
        className="landing-bg-decor absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] mix-blend-screen transition-transform duration-1000 z-0"
        style={{
          transform: `translate(${mousePos.x * -1.5}px, ${mousePos.y * -1.5}px)`,
        }}
      />
      <div
        className="landing-bg-decor absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen transition-transform duration-1000 z-0"
        style={{
          transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)`,
        }}
      />

      {/* If logged in show Dashboard, otherwise show landing split */}
      {user ? (
        <div
          className={`app-root relative z-20 ${isSidebarCollapsed ? "is-collapsed" : ""}`}
        >
          <ChangePassModal
            isOpen={showChangePass}
            user={user}
            onChanged={handlePasswordChanged}
            onLogout={logout}
          />
          {(() => {
            switch (route) {
              case "students":
                return <Students />;
              case "users":
                return <UserManagement />;
              case "master-scheduler":
                return <MasterScheduler />;
              case "teacher-allocation":
                // Only ADMIN may access teacher allocation
                if (user?.role === "ADMIN") return <TeacherAllocation />;
                return <MasterScheduler />;
              case "teachers":
                // Only ADMIN may access teachers list
                if (user?.role === "ADMIN") return <Teachers />;
                return <MasterScheduler />;
              case "subjects":
                return <SubjectList />;
              case "profile":
                return <Profile />;
              case "":
              default:
                return <MasterScheduler />;
            }
          })()}
        </div>
      ) : (
        <div
          className={`landing-split ${showLogin || isLeaving ? "landing-split--active" : ""} ${isLeaving ? "landing-split--leaving" : ""} ${isHeroLeaving ? "landing-split--hero-leaving" : ""}`}
        >
          <div className="landing-hero-pane">
            <Hero onLogin={() => setShowLogin(true)} />
          </div>
          <div
            className={`landing-login-pane ${showLogin ? "is-visible" : ""}`}
          >
            <Login onBack={handleClose} />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
