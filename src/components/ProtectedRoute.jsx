import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotifyWarning, NotifyError } from "../toastify";
import { Skeleton } from "./ui/skeleton";

/**
 * MinimalLoadingScreen - Professional minimal loading screen for all pages
 */
const MinimalLoadingScreen = ({ message = "Loading" }) => {
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Centered spinner */}
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin"></div>
        </div>

        {/* Message */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {message}
          </h2>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>

        {/* Subtle dots animation */}
        <div className="flex gap-1.5 mt-6 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * PageLoadingSkeleton - Beautiful loading skeleton for protected routes
 */
const PageLoadingSkeleton = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="fixed bottom-8 right-8 flex items-center gap-3 bg-card px-6 py-3 rounded-full shadow-lg border border-border">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 rounded-full border-2 border-muted"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
          <span className="text-sm font-medium text-foreground">{message}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * ProtectedRoute - Protects routes that require authentication
 * Redirects to home page if user is not authenticated
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, apiOnline, user } = useAuth();
  const location = useLocation();
  const [hasNotified, setHasNotified] = React.useState(false);
  const optimisticAuth = isAuthenticated || (loading && !!user);

  React.useEffect(() => {
    if (apiOnline && !loading && !isAuthenticated && !hasNotified) {
      NotifyWarning("Please login to access this page");
      setHasNotified(true);
    }
  }, [apiOnline, loading, isAuthenticated, hasNotified]);

  // Show loading state while checking authentication
  if (loading) {
    if (optimisticAuth) {
      return children;
    }
    return <MinimalLoadingScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Save the attempted location so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * AdminRoute - Protects routes that require admin access
 * Redirects to user dashboard if authenticated but not admin
 * Redirects to home page if not authenticated
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, apiOnline, user } = useAuth();
  const location = useLocation();
  const [hasNotified, setHasNotified] = React.useState(false);
  const optimisticAuth = isAuthenticated || (loading && !!user);
  const optimisticAdmin =
    isAdmin || (loading && user?.role === "admin" && isAuthenticated);

  React.useEffect(() => {
    if (apiOnline && !loading && !hasNotified) {
      if (!isAuthenticated) {
        NotifyWarning("Please login to access the admin panel");
        setHasNotified(true);
      } else if (!isAdmin) {
        NotifyError(
          "Access denied. You don't have admin privileges to access this page.",
        );
        setHasNotified(true);
      }
    }
  }, [apiOnline, loading, isAuthenticated, isAdmin, hasNotified]);

  // Show loading state while checking authentication
  if (loading) {
    if (optimisticAuth && optimisticAdmin) {
      return children;
    }
    return <MinimalLoadingScreen message="Verifying admin access..." />;
  }

  if (!isAuthenticated) {
    // Save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Authenticated but not admin - redirect to user dashboard
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * PublicOnlyRoute - For routes that should only be accessible when NOT logged in
 * Like login/register pages
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <MinimalLoadingScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    const redirectTo = isAdmin ? "/admin" : "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};
