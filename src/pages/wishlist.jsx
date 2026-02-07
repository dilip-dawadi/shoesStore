import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FiGrid, FiList, FiHeart } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { HiShoppingCart } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useAddToCart } from "../hooks/useCart";
import { useWishlist, useRemoveFromWishlist } from "../hooks/useWishlist";
import { NotifySuccess, NotifyError } from "../toastify";

const Wishlist = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data, isLoading, error } = useWishlist();
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  const wishlistItems = data?.items || [];

  // Filter and sort wishlist items
  const filteredAndSortedItems = useMemo(() => {
    let items = [...wishlistItems];

    // Filter by search query
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.product?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.product?.brand
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.product?.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Sort items
    switch (sortBy) {
      case "newest":
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "price-low":
        items.sort((a, b) => (a.product?.price || 0) - (b.product?.price || 0));
        break;
      case "price-high":
        items.sort((a, b) => (b.product?.price || 0) - (a.product?.price || 0));
        break;
      case "name":
        items.sort((a, b) =>
          (a.product?.name || "").localeCompare(b.product?.name || ""),
        );
        break;
      default:
        break;
    }

    return items;
  }, [wishlistItems, searchQuery, sortBy]);

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    const product = item.product;
    addToCart(
      {
        productId: product.id,
        quantity: 1,
      },
      {
        onSuccess: () => {
          NotifySuccess(`${product.name} added to cart!`);
        },
        onError: (error) => {
          NotifyError(error.message || "Failed to add to cart");
        },
      },
    );
  };

  const handleRemoveFromWishlist = (e, item) => {
    e.stopPropagation();
    removeFromWishlist(item.id, {
      onSuccess: () => NotifySuccess("Removed from wishlist"),
      onError: (error) =>
        NotifyError(error.message || "Failed to remove from wishlist"),
    });
  };

  const ProductCard = ({ item, index }) => {
    const product = item.product;

    if (!product) return null;

    return (
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className={`bg-card border border-border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group ${
          viewMode === "list" ? "flex" : ""
        }`}
      >
        <div
          className={`relative overflow-hidden ${
            viewMode === "list" ? "w-48" : "h-64"
          }`}
        >
          <img
            src={product.images?.[0] || "/placeholder.jpg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.stock < 5 && product.stock > 0 && (
            <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              Only {product.stock} left
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              Out of Stock
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              Featured
            </div>
          )}
          <button
            onClick={(e) => handleRemoveFromWishlist(e, item)}
            className="absolute bottom-2 right-2 bg-background border border-border p-2 rounded-full shadow-lg hover:scale-110 transition-all hover:shadow-xl"
            title="Remove from wishlist"
          >
            <AiFillHeart className="text-destructive" size={20} />
          </button>
        </div>

        <div
          className={`p-4 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}
        >
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {product.brand}
            </p>
            {viewMode === "list" && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {product.description}
              </p>
            )}
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center">
                <span className="text-yellow-500 mr-1">★</span>
                <span className="text-sm font-semibold text-foreground">
                  {parseFloat(product.rating || 0).toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.numReviews || 0} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
            <div>
              <span className="text-2xl font-bold text-primary">
                ${product.price}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>
            <button
              onClick={(e) => handleAddToCart(e, item)}
              disabled={product.stock === 0 || isAddingToCart}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <HiShoppingCart size={18} />
              <span className="font-semibold">Add</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <FiHeart className="text-destructive" size={32} />
            <h1 className="text-4xl font-bold text-foreground">My Wishlist</h1>
          </div>
          <p className="text-muted-foreground">
            {wishlistItems.length === 0
              ? "Your wishlist is empty. Start adding your favorite products!"
              : `${wishlistItems.length} ${wishlistItems.length === 1 ? "item" : "items"} saved for later`}
          </p>
        </motion.div>

        {/* Toolbar */}
        {wishlistItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-lg shadow-md p-4 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Sort & View Controls */}
              <div className="flex items-center space-x-4">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "grid"
                        ? "bg-accent text-accent-foreground shadow-md"
                        : "bg-secondary/10 text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                    }`}
                  >
                    <FiGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "list"
                        ? "bg-accent text-accent-foreground shadow-md"
                        : "bg-secondary/10 text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                    }`}
                  >
                    <FiList size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results count */}
            {searchQuery && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredAndSortedItems.length} of{" "}
                {wishlistItems.length} items
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl shadow-md overflow-hidden animate-pulse"
              >
                <div className="h-64 bg-secondary/20"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary/20 rounded w-3/4"></div>
                  <div className="h-4 bg-secondary/20 rounded w-1/2"></div>
                  <div className="h-4 bg-secondary/20 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <p className="text-destructive font-semibold">
              Error loading wishlist
            </p>
            <p className="text-destructive/80 text-sm mt-2">{error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && wishlistItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-lg shadow-md p-12 text-center"
          >
            <FiHeart className="mx-auto text-muted-foreground mb-4" size={64} />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Explore our products and add your favorites to your wishlist
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Browse Products
            </button>
          </motion.div>
        )}

        {/* Wishlist Grid/List */}
        {!isLoading && !error && filteredAndSortedItems.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
            }
          >
            {filteredAndSortedItems.map((item, index) => (
              <ProductCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading &&
          !error &&
          wishlistItems.length > 0 &&
          filteredAndSortedItems.length === 0 && (
            <div className="bg-card rounded-lg shadow-md p-12 text-center">
              <p className="text-muted-foreground text-lg">
                No items match your search
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Try a different search term
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default Wishlist;
