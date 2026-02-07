import React from "react";
import { HiShoppingCart } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function Cart() {
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const cartItems = cart?.items || [];
  return (
    <>
      <Button
        variant="default"
        size="icon"
        className={`fixed right-0 bottom-3 mr-7 z-50 rounded-full hover:scale-110 transition-transform duration-300 ease-in-out`}
        onClick={() => navigate("/cart")}
      >
        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {cartItems?.length || 0}
        </Badge>
        <HiShoppingCart className="text-2xl" title="Your Cart" />
      </Button>
    </>
  );
}
