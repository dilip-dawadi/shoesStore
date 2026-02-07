import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
} from "react-icons/fi";
import { BiReset } from "react-icons/bi";

const AdvancedFilters = ({ filters, setFilters, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Update local filters when filters prop changes
  useEffect(() => {
    setLocalFilters(filters);
    if (filters.minPrice || filters.maxPrice) {
      setPriceRange([
        parseInt(filters.minPrice) || 0,
        parseInt(filters.maxPrice) || 500,
      ]);
    }
  }, [filters]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleMultiSelect = (category, value) => {
    const currentValues = localFilters[category]
      ? localFilters[category].split(",")
      : [];
    let newValues;

    if (currentValues.includes(value)) {
      newValues = currentValues.filter((v) => v !== value);
    } else {
      newValues = [...currentValues, value];
    }

    setLocalFilters({
      ...localFilters,
      [category]: newValues.length > 0 ? newValues.join(",") : "",
    });
  };

  const handlePriceChange = useCallback((index, value) => {
    const numValue = Number(value);
    setPriceRange((prev) => {
      const next = [...prev];
      next[index] = numValue;
      // Ensure min doesn't exceed max and vice-versa
      if (index === 0 && numValue > prev[1]) next[1] = numValue;
      if (index === 1 && numValue < prev[0]) next[0] = numValue;
      return next;
    });
  }, []);

  const handleSortChange = (value) => {
    setLocalFilters({
      ...localFilters,
      sort: value,
    });
  };

  const applyFilters = () => {
    setFilters({
      ...localFilters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      search: searchTerm,
      page: 1, // Reset to first page when filters change
    });
  };

  const resetFilters = () => {
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
    setLocalFilters(defaultFilters);
    setPriceRange([0, 500]);
    setSearchTerm("");
    setFilters(defaultFilters);
  };

  const isSelected = (category, value) => {
    const currentValues = localFilters[category]
      ? localFilters[category].split(",")
      : [];
    return currentValues.includes(value);
  };

  const FilterSection = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left font-semibold text-gray-800 hover:text-blue-600 transition-colors"
      >
        <span className="text-sm uppercase tracking-wide">{title}</span>
        {expandedSections[sectionKey] ? (
          <FiChevronUp className="text-gray-500" />
        ) : (
          <FiChevronDown className="text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const CheckboxItem = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
      />
      <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
        {label}
      </span>
    </label>
  );

  return (
    <div className="relative">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <FiFilter size={24} />
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6 space-y-6 sticky top-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center space-x-2">
                <FiFilter className="text-blue-600" size={20} />
                <h2 className="text-xl font-bold text-gray-800">Filters</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>

            {/* Sort */}
            <FilterSection title="Sort By" sectionKey="sort">
              <select
                value={localFilters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterSection>

            {/* Price Range */}
            <FilterSection title="Price Range" sectionKey="price">
              <div className="px-2">
                <div className="relative h-6">
                  {/* Track background */}
                  <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 rounded-full" />
                  {/* Active track */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-accent-500 rounded-full"
                    style={{
                      left: `${(priceRange[0] / 500) * 100}%`,
                      right: `${100 - (priceRange[1] / 500) * 100}%`,
                    }}
                  />
                  {/* Min slider */}
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={priceRange[0]}
                    onChange={(e) => handlePriceChange(0, e.target.value)}
                    className="price-slider absolute top-0 left-0 w-full"
                  />
                  {/* Max slider */}
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={priceRange[1]}
                    onChange={(e) => handlePriceChange(1, e.target.value)}
                    className="price-slider absolute top-0 left-0 w-full"
                  />
                </div>
                <div className="flex justify-between mt-3 text-sm text-gray-600">
                  <span className="font-medium">${priceRange[0]}</span>
                  <span className="font-medium">${priceRange[1]}</span>
                </div>
              </div>
            </FilterSection>

            {/* Category */}
            <FilterSection title="Category" sectionKey="category">
              {categories.map((category) => (
                <CheckboxItem
                  key={category}
                  label={category}
                  checked={isSelected("category", category)}
                  onChange={() => handleMultiSelect("category", category)}
                />
              ))}
            </FilterSection>

            {/* Brand */}
            <FilterSection title="Brand" sectionKey="brand">
              {brands.map((brand) => (
                <CheckboxItem
                  key={brand}
                  label={brand}
                  checked={isSelected("brand", brand)}
                  onChange={() => handleMultiSelect("brand", brand)}
                />
              ))}
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
            <div className="space-y-2 pt-4">
              <button
                onClick={applyFilters}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {isLoading ? "Applying..." : "Apply Filters"}
              </button>
              <button
                onClick={resetFilters}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <BiReset size={18} />
                <span>Reset All</span>
              </button>
            </div>

            {/* Active Filters Count */}
            {(localFilters.category ||
              localFilters.brand ||
              localFilters.shoeFor ||
              searchTerm) && (
              <div className="text-center text-sm text-gray-600 pt-2 border-t border-gray-200">
                <span className="font-semibold">
                  {[
                    localFilters.category?.split(",").filter(Boolean).length,
                    localFilters.brand?.split(",").filter(Boolean).length,
                    localFilters.shoeFor?.split(",").filter(Boolean).length,
                    searchTerm ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </span>{" "}
                active filter(s)
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilters;
