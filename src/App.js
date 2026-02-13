import { useEffect, useState } from "react";
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

  useEffect(() => {
    const handleApiStatus = (event) => {
      setApiOffline(!event.detail?.online);
    };

    window.addEventListener("api:status", handleApiStatus);
    return () => {
      window.removeEventListener("api:status", handleApiStatus);
    };
  }, []);

  return (
    <>
      {apiOffline ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-lg border border-primary-200 bg-white px-6 py-5 text-center shadow-sm">
            <div className="text-lg font-semibold text-primary-900">
              Reconnecting...
            </div>
            <div className="mt-1 text-sm text-primary-600">
              Backend is restarting. We will reconnect automatically.
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-100">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary-500" />
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
