import { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryProvider } from "./lib/react-query";
import { AuthProvider } from "./context/AuthContext";
import Footer from "./components/Footer";
import { Header } from "./components/Header";
import PageNotFound from "./components/PageNotFound";
import {
  ProtectedRoute,
  AdminRoute,
  PublicOnlyRoute,
} from "./components/ProtectedRoute";

// import pages
import Home from "./pages/Home";
import Products from "./pages/product/Products";
import Wishlist from "./pages/wishlist";
import ProductDetails from "./pages/product/ProductDetails";
import UserVerification from "./pages/UserEmailVerification";
import Checkout from "./pages/Checkout";
import CartPage from "./pages/Cart";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import UserDashboard from "./pages/dashboard/UserDashboard";
import ManageProducts from "./pages/dashboard/ManageProducts";
import ManageOrders from "./pages/dashboard/ManageOrders";
import ManageUsers from "./pages/dashboard/ManageUsers";
import AddProduct from "./pages/product/ManageProduct";
import Cart from "./components/cart";

const AppContent = () => {
  const [apiOffline, setApiOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState(null);
  const [retryDelayMs, setRetryDelayMs] = useState(null);
  const retryTimerRef = useRef(null);
  const retryDelayRef = useRef(1000);

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const healthUrl = apiBaseUrl.replace(/\/api\/?$/, "") + "/health";

  const sendApiStatus = (online) => {
    window.dispatchEvent(
      new CustomEvent("api:status", {
        detail: { online },
      }),
    );
  };

  const checkHealth = async () => {
    try {
      const response = await fetch(healthUrl, { cache: "no-store" });
      if (response.ok) {
        sendApiStatus(true);
        return true;
      }
    } catch (error) {
      // Ignore fetch errors and keep offline state.
    }

    sendApiStatus(false);
    return false;
  };

  useEffect(() => {
    const handleApiStatus = (event) => {
      const online = !!event.detail?.online;
      setApiOffline(!online);
    };

    window.addEventListener("api:status", handleApiStatus);
    return () => {
      window.removeEventListener("api:status", handleApiStatus);
    };
  }, []);

  useEffect(() => {
    if (apiOffline && !offlineSince) {
      setOfflineSince(Date.now());
    }

    if (!apiOffline) {
      setOfflineSince(null);
      setRetryDelayMs(null);
      retryDelayRef.current = 1000;

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    }
  }, [apiOffline, offlineSince]);

  useEffect(() => {
    if (!apiOffline) {
      return;
    }

    const scheduleRetry = () => {
      const delay = Math.min(retryDelayRef.current, 15000);
      setRetryDelayMs(delay);

      retryTimerRef.current = setTimeout(async () => {
        const ok = await checkHealth();

        if (!ok) {
          retryDelayRef.current = Math.min(retryDelayRef.current * 2, 15000);
          scheduleRetry();
        }
      }, delay);
    };

    scheduleRetry();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [apiOffline]);

  const handleManualRetry = async () => {
    retryDelayRef.current = 1000;
    setRetryDelayMs(0);
    await checkHealth();
  };

  return (
    <>
      {apiOffline ? (
        <div className="fixed top-3 left-3 right-3 z-50 rounded-lg border border-primary-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-primary-900">
                Backend offline. Reconnecting...
              </div>
              <div className="text-xs text-primary-600">
                {retryDelayMs
                  ? `Auto-retry in ~${Math.ceil(retryDelayMs / 1000)}s.`
                  : "Auto-retry active."}
                {offlineSince && Date.now() - offlineSince > 20000
                  ? " Still offline. You can retry now."
                  : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-primary-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary-500" />
              </div>
              <button
                type="button"
                className="rounded-md border border-primary-300 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
                onClick={handleManualRetry}
              >
                Retry now
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="max-w-360 mx-auto bg-white relative">
        <Header />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products" element={<Products />} />
          <Route path="/verify-email" element={<UserVerification />} />

          {/* Auth Routes - Only accessible when NOT logged in */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes - Require Authentication */}
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Require Admin Role */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <ManageProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/add"
            element={
              <AdminRoute>
                <AddProduct />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/edit/:id"
            element={
              <AdminRoute>
                <AddProduct />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <ManageOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            }
          />

          {/* 404 Page */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Footer />
      </div>
      <Cart />
    </>
  );
};

const App = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
