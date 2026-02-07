import React from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useProduct } from "../hooks/useProducts";
import { useAddToCart } from "../hooks/useCart";
import { LoadingSinglePage } from "../toastify";

const ProductDetails = () => {
  const { id } = useParams();
  const token = localStorage.getItem("authenticate");
  let decodeData = null;

  try {
    if (token) {
      decodeData = JSON.parse(atob(token.split(".")[1]));
    }
  } catch (error) {
    console.error("Token decode error:", error);
  }

  const { data: singleShoeData, isLoading } = useProduct(id);
  const { mutate: addToCart } = useAddToCart();

  const handleAddToCart = () => {
    addToCart({
      productId: id,
      quantity: 1,
      size: singleShoeData?.sizes?.[0],
      color: singleShoeData?.colors?.[0],
    });
  };

  const handleCheckout = () => {
    handleAddToCart();
    // Navigate to checkout or open cart
    window.location.href = "/checkout";
  };

  if (isLoading || !singleShoeData) return <LoadingSinglePage />;
  return (
    <div className="container mx-auto min-h-[600px] mt-4">
      <div className="text-2xl font-semibold items-center justify-between gap-x-2 flex">
        {singleShoeData?.title}
        <div className=" text-sm font-normal sm:flex sm:items-center hidden">
          <div>
            {singleShoeData?.shoeFor
              ?.map((shoeF, index) => {
                return (
                  <span
                    className="capitalize bg-green-500 rounded-full text-white px-3 py-2 ml-2 inline-block"
                    key={index}
                  >
                    {shoeF}
                  </span>
                );
              })
              .splice(0, 1)}
          </div>
          <div className="bg-primary rounded-full text-white px-3 py-2 ml-1 inline-block">
            Available: {singleShoeData?.quantity}
          </div>
          <div className="text-2xl font-semibold text-primary-900 ml-10">
            Rs.{singleShoeData?.price}
          </div>
        </div>
        <div className="text-2xl font-semibold text-primary-900 inline-block sm:hidden">
          Rs.{singleShoeData?.price}
        </div>
      </div>
      <div className="text-sm font-normal flex sm:hidden items-center mt-1">
        <div>
          {singleShoeData?.category
            ?.map((category, index) => {
              return (
                <span
                  className="capitalize bg-green-500 rounded-full text-white px-3 py-2 ml-2 inline-block"
                  key={index}
                >
                  {category}
                </span>
              );
            })
            .splice(0, 1)}
        </div>
        <div className="bg-primary rounded-full text-white px-3 py-2 ml-1 inline-block">
          Available: {singleShoeData?.quantity}
        </div>
      </div>
      <div className="flex flex-col gap-10 items-center justify-center text-center md:min-h-[640px] md:flex-row">
        <div className="basis-1/3 flex-1">
          <img
            className="m-auto rounded-lg md:min-w-[400px] lg:min-w-[600px] xl:min-w-[680px] xl:max-w-[720px] xl:min-h-[520px] xl:max-h-[520px] object-cover bg-white"
            src={singleShoeData?.selectedFile?.[0] || "/placeholder.jpg"}
            alt=""
          />
          <h3 className="text-lg text-justify mb-4 py-2 px-4 rounded-md bg-gray-100 w-full">
            {singleShoeData?.description}
          </h3>
        </div>
        <div className="basis-1/3 flex-1 w-full mb-8 bg-white border border-gray-300 rounded-lg px-6 py-8">
          <div className="flex items-center gap-x-4 mb-8">
            <div className="w-10 h-10 p-1 border border-gray-300 rounded-full">
              <img
                src={singleShoeData?.selectedFile?.[0] || "/placeholder.jpg"}
                alt=""
              />
            </div>
            <div>
              <div className="font-bold text-lg ">{singleShoeData?.title}</div>
              <Link to="" className="text-primary-700 text-sm">
                Order Now
              </Link>
            </div>
          </div>
          <form
            className="flex flex-col gap-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              className="border border-secondary-300 focus:border-primary rounded w-full px-4 h-14 text-sm outline-none"
              type="text"
              defaultValue={decodeData?.name || ""}
              placeholder="Name*"
            />
            <input
              className="border border-secondary-300 focus:border-primary rounded w-full px-4 h-14 text-sm outline-none"
              type="text"
              placeholder="Email*"
              defaultValue={decodeData?.email || ""}
            />
            <input
              className="border border-secondary-300 focus:border-primary rounded w-full px-4 h-14 text-sm outline-none"
              type="text"
              placeholder="Phone*"
              defaultValue={decodeData?.number || ""}
            />
            <textarea
              className="border border-secondary-300 focus:border-primary rounded w-full p-4 h-[5.5rem] text-sm text-secondary-400 outline-none resize-none"
              type="text"
              placeholder="Message*"
              defaultValue="Hello, I am interested to buy this product. Please contact me."
            />
          </form>
          <div className="flex gap-x-2 mt-4">
            <button
              className="bg-primary hover:bg-primary-900 text-white rounded p-4 text-sm w-full transition"
              onClick={handleCheckout}
            >
              Order Now
            </button>
            <button
              className="border border-primary text-primary hover:border-primary-900 hover:text-primary-900 rounded p-4 text-sm w-full transition"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
