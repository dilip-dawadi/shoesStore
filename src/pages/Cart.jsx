import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart, useRemoveFromCart, useUpdateCart } from "../hooks/useCart";
import { FiShoppingBag, FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { NotifyInfo, NotifySuccess, NotifyError } from "../toastify";

const CartPage = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const { mutate: updateCart, isPending: isUpdating } = useUpdateCart();
  const { mutate: removeFromCart, isPending: isRemoving } = useRemoveFromCart();

  const cartItems = cart?.items || [];

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + (item.price || item.product?.price || 0) * (item.quantity || 0),
        0,
      ),
    [cartItems],
  );
  const shipping = subtotal > 100 ? 0 : cartItems.length > 0 ? 10 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (itemId, direction) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity =
      direction === "increase" ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity <= 0) return;

    updateCart(
      { id: itemId, data: { quantity: newQuantity } },
      {
        onSuccess: (response) => {
          NotifySuccess(response.data?.message || "Cart updated.");
        },
        onError: (error) => {
          NotifyError(
            error.response?.data?.message || "Failed to update cart.",
          );
        },
      },
    );
  };

  const handleRemove = (itemId) => {
    removeFromCart(itemId, {
      onSuccess: (response) => {
        NotifySuccess(response.data?.message || "Item removed from cart.");
      },
      onError: (error) => {
        NotifyError(error.response?.data?.message || "Failed to remove item.");
      },
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      NotifyInfo("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl shadow-md p-6 animate-pulse"
                >
                  <div className="h-6 bg-secondary/20 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-secondary/20 rounded w-2/3"></div>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-6 bg-secondary/20 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-secondary/20 rounded w-full mb-2"></div>
              <div className="h-4 bg-secondary/20 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">My Cart</h1>
          <p className="text-muted-foreground">
            Review your items and shipping details
          </p>
        </motion.div>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl shadow-md p-12 text-center"
          >
            <FiShoppingBag
              size={64}
              className="mx-auto text-muted-foreground mb-4"
            />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Browse products and add items to your cart
            </p>
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-xl shadow-md p-6 border border-border"
              >
                <div className="flex items-center mb-6">
                  <FiShoppingBag className="text-primary mr-2" size={24} />
                  <h2 className="text-2xl font-bold text-foreground">
                    Cart Items
                  </h2>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center gap-4 pb-4 border-b border-border last:border-0"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <img
                          src={item.product?.images?.[0] || "/placeholder.jpg"}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="min-w-0">
                          <h3
                            className="text-sm font-semibold text-foreground truncate"
                            title={item.product?.name}
                          >
                            {item.product?.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            ${item.price || item.product?.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 md:justify-self-center">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, "decrease")
                          }
                          disabled={isUpdating || isRemoving}
                          className="p-2 rounded-lg border border-border hover:bg-secondary/20 text-foreground transition-colors"
                        >
                          <FiMinus />
                        </button>
                        <span className="min-w-8 text-center text-foreground font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, "increase")
                          }
                          disabled={isUpdating || isRemoving}
                          className="p-2 rounded-lg border border-border hover:bg-secondary/20 text-foreground transition-colors"
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <div className="flex items-center space-x-4 md:justify-self-end">
                        <span className="text-sm font-bold text-foreground">
                          $
                          {(item.price || item.product?.price || 0) *
                            item.quantity}
                        </span>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving}
                          className="p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
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

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-xl font-bold text-foreground">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {subtotal > 100 && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent mb-4">
                    🎉 You've qualified for free shipping!
                  </div>
                )}

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={handleCheckout}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
                >
                  Proceed to Checkout
                </motion.button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
