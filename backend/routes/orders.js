import express from "express";
import { db } from "../db/index.js";
import { orders, carts } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toMinorUnits = (value) => Math.round(toNumber(value) * 100);

const normalizeItems = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    productId: item.productId ?? item.product?.id,
    quantity: Math.max(1, parseInt(item.quantity) || 1),
    price: toNumber(item.price ?? item.product?.price),
    name: item.product?.name || item.name || `Product ${item.productId || ""}`,
    image: item.product?.images?.[0] || item.image || null,
  }));

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

// ==================== CREATE CHECKOUT SESSION ====================
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const { shippingInfo, items, subtotal, shipping, tax, total } = req.body;
    const userId = req.user.id;

    const normalizedItems = normalizeItems(items);

    if (!shippingInfo || normalizedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Shipping info and items are required",
      });
    }

    for (const item of normalizedItems) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: "One or more cart items are missing product ID",
        });
      }

      if (!Number.isFinite(item.price) || item.price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for product ${item.productId}`,
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product ${item.productId}`,
        });
      }
    }

    const checkoutTotal = toNumber(total);
    if (checkoutTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount",
      });
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:3000";

    const lineItems = normalizedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: toMinorUnits(item.price),
      },
      quantity: item.quantity,
    }));

    // Stripe Checkout line items should include shipping/tax as separate lines if needed.
    if (toNumber(shipping) > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: toMinorUnits(shipping),
        },
        quantity: 1,
      });
    }

    if (toNumber(tax) > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Tax" },
          unit_amount: toMinorUnits(tax),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: shippingInfo.email || undefined,
      success_url: `${frontendUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout?canceled=true`,
      metadata: {
        userId: String(userId),
        subtotal: String(toNumber(subtotal)),
        shipping: String(toNumber(shipping)),
        tax: String(toNumber(tax)),
        total: String(checkoutTotal),
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create checkout session",
    });
  }
});

// ==================== CONFIRM CHECKOUT SESSION ====================
router.post("/confirm-checkout-session", authMiddleware, async (req, res) => {
  try {
    const { sessionId, shippingInfo, items, subtotal, shipping, tax, total } =
      req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!session || session.mode !== "payment") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid checkout session" });
    }

    if (String(session.metadata?.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Session does not belong to user" });
    }

    if (session.payment_status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not successful" });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const normalizedItems = normalizeItems(items);

    if (!shippingInfo || normalizedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Shipping info and items are required",
      });
    }

    if (paymentIntentId) {
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.paymentIntentId, paymentIntentId));

      if (existingOrder) {
        return res.json({
          success: true,
          data: existingOrder,
          message: "Order already created",
        });
      }
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const [order] = await db
      .insert(orders)
      .values({
        userId,
        orderNumber,
        status: "pending",
        items: normalizedItems,
        totalAmount: String(toNumber(total)),
        shippingAddress: shippingInfo,
        paymentIntentId: paymentIntentId || session.id,
      })
      .returning();

    try {
      await db.delete(carts).where(eq(carts.userId, userId));
    } catch (cartError) {
      console.error("Error clearing cart:", cartError);
    }

    res.json({
      success: true,
      data: {
        ...order,
        subtotal: toNumber(subtotal),
        shipping: toNumber(shipping),
        tax: toNumber(tax),
        total: toNumber(total),
      },
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Confirm checkout session error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm checkout session",
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
      // Normalize items so price is always a top-level field
      const items = (order.items || []).map((item) => ({
        ...item,
        price: Number(item.price ?? item.product?.price ?? 0),
      }));

      // Derive subtotal directly from stored items (accurate for any item count)
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * (Number(item.quantity) || 0),
        0,
      );
      const shipping = subtotal > 100 ? 0 : items.length > 0 ? 10 : 0;
      const tax = (subtotal + shipping) * 0.08;
      const total = Number(order.totalAmount) || subtotal + shipping + tax;

      return {
        ...order,
        items,
        total,
        totalAmount: total,
        subtotal,
        shipping,
        tax,
        shippingInfo: order.shippingAddress,
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
