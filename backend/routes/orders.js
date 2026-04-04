import express from "express";
import { db } from "../db/index.js";
import { orders, carts, users } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import Stripe from "stripe";
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
} from "../services/email.js";

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
    brand: item.product?.brand || item.brand || null,
    size: item.size || null,
    color: item.color || null,
  }));

const toPublicImageUrl = (image, frontendUrl) => {
  if (!image || image === "/placeholder.jpg") {
    return null;
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  const base = frontendUrl.endsWith("/")
    ? frontendUrl.slice(0, -1)
    : frontendUrl;

  const path = image.startsWith("/") ? image : `/${image}`;
  return `${base}${path}`;
};

const buildItemDescription = (item) => {
  const chips = [];
  if (item.brand) chips.push(item.brand);
  if (item.size) chips.push(`Size: ${item.size}`);
  if (item.color) chips.push(`Color: ${item.color}`);
  return chips.join(" • ") || undefined;
};

const buildStripeItemName = (item) => {
  const baseName = item.name || "Product";
  const qty = Math.max(1, Number(item.quantity) || 1);
  return qty > 1 ? `${baseName} x${qty}` : baseName;
};

const buildStripeAddress = (shippingInfo = {}) => {
  const address = {
    line1: shippingInfo.address || undefined,
    city: shippingInfo.city || undefined,
    state: shippingInfo.state || undefined,
    postal_code: shippingInfo.zipCode || undefined,
    country: shippingInfo.country || undefined,
  };

  const hasAtLeastOneField = Object.values(address).some(Boolean);
  return hasAtLeastOneField ? address : undefined;
};

const TAX_RATE = 0.08;

const COUNTRY_NAME_TO_CODE = {
  "UNITED STATES": "US",
  USA: "US",
  "UNITED KINGDOM": "GB",
  UK: "GB",
  CANADA: "CA",
  AUSTRALIA: "AU",
  "NEW ZEALAND": "NZ",
  INDIA: "IN",
  NEPAL: "NP",
};

const normalizeCountryCode = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  const upper = raw.toUpperCase();
  if (upper.length === 2) {
    return upper;
  }

  return COUNTRY_NAME_TO_CODE[upper] || "";
};

const pickFirstNonEmpty = (...values) =>
  values.find((value) => String(value || "").trim().length > 0) || "";

const resolveShippingInfo = (
  profile = {},
  shippingInfo = {},
  lastShippingInfo = {},
) => ({
  fullName: pickFirstNonEmpty(
    shippingInfo.fullName,
    profile.name,
    lastShippingInfo.fullName,
    lastShippingInfo.name,
  ),
  email: pickFirstNonEmpty(
    shippingInfo.email,
    profile.email,
    lastShippingInfo.email,
  ),
  phone: pickFirstNonEmpty(
    shippingInfo.phone,
    profile.phone,
    lastShippingInfo.phone,
  ),
  address: pickFirstNonEmpty(
    shippingInfo.address,
    profile.address,
    lastShippingInfo.address,
    lastShippingInfo.line1,
  ),
  city: pickFirstNonEmpty(
    shippingInfo.city,
    profile.city,
    lastShippingInfo.city,
  ),
  state: pickFirstNonEmpty(
    shippingInfo.state,
    profile.state,
    lastShippingInfo.state,
    lastShippingInfo.province,
  ),
  zipCode: pickFirstNonEmpty(
    shippingInfo.zipCode,
    profile.zipCode,
    lastShippingInfo.zipCode,
    lastShippingInfo.postalCode,
    lastShippingInfo.postal_code,
  ),
  country: normalizeCountryCode(
    pickFirstNonEmpty(
      shippingInfo.country,
      profile.country,
      lastShippingInfo.country,
    ),
  ),
});

const extractShippingInfoFromStripeSession = (session = {}, fallback = {}) => {
  const shippingDetails = session.shipping_details || {};
  const customerDetails = session.customer_details || {};
  const stripeAddress =
    shippingDetails.address || customerDetails.address || {};

  return {
    fullName: pickFirstNonEmpty(
      shippingDetails.name,
      customerDetails.name,
      fallback.fullName,
    ),
    email: pickFirstNonEmpty(customerDetails.email, fallback.email),
    phone: pickFirstNonEmpty(
      shippingDetails.phone,
      customerDetails.phone,
      fallback.phone,
    ),
    address: pickFirstNonEmpty(stripeAddress.line1, fallback.address),
    city: pickFirstNonEmpty(stripeAddress.city, fallback.city),
    state: pickFirstNonEmpty(stripeAddress.state, fallback.state),
    zipCode: pickFirstNonEmpty(stripeAddress.postal_code, fallback.zipCode),
    country: normalizeCountryCode(
      pickFirstNonEmpty(stripeAddress.country, fallback.country),
    ),
  };
};

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

    const [profile] = await db
      .select({
        name: users.name,
        email: users.email,
        phone: users.phone,
        address: users.address,
        city: users.city,
        state: users.state,
        zipCode: users.zipCode,
        country: users.country,
      })
      .from(users)
      .where(eq(users.id, userId));

    const [latestOrder] = await db
      .select({ shippingAddress: orders.shippingAddress })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    const resolvedShippingInfo = resolveShippingInfo(
      profile || {},
      shippingInfo || {},
      latestOrder?.shippingAddress || {},
    );

    const normalizedItems = normalizeItems(items);

    if (normalizedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items are required",
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

    if (!resolvedShippingInfo.email) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required for checkout",
      });
    }

    const lineItems = normalizedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: buildStripeItemName(item),
          description: buildItemDescription(item),
          images: toPublicImageUrl(item.image, frontendUrl)
            ? [toPublicImageUrl(item.image, frontendUrl)]
            : undefined,
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
          product_data: {
            name: "Shipping & Delivery",
            description: "Standard delivery charge",
          },
          unit_amount: toMinorUnits(shipping),
        },
        quantity: 1,
      });
    }

    if (toNumber(tax) > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Estimated Tax (${Math.round(TAX_RATE * 100)}%)`,
            description: "Sales tax calculation",
          },
          unit_amount: toMinorUnits(tax),
        },
        quantity: 1,
      });
    }

    // Prefill Stripe Checkout using shipping form data so users only need card details.
    const customerEmail = resolvedShippingInfo.email || undefined;
    const customerAddress = buildStripeAddress(resolvedShippingInfo);
    const customerShipping = customerAddress
      ? {
          name: resolvedShippingInfo.fullName || undefined,
          phone: resolvedShippingInfo.phone || undefined,
          address: customerAddress,
        }
      : undefined;
    let customerId;

    if (customerEmail) {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        await stripe.customers.update(customerId, {
          name: resolvedShippingInfo.fullName || undefined,
          phone: resolvedShippingInfo.phone || undefined,
          address: customerAddress,
          shipping: customerShipping,
        });
      } else {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: resolvedShippingInfo.fullName || undefined,
          phone: resolvedShippingInfo.phone || undefined,
          address: customerAddress,
          shipping: customerShipping,
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      success_url: `${frontendUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout?canceled=true`,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      shipping_address_collection: {
        allowed_countries: [
          "US",
          "CA",
          "GB",
          "AU",
          "NZ",
          "IN",
          "NP",
          "DE",
          "FR",
          "NL",
          "BE",
          "DK",
          "SE",
          "NO",
          "FI",
          "IE",
          "ES",
          "IT",
          "CH",
          "AT",
        ],
      },
      custom_text: {
        submit: {
          message:
            "Secure payment powered by Stripe. Your order is confirmed instantly after payment.",
        },
      },
      payment_intent_data: {
        description: `Order for ${resolvedShippingInfo.fullName || "Customer"}`,
      },
      customer_update: {
        name: "auto",
        address: "auto",
        shipping: "auto",
      },
      metadata: {
        userId: String(userId),
        subtotal: String(toNumber(subtotal)),
        shipping: String(toNumber(shipping)),
        tax: String(toNumber(tax)),
        taxRate: String(TAX_RATE),
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

    const finalShippingInfo = extractShippingInfoFromStripeSession(
      session,
      shippingInfo || {},
    );

    if (normalizedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items are required",
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
        shippingAddress: finalShippingInfo,
        paymentIntentId: paymentIntentId || session.id,
      })
      .returning();

    try {
      const profileUpdateData = {
        name: finalShippingInfo.fullName || undefined,
        phone: finalShippingInfo.phone || undefined,
        address: finalShippingInfo.address || undefined,
        city: finalShippingInfo.city || undefined,
        state: finalShippingInfo.state || undefined,
        zipCode: finalShippingInfo.zipCode || undefined,
        country: finalShippingInfo.country || undefined,
      };

      const hasUpdates = Object.values(profileUpdateData).some(Boolean);
      if (hasUpdates) {
        await db
          .update(users)
          .set({
            ...profileUpdateData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
    } catch (profileUpdateError) {
      console.error(
        "Profile update from Stripe shipping failed:",
        profileUpdateError,
      );
    }

    try {
      const emailTarget =
        finalShippingInfo.email ||
        session.customer_details?.email ||
        req.user?.email;

      if (emailTarget) {
        void sendOrderConfirmation(emailTarget, {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          items: normalizedItems,
        }).catch((emailError) => {
          console.error("Order confirmation email failed:", emailError);
        });
      }
    } catch (emailError) {
      console.error("Order confirmation email failed:", emailError);
    }

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

    try {
      if (req.user?.email) {
        void sendOrderConfirmation(req.user.email, {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          items,
        }).catch((emailError) => {
          console.error("Order confirmation email failed:", emailError);
        });
      }
    } catch (emailError) {
      console.error("Order confirmation email failed:", emailError);
    }

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
      .select({
        id: orders.id,
        userId: orders.userId,
        orderNumber: orders.orderNumber,
        items: orders.items,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentIntentId: orders.paymentIntentId,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    const ordersWithCustomerInfo = allOrders.map((order) => {
      const shipping = order.shippingAddress || {};

      return {
        ...order,
        userName: order.userName || shipping.fullName || shipping.name || null,
        userEmail: order.userEmail || shipping.email || null,
      };
    });

    res.json({
      success: true,
      orders: ordersWithCustomerInfo,
      count: ordersWithCustomerInfo.length,
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
      const { status, trackingNumber, estimatedDelivery } = req.body;

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

      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const nextShippingAddress = {
        ...(existingOrder.shippingAddress || {}),
      };

      if (trackingNumber !== undefined) {
        nextShippingAddress.trackingNumber =
          String(trackingNumber || "").trim() || null;
      }

      if (estimatedDelivery !== undefined) {
        nextShippingAddress.estimatedDelivery =
          String(estimatedDelivery || "").trim() || null;
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status,
          shippingAddress: nextShippingAddress,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      try {
        const [orderOwner] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, updatedOrder.userId))
          .limit(1);

        if (orderOwner?.email) {
          void sendOrderStatusUpdate(orderOwner.email, {
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status,
            trackingNumber: updatedOrder.shippingAddress?.trackingNumber,
            estimatedDelivery: updatedOrder.shippingAddress?.estimatedDelivery,
          }).catch((emailError) => {
            console.error("Order status update email failed:", emailError);
          });
        }
      } catch (emailError) {
        console.error("Order status update email failed:", emailError);
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

    try {
      if (req.user?.email) {
        void sendOrderStatusUpdate(req.user.email, {
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          trackingNumber: updatedOrder.shippingAddress?.trackingNumber,
          estimatedDelivery: updatedOrder.shippingAddress?.estimatedDelivery,
        }).catch((emailError) => {
          console.error("Order cancellation email failed:", emailError);
        });
      }
    } catch (emailError) {
      console.error("Order cancellation email failed:", emailError);
    }

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
