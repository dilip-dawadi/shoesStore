import React from "react";
import { HiShoppingCart } from "react-icons/hi";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "./customDialog/ConfirmDialog";

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [openAuthDialog, setOpenAuthDialog] = React.useState(false);
  const { data: cart } = useCart();
  const cartItems = cart?.items || [];

  const handleCartClick = () => {
    if (!isAuthenticated) {
      setOpenAuthDialog(true);
      return;
    }
    navigate("/cart");
  };

  const handleLoginConfirm = async () => {
    sessionStorage.setItem("redirectAfterLogin", "/cart");
    setOpenAuthDialog(false);
    navigate("/login");
  };

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className={`fixed right-0 bottom-3 mr-7 z-50 rounded-full hover:scale-110 transition-transform duration-300 ease-in-out`}
        onClick={handleCartClick}
      >
        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {cartItems?.length || 0}
        </Badge>
        <HiShoppingCart className="text-2xl" title="Your Cart" />
      </Button>

      <ConfirmDialog
        open={openAuthDialog}
        setOpen={setOpenAuthDialog}
        title="Login required"
        description="You are currently not logged in. Please login to access your cart and continue shopping."
        confirmText="Login"
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="default"
        onConfirm={handleLoginConfirm}
      />
    </>
  );
}
