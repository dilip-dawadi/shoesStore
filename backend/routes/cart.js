import express from "express";
import { db } from "../db/index.js";
import { carts, products } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

// Get user's cart
router.get("/", async (req, res) => {
  try {
    const cartItems = await db
      .select({
        id: carts.id,
        quantity: carts.quantity,
        size: carts.size,
        color: carts.color,
        product: products,
      })
      .from(carts)
      .leftJoin(products, eq(carts.productId, products.id))
      .where(eq(carts.userId, req.user.userId));

    res.json(cartItems);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add to cart
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if item already in cart
    const [existingItem] = await db
      .select()
      .from(carts)
      .where(
        and(
          eq(carts.userId, req.user.userId),
          eq(carts.productId, productId),
          eq(carts.size, size),
          eq(carts.color, color),
        ),
      );

    if (existingItem) {
      // Update quantity
      const [updated] = await db
        .update(carts)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(carts.id, existingItem.id))
        .returning();

      return res.json(updated);
    }

    // Add new item
    const [cartItem] = await db
      .insert(carts)
      .values({
        userId: req.user.userId,
        productId,
        quantity,
        size,
        color,
      })
      .returning();

    res.status(201).json(cartItem);
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update cart item
router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;

    const [cartItem] = await db
      .update(carts)
      .set({ quantity, updatedAt: new Date() })
      .where(
        and(eq(carts.id, req.params.id), eq(carts.userId, req.user.userId)),
      )
      .returning();

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json(cartItem);
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove from cart
router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(carts)
      .where(
        and(eq(carts.id, req.params.id), eq(carts.userId, req.user.userId)),
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear cart
router.delete("/", async (req, res) => {
  try {
    await db.delete(carts).where(eq(carts.userId, req.user.userId));

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
