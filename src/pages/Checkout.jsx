import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import {
  FiCreditCard,
  FiMapPin,
  FiUser,
  FiMail,
  FiPhone,
  FiShoppingBag,
} from "react-icons/fi";
import { NotifySuccess, NotifyError, LoadingBtn } from "../toastify";
import api from "../lib/axios";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_your_key_here",
);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  useEffect(() => {
    let isMounted = true;
    api
      .get("/users/profile")
      .then((response) => {
        if (!isMounted) return;
        const profile = response.data?.data || response.data;
        setShippingInfo((prev) => ({
          ...prev,
          fullName: prev.fullName || profile?.name || "",
          email: prev.email || profile?.email || "",
          phone: prev.phone || profile?.phone || "",
          address: prev.address || profile?.address || "",
        }));
      })
      .catch(() => {
        // Silent fail
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cartItems = cart?.items || [];
  const toNumber = (value) =>
    Number.isFinite(Number(value)) ? Number(value) : 0;
  const formatCurrency = (value) =>
    Number.isFinite(value) ? value.toFixed(2) : "0.00";

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      toNumber(item.price ?? item.product?.price) * toNumber(item.quantity),
    0,
  );
  const shipping = subtotal > 100 ? 0 : cartItems.length > 0 ? 10 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleInputChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate form
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
    ];
    const missingFields = requiredFields.filter(
      (field) => !shippingInfo[field],
    );

    if (missingFields.length > 0) {
      NotifyError("Please fill in all required fields");
      return;
    }

    if (cartItems.length === 0) {
      NotifyError("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent on backend
      const response = await api.post("/orders/create-payment-intent", {
        amount: Math.round(total * 100), // Convert to cents
        shippingInfo,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      const { clientSecret } = response.data;

      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: shippingInfo.fullName,
              email: shippingInfo.email,
              phone: shippingInfo.phone,
              address: {
                line1: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state,
                postal_code: shippingInfo.zipCode,
                country: shippingInfo.country,
              },
            },
          },
        },
      );

      if (error) {
        NotifyError(error.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Create order on backend
        await api.post("/orders", {
          paymentIntentId: paymentIntent.id,
          shippingInfo,
          items: cartItems,
          subtotal,
          shipping,
          tax,
          total,
        });

        NotifySuccess("Payment successful! Order placed.");
        setTimeout(() => {
          navigate("/orders");
        }, 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      NotifyError(
        error.response?.data?.message || "Payment failed. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shipping Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-xl shadow-md p-6 border border-border"
              >
                <div className="flex items-center mb-6">
                  <FiMapPin className="text-primary mr-2" size={24} />
                  <h2 className="text-2xl font-bold text-foreground">
                    Shipping Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <FiUser className="inline mr-1" /> Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <FiMail className="inline mr-1" /> Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <FiPhone className="inline mr-1" /> Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={shippingInfo.country}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Payment Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl shadow-md p-6 border border-border"
              >
                <div className="flex items-center mb-6">
                  <FiCreditCard className="text-primary mr-2" size={24} />
                  <h2 className="text-2xl font-bold text-foreground">
                    Payment Information
                  </h2>
                </div>

                <div className="border border-border rounded-lg p-4 bg-secondary/10">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "hsl(var(--foreground))",
                          "::placeholder": {
                            color: "hsl(var(--muted-foreground))",
                          },
                        },
                        invalid: {
                          color: "hsl(var(--destructive))",
                        },
                      },
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Your payment information is securely processed by Stripe
                </p>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <LoadingBtn message="Processing Payment..." />
                ) : (
                  `Pay $${formatCurrency(total)}`
                )}
              </motion.button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-xl shadow-md p-6 sticky top-4 border border-border"
            >
              <div className="flex items-center mb-6">
                <FiShoppingBag className="text-primary mr-2" size={24} />
                <h2 className="text-2xl font-bold text-foreground">
                  Order Summary
                </h2>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 pb-4 border-b border-border"
                  >
                    <img
                      src={item.product?.images?.[0] || "/placeholder.jpg"}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                        {item.product?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      $
                      {formatCurrency(
                        toNumber(item.price ?? item.product?.price) *
                          toNumber(item.quantity),
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? "FREE" : `$${formatCurrency(shipping)}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span>${formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>${formatCurrency(total)}</span>
                </div>
              </div>

              {subtotal > 100 && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent">
                  🎉 You've qualified for free shipping!
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout;
