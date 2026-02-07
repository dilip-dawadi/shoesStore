import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { QueryProvider } from "./lib/react-query";
import { AuthProvider } from "./context/AuthContext";
import Footer from "./components/Footer";
import { Header } from "./components/Header";
import PageNotFound from "./components/PageNotFound";

// import pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import Wishlist from "./pages/wishlist";
import ProductDetails from "./pages/ProductDetails";
import UserVerification from "./pages/UserEmailVerification";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import { NotifyInfo } from "./toastify";

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
    <div className="max-w-[1440px] mx-auto bg-white">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/products" element={<Products />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verify-email" element={<UserVerification />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Footer />
    </div>
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
