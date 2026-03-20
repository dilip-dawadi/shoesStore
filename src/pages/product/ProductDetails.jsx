import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAddReview, useProduct } from "../../hooks/useProducts";
import { useAddToCart } from "../../hooks/useCart";
import { LoadingSinglePage, NotifyError, NotifySuccess } from "../../toastify";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/customDialog/ConfirmDialog";

const REVIEWS_PER_PAGE = 4;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const { data: singleShoeData, isLoading } = useProduct(id);
  const { mutate: addToCart } = useAddToCart();
  const addReviewMutation = useAddReview();
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState("cart");
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPage, setReviewPage] = useState(1);

  const product = singleShoeData?.data || singleShoeData;
  const productName = product?.name || product?.title || "Product";
  const productImages = product?.images || product?.selectedFile || [];
  const productPrice = product?.price || product?.compareAtPrice || 0;
  const productStock = Number(
    product?.stock ?? product?.quantity ?? product?.count ?? 0,
  );
  const productSizes = Array.isArray(product?.sizes)
    ? product?.sizes
    : typeof product?.sizes === "string"
      ? product.sizes.split(",").map((s) => s.trim())
      : [];
  const productColors = Array.isArray(product?.colors)
    ? product?.colors
    : typeof product?.colors === "string"
      ? product.colors.split(",").map((c) => c.trim())
      : [];
  const productCategories = Array.isArray(product?.category)
    ? product?.category
    : typeof product?.category === "string"
      ? product.category.split(",").map((c) => c.trim())
      : [];
  const productShoeFor = Array.isArray(product?.shoeFor)
    ? product?.shoeFor
    : typeof product?.shoeFor === "string"
      ? product.shoeFor.split(",").map((s) => s.trim())
      : [];
  const productReviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const hasReviewed = productReviews.some(
    (review) => Number(review.userId) === Number(user?.id),
  );
  const totalReviewPages = Math.max(
    1,
    Math.ceil(productReviews.length / REVIEWS_PER_PAGE),
  );
  const paginatedReviews = useMemo(() => {
    const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
    return productReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [productReviews, reviewPage]);

  useEffect(() => {
    if (productSizes.length) {
      setSelectedSize((prev) => prev || productSizes[0]);
    }
    if (productColors.length) {
      setSelectedColor((prev) => prev || productColors[0]);
    }
  }, [productSizes, productColors]);

  useEffect(() => {
    setReviewPage(1);
  }, [productReviews.length]);

  const formattedPrice = useMemo(() => {
    const value = Number(productPrice);
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  }, [productPrice]);

  const handleLoginConfirm = async () => {
    sessionStorage.setItem(
      "redirectAfterLogin",
      `${location.pathname}${location.search}`,
    );
    setOpenAuthDialog(false);
    navigate("/login");
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthDialogMode("cart");
      setOpenAuthDialog(true);
      return;
    }

    addToCart(
      {
        productId: id,
        quantity: 1,
        size: selectedSize || productSizes?.[0],
        color: selectedColor || productColors?.[0],
      },
      {
        onSuccess: (response) =>
          NotifySuccess(response.data?.message || "Item added to cart."),
        onError: (error) => {
          if ([401, 440].includes(error?.response?.status)) {
            setOpenAuthDialog(true);
            return;
          }
          NotifyError(error.response?.data?.message || "Failed to add to cart");
        },
      },
    );
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setAuthDialogMode("cart");
      setOpenAuthDialog(true);
      return;
    }

    handleAddToCart();
    navigate("/checkout");
  };

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      setAuthDialogMode("review");
      setOpenAuthDialog(true);
      return;
    }

    addReviewMutation.mutate(
      {
        id,
        data: {
          rating: reviewRating,
          comment: reviewComment,
        },
      },
      {
        onSuccess: (response) => {
          NotifySuccess(
            response.data?.message || "Review submitted successfully",
          );
          setReviewComment("");
          setReviewRating(5);
        },
        onError: (error) => {
          NotifyError(
            error.response?.data?.message || "Failed to submit review",
          );
        },
      },
    );
  };

  if (isLoading || !product) return <LoadingSinglePage />;
  return (
    <>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {productName}
            </h1>
            <p className="text-muted-foreground mt-2">
              {product?.brand || "Premium footwear"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <img
                  className="w-full h-105 object-cover"
                  src={productImages?.[selectedImage] || "/placeholder.jpg"}
                  alt={productName}
                />
              </div>
              {productImages?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto">
                  {productImages.map((img, index) => (
                    <button
                      key={img + index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 w-20 rounded-xl border overflow-hidden shrink-0 transition-all ${
                        selectedImage === index
                          ? "border-accent ring-2 ring-accent/40"
                          : "border-border"
                      }`}
                    >
                      <img
                        src={img || "/placeholder.jpg"}
                        alt={`${productName} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {productCategories.slice(0, 2).map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 rounded-full bg-secondary/20 text-foreground text-sm capitalize"
                  >
                    {category}
                  </span>
                ))}
                {productShoeFor.slice(0, 2).map((shoeFor) => (
                  <span
                    key={shoeFor}
                    className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm capitalize"
                  >
                    {shoeFor}
                  </span>
                ))}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    productStock > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {productStock > 0
                    ? `In stock: ${productStock}`
                    : "Out of stock"}
                </span>
              </div>

              <div className="text-3xl font-bold text-primary">
                ${formattedPrice}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="font-semibold text-foreground">
                    {Number(product?.rating || 0).toFixed(1)}
                  </span>
                </div>
                <span>({product?.numReviews || 0} reviews)</span>
                <span>•</span>
                <span>SKU: {product?.id || "N/A"}</span>
              </div>

              <p className="text-muted-foreground">
                {product?.description ||
                  "Comfortable, stylish, and built for everyday wear."}
              </p>

              {productSizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Select Size
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {productSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedSize === size
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {productColors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Select Color
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {productColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                          selectedColor === color
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleCheckout}
                  disabled={productStock === 0}
                >
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-border"
                  onClick={handleAddToCart}
                  disabled={productStock === 0}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Free Shipping",
                description: "On orders above $100",
              },
              {
                title: "Easy Returns",
                description: "30-day hassle-free returns",
              },
              {
                title: "Secure Checkout",
                description: "Protected payments and data",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-card border border-border rounded-xl p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Details & Shipping */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Product Details
              </h2>
              <p className="text-muted-foreground mb-6">
                {product?.description ||
                  "Designed for everyday comfort with premium materials and a modern silhouette that pairs effortlessly with your style."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-secondary/10 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-semibold text-foreground">
                    {productCategories.join(", ") || "N/A"}
                  </p>
                </div>
                <div className="bg-secondary/10 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Shoe For</p>
                  <p className="text-sm font-semibold text-foreground">
                    {productShoeFor.join(", ") || "N/A"}
                  </p>
                </div>
                <div className="bg-secondary/10 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Available Sizes
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {productSizes.join(", ") || "N/A"}
                  </p>
                </div>
                <div className="bg-secondary/10 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Available Colors
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {productColors.join(", ") || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Shipping & Returns
              </h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Standard shipping in 3-5 business days.</li>
                <li>• Express delivery available at checkout.</li>
                <li>• 30-day returns on unworn items.</li>
                <li>• Free shipping on orders over $100.</li>
              </ul>
              <div className="mt-6 rounded-xl bg-accent/10 border border-accent/20 p-4">
                <p className="text-sm text-accent font-semibold">Need help?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support for sizing, delivery, or returns assistance.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Customer Reviews
              </h2>

              {productReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Be the first to review this product.
                </p>
              ) : (
                <div className="space-y-4">
                  {paginatedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {review.userName || "Customer"}
                          </p>
                          {review.verifiedPurchase ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              Verified Purchase
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      <p className="text-yellow-500 mt-1">
                        {"★".repeat(review.rating)}
                        <span className="text-muted-foreground">
                          {"☆".repeat(5 - review.rating)}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {review.comment || "Great product."}
                      </p>
                    </div>
                  ))}

                  {totalReviewPages > 1 ? (
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">
                        Page {reviewPage} of {totalReviewPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setReviewPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={reviewPage === 1}
                          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReviewPage((prev) =>
                              Math.min(totalReviewPages, prev + 1),
                            )
                          }
                          disabled={reviewPage === totalReviewPages}
                          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Write a Review
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Rating
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        className={`text-2xl transition-colors ${
                          value <= reviewRating
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Comment
                  </p>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    placeholder="Share your experience with this product"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={addReviewMutation.isPending || hasReviewed}
                  className="w-full"
                >
                  {hasReviewed
                    ? "You have already reviewed"
                    : addReviewMutation.isPending
                      ? "Submitting..."
                      : "Submit Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={openAuthDialog}
        setOpen={setOpenAuthDialog}
        title="Login required"
        description={
          authDialogMode === "review"
            ? "You are currently not logged in. Please login to submit a review."
            : "You are currently not logged in. Please login to add this product to your cart or continue to checkout."
        }
        confirmText="Login"
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="default"
        onConfirm={handleLoginConfirm}
      />
    </>
  );
};

export default ProductDetails;
