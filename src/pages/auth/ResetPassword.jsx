import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { FiArrowLeft, FiCheckCircle, FiLock } from "react-icons/fi";
import { useResetPassword } from "../../hooks/useAuth";
import { NotifyError, NotifySuccess } from "../../toastify";
import { Button } from "../../components/ui/button";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetPasswordMutation = useResetPassword();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async ({ password }) => {
    if (!token) {
      NotifyError("Invalid reset link. Please request a new one.");
      return;
    }

    try {
      const response = await resetPasswordMutation.mutateAsync({
        token,
        password,
      });
      NotifySuccess(response.data?.message || "Password reset successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      NotifyError(
        error.response?.data?.message ||
          "Reset link is invalid or expired. Please request a new one.",
      );
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-muted/30 to-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Invalid reset link
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The password reset token is missing. Please request a new reset
            link.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <FiArrowLeft /> Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/30 to-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Create a new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <motion.div
          className="bg-card rounded-2xl shadow-xl border border-border p-8"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                New password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-muted-foreground" />
                </div>
                <input
                  {...register("password")}
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  className="pl-10 w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Confirm new password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCheckCircle className="text-muted-foreground" />
                </div>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  id="confirmPassword"
                  placeholder="••••••••"
                  className="pl-10 w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Updating password...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <FiArrowLeft /> Back to login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
