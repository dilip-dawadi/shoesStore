import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
  });

  const orders = data?.data || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="text-yellow-500" size={20} />;
      case "processing":
        return <FiPackage className="text-blue-500" size={20} />;
      case "shipped":
        return <FiTruck className="text-purple-500" size={20} />;
      case "delivered":
        return <FiCheckCircle className="text-green-500" size={20} />;
      case "cancelled":
        return <FiX className="text-red-500" size={20} />;
      default:
        return <FiPackage className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold">Error loading orders</p>
            <p className="text-red-500 text-sm mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-md p-12 text-center"
          >
            <FiPackage size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start shopping to see your orders here
            </p>
            <a
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-2 md:mb-0">
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.id?.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500">
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
                        className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-0"
                      >
                        <img
                          src={item.product?.images?.[0] || "/placeholder.jpg"}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800">
                            {item.product?.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">
                        ${order.subtotal?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold text-gray-900">
                        ${order.shipping?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold text-gray-900">
                        ${order.tax?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total:
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ${order.total?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingInfo && (
                    <div className="mt-6 bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Shipping Address
                      </h4>
                      <p className="text-sm text-gray-700">
                        {order.shippingInfo.fullName}
                      </p>
                      <p className="text-sm text-gray-700">
                        {order.shippingInfo.address}
                      </p>
                      <p className="text-sm text-gray-700">
                        {order.shippingInfo.city}, {order.shippingInfo.state}{" "}
                        {order.shippingInfo.zipCode}
                      </p>
                      <p className="text-sm text-gray-700">
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
