import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotifyWarning, NotifyError } from "../toastify";
import { Skeleton } from "./ui/skeleton";

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
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [hasNotified, setHasNotified] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !isAuthenticated && !hasNotified) {
      NotifyWarning("Please login to access this page");
      setHasNotified(true);
    }
  }, [loading, isAuthenticated, hasNotified]);

  // Show loading state while checking authentication
  if (loading) {
    return <PageLoadingSkeleton message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Save the attempted location so we can redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * AdminRoute - Protects routes that require admin access
 * Redirects to user dashboard if authenticated but not admin
 * Redirects to home page if not authenticated
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const location = useLocation();
  const [hasNotified, setHasNotified] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !hasNotified) {
      if (!isAuthenticated) {
        NotifyWarning("Please login to access the admin panel");
        setHasNotified(true);
      } else if (!isAdmin) {
        NotifyError("Access denied. Admin privileges required.");
        setHasNotified(true);
      }
    }
  }, [loading, isAuthenticated, isAdmin, hasNotified]);

  // Show loading state while checking authentication
  if (loading) {
    return <PageLoadingSkeleton message="Verifying admin access..." />;
  }

  if (!isAuthenticated) {
    // Save the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
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
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoadingSkeleton message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
