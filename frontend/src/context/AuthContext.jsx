import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agrifarm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('agrifarm_token') || null);
  const [loading, setLoading] = useState(true);

  // Re-verify session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agrifarm_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('agrifarm_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('agrifarm_token');
          localStorage.removeItem('agrifarm_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user: userData, token: jwtToken } = res.data;

    localStorage.setItem('agrifarm_token', jwtToken);
    localStorage.setItem('agrifarm_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authApi.register(formData);
    const { user: userData, token: jwtToken } = res.data;

    localStorage.setItem('agrifarm_token', jwtToken);
    localStorage.setItem('agrifarm_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('agrifarm_token');
    localStorage.removeItem('agrifarm_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('agrifarm_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
