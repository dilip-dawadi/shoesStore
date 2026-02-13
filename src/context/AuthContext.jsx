import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);

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
      try {
        // Check if user has active session
        const { data } = await api.get("/auth/session");

        if (data.isAuthenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (error.response?.status === 401 || error.response?.status === 440) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [apiOnline]);

  const login = (userData) => {
    setUser(userData);
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
    }
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
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
