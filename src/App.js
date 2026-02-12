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
  return (
    <>
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
