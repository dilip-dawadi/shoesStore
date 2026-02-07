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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/product/${product.id}`)}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group ${
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
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Only {product.stock} left
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Out of Stock
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
        <button
          onClick={(e) => handleWishlistToggle(e, product)}
          className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          {isInWishlist(product.id) ? (
            <AiFillHeart className="text-red-500" size={20} />
          ) : (
            <AiOutlineHeart className="text-gray-600" size={20} />
          )}
        </button>
      </div>

      <div
        className={`p-4 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}
      >
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
          {viewMode === "list" && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span className="text-sm font-semibold text-gray-700">
                {product.rating?.toFixed(1) || "0.0"}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              ({product.numReviews || 0} reviews)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              ${product.price}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ${product.compareAtPrice}
              </span>
            )}
          </div>
          <button
            onClick={(e) => handleAddToCart(e, product)}
            disabled={product.stock === 0 || isAddingToCart}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <HiShoppingCart size={18} />
            <span className="font-semibold">Add</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Discover Your Perfect Shoes
          </h1>
          <p className="text-gray-600">
            Browse our collection of premium footwear
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <AdvancedFilters
              filters={filters}
              setFilters={setFilters}
              isLoading={isLoading}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
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
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FiGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FiList size={20} />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
                  >
                    <div className="h-64 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 font-semibold">
                  Error loading products
                </p>
                <p className="text-red-500 text-sm mt-2">{error.message}</p>
              </div>
            )}

            {/* Products Grid/List */}
            {!isLoading && !error && (
              <>
                {products.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg">No products found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Try adjusting your filters
                    </p>
                  </div>
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
                      className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                pageNum === pagination.currentPage
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-white text-gray-700 hover:bg-gray-50 shadow"
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
                      className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
