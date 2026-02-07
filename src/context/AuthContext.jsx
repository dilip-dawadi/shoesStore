import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken) {
          // Verify token is not expired
          const decoded = jwtDecode(storedToken);
          const isExpired = decoded.exp * 1000 < Date.now();

          if (isExpired) {
            // Token expired, clear storage
            logout();
          } else {
            setToken(storedToken);
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } else {
              // Decode user from token
              const userFromToken = {
                id: decoded.id || decoded.userId,
                email: decoded.email,
                name: decoded.name,
                role: decoded.role || "user",
              };
              setUser(userFromToken);
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (tokenData, userData) => {
    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authenticate");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "admin";

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
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
