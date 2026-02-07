import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, Upload, X } from "lucide-react";
import { NotifySuccess, NotifyError, NotifyWarning } from "../toastify";

const AddProduct = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    name: "",
    description: "",
    price: "",
    brand: "",
    category: [],
    shoeFor: [],
    stock: "",
    quantity: "",
    images: [],
  });

  const [imageUrls, setImageUrls] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const createProductMutation = useMutation({
    mutationFn: async (productData) => {
      const { data } = await axios.post("/products", productData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-products"]);
      NotifySuccess("Product created successfully!");
      navigate("/admin/products");
    },
    onError: (error) => {
      NotifyError(
        error.response?.data?.message || "Failed to create product"
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (category) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }));
  };

  const handleShoeForChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      shoeFor: prev.shoeFor.includes(type)
        ? prev.shoeFor.filter((s) => s !== type)
        : [...prev.shoeFor, type],
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingImages(true);

    // Simulate image upload - In production, upload to your storage service
    const newImageUrls = files.map((file) => URL.createObjectURL(file));
    
    setImageUrls((prev) => [...prev, ...newImageUrls]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImageUrls],
    }));

    setIsUploadingImages(false);
  };

  const handleRemoveImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title && !formData.name) {
      return NotifyWarning("Please provide a product name");
    }
    if (!formData.price) {
      return NotifyWarning("Please provide a price");
    }
    if (!formData.brand) {
      return NotifyWarning("Please provide a brand");
    }
    if (formData.images.length === 0) {
      return NotifyWarning("Please upload at least one image");
    }

    // Prepare data for submission
    const productData = {
      name: formData.name || formData.title,
      title: formData.title || formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      brand: formData.brand,
      category: formData.category,
      shoeFor: formData.shoeFor,
      stock: parseInt(formData.stock || formData.quantity || 0),
      quantity: parseInt(formData.quantity || formData.stock || 0),
      images: formData.images,
    };

    createProductMutation.mutate(productData);
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/products")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Add New Product
        </h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new product
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Enter brand name"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (Rs.) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {["Men", "Women", "Kids"].map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={
                      formData.category.includes(category)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Shoe Type Selection */}
            <div className="space-y-2">
              <Label>Shoe Type</Label>
              <div className="flex flex-wrap gap-2">
                {["Running", "Casual", "Sports", "Formal", "Lounging", "Everyday"].map(
                  (type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={
                        formData.shoeFor.includes(type) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleShoeForChange(type)}
                    >
                      {type}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>
                Product Images <span className="text-destructive">*</span>
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="flex justify-center">
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer text-primary hover:text-primary/80"
                    >
                      <span className="font-medium">Click to upload</span> or
                      drag and drop
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploadingImages}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </div>

                {/* Image Preview */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createProductMutation.isPending}
                className="flex-1"
              >
                {createProductMutation.isPending
                  ? "Creating..."
                  : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/products")}
                disabled={createProductMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
