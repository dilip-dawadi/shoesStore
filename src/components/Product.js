import { FaHeart, FaRegHeart } from "react-icons/fa";
import { BsEyeFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "../hooks/useWishlist";
import { LoadingCircle, NotifyWarning } from "../toastify";
import { useAuth } from "../context/AuthContext";

const Product = ({ Products }) => {
  const { isAuthenticated } = useAuth();
  const { data: wishlist } = useWishlist();
  const { mutate: addToWishlist, isPending: isAdding } = useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist();

  const wishlistItems = wishlist?.items || [];
  const wishListIDs = wishlistItems.map((item) => item.productId);
  const loading = isAdding || isRemoving;

  const getWishlistItemId = (productId) => {
    const item = wishlistItems.find((item) => item.productId === productId);
    return item?.id;
  };
  return (
    <Card className="px-3 pt-3 rounded-lg rounded-tl-[90px] w-full max-w-88 mx-auto cursor-pointer hover:shadow-lg transition relative group">
      <center>
        <img
          className="mb-3 rounded-tl-[90px] min-w-[240px] max-w-[240px] min-h-[240px] max-h-[240px] object-cover"
          src={Products?.images?.[0] || "/placeholder.jpg"}
          alt={Products?.name || Products?.title}
        />
      </center>
      <div className="w-full h-full flex justify-center items-center rounded-lg rounded-tl-[90px] opacity-0 group-hover:opacity-100 transition duration-500 absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 ease-in-out group-hover:bg-[#00000003]">
        <Link to={`/product/${Products?.id}`}>
          <Button variant="default" size="default" className="gap-2">
            <BsEyeFill className="text-xl" />
          </Button>
        </Link>
        {!isAuthenticated ? (
          <FaRegHeart
            className="text-2xl 
          text-primary transition duration-500 
          "
            style={{
              position: "absolute",
              top: "5%",
              right: "10%",
            }}
            title="Add to WishList"
            onClick={() =>
              NotifyWarning("Please login to add items to your wishlist")
            }
          />
        ) : wishListIDs?.find((item) => item === Products?.id) ? (
          loading ? (
            <LoadingCircle />
          ) : (
            <FaHeart
              className="text-2xl 
              text-primary transition duration-500
              "
              style={{
                position: "absolute",
                top: "5%",
                right: "10%",
              }}
              title="WishListed"
              onClick={() => {
                const wishlistItemId = getWishlistItemId(Products?.id);
                if (wishlistItemId) removeFromWishlist(wishlistItemId);
              }}
            />
          )
        ) : loading ? (
          <LoadingCircle />
        ) : (
          <FaRegHeart
            className="text-2xl 
            text-primary transition duration-500
            "
            style={{
              position: "absolute",
              top: "5%",
              right: "10%",
            }}
            title="Add to WishList"
            onClick={() => addToWishlist({ productId: Products?.id })}
          />
        )}
      </div>
      <div className="mb-2 flex text-sm justify-between px-2 align-center gap-2">
        {Products?.shoeFor
          ?.split(",")
          ?.map((shoeF, index) => {
            return (
              <Badge
                variant={index === 0 ? "secondary" : "default"}
                className="capitalize"
                key={index}
              >
                {shoeF.trim()}
              </Badge>
            );
          })
          ?.slice(0, 2)}
      </div>
      <div className="flex justify-between mb-2 bg-muted px-4 py-[0.7rem] rounded-lg text-foreground font-medium">
        <div className="max-w-[120px]">
          {(Products?.name || Products?.title)
            ?.split(" ")
            .slice(0, 6)
            .join(" ")}
        </div>
        <div className="text-foreground font-semibold">$ {Products?.price}</div>
      </div>
    </Card>
  );
};

export default Product;
