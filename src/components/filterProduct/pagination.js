import React, { useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { TbDiscount } from "react-icons/tb";
import { Menu } from "@headlessui/react";

const Pagination = ({ Page, setPage }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Simple page numbers
  const pageData = ["All Pages", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <Menu as="div" className="dropdown relative lg:max-w-[200px]">
      <Menu.Button
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-btn w-full text-left"
      >
        <TbDiscount className="dropdown-icon-primary" />
        <div>
          <div className="text-[15px] font-medium leading-tight">
            {Page === "Page (any)" || Page === "All Pages"
              ? Page
              : `Page ${Page}`}
          </div>
          <div className="text-[13px]">Choose Page</div>
        </div>
        {isOpen ? (
          <RiArrowUpSLine className="dropdown-icon-secondary" />
        ) : (
          <RiArrowDownSLine className="dropdown-icon-secondary" />
        )}
      </Menu.Button>

      <Menu.Items className="dropdown-menu">
        {pageData?.map((pageItem, index) => {
          return (
            <Menu.Item
              as="li"
              onClick={() => setPage(pageItem)}
              key={index}
              className="cursor-pointer hover:text-primary transition"
            >
              {Page}
            </Menu.Item>
          );
        })}
      </Menu.Items>
    </Menu>
  );
};

export default Pagination;
