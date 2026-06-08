/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
// switched to backend authentication

const API_BASE = '/backend';

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
    // Call backend login endpoint (expects `username` + `password`)
    const resp = await fetch(`${API_BASE}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
    const data = await resp.json();
    if (!data || !data.success) {
      const msg = data?.message || 'Invalid credentials';
      throw new Error(msg);
    }
    const u = data.user;
    setUser(u);
    return u;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAdmin: user?.role === 'ADMIN', login, logout, updateUser }}>
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
