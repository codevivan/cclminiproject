import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check login state on initial app load via /api/auth/me
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        const response = await authApi.getCurrentUser();
        if (isMounted && response?.user) {
          setUser(response.user);
        }
      } catch (err) {
        // Normal if user is not logged in or cookie expired
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await authApi.login({ email, password });
      setUser(response.user);
      return response;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const response = await authApi.register({ name, email, password });
      setUser(response.user);
      return response;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const ownerLogin = async (email, password, rememberMe = false) => {
    setAuthError(null);
    try {
      const response = await authApi.ownerLogin({ email, password, rememberMe });
      setUser(response.user);
      return response;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const ownerSetup = async (name, email, password, confirmPassword) => {
    setAuthError(null);
    try {
      const response = await authApi.ownerSetup({ name, email, password, confirmPassword });
      setUser(response.user);
      return response;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
    }
  };

  const roleUpper = String(user?.role || '').toUpperCase();
  const isOwner = roleUpper === 'OWNER' || roleUpper === 'ADMIN';
  const isStudent = roleUpper === 'STUDENT';

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    isOwner,
    isAdmin: isOwner, // alias
    isStudent,
    login,
    register,
    ownerLogin,
    ownerSetup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
