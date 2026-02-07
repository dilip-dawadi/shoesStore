import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Auth from "./Model/AuthModel";
import { Popover, Transition } from "@headlessui/react";
import { useLogout } from "../hooks/useAuth";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
// react icons
import { IoIosArrowDown } from "react-icons/io";
import { BiLogOutCircle } from "react-icons/bi";
import { FiUser, FiShield } from "react-icons/fi";
import { Fragment } from "react";
import AddProduct from "./Model/addProduct";
import Cart from "./cart";

export const Header = () => {
  const [IsSignup, setIsSignup] = React.useState(true);
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout: contextLogout } = useAuth();
  const { mutate: logoutMutation } = useLogout();

  const handleLogout = () => {
    logoutMutation(undefined, {
      onSettled: () => {
        contextLogout();
      },
    });
  };
  return (
    <header className="py-3 mb-0 border-b bg-background">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-3xl font-bold text-primary first-letter:uppercase hover:text-primary/90 transition duration-400 ease-in-out hover:scale-105 transform"
        >
          shoe Store
        </Link>
        <nav className="hidden md:flex gap-x-4">
          <Link
            to="/"
            className="text-md font-medium text-foreground hover:text-primary transition duration-400 ease-in-out"
          >
            Home
          </Link>
          <Link
            to="/products"
            className="ml-6 text-md font-medium text-foreground hover:text-primary transition duration-400 ease-in-out"
          >
            Products
          </Link>
          <Link
            to="/wishlist"
            className="ml-6 text-md font-medium text-foreground hover:text-primary transition duration-400 ease-in-out"
          >
            Wishlist
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/orders"
                className="ml-6 text-md font-medium text-foreground hover:text-primary transition duration-400 ease-in-out"
              >
                Orders
              </Link>
              <Link
                to="/profile"
                className="ml-6 text-md font-medium text-foreground hover:text-primary transition duration-400 ease-in-out"
              >
                Profile
              </Link>
            </>
          )}
        </nav>
        <div className="hidden md:flex items-center gap-6">
          {!isAuthenticated ? (
            <>
              <Button
                variant={!IsSignup ? "default" : "ghost"}
                onClick={() => {
                  setIsSignup(false);
                }}
              >
                <Auth
                  IsSignup={IsSignup}
                  setIsSignup={setIsSignup}
                  text={"Log in"}
                />
              </Button>
              <Button
                variant={IsSignup ? "default" : "ghost"}
                onClick={() => {
                  setIsSignup(true);
                }}
              >
                <Auth
                  IsSignup={IsSignup}
                  setIsSignup={setIsSignup}
                  text={"Sign up"}
                />
              </Button>
            </>
          ) : (
            <>
              {isAdmin && (
                <Button
                  onClick={() => navigate("/admin/products/add")}
                  className="gap-2 shadow-md"
                  size="default"
                >
                  <FiShield size={16} />
                  <span>Add Product</span>
                </Button>
              )}
              <Cart />
              <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-2">
                {user && (
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Badge
                        variant="default"
                        className="uppercase tracking-wide"
                      >
                        Admin
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <FiUser className="text-muted-foreground" size={16} />
                      <span className="font-medium text-foreground">
                        {user.name || user.email}
                      </span>
                    </div>
                  </div>
                )}
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <BiLogOutCircle size={20} />
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="flex md:hidden items-center gap-6">
          <PopoverFunction
            IsSignup={IsSignup}
            setIsSignup={setIsSignup}
            isAuthenticated={isAuthenticated}
            handleLogout={handleLogout}
            user={user}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
};

const Options = [
  {
    name: "Products",
    description: "Discover the best products for your needs.",
    href: "/products",
    icon: IconOne,
  },
  {
    name: "Wishlist",
    description: "Create your own collection of products.",
    href: "/wishlist",
    icon: IconTwo,
  },
  {
    name: "Orders",
    description: "Track and manage your orders.",
    href: "/orders",
    icon: IconOne,
  },
  {
    name: "Profile",
    description: "Manage your account settings.",
    href: "/profile",
    icon: IconTwo,
  },
];

export default function PopoverFunction({
  IsSignup,
  setIsSignup,
  handleLogout,
  isAuthenticated,
  user,
  isAdmin,
}) {
  const [open, setOpen] = React.useState(false);
  function openModalDropDown() {
    setOpen(!open);
  }
  function closeModalDropDown() {
    setOpen(false);
  }
  return (
    <Popover className="relative">
      <>
        <Popover.Button
          onClick={openModalDropDown}
          className={`
                text-opacity-100
                group inline-flex items-center text-base font-medium text-white hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 bg-primary hover:bg-primary-900  px-4 py-3 rounded-lg transition duration-400 ease-in-out cursor-pointer`}
        >
          <span>Menu</span>
          <IoIosArrowDown
            className={`${
              open ? "transform rotate-180" : "transform rotate-0"
            } ml-2 h-5 w-5 text-white transition duration-150 ease-in-out group-hover:text-opacity-80`}
            aria-hidden="true"
          />
        </Popover.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
          show={open}
        >
          <Popover.Panel
            className="absolute left-1/6 z-20 mt-3 max-w-sm w-[31vh] -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl"
            onClose={closeModalDropDown}
          >
            <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="relative grid gap-6 bg-white p-6 lg:grid-cols-2">
                {Options.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-primary-600 focus-visible:ring-opacity-50"
                    onClick={closeModalDropDown}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center text-white sm:h-12 sm:w-12">
                      <item.icon aria-hidden="true" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
                {!isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <button
                      className={
                        !IsSignup
                          ? "bg-primary hover:bg-primary-900 text-white px-4 py-3 rounded-lg transition duration-400 ease-in-out"
                          : "hover:text-primary transition duration-400 ease-in-out"
                      }
                      type="button"
                      onClick={() => {
                        setIsSignup(false);
                      }}
                    >
                      <Auth
                        IsSignup={IsSignup}
                        setIsSignup={setIsSignup}
                        text={"Log in"}
                        closeModalDropDown={closeModalDropDown}
                      />
                    </button>
                    <button
                      className={
                        IsSignup
                          ? "bg-primary hover:bg-primary-900 text-white px-4 py-3 rounded-lg transition duration-400 ease-in-out"
                          : "hover:text-primary transition duration-400 ease-in-out"
                      }
                      type="button"
                      onClick={() => {
                        setIsSignup(true);
                      }}
                    >
                      <Auth
                        IsSignup={IsSignup}
                        setIsSignup={setIsSignup}
                        text={"Sign up"}
                        closeModalDropDown={closeModalDropDown}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 p-4 border-t border-gray-200">
                    {user && (
                      <div className="flex items-center gap-2 w-full justify-center">
                        {isAdmin && (
                          <span className="bg-primary text-white px-2 py-1 rounded text-xs font-bold uppercase">
                            Admin
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {user.name || user.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Cart />
                      {isAdmin && <AddProduct />}
                      <button
                        className="bg-primary hover:bg-primary-900 rounded-full p-2 text-white text-xl cursor-pointer hover:scale-110 transition-all duration-300"
                        type="button"
                        onClick={handleLogout}
                        title="Logout"
                      >
                        <BiLogOutCircle />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 p-2">
                <a
                  href="##"
                  className="flow-root rounded-md px-3 py-0 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-primary-600 focus-visible:ring-opacity-50"
                >
                  <span className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      Tips & Tricks
                    </span>
                  </span>
                  <span className="block text-sm text-gray-500">
                    You can add products to your wishlist by clicking on the
                    heart icon
                  </span>
                </a>
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </>
    </Popover>
  );
}

function IconOne() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="8" fill="#1f2937" />
      <path d="M24 24L24 24L24 24Z" fill="white" />
      <path d="M24 24H16V16H24V24Z" fill="white" />
      <path d="M24 24H32V16H24V24Z" fill="white" />
      <path d="M24 24H16V32H24V24Z" fill="white" />
      <path d="M24 24H32V32H24V24Z" fill="white" />
    </svg>
  );
}

function IconTwo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="8" fill="#1f2937" />
      <path
        d="M28.0413 20L23.9998 13L19.9585 20M32.0828 27.0001L36.1242 34H28.0415M19.9585 34H11.8755L15.9171 27"
        stroke="#fff"
        strokeWidth="2"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.804 30H29.1963L24.0001 21L18.804 30Z"
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}
