import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiX,
} from "react-icons/fi";

const Orders = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("/orders");
      return response.data;
    },
  });

  const orders = data?.data || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="text-muted-foreground" size={20} />;
      case "processing":
        return <FiPackage className="text-accent" size={20} />;
      case "shipped":
        return <FiTruck className="text-primary" size={20} />;
      case "delivered":
        return <FiCheckCircle className="text-primary" size={20} />;
      case "cancelled":
        return <FiX className="text-destructive" size={20} />;
      default:
        return <FiPackage className="text-muted-foreground" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-secondary/20 text-foreground border-border";
      case "processing":
        return "bg-accent/10 text-accent border-accent/20";
      case "shipped":
        return "bg-primary/10 text-primary border-primary/20";
      case "delivered":
        return "bg-primary/10 text-primary border-primary/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-secondary/20 text-foreground border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl shadow-md p-6 animate-pulse"
              >
                <div className="h-6 bg-secondary/20 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-secondary/20 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <p className="text-destructive font-semibold">
              Error loading orders
            </p>
            <p className="text-destructive/80 text-sm mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl shadow-md p-12 text-center"
          >
            <FiPackage
              size={64}
              className="mx-auto text-muted-foreground mb-4"
            />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No orders yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <a
              href="/products"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Browse Products
            </a>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-border"
              >
                {/* Order Header */}
                <div className="bg-secondary/10 px-6 py-4 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-2 md:mb-0">
                      <h3 className="text-lg font-bold text-foreground">
                        Order #
                        {order.orderNumber || String(order.id).padStart(8, "0")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-4 pb-4 border-b border-border last:border-0"
                      >
                        {(() => {
                          const itemImage =
                            item.image ||
                            item.product?.images?.[0] ||
                            "/placeholder.jpg";
                          const itemName =
                            item.name || item.product?.name || "Product";

                          return (
                            <>
                              <img
                                src={itemImage}
                                alt={itemName}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {itemName}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-foreground">
                                $
                                {(
                                  (Number(item.price) || 0) *
                                  (Number(item.quantity) || 0)
                                ).toFixed(2)}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-secondary/10 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold text-foreground">
                        ${(Number(order.subtotal) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span className="font-semibold text-foreground">
                        ${(Number(order.shipping) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-semibold text-foreground">
                        ${(Number(order.tax) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2 flex justify-between">
                      <span className="text-lg font-bold text-foreground">
                        Total:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        $
                        {(
                          Number(order.total) ||
                          Number(order.totalAmount) ||
                          0
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingInfo && (
                    <div className="mt-6 bg-accent/5 rounded-lg p-4 border border-accent/20">
                      <h4 className="font-semibold text-foreground mb-2">
                        Shipping Address
                      </h4>
                      <p className="text-sm text-foreground">
                        {order.shippingInfo.fullName}
                      </p>
                      <p className="text-sm text-foreground">
                        {order.shippingInfo.address}
                      </p>
                      <p className="text-sm text-foreground">
                        {order.shippingInfo.city}, {order.shippingInfo.state}{" "}
                        {order.shippingInfo.zipCode}
                      </p>
                      <p className="text-sm text-foreground">
                        {order.shippingInfo.country}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
