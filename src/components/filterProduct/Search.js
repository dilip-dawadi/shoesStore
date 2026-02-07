import React from "react";
import BrandDropdown from "./BrandDropdown";
import CategoryDropdown from "./Category";
import PriceRangeDropdown from "./PriceRangeDropdown";
import { RiSearch2Line } from "react-icons/ri";
import { NotifySuccess, NotifyWarning } from "../../toastify";
import Pagination from "./pagination";
import { Button } from "../ui/button";

const Search = ({ filters, setFilters, loading }) => {
  const [Category, setCategory] = React.useState(
    filters?.category || "Category (any)",
  );
  const [Price, setPrice] = React.useState(
    filters?.price || "Price range (any)",
  );
  const [Brand, setbrand] = React.useState(filters?.brand || "Brand (any)");
  const [Page, setPage] = React.useState(filters?.page || "Page (any)");

  const handleSubmit = (e) => {
    e.preventDefault();

    const newFilters = { ...filters };

    if (Page !== "Page (any)" && Page !== "All Pages") {
      newFilters.page = Page;
    } else {
      newFilters.page = 1;
    }

    if (Category !== "Category (any)" && Category !== "All Categories") {
      newFilters.category = Category;
    } else {
      newFilters.category = "";
    }

    if (Price !== "Price range (any)" && Price !== "All Prices") {
      newFilters.price = Price;
    } else {
      newFilters.price = "";
    }

    if (Brand !== "Brand (any)" && Brand !== "All Brands") {
      newFilters.brand = Brand;
    } else {
      newFilters.brand = "";
    }

    if (
      Brand === "Brand (any)" &&
      Price === "Price range (any)" &&
      Category === "Category (any)" &&
      Page === "Page (any)"
    ) {
      return NotifyWarning("Please select any filter");
    }

    setFilters(newFilters);
    NotifySuccess("Filter applied successfully");
  };
  return (
    <div className="px-[30px] py-6 max-w-[1170px] mx-auto flex flex-col items-center lg:flex-row justify-between gap-4 lg:gap-x-3 relative -top-3 lg:-top-4 lg:shadow-1 bg-white lg:bg-transparent lg:backdrop-blur rounded-lg">
      <BrandDropdown brand={Brand} setbrand={setbrand} />
      <CategoryDropdown Category={Category} setCategory={setCategory} />
      <PriceRangeDropdown price={Price} setPrice={setPrice} />
      <Pagination Page={Page} setPage={setPage} />
      <Button
        className="w-full lg:max-w-[132px] gap-2"
        size="lg"
        onClick={handleSubmit}
      >
        <RiSearch2Line />
        Search
      </Button>
    </div>
  );
};

export default Search;
