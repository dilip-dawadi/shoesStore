import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { HiShoppingCart } from "react-icons/hi";
import { IoIosAddCircle } from "react-icons/io";
import { AiFillMinusCircle } from "react-icons/ai";
import { useCart, useUpdateCart, useRemoveFromCart } from "../hooks/useCart";
import { LoadingBtn, NotifyInfo } from "../toastify";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function Cart() {
  const [isOpenCart, setIsOpenCart] = useState(false);
  const { data: cart } = useCart();
  const { mutate: updateCart, isPending: isUpdating } = useUpdateCart();
  const { mutate: removeFromCart } = useRemoveFromCart();

  const cartItems = cart?.items || [];
  const data = cartItems.map((item) => ({
    _id: item.id,
    title: item.product?.name || item.product?.title,
    selectedFile: item.product?.images || [],
    price: item.price || item.product?.price,
    quantityUserAdd: item.quantity,
  }));

  function closeModal() {
    setIsOpenCart(false);
  }

  function openModal() {
    if (cartItems.length === 0) {
      return NotifyInfo("Your cart is empty");
    }
    setIsOpenCart(true);
  }

  function QuantityStatus({ shoeId, status: statusParam }) {
    const item = cartItems.find((i) => i.id === shoeId);
    if (!item) return;

    const newQuantity =
      statusParam === "increase" ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity > 0) {
      updateCart({ id: shoeId, data: { quantity: newQuantity } });
    }
  }

  function DeleteCart(id) {
    removeFromCart(id);
  }

  function CheckoutBtn(total) {
    window.location.href = "/checkout";
    setIsOpenCart(false);
  }

  const size = window.innerWidth > 768 ? "md" : "sm";
  return (
    <>
      <Button
        variant="default"
        size="icon"
        className={`${
          size === "md" && "fixed right-0 top-3 mr-7"
        } z-50 rounded-full hover:scale-110 transition-transform duration-300 ease-in-out relative`}
        onClick={openModal}
      >
        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {cartItems?.length || 0}
        </Badge>
        <HiShoppingCart className="text-2xl" title="Your Cart" />
      </Button>

      <Transition appear show={isOpenCart} as={Fragment}>
        <Dialog as="div" className="relative z-[1000]" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-50 bg-opacity-50" />
          </Transition.Child>
          <div className="fixed right-1 top-0 bottom-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md h-[96vh] transform overflow-hidden rounded-2xl bg-white align-middle shadow-xl transition-all flex justify-center relative items-center">
                  <div className="space-y-4 max-h-[82%] py-2 overflow-auto m-auto">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium absolute top-2 
                                            left-1/2 transform -translate-x-1/2               text-gray-900 text-center"
                    >
                      Your Cart
                    </Dialog.Title>
                    <div className="grid grid-cols-1">
                      {data
                        ?.slice()
                        ?.reverse()
                        ?.map((Products, index) => {
                          return (
                            <div key={index}>
                              <div className="px-6 flex">
                                <div className="bg-gray-50 relative">
                                  <img
                                    className={`relative min-w-[100px] max-w-[100px] min-h-[100px] max-h-[100px] object-cover bg-white`}
                                    src={Products?.selectedFile[0]}
                                    alt={Products?.title}
                                  />
                                  <AiFillMinusCircle
                                    title="remove"
                                    className="absolute inset-x-1 top-2 text-destructive cursor-pointer text-2xl"
                                    onClick={() => DeleteCart(Products?._id)}
                                  />
                                </div>
                                <div className="flex flex-col items-center justify-around ml-4 bg-gray-50 px-1 pt-1 rounded-lg">
                                  <p className="text-sm font-bold">
                                    {Products?.title?.slice(0, 15)}
                                  </p>
                                  <div className="flex justify-around items-center w-full px-2 py-1 mb-1 rounded-lg bg-gray-100">
                                    <div className="flex items-center text-xl text-primary cursor-pointer">
                                      <IoIosAddCircle
                                        title="Add"
                                        className="hover:text-primary-600 hover:scale-110"
                                        onClick={() =>
                                          QuantityStatus({
                                            shoeId: Products?._id,
                                            status: "increase",
                                          })
                                        }
                                      />
                                    </div>
                                    <p className="mx-2">
                                      {isUpdating ? (
                                        <LoadingBtn color={"black"} width={4} />
                                      ) : (
                                        Products?.quantityUserAdd
                                      )}
                                    </p>
                                    <div className="flex items-center text-xl text-gray-600 cursor-pointer">
                                      <AiFillMinusCircle
                                        title="minus"
                                        className="hover:text-gray-500 hover:scale-110"
                                        onClick={() =>
                                          QuantityStatus({
                                            shoeId: Products?._id,
                                            status: "decrease",
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-around items-center bg-gray-100 px-4 py-[0.7rem] rounded-lg text-black font-medium ">
                                    <div className="max-w-[120px] mr-5">
                                      {Products?.quantityUserAdd} x
                                    </div>
                                    <div className="text-black">
                                      Rs.{" "}
                                      {Products?.quantityUserAdd *
                                        Products?.price}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full h-[1px] bg-[#957272] my-4"></div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="absolute bottom-3">
                      <div className="flex items-center font-semibold">
                        <div className="relative left-10">
                          Total = Rs.{" "}
                          {data?.reduce(
                            (acc, item) =>
                              acc + item?.quantityUserAdd * item?.price,
                            0,
                          )}
                        </div>
                        <button
                          className="relative left-16 bg-primary hover:bg-primary-900 text-white px-4 py-[0.42rem] rounded-lg hover:scale-105"
                          onClick={() =>
                            CheckoutBtn(
                              data?.reduce(
                                (acc, item) =>
                                  acc + item?.quantityUserAdd * item?.price,
                                0,
                              ),
                            )
                          }
                        >
                          Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
