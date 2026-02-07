import React, { useState } from "react";
import { motion } from "framer-motion";
import { useProducts } from "../hooks/useProducts";
import AdvancedFilters from "../components/filterProduct/AdvancedFilters";
import { FiGrid, FiList, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { HiShoppingCart } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useAddToCart } from "../hooks/useCart";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "../hooks/useWishlist";
import { NotifySuccess, NotifyError } from "../toastify";

function Products() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    sort: "-createdAt",
    brand: "",
    category: "",
    shoeFor: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });

  const { data, isLoading, error } = useProducts(filters);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { data: wishlistData } = useWishlist();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  const products = data?.data || [];
  const pagination = data?.pagination || {};
  const wishlistItems = wishlistData?.items || [];

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(
      {
        productId: product.id,
        quantity: 1,
        price: product.price,
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

  const handleWishlistToggle = (e, product) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      const wishlistItem = wishlistItems.find(
        (item) => item.productId === product.id,
      );
      removeFromWishlist(wishlistItem.id, {
        onSuccess: () => NotifySuccess("Removed from wishlist"),
      });
    } else {
      addToWishlist(
        { productId: product.id },
        {
          onSuccess: () => NotifySuccess("Added to wishlist"),
          onError: (error) =>
            NotifyError(error.message || "Failed to add to wishlist"),
        },
      );
    }
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ProductCard = ({ product, index }) => (
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
          onClick={(e) => handleWishlistToggle(e, product)}
          className="absolute bottom-2 right-2 bg-background border border-border p-2 rounded-full shadow-lg hover:scale-110 transition-all hover:shadow-xl"
        >
          {isInWishlist(product.id) ? (
            <AiFillHeart className="text-destructive" size={20} />
          ) : (
            <AiOutlineHeart className="text-muted-foreground" size={20} />
          )}
        </button>
      </div>

      <div
        className={`p-4 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}
      >
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
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
            onClick={(e) => handleAddToCart(e, product)}
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Discover Your Perfect Shoes
          </h1>
          <p className="text-muted-foreground">
            Browse our collection of premium footwear
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 shrink-0">
            <AdvancedFilters
              filters={filters}
              setFilters={setFilters}
              isLoading={isLoading}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg shadow-md p-4 mb-6 flex items-center justify-between"
            >
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <span>Loading...</span>
                ) : (
                  <span>
                    Showing{" "}
                    <span className="font-semibold">{products.length}</span> of{" "}
                    <span className="font-semibold">
                      {pagination.totalItems || 0}
                    </span>{" "}
                    products
                  </span>
                )}
              </div>
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
            </motion.div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
                  Error loading products
                </p>
                <p className="text-destructive/80 text-sm mt-2">
                  {error.message}
                </p>
              </div>
            )}

            {/* Products Grid/List */}
            {!isLoading && !error && (
              <>
                {products.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card rounded-lg shadow-md p-12 text-center"
                  >
                    <p className="text-muted-foreground text-lg">
                      No products found
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Try adjusting your filters
                    </p>
                  </motion.div>
                ) : (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "space-y-6"
                    }
                  >
                    {products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrevPage}
                      className="p-2 rounded-lg bg-card border border-border shadow-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <FiChevronLeft size={20} />
                    </button>

                    <div className="flex items-center space-x-2">
                      {[...Array(pagination.totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= pagination.currentPage - 1 &&
                            pageNum <= pagination.currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                pageNum === pagination.currentPage
                                  ? "bg-accent text-accent-foreground shadow-md scale-105"
                                  : "bg-card border border-border text-foreground hover:bg-accent/10 hover:border-accent shadow"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === pagination.currentPage - 2 ||
                          pageNum === pagination.currentPage + 2
                        ) {
                          return (
                            <span key={pageNum} className="text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNextPage}
                      className="p-2 rounded-lg bg-card border border-border shadow-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;
