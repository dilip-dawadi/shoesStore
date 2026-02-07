import React from "react";

// import components
import ProductList from "../components/ProductList";
import Banner from "../components/Banner";
import TopProduct from "./topProduct";
import { useProducts } from "../hooks/useProducts";
import Search from "../components/filterProduct/Search";

const Home = () => {
  const [filters, setFilters] = React.useState({
    page: 1,
    limit: 4,
    sort: "",
    brand: "",
    category: "",
    price: "",
  });

  const { data, isLoading, error } = useProducts(filters);

  return (
    <div className="min-h-[1400px]">
      <Banner setFilters={setFilters} />
      <Search filters={filters} setFilters={setFilters} loading={isLoading} />
      <ProductList
        data={data?.products || []}
        error={error?.message}
        loading={isLoading}
        title="Our Products"
        limit={4}
      />
      <TopProduct />
    </div>
  );
};

export default Home;
