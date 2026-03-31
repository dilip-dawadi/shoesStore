import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../lib/axios";

// Products API
export const productsApi = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  getReviews: (id) => api.get(`/products/${id}/reviews`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

const normalizeFilters = (filters = {}) => {
  const compact = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    const normalizedValue = typeof value === "string" ? value.trim() : value;

    if (normalizedValue === "") {
      return acc;
    }

    acc[key] = normalizedValue;
    return acc;
  }, {});

  // Sort keys to keep query keys stable and avoid cache misses from key order.
  return Object.keys(compact)
    .sort()
    .reduce((acc, key) => {
      acc[key] = compact[key];
      return acc;
    }, {});
};

// Use Products Query
export const useProducts = (filters = {}) => {
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery({
    queryKey: ["products", normalizedFilters],
    queryFn: () =>
      productsApi.getAll(normalizedFilters).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
};

// Use Product Query
export const useProduct = (id) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

// Use Product Reviews Query
export const useProductReviews = (id) => {
  return useQuery({
    queryKey: ["product-reviews", id],
    queryFn: () => productsApi.getReviews(id).then((res) => res.data),
    enabled: !!id,
  });
};

// Use Add Review Mutation
export const useAddReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productsApi.addReview(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({
        queryKey: ["product-reviews", variables.id],
      });
    },
  });
};

// Use Create Product Mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

// Use Update Product Mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
  });
};

// Use Delete Product Mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
