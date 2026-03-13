import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableSelect } from "@/components/customInputs/SearchableSelect";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
} from "react-icons/fi";
import { BiReset } from "react-icons/bi";
import { Slider } from "@/components/ui/slider";

const AdvancedFilters = ({ filters, setFilters, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [priceRange, setPriceRange] = useState([
    parseInt(filters.minPrice) || 0,
    parseInt(filters.maxPrice) || 500,
  ]);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    brand: true,
    gender: true,
    sort: true,
  });

  // Available filter options
  const categories = [
    "Running",
    "Basketball",
    "Casual",
    "Training",
    "Walking",
    "Hiking",
    "Soccer",
    "Tennis",
  ];

  const brands = [
    "Nike",
    "Adidas",
    "Puma",
    "Reebok",
    "New Balance",
    "Converse",
    "Vans",
    "Under Armour",
  ];

  const genderOptions = ["Men", "Women", "Unisex", "Kids"];

  const sortOptions = [
    { label: "Newest First", value: "-createdAt" },
    { label: "Price: Low to High", value: "+price" },
    { label: "Price: High to Low", value: "-price" },
    { label: "Best Rating", value: "-rating" },
    { label: "Most Popular", value: "-numReviews" },
    { label: "Name: A to Z", value: "+name" },
    { label: "Name: Z to A", value: "-name" },
  ];

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters((prev) => ({
          ...prev,
          search: searchTerm,
          page: 1,
        }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handlePriceCommit = useCallback(
    (value) => {
      setFilters((prev) => ({
        ...prev,
        minPrice: value[0],
        maxPrice: value[1],
        page: 1,
      }));
    },
    [setFilters],
  );

  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleMultiSelect = useCallback(
    (category, value) => {
      const currentValues = filters[category]
        ? filters[category].split(",")
        : [];
      let newValues;

      if (currentValues.includes(value)) {
        newValues = currentValues.filter((v) => v !== value);
      } else {
        newValues = [...currentValues, value];
      }

      setFilters((prev) => ({
        ...prev,
        [category]: newValues.length > 0 ? newValues.join(",") : "",
        page: 1,
      }));
    },
    [filters, setFilters],
  );

  const handleSortChange = useCallback(
    (value) => {
      setFilters((prev) => ({
        ...prev,
        sort: value,
        page: 1,
      }));
    },
    [setFilters],
  );

  const resetFilters = useCallback(() => {
    const defaultFilters = {
      page: 1,
      limit: 12,
      sort: "-createdAt",
      brand: "",
      category: "",
      shoeFor: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    };
    setPriceRange([0, 500]);
    setSearchTerm("");
    setFilters(defaultFilters);
  }, [setFilters]);

  const isSelected = useCallback(
    (category, value) => {
      const currentValues = filters[category]
        ? filters[category].split(",")
        : [];
      return currentValues.includes(value);
    },
    [filters],
  );

  // Memoize active filters count
  const activeFiltersCount = useMemo(() => {
    return [
      filters.category?.split(",").filter(Boolean).length || 0,
      filters.brand?.split(",").filter(Boolean).length || 0,
      filters.shoeFor?.split(",").filter(Boolean).length || 0,
      searchTerm ? 1 : 0,
      filters.minPrice && filters.minPrice !== "0" ? 1 : 0,
      filters.maxPrice && filters.maxPrice !== "500" ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
  }, [filters, searchTerm]);

  const FilterSection = ({ title, sectionKey, children }) => (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left font-semibold text-foreground hover:text-accent transition-colors"
      >
        <span className="text-sm uppercase tracking-wide">{title}</span>
        {expandedSections[sectionKey] ? (
          <FiChevronUp className="text-muted-foreground" />
        ) : (
          <FiChevronDown className="text-muted-foreground" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="mt-3 space-y-2">{children}</div>
      )}
    </div>
  );

  const CheckboxItem = React.memo(({ label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer group py-1">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-4 h-4 text-accent border-border rounded focus:ring-accent focus:ring-2 cursor-pointer transition-all"
        />
      </div>
      <span className="text-sm text-foreground group-hover:text-accent transition-colors select-none">
        {label}
      </span>
    </label>
  ));

  return (
    <div className="relative">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-accent text-accent-foreground p-4 rounded-full shadow-lg hover:bg-accent/90 transition-all hover:scale-110"
        aria-label="Toggle filters"
      >
        <FiFilter size={24} />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-card rounded-xl shadow-xl border border-border p-6 space-y-6 sticky top-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <FiFilter className="text-accent" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Filters</h2>
                {activeFiltersCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {activeFiltersCount} active
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No filters applied
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close filters"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-border bg-background rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all text-foreground placeholder:text-muted-foreground"
            />
            <FiSearch
              className="absolute left-3 top-3.5 text-muted-foreground"
              size={16}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Sort */}
          <FilterSection title="Sort By" sectionKey="sort">
            <SearchableSelect
              options={sortOptions.map((o) => ({
                id: o.value,
                label: o.label,
              }))}
              value={filters.sort}
              onChange={handleSortChange}
              placeholder="Select sort"
              returnType="id"
            />
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Price Range" sectionKey="price">
            <div className="px-2">
              <div className="mb-6 pt-2">
                <Slider
                  min={0}
                  max={500}
                  step={1}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  onValueCommit={handlePriceCommit}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2">
                  <span className="text-xs text-muted-foreground">Min</span>
                  <div className="text-sm font-semibold text-foreground">
                    ${priceRange[0]}
                  </div>
                </div>
                <div className="text-muted-foreground">—</div>
                <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2">
                  <span className="text-xs text-muted-foreground">Max</span>
                  <div className="text-sm font-semibold text-foreground">
                    ${priceRange[1]}
                  </div>
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Category */}
          <FilterSection title="Category" sectionKey="category">
            <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {categories.map((category) => (
                <CheckboxItem
                  key={category}
                  label={category}
                  checked={isSelected("category", category)}
                  onChange={() => handleMultiSelect("category", category)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Brand */}
          <FilterSection title="Brand" sectionKey="brand">
            <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {brands.map((brand) => (
                <CheckboxItem
                  key={brand}
                  label={brand}
                  checked={isSelected("brand", brand)}
                  onChange={() => handleMultiSelect("brand", brand)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Gender/Type */}
          <FilterSection title="For" sectionKey="gender">
            {genderOptions.map((option) => (
              <CheckboxItem
                key={option}
                label={option}
                checked={isSelected("shoeFor", option)}
                onChange={() => handleMultiSelect("shoeFor", option)}
              />
            ))}
          </FilterSection>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-border">
            <button
              onClick={resetFilters}
              className="w-full bg-secondary/10 text-foreground py-3 rounded-lg font-semibold hover:bg-secondary/20 transition-all flex items-center justify-center space-x-2 border border-border"
            >
              <BiReset size={18} />
              <span>Reset All Filters</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center pointer-events-none">
              <div className="bg-card px-4 py-2 rounded-lg shadow-lg border border-border">
                <p className="text-sm font-medium text-foreground">
                  Loading...
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-secondary-100);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-accent);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-accent-600);
        }
      `}</style>
    </div>
  );
};

export default AdvancedFilters;
