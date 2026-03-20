import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { FiArrowLeft, FiMail, FiSend } from "react-icons/fi";
import { useForgotPassword } from "../../hooks/useAuth";
import { NotifyError, NotifySuccess } from "../../toastify";
import { Button } from "../../components/ui/button";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const forgotPasswordMutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }) => {
    try {
      const response = await forgotPasswordMutation.mutateAsync(email);
      NotifySuccess(
        response.data?.message ||
          "If that email exists, a password reset link has been sent.",
      );
    } catch (error) {
      NotifyError(error.response?.data?.message || "Could not process request");
    }
  };

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
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we will send you a reset link.
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
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-muted-foreground" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  className="pl-10 w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Sending link...
                </>
              ) : (
                <>
                  Send reset link
                  <FiSend />
                </>
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
