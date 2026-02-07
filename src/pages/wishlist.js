import React from "react";
import ProductList from "../components/ProductList";
import { useWishlist } from "../hooks/useWishlist";
import Search from "../components/filterProduct/Search";

const Wishlist = () => {
  const [filters, setFilters] = React.useState({
    page: 1,
    limit: 8,
    sort: "",
    brand: "",
    category: "",
    price: "",
  });

  const { data, isLoading, error } = useWishlist();

  return (
    <div className="min-h-[600px] mt-10">
      <Search filters={filters} setFilters={setFilters} loading={isLoading} />
      <ProductList
        data={data?.items || []}
        loading={isLoading}
        error={error?.message}
        title="WishList"
        limit={8}
      />
    </div>
  );
};

export default Wishlist;
