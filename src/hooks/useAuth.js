import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";

// Auth API
export const authApi = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// Use Login Mutation
export const useLogin = () => {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Don't reload - let the page handle redirect with useAuth context
      // The AuthContext will automatically refresh the user state
    },
  });
};

// Use Register Mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
  });
};

// Use Logout Mutation
export const useLogout = () => {
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => {
      // Even if API fails, redirect
      window.location.href = "/";
    },
  });
};

// Use Verify Email Mutation
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: authApi.verifyEmail,
  });
};

// Use Forgot Password Mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
};

// Use Reset Password Mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: authApi.resetPassword,
  });
};
