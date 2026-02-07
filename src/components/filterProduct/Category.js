import React, { useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { TbDiscount } from "react-icons/tb";
import { Menu } from "@headlessui/react";

const ProductDropdown = ({ Category, setCategory }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Hardcoded categories - could be fetched from API later
  const categoryData = [
    "All Categories",
    "Running",
    "Casual",
    "Sports",
    "Formal",
    "Sneakers",
  ];

  return (
    <Menu as="div" className="dropdown relative">
      <Menu.Button
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-btn w-full text-left"
      >
        <TbDiscount className="dropdown-icon-primary" />
        <div>
          <div className="text-[15px] font-medium leading-tight">
            {Category}
          </div>
          <div className="text-[13px]">Choose category</div>
        </div>
        {isOpen ? (
          <RiArrowUpSLine className="dropdown-icon-secondary" />
        ) : (
          <RiArrowDownSLine className="dropdown-icon-secondary" />
        )}
      </Menu.Button>

      <Menu.Items className="dropdown-menu">
        {categoryData?.map((cat, index) => {
          return (
            <Menu.Item
              as="li"
              onClick={() => setCategory(cat)}
              key={index}
              className="cursor-pointer hover:text-primary transition"
            >
              {Category}
            </Menu.Item>
          );
        })}
      </Menu.Items>
    </Menu>
  );
};

export default ProductDropdown;
