import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { QueryProvider } from "./lib/react-query";
import { AuthProvider } from "./context/AuthContext";
import Footer from "./components/Footer";
import { Header } from "./components/Header";
import PageNotFound from "./components/PageNotFound";

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
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import UserDashboard from "./pages/dashboard/UserDashboard";
import ManageProducts from "./pages/dashboard/ManageProducts";
import ManageOrders from "./pages/dashboard/ManageOrders";
import ManageUsers from "./pages/dashboard/ManageUsers";
import AddProduct from "./pages/product/ManageProduct";
import { NotifyInfo } from "./toastify";
import Cart from "./components/cart";

const AppContent = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  React.useEffect(() => {
    if (token) {
      try {
        // Decode JWT manually
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        );
        const decoded = JSON.parse(jsonPayload);

        const hoursLeft =
          (decoded.exp * 1000 - new Date().getTime()) / 1000 / 60 / 60;

        if (hoursLeft < 0) {
          localStorage.removeItem("token");
          NotifyInfo("Your session has expired. Please login again");
          navigate("/");
        } else if (hoursLeft < 24) {
          NotifyInfo(
            `Your session will expire in ${Math.round(hoursLeft)} hours`,
          );
        }
      } catch (error) {
        console.error("Token decode error:", error);
        localStorage.removeItem("token");
      }
    }
  }, [token, navigate]);

  return (
    <>
      <div className="max-w-360 mx-auto bg-white relative">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products" element={<Products />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ManageProducts />} />
          <Route path="/admin/products/add" element={<AddProduct />} />
          <Route path="/admin/products/edit/:id" element={<AddProduct />} />
          <Route path="/admin/orders" element={<ManageOrders />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/verify-email" element={<UserVerification />} />
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
