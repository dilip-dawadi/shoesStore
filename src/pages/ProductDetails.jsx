import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProduct } from "../hooks/useProducts";
import { useAddToCart } from "../hooks/useCart";
import { LoadingSinglePage, NotifyError, NotifySuccess } from "../toastify";
import { Button } from "../components/ui/button";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: singleShoeData, isLoading } = useProduct(id);
  const { mutate: addToCart } = useAddToCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

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

  useEffect(() => {
    if (productSizes.length) {
      setSelectedSize((prev) => prev || productSizes[0]);
    }
    if (productColors.length) {
      setSelectedColor((prev) => prev || productColors[0]);
    }
  }, [productSizes, productColors]);

  const formattedPrice = useMemo(() => {
    const value = Number(productPrice);
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  }, [productPrice]);

  const handleAddToCart = () => {
    addToCart(
      {
        productId: id,
        quantity: 1,
        size: selectedSize || productSizes?.[0],
        color: selectedColor || productColors?.[0],
      },
      {
        onSuccess: () => NotifySuccess("Added to cart"),
        onError: (error) =>
          NotifyError(error.message || "Failed to add to cart"),
      },
    );
  };

  const handleCheckout = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  if (isLoading || !product) return <LoadingSinglePage />;
  return (
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
      </div>
    </div>
  );
};

export default ProductDetails;
