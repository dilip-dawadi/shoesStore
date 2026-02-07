import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";

// Wishlist API
export const wishlistApi = {
  getWishlist: () => api.get("/wishlist"),
  addToWishlist: (productId) => api.post("/wishlist", { productId }),
  removeFromWishlist: (id) => api.delete(`/wishlist/${id}`),
};

// Use Wishlist Query
export const useWishlist = () => {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.getWishlist().then((res) => res.data),
  });
};

// Use Add to Wishlist Mutation
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wishlistApi.addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

// Use Remove from Wishlist Mutation
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wishlistApi.removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};
