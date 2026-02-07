import React, { useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { Menu } from "@headlessui/react";
import { GiRunningShoe } from "react-icons/gi";

const BrandDropdown = ({ brand, setbrand }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Hardcoded brands - could be fetched from API later
  const brandData = [
    "All Brands",
    "Nike",
    "Adidas",
    "Puma",
    "Reebok",
    "New Balance",
  ];

  return (
    <Menu as="div" className="dropdown relative">
      <Menu.Button
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-btn w-full text-left"
      >
        <GiRunningShoe className="dropdown-icon-primary" />
        <div>
          <div className="text-[15px] font-medium leading-tight">{brand}</div>
          <div className="text-[13px]">Select your brand</div>
        </div>
        {isOpen ? (
          <RiArrowUpSLine className="dropdown-icon-secondary" />
        ) : (
          <RiArrowDownSLine className="dropdown-icon-secondary" />
        )}
      </Menu.Button>

      <Menu.Items className="dropdown-menu">
        {brandData?.map((brandItem, index) => {
          return (
            <Menu.Item
              as="li"
              onClick={() => setbrand(brandItem)}
              key={index}
              className="cursor-pointer hover:text-primary transition"
            >
              {brandItem}
            </Menu.Item>
          );
        })}
      </Menu.Items>
    </Menu>
  );
};

export default BrandDropdown;
