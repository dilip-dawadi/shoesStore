import express from "express";
import { db } from "../db/index.js";
import { products, reviews, users, orders } from "../db/schema.js";
import {
  eq,
  like,
  and,
  or,
  gte,
  lte,
  desc,
  asc,
  count,
  sql,
  ilike,
  inArray,
} from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ==================== CONSTANTS ====================
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

const ALLOWED_SORT_FIELDS = [
  "id",
  "name",
  "price",
  "rating",
  "stock",
  "createdAt",
  "updatedAt",
  "numReviews",
];

const PRICE_RANGES = {
  budget: { min: 0, max: 50 },
  affordable: { min: 50, max: 100 },
  premium: { min: 100, max: 200 },
  luxury: { min: 200, max: 999999 },
};

const setPublicCache =
  (maxAgeSeconds = 60) =>
  (req, res, next) => {
    const maxAge = Math.max(0, Number(maxAgeSeconds) || 0);
    const staleWhileRevalidate = maxAge * 2;

    res.set(
      "Cache-Control",
      `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    );
    next();
  };

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items;
};

const itemHasProduct = (item, productId) => {
  const directId = Number(item?.productId ?? item?.id);
  const nestedId = Number(item?.product?.id);
  const targetId = Number(productId);

  return directId === targetId || nestedId === targetId;
};

const hasPurchasedProduct = (orderItems, productId) => {
  const items = normalizeOrderItems(orderItems);
  return items.some((item) => itemHasProduct(item, productId));
};

// ==================== UTILITIES ====================

/**
 * Sanitize and validate pagination parameters
 */
const sanitizePagination = (page, limit) => {
  const sanitizedPage = Math.max(1, parseInt(page) || 1);
  const sanitizedLimit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(limit) || DEFAULT_PAGE_SIZE),
  );
  const offset = (sanitizedPage - 1) * sanitizedLimit;

  return { page: sanitizedPage, limit: sanitizedLimit, offset };
};

/**
 * Build dynamic WHERE conditions
 */
const buildWhereConditions = (filters) => {
  const conditions = [];
  const {
    category,
    brand,
    shoeFor,
    minPrice,
    maxPrice,
    priceRange,
    search,
    inStock,
    featured,
    minRating,
  } = filters;

  // Category filter (case-insensitive, supports comma-separated multi-select)
  if (category) {
    const categoryValues = category
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (categoryValues.length === 1) {
      conditions.push(ilike(products.category, `%${categoryValues[0]}%`));
    } else if (categoryValues.length > 1) {
      conditions.push(
        or(...categoryValues.map((v) => ilike(products.category, `%${v}%`))),
      );
    }
  }

  // Brand filter (case-insensitive, supports comma-separated multi-select)
  if (brand) {
    const brandValues = brand
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (brandValues.length === 1) {
      conditions.push(ilike(products.brand, `%${brandValues[0]}%`));
    } else if (brandValues.length > 1) {
      conditions.push(
        or(...brandValues.map((v) => ilike(products.brand, `%${v}%`))),
      );
    }
  }

  // Shoe type filter (case-insensitive, supports comma-separated multi-select)
  if (shoeFor) {
    const shoeForValues = shoeFor
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (shoeForValues.length === 1) {
      conditions.push(ilike(products.shoeFor, `%${shoeForValues[0]}%`));
    } else if (shoeForValues.length > 1) {
      conditions.push(
        or(...shoeForValues.map((v) => ilike(products.shoeFor, `%${v}%`))),
      );
    }
  }

  // Price range filters
  if (priceRange && PRICE_RANGES[priceRange]) {
    const range = PRICE_RANGES[priceRange];
    conditions.push(gte(products.price, range.min.toString()));
    conditions.push(lte(products.price, range.max.toString()));
  } else {
    if (minPrice) conditions.push(gte(products.price, minPrice));
    if (maxPrice) conditions.push(lte(products.price, maxPrice));
  }

  // Search filter (searches in name and description)
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(products.name, searchTerm),
        ilike(products.description, searchTerm),
      ),
    );
  }

  // Stock filter
  if (inStock === "true" || inStock === true) {
    conditions.push(gte(products.stock, 1));
  }

  // Featured products filter
  if (featured === "true" || featured === true) {
    conditions.push(eq(products.isFeatured, true));
  }

  // Minimum rating filter
  if (minRating) {
    conditions.push(gte(products.rating, minRating));
  }

  return conditions;
};

/**
 * Build ORDER BY clause with validation
 */
const buildOrderBy = (sortField, sortOrder) => {
  // Parse sort field (handle format like "-price" or "price")
  let field = sortField;
  let order = sortOrder?.toLowerCase();

  if (sortField?.startsWith("-")) {
    field = sortField.substring(1);
    order = "desc";
  } else if (sortField?.startsWith("+")) {
    field = sortField.substring(1);
    order = "asc";
  }

  // Default to createdAt desc if invalid
  if (!ALLOWED_SORT_FIELDS.includes(field)) {
    field = "createdAt";
    order = "desc";
  }

  // Validate order
  order = order === "asc" ? "asc" : "desc";

  return order === "asc" ? asc(products[field]) : desc(products[field]);
};

// ==================== ROUTES ====================

/**
 * @route   GET /api/products
 * @desc    Get all products with advanced filtering, sorting, and pagination
 * @access  Public
 */
router.get("/", setPublicCache(30), async (req, res) => {
  try {
    const {
      // Pagination
      page,
      limit,
      // Sorting
      sort = "-createdAt",
      order,
      // Filters
      category,
      brand,
      shoeFor,
      minPrice,
      maxPrice,
      priceRange,
      search,
      inStock,
      featured,
      minRating,
    } = req.query;

    // Sanitize pagination
    const {
      page: sanitizedPage,
      limit: sanitizedLimit,
      offset,
    } = sanitizePagination(page, limit);

    // Build WHERE conditions
    const filters = {
      category,
      brand,
      shoeFor,
      minPrice,
      maxPrice,
      priceRange,
      search,
      inStock,
      featured,
      minRating,
    };

    const conditions = buildWhereConditions(filters);

    // Build ORDER BY
    const orderBy = buildOrderBy(sort, order);

    // Execute query with proper error handling
    const [productsResult, totalResult] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          category: products.category,
          brand: products.brand,
          shoeFor: products.shoeFor,
          sizes: products.sizes,
          colors: products.colors,
          images: products.images,
          stock: products.stock,
          rating: products.rating,
          numReviews: products.numReviews,
          isFeatured: products.isFeatured,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(sanitizedLimit)
        .offset(offset),

      db
        .select({ count: count() })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / sanitizedLimit);

    // Build response with metadata
    res.json({
      success: true,
      data: productsResult,
      pagination: {
        currentPage: sanitizedPage,
        pageSize: sanitizedLimit,
        totalItems: total,
        totalPages,
        hasNextPage: sanitizedPage < totalPages,
        hasPrevPage: sanitizedPage > 1,
      },
      filters: {
        category,
        brand,
        shoeFor,
        priceRange: priceRange || { min: minPrice, max: maxPrice },
        search,
        inStock,
        featured,
        minRating,
      },
      sort: {
        field: sort.replace(/^[-+]/, ""),
        order: sort.startsWith("-") ? "desc" : "asc",
      },
    });
  } catch (error) {
    console.error("❌ Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get("/featured", setPublicCache(60), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const sanitizedLimit = Math.min(50, parseInt(limit) || 10);

    const featuredProducts = await db
      .select()
      .from(products)
      .where(eq(products.isFeatured, true))
      .orderBy(desc(products.rating))
      .limit(sanitizedLimit);

    res.json({
      success: true,
      data: featuredProducts,
      count: featuredProducts.length,
    });
  } catch (error) {
    console.error("❌ Get featured products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
    });
  }
});

/**
 * @route   GET /api/products/search
 * @desc    Advanced search with multiple fields
 * @access  Public
 */
router.get("/search", setPublicCache(30), async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const {
      page: sanitizedPage,
      limit: sanitizedLimit,
      offset,
    } = sanitizePagination(page, limit);

    const searchTerm = `%${q.trim()}%`;

    const searchResults = await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.brand, searchTerm),
          ilike(products.category, searchTerm),
        ),
      )
      .orderBy(desc(products.rating), desc(products.numReviews))
      .limit(sanitizedLimit)
      .offset(offset);

    res.json({
      success: true,
      data: searchResults,
      query: q,
      count: searchResults.length,
    });
  } catch (error) {
    console.error("❌ Search products error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
});

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Public
 */
router.get("/stats", setPublicCache(120), async (req, res) => {
  try {
    const stats = await db
      .select({
        totalProducts: count(),
        avgPrice: sql`AVG(${products.price})::numeric(10,2)`,
        minPrice: sql`MIN(${products.price})`,
        maxPrice: sql`MAX(${products.price})`,
        totalStock: sql`SUM(${products.stock})`,
        avgRating: sql`AVG(${products.rating})::numeric(2,1)`,
      })
      .from(products);

    // Get category distribution
    const categoryStats = await db
      .select({
        category: products.category,
        count: count(),
      })
      .from(products)
      .groupBy(products.category)
      .orderBy(desc(count()));

    // Get brand distribution
    const brandStats = await db
      .select({
        brand: products.brand,
        count: count(),
      })
      .from(products)
      .groupBy(products.brand)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        categories: categoryStats,
        topBrands: brandStats,
      },
    });
  } catch (error) {
    console.error("❌ Get product stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get("/:id", setPublicCache(60), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productReviews = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));

    const reviewerIds = [
      ...new Set(
        productReviews.map((review) => Number(review.userId)).filter(Boolean),
      ),
    ];

    const reviewerOrders =
      reviewerIds.length > 0
        ? await db
            .select({
              userId: orders.userId,
              status: orders.status,
              items: orders.items,
            })
            .from(orders)
            .where(
              and(
                inArray(orders.userId, reviewerIds),
                sql`${orders.status} <> 'cancelled'`,
              ),
            )
        : [];

    const verifiedUserIds = new Set(
      reviewerOrders
        .filter((order) => hasPurchasedProduct(order.items, productId))
        .map((order) => Number(order.userId)),
    );

    const reviewsWithPurchaseStatus = productReviews.map((review) => ({
      ...review,
      verifiedPurchase: verifiedUserIds.has(Number(review.userId)),
    }));

    res.json({
      success: true,
      data: {
        ...product,
        reviews: reviewsWithPurchaseStatus,
      },
    });
  } catch (error) {
    console.error("❌ Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

/**
 * @route   GET /api/products/:id/reviews
 * @desc    Get reviews for a product
 * @access  Public
 */
router.get("/:id/reviews", setPublicCache(30), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productReviews = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));

    const reviewerIds = [
      ...new Set(
        productReviews.map((review) => Number(review.userId)).filter(Boolean),
      ),
    ];

    const reviewerOrders =
      reviewerIds.length > 0
        ? await db
            .select({
              userId: orders.userId,
              status: orders.status,
              items: orders.items,
            })
            .from(orders)
            .where(
              and(
                inArray(orders.userId, reviewerIds),
                sql`${orders.status} <> 'cancelled'`,
              ),
            )
        : [];

    const verifiedUserIds = new Set(
      reviewerOrders
        .filter((order) => hasPurchasedProduct(order.items, productId))
        .map((order) => Number(order.userId)),
    );

    const reviewsWithPurchaseStatus = productReviews.map((review) => ({
      ...review,
      verifiedPurchase: verifiedUserIds.has(Number(review.userId)),
    }));

    res.json({
      success: true,
      data: reviewsWithPurchaseStatus,
    });
  } catch (error) {
    console.error("❌ Get product reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product reviews",
    });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private/Admin
 */
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      shoeFor,
      sizes,
      colors,
      images,
      stock,
      isFeatured,
    } = req.body;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and category are required",
      });
    }

    if (parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    // Handle category - can be string or array
    const categoryValue = Array.isArray(category)
      ? category.join(", ")
      : category?.trim();

    // Handle shoeFor - can be string or array
    const shoeForValue = Array.isArray(shoeFor)
      ? shoeFor.join(", ")
      : shoeFor?.trim();

    const [product] = await db
      .insert(products)
      .values({
        name: name.trim(),
        description: description?.trim(),
        price: parseFloat(price).toFixed(2),
        category: categoryValue,
        brand: brand?.trim(),
        shoeFor: shoeForValue,
        sizes: sizes || [],
        colors: colors || [],
        images: images || [],
        stock: parseInt(stock) || 0,
        isFeatured: isFeatured || false,
        rating: "0",
        numReviews: 0,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("❌ Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private/Admin
 */
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Prepare update data
    const updateData = { ...req.body, updatedAt: new Date() };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.numReviews;
    // Remove non-schema fields sent by the frontend
    delete updateData.title;
    delete updateData.quantity;
    delete updateData.rating;

    // The DB columns category and shoeFor are varchar (single string).
    // The frontend sends arrays — join them to comma-separated strings.
    if (Array.isArray(updateData.category)) {
      updateData.category = updateData.category.join(",");
    }
    if (Array.isArray(updateData.shoeFor)) {
      updateData.shoeFor = updateData.shoeFor.join(",");
    }

    // Validate price if provided
    if (updateData.price && parseFloat(updateData.price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("❌ Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
});

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private/Admin
 */
router.patch(
  "/:id/stock",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { stock, operation = "set" } = req.body;

      if (isNaN(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      if (stock === undefined || isNaN(parseInt(stock))) {
        return res.status(400).json({
          success: false,
          message: "Valid stock value is required",
        });
      }

      const [existingProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      let newStock;
      switch (operation) {
        case "increment":
          newStock = existingProduct.stock + parseInt(stock);
          break;
        case "decrement":
          newStock = Math.max(0, existingProduct.stock - parseInt(stock));
          break;
        case "set":
        default:
          newStock = parseInt(stock);
      }

      const [updatedProduct] = await db
        .update(products)
        .set({ stock: newStock, updatedAt: new Date() })
        .where(eq(products.id, productId))
        .returning();

      res.json({
        success: true,
        message: "Stock updated successfully",
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          stock: updatedProduct.stock,
        },
      });
    } catch (error) {
      console.error("❌ Update stock error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update stock",
      });
    }
  },
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private/Admin
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, productId))
      .returning();

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      data: {
        id: deletedProduct.id,
        name: deletedProduct.name,
      },
    });
  } catch (error) {
    console.error("❌ Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
});

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Add a review to a product (updates rating)
 * @access  Private
 */
router.post("/:id/reviews", authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { rating, comment } = req.body;

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(
        and(eq(reviews.productId, productId), eq(reviews.userId, req.user.id)),
      );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const userOrders = await db
      .select({ id: orders.id, status: orders.status, items: orders.items })
      .from(orders)
      .where(
        and(
          eq(orders.userId, req.user.id),
          sql`${orders.status} <> 'cancelled'`,
        ),
      );

    const hasPurchased = userOrders.some((order) =>
      hasPurchasedProduct(order.items, productId),
    );

    if (!hasPurchased) {
      return res.status(400).json({
        success: false,
        message: "Only customers who purchased this product can leave a review",
      });
    }

    await db.insert(reviews).values({
      productId,
      userId: req.user.id,
      rating: parseInt(rating),
      comment: comment?.trim() || null,
    });

    const reviewStats = await db
      .select({
        numReviews: count(),
        avgRating: sql`AVG(${reviews.rating})::numeric(2,1)`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const newNumReviews = Number(reviewStats[0]?.numReviews || 0);
    const newRating = reviewStats[0]?.avgRating
      ? String(reviewStats[0].avgRating)
      : "0.0";

    const [updatedProduct] = await db
      .update(products)
      .set({
        rating: newRating,
        numReviews: newNumReviews,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    res.json({
      success: true,
      message: "Review added successfully",
      data: {
        id: updatedProduct.id,
        rating: updatedProduct.rating,
        numReviews: updatedProduct.numReviews,
      },
    });
  } catch (error) {
    console.error("❌ Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
});

export default router;
