/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockLogin } from '../assets/js/login.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Toggle persistence of the mock auth session. Set to `true` to restore
  // from localStorage so users remain logged in across refreshes. This
  // makes the app behave like a real session-based app in the browser.
  const PERSIST_AUTH = true;

  const [user, setUser] = useState(() => {
    if (!PERSIST_AUTH) return null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('mock_auth_user');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!PERSIST_AUTH) return;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (user) window.localStorage.setItem('mock_auth_user', JSON.stringify(user));
      else window.localStorage.removeItem('mock_auth_user');
    }
  }, [user]);

  const login = async (email, password) => {
    const u = await mockLogin(email, password);
    setUser(u);
    return u;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAdmin: user?.role === 'ADMIN', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
