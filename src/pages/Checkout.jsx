import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FiCreditCard, FiLock, FiRefreshCw } from "react-icons/fi";
import { SiStripe } from "react-icons/si";
import {
  NotifySuccess,
  NotifyError,
  NotifyInfo,
  LoadingBtn,
} from "../toastify";
import api from "../lib/axios";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_your_key_here",
);

const CHECKOUT_STORAGE_KEY = "checkout:pendingOrder";
const CHECKOUT_CONFIRMING_KEY = "checkout:confirmingSessionId";
const CHECKOUT_CONFIRMED_KEY = "checkout:confirmedSessionId";

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: cart, isLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmingSession, setIsConfirmingSession] = useState(false);
  const [hasStartedCheckout, setHasStartedCheckout] = useState(false);

  const cartItems = cart?.items || [];

  const totals = useMemo(() => {
    const toNumber = (value) =>
      Number.isFinite(Number(value)) ? Number(value) : 0;

    const subtotal = cartItems.reduce(
      (sum, item) =>
        sum +
        toNumber(item.price ?? item.product?.price) * toNumber(item.quantity),
      0,
    );
    const shipping = subtotal > 100 ? 0 : cartItems.length > 0 ? 10 : 0;
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, taxRate, total };
  }, [cartItems]);

  const buildPendingOrder = async () => {
    const profileResponse = await api.get("/users/profile");
    const profile = profileResponse.data?.data || profileResponse.data || {};

    const shippingInfo = {
      fullName: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      city: profile?.city || "",
      state: profile?.state || "",
      zipCode: profile?.zipCode || "",
      country: profile?.country || "",
    };

    const normalizedItems = cartItems.map((item) => ({
      productId: item.productId ?? item.product?.id,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price ?? item.product?.price ?? 0),
      name: item.product?.name,
      image: item.product?.images?.[0],
      brand: item.product?.brand,
      size: item.size,
      color: item.color,
    }));

    return {
      shippingInfo,
      items: normalizedItems,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
    };
  };

  const startStripeCheckout = async () => {
    if (cartItems.length === 0) {
      NotifyError("Your cart is empty");
      navigate("/cart", { replace: true });
      return;
    }

    setIsProcessing(true);

    try {
      const pendingOrder = await buildPendingOrder();

      sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify(pendingOrder),
      );

      const response = await api.post("/orders/create-checkout-session", {
        ...pendingOrder,
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error(
          "Stripe redirect URL is missing and Stripe.js is not initialized",
        );
      }

      if (response.data?.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: response.data.sessionId,
        });

        if (error) {
          throw error;
        }
      } else {
        throw new Error("Invalid checkout session response");
      }
    } catch (error) {
      console.error("Payment error:", error);
      NotifyError(
        error.response?.data?.message ||
          error.message ||
          "Payment failed. Please try again.",
      );
      setIsProcessing(false);
      setHasStartedCheckout(false);
    }
  };

  useEffect(() => {
    const canceled = searchParams.get("canceled");

    if (canceled === "true") {
      NotifyInfo("Payment canceled. You can retry checkout.");
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      setSearchParams({}, { replace: true });
      setHasStartedCheckout(false);
      setIsProcessing(false);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || isConfirmingSession) {
      return;
    }

    const alreadyConfirmedSessionId = sessionStorage.getItem(
      CHECKOUT_CONFIRMED_KEY,
    );
    if (alreadyConfirmedSessionId === sessionId) {
      setSearchParams({}, { replace: true });
      navigate("/orders", { replace: true });
      return;
    }

    const confirmingSessionId = sessionStorage.getItem(CHECKOUT_CONFIRMING_KEY);
    if (confirmingSessionId === sessionId) {
      return;
    }

    const finalizeOrder = async () => {
      try {
        setIsConfirmingSession(true);
        sessionStorage.setItem(CHECKOUT_CONFIRMING_KEY, sessionId);
        const pendingOrderRaw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);

        if (!pendingOrderRaw) {
          NotifyError("Missing checkout data. Please try checkout again.");
          setSearchParams({}, { replace: true });
          setIsConfirmingSession(false);
          return;
        }

        const pendingOrder = JSON.parse(pendingOrderRaw);

        const response = await api.post("/orders/confirm-checkout-session", {
          sessionId,
          ...pendingOrder,
        });

        sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        sessionStorage.removeItem(CHECKOUT_CONFIRMING_KEY);
        sessionStorage.setItem(CHECKOUT_CONFIRMED_KEY, sessionId);

        // Keep floating cart badge/cart page in sync without full refresh.
        queryClient.setQueryData(["cart"], { items: [] });
        queryClient.invalidateQueries({ queryKey: ["cart"] });

        setSearchParams({}, { replace: true });

        const message =
          response.data?.message || "Payment successful! Order placed.";
        if (message !== "Order already created") {
          NotifySuccess(message);
        }
        navigate("/orders", { replace: true });
      } catch (error) {
        console.error("Checkout confirmation error:", error);
        sessionStorage.removeItem(CHECKOUT_CONFIRMING_KEY);
        NotifyError(
          error.response?.data?.message ||
            "Could not verify payment. Please contact support if amount was charged.",
        );
      } finally {
        setIsConfirmingSession(false);
      }
    };

    finalizeOrder();
  }, [
    isConfirmingSession,
    navigate,
    queryClient,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const canceled = searchParams.get("canceled");

    if (isLoading || hasStartedCheckout || sessionId || canceled) {
      return;
    }

    setHasStartedCheckout(true);
    startStripeCheckout();
  }, [hasStartedCheckout, isLoading, searchParams]);

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-lg p-8 text-center"
        >
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <SiStripe className="text-primary" size={26} />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Secure Checkout
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            We are preparing your payment and redirecting you to Stripe.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-secondary/10 p-4 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">
                ${totals.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-semibold">
                {totals.shipping === 0
                  ? "FREE"
                  : `$${totals.shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({Math.round(totals.taxRate * 100)}%)
              </span>
              <span className="font-semibold">${totals.tax.toFixed(2)}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-foreground font-semibold">
                Total (after tax)
              </span>
              <span className="text-lg font-bold text-foreground">
                ${totals.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <FiLock size={14} />
            <span>
              Address can be reviewed and edited inside Stripe if needed.
            </span>
          </div>

          <div className="mt-6">
            {isProcessing || isConfirmingSession ? (
              <LoadingBtn
                message={
                  isConfirmingSession
                    ? "Confirming payment..."
                    : "Redirecting to Stripe..."
                }
              />
            ) : (
              <button
                type="button"
                onClick={startStripeCheckout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 font-semibold hover:bg-primary/90"
              >
                <FiRefreshCw /> Retry Checkout
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Cart
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
