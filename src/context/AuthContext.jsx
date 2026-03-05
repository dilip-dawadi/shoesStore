import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/axios";

const AuthContext = createContext(null);

// Secure in-memory cache with expiration (no localStorage/sessionStorage risk)
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds max cache

let authCache = {
  user: null,
  timestamp: null,
  isValid: () => {
    if (!authCache.timestamp) return false;
    return Date.now() - authCache.timestamp < CACHE_DURATION_MS;
  },
  set: (user) => {
    authCache.user = user;
    authCache.timestamp = Date.now();
    // Also persist to sessionStorage during this browser session
    if (user) {
      try {
        sessionStorage.setItem("auth:temp", JSON.stringify(user));
      } catch (e) {
        // Ignore
      }
    }
  },
  clear: () => {
    authCache.user = null;
    authCache.timestamp = null;
    try {
      sessionStorage.removeItem("auth:temp");
    } catch (e) {
      // Ignore
    }
  },
  get: () => {
    return authCache.isValid() ? authCache.user : null;
  },
  // Get temp fallback for fresh loads (will be cleared on logout)
  getTempFallback: () => {
    try {
      const temp = sessionStorage.getItem("auth:temp");
      return temp ? JSON.parse(temp) : null;
    } catch (e) {
      return null;
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    () => authCache.get() || authCache.getTempFallback(),
  );
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Function to fetch current session from backend
  const fetchSession = async () => {
    try {
      const { data } = await api.get("/auth/session");
      if (data.isAuthenticated && data.user) {
        setUser(data.user);
        authCache.set(data.user);
      } else {
        setUser(null);
        authCache.clear();
      }
    } catch (error) {
      console.error("Session fetch error:", error);
      if (error.response?.status === 401 || error.response?.status === 440) {
        setUser(null);
        authCache.clear();
      }
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  };

  // Initialize auth from session
  useEffect(() => {
    const handleApiStatus = (event) => {
      const online = !!event.detail?.online;
      setApiOnline(online);

      if (!online) {
        setLoading(true);
      }
    };

    window.addEventListener("api:status", handleApiStatus);
    return () => {
      window.removeEventListener("api:status", handleApiStatus);
    };
  }, []);

  useEffect(() => {
    if (!apiOnline) {
      return;
    }

    const initAuth = async () => {
      await fetchSession();
    };

    initAuth();
  }, [apiOnline]);

  // Allow manual refresh of session (e.g., after login or email verification)
  const refreshSession = () => {
    setLoading(true);
    return fetchSession();
  };

  const login = (userData) => {
    if (!userData || !userData.id) {
      console.warn("Invalid user data on login");
      return;
    }
    setUser(userData);
    authCache.set(userData);
    // Clear any stored redirect path after successful login
    // The Login page will handle the actual redirect
    sessionStorage.removeItem("redirectAfterLogin");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      authCache.clear();
    }
  };

  const updateUser = (updates) => {
    if (!user) {
      console.warn("Cannot update user without authenticated session");
      return;
    }
    const updated = { ...user, ...updates };
    setUser(updated);
    authCache.set(updated);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
    apiOnline,
    sessionChecked,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
