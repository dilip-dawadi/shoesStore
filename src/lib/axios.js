import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // Enable sending cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle session expiry on protected routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;

    // Handle 401/440 (Unauthorized/Session Expired)
    if (error.response?.status === 401 || error.response?.status === 440) {
      // List of protected route prefixes that require authentication
      const protectedRoutes = [
        "/admin",
        "/dashboard",
        "/profile",
        "/orders",
        "/checkout",
        "/wishlist",
        "/cart",
      ];

      // Only redirect to login if on a protected route
      const isProtectedRoute = protectedRoutes.some((route) =>
        currentPath.startsWith(route),
      );

      if (
        isProtectedRoute &&
        currentPath !== "/login" &&
        currentPath !== "/register"
      ) {
        // Store the attempted URL for redirect after login
        sessionStorage.setItem("redirectAfterLogin", currentPath);
        // Mark that this is due to session expiry (actual API error)
        sessionStorage.setItem("sessionExpired", "true");
        window.location.href = "/login";
      }
    }

    // Handle 403 (Forbidden - e.g., non-admin accessing admin route)
    // Don't redirect, let the component handle it with a notification
    // The AdminRoute component will redirect to dashboard

    return Promise.reject(error);
  },
);

export default api;
