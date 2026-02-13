import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogout } from "../hooks/useAuth";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
// react icons
import { BiLogOutCircle } from "react-icons/bi";
import {
  FiUser,
  FiShield,
  FiMenu,
  FiHome,
  FiPackage,
  FiHeart,
  FiShoppingBag,
} from "react-icons/fi";

export const Header = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    logout: contextLogout,
  } = useAuth();
  const { mutate: logoutMutation } = useLogout();

  // Use cached user for optimistic state, but validate admin role
  const optimisticAuth = isAuthenticated || (loading && !!user);
  const optimisticAdmin =
    isAdmin || (loading && user?.role === "admin" && isAuthenticated);

  const handleLogout = () => {
    logoutMutation(undefined, {
      onSettled: () => {
        contextLogout();
      },
    });
  };
  return (
    <header className="py-3 mb-0 border-b">
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
          {!optimisticAuth ? (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="default">Sign up</Button>
              </Link>
            </>
          ) : (
            <>
              {optimisticAdmin && (
                <Button
                  onClick={() => navigate("/admin")}
                  className="gap-2"
                  size="sm"
                  variant="outline"
                >
                  <FiShield size={16} />
                  <span className="hidden lg:inline">Admin</span>
                </Button>
              )}
              {!optimisticAdmin && (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                  size="sm"
                  variant="outline"
                >
                  <FiUser size={16} />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
              )}
              <div className="flex items-center gap-2">
                {optimisticAdmin && (
                  <Badge variant="default" className="text-xs">
                    Admin
                  </Badge>
                )}
                <span className="hidden md:inline text-sm font-medium text-foreground">
                  {user?.name || user?.email}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <BiLogOutCircle size={18} />
                </Button>
              </div>
            </>
          )}
        </div>
        <MobileMenu
          isAuthenticated={optimisticAuth}
          handleLogout={handleLogout}
          user={user}
          isAdmin={optimisticAdmin}
          navigate={navigate}
        />
      </div>
    </header>
  );
};

function MobileMenu({
  handleLogout,
  isAuthenticated,
  user,
  isAdmin,
  navigate,
}) {
  return (
    <div className="flex md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="icon">
            <FiMenu size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mr-4" align="end">
          <DropdownMenuLabel>
            <span className="font-semibold">Menu</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => navigate("/")}>
            <FiHome className="mr-2" size={16} />
            Home
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/products")}>
            <FiPackage className="mr-2" size={16} />
            Products
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/wishlist")}>
            <FiHeart className="mr-2" size={16} />
            Wishlist
          </DropdownMenuItem>

          {isAuthenticated && (
            <>
              <DropdownMenuItem onClick={() => navigate("/orders")}>
                <FiShoppingBag className="mr-2" size={16} />
                Orders
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <FiUser className="mr-2" size={16} />
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <FiShield className="mr-2" size={16} />
                  Admin Dashboard
                </DropdownMenuItem>
              )}

              {!isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <FiUser className="mr-2" size={16} />
                  My Dashboard
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Badge variant="default" className="text-xs">
                      Admin
                    </Badge>
                  )}
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.name || user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <BiLogOutCircle className="mr-2" size={16} />
                Logout
              </DropdownMenuItem>
            </>
          )}

          {!isAuthenticated && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-2">
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="default" className="w-full">
                    Sign up
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
