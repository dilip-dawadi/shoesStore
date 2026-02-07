-- Add indexes for better query performance
-- Created: 2026-02-06

-- Index on price for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Index on rating for sorting featured/top products
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);

-- Index on created_at for sorting by newest
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Index on category for filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Index on brand for filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- Index on shoe_for for filtering
CREATE INDEX IF NOT EXISTS idx_products_shoe_for ON products(shoe_for);

-- Index on stock for checking availability
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Index on is_featured for featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category, price);
CREATE INDEX IF NOT EXISTS idx_products_brand_price ON products(brand, price);

-- Full-text search index for name and description (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector('english', COALESCE(description, '')));

-- Index on users email for authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on orders for user lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Composite index for user orders
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
