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
      .where(eq(carts.userId, req.user.id));

    res.json({ items: cartItems });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add to cart
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;
    const requestedQuantity = Number(quantity);

    // Validate productId
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const availableStock = Number(product.stock || 0);
    if (availableStock <= 0) {
      return res.status(400).json({ message: "This product is out of stock" });
    }

    // Build where conditions, only including defined values
    const whereConditions = [
      eq(carts.userId, req.user.id),
      eq(carts.productId, productId),
    ];

    if (size !== undefined && size !== null) {
      whereConditions.push(eq(carts.size, size));
    }

    if (color !== undefined && color !== null) {
      whereConditions.push(eq(carts.color, color));
    }

    // Check if item already in cart
    const [existingItem] = await db
      .select()
      .from(carts)
      .where(and(...whereConditions));

    if (existingItem) {
      const nextQuantity = existingItem.quantity + requestedQuantity;
      if (nextQuantity > availableStock) {
        return res.status(400).json({
          message: `Only ${availableStock} item(s) available in stock`,
        });
      }

      // Update quantity
      const [updated] = await db
        .update(carts)
        .set({ quantity: nextQuantity })
        .where(eq(carts.id, existingItem.id))
        .returning();

      return res.json({
        ...updated,
        message: "Item quantity increased in cart.",
      });
    }

    // Build insert values, only including defined fields
    const insertValues = {
      userId: req.user.id,
      productId,
      quantity: requestedQuantity,
    };

    if (requestedQuantity > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} item(s) available in stock`,
      });
    }

    if (size !== undefined && size !== null) {
      insertValues.size = size;
    }

    if (color !== undefined && color !== null) {
      insertValues.color = color;
    }

    // Add new item
    const [cartItem] = await db.insert(carts).values(insertValues).returning();

    res.status(201).json({
      ...cartItem,
      message: "Item added to cart.",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update cart item
router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    const nextQuantity = Number(quantity);

    if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const [existingItem] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, req.params.id), eq(carts.userId, req.user.id)));

    if (!existingItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const [product] = await db
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .where(eq(products.id, existingItem.productId));

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const availableStock = Number(product.stock || 0);
    if (nextQuantity > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} item(s) available in stock`,
      });
    }

    const [cartItem] = await db
      .update(carts)
      .set({ quantity: nextQuantity, updatedAt: new Date() })
      .where(and(eq(carts.id, req.params.id), eq(carts.userId, req.user.id)))
      .returning();

    let message = "Cart updated.";
    if (nextQuantity > existingItem.quantity) {
      message = "Item quantity increased in cart.";
    } else if (nextQuantity < existingItem.quantity) {
      message = "Item quantity decreased in cart.";
    }

    res.json({
      ...cartItem,
      message,
    });
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
      .where(and(eq(carts.id, req.params.id), eq(carts.userId, req.user.id)))
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
    await db.delete(carts).where(eq(carts.userId, req.user.id));

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
