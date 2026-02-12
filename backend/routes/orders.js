import express from "express";
import { db } from "../db/index.js";
import { orders, carts } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// ==================== CREATE PAYMENT INTENT ====================
router.post("/create-payment-intent", authMiddleware, async (req, res) => {
  try {
    const { amount, shippingInfo, items } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || amount < 50) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Minimum $0.50",
      });
    }

    if (!shippingInfo || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Shipping info and items are required",
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: "usd",
      metadata: {
        userId: userId.toString(),
        itemCount: items.length,
      },
      description: `Order for ${shippingInfo.fullName}`,
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment intent",
    });
  }
});

// ==================== CREATE ORDER ====================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      paymentIntentId,
      shippingInfo,
      items,
      subtotal,
      shipping,
      tax,
      total,
    } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!paymentIntentId || !shippingInfo || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID, shipping info, and items are required",
      });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful",
      });
    }

    // Create order in database
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const [order] = await db
      .insert(orders)
      .values({
        userId,
        orderNumber,
        status: "pending",
        items: items,
        totalAmount: total.toString(),
        shippingAddress: shippingInfo,
        paymentIntentId,
      })
      .returning();

    // Add calculated fields for frontend display
    const orderWithDetails = {
      ...order,
      subtotal,
      shipping,
      tax,
      total,
      shippingInfo,
    };

    // Clear user's cart
    try {
      await db.delete(carts).where(eq(carts.userId, userId));
    } catch (cartError) {
      console.error("Error clearing cart:", cartError);
      // Continue even if cart clearing fails
    }

    res.status(201).json({
      success: true,
      data: orderWithDetails,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
});

// ==================== GET USER ORDERS ====================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // Transform orders to include calculated fields
    const ordersWithDetails = userOrders.map((order) => {
      const total = Number(order.totalAmount) || 0;
      // Calculate breakdown (typical e-commerce split)
      const subtotal = total / 1.08 / 1.1; // Remove tax (8%) and shipping estimate
      const shipping = subtotal > 100 ? 0 : 10;
      const tax = (subtotal + shipping) * 0.08;

      return {
        ...order,
        total,
        totalAmount: total, // Keep both for compatibility
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        shippingInfo: order.shippingAddress, // Map to frontend field name
      };
    });

    res.json({
      success: true,
      data: ordersWithDetails,
      count: ordersWithDetails.length,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
});

// ==================== GET ALL ORDERS (ADMIN) ====================
router.get("/all", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    res.json({
      success: true,
      orders: allOrders,
      count: allOrders.length,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
});

// ==================== GET SINGLE ORDER ====================
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [order] = await db.select().from(orders).where(eq(orders.id, id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to user (unless admin)
    if (order.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
});

// ==================== UPDATE ORDER STATUS (Admin only) ====================
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        data: updatedOrder,
        message: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update order status",
      });
    }
  },
);

// ==================== CANCEL ORDER ====================
router.post("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [order] = await db.select().from(orders).where(eq(orders.id, id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to user
    if (order.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Only allow cancellation of pending or processing orders
    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, id))
      .returning();

    // Optionally refund via Stripe
    if (order.paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
        });
      } catch (refundError) {
        console.error("Refund error:", refundError);
        // Continue even if refund fails - can be handled manually
      }
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
});

export default router;
