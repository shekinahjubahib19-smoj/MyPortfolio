/** 
security: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

..\node-v24.15.0-win-x64\npm.cmd install **/
/**Run daily: ..\node-v24.15.0-win-x64\npm.cmd run dev 

..\node-v24.15.0-win-x64\npm.cmd install @tailwindcss/postcss postcss

short cut:

1. cd academic-scheduler

2. $env:Path += ";C:\xampp\htdocs\Portfolio\node-v24.15.0-win-x64"

3. npm.cmd run dev

**/

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import bgImage from './assets/img/bg-3d.jpg';
import Navbar from './components/navbar';
import Sidebar from './components/sidebar';
import Hero from './sections/hero';
import Login from './sections/login';
import Dashboard from './pages/dashboard';
import UserManagement from './pages/user-management';
import MasterScheduler from './pages/master-scheduler';
import TeacherAllocation from './pages/teacher-allocation';
import StudentAssignments from './pages/student-assignments';
import Distribution from './pages/distribution';
import RoomMgmt from './pages/room-mgmt';
import './assets/css/landing.css';
import { useLandingState } from './assets/js/landing';

function AppInner() {
  const { user } = useAuth();
  const {
    mousePos,
    showLogin,
    isLeaving,
    isHeroLeaving,
    setShowLogin,
    handleMouseMove,
    handleClose,
  } = useLandingState();

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

  React.useEffect(() => {
    // Keep routing consistent on login/logout and prevent non-admins
    // from remaining on admin-only pages.
    try {
      if (!user) {
        // When signed out, reset to landing root (no route)
        if ((window.location.hash || '').replace('#/', '') !== '') {
          window.location.hash = '#/';
        }
        return;
      }

      const current = (window.location.hash || '').replace('#/', '');

      // If user just signed in and there's no route, default to dashboard
      if (user && (current === '' || current === '/')) {
        window.location.hash = '#/dashboard';
        return;
      }

      // If a non-admin user is on the admin-only `users` route, redirect
      if (user && user.role !== 'ADMIN' && current === 'users') {
        window.location.hash = '#/dashboard';
      }
    } catch {
      // ignore - window may be unavailable in some environments
    }
  }, [user, route]);

  return (
      <div 
      onMouseMove={handleMouseMove}
      className="landing-root relative min-h-screen w-full overflow-hidden bg-black"
    >
      <Navbar />
      <Sidebar />

      {/* Background layers (always present) */}
      <div 
        className="landing-bg-layer absolute inset-0 z-0 transition-transform duration-700 ease-out"
        style={{ 
          transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)` 
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
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] mix-blend-screen transition-transform duration-1000"
        style={{ transform: `translate(${mousePos.x * -1.5}px, ${mousePos.y * -1.5}px)` }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen transition-transform duration-1000"
        style={{ transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)` }}
      />

      {/* If logged in show Dashboard, otherwise show landing split */}
      {user ? (
        <div className="app-root relative z-10">
          {(() => {
            switch (route) {
              case 'users':
                return <UserManagement />;
              case 'master-scheduler':
                return <MasterScheduler />;
              case 'teacher-allocation':
                return <TeacherAllocation />;
              case 'student-assignments':
                return <StudentAssignments />;
              case 'distribution':
                return <Distribution />;
              case 'room-mgmt':
                return <RoomMgmt />;
              case 'dashboard':
              case '':
              default:
                return <Dashboard />;
            }
          })()}
        </div>
      ) : (
        <div className={`landing-split ${showLogin || isLeaving ? 'landing-split--active' : ''} ${isLeaving ? 'landing-split--leaving' : ''} ${isHeroLeaving ? 'landing-split--hero-leaving' : ''}`}>
          <div className="landing-hero-pane">
            <Hero onLogin={() => setShowLogin(true)} />
          </div>
          <div className={`landing-login-pane ${showLogin ? 'is-visible' : ''}`}>
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