import express from "express";
import { db } from "../db/index.js";
import { wishlists, products } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(authMiddleware);

// Get user's wishlist
router.get("/", async (req, res) => {
  try {
    const wishlistItems = await db
      .select({
        id: wishlists.id,
        createdAt: wishlists.createdAt,
        product: products,
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, req.user.userId));

    res.json(wishlistItems);
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add to wishlist
router.post("/", async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already in wishlist
    const [existing] = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, req.user.userId),
          eq(wishlists.productId, productId),
        ),
      );

    if (existing) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add to wishlist
    const [wishlistItem] = await db
      .insert(wishlists)
      .values({
        userId: req.user.userId,
        productId,
      })
      .returning();

    res.status(201).json(wishlistItem);
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove from wishlist
router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.id, req.params.id),
          eq(wishlists.userId, req.user.userId),
        ),
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    res.json({ message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
