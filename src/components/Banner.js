import React from "react";
import Image from "../assets/homepage.svg";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Banner = ({ setFilters }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    if (setFilters) {
      setFilters((prev) => ({ ...prev, category }));
    }
    navigate("/products");
  };

  const ShoeForMen = () => handleCategoryClick("Men");
  const ShoeForWomen = () => handleCategoryClick("Women");
  const ShoeForKids = () => handleCategoryClick("Kids");
  return (
    <section className="min-h-[80vh] flex flex-col justify-center">
      <div className="text-center p-4 sm:p-10 flex flex-col gap-10 md:flex-row md:flex-wrap items-center justify-center">
        <div className="basis-1/3 flex-1">
          <h1 className="text-2xl sm:text-4xl font-semibold text-foreground mb-4 capitalize">
            <p className="text-primary text-4xl lg:text-[66px] font-medium leading-none">
              Shoe Store
            </p>{" "}
            dream footwear store
          </h1>
          <p className="mb-8 px-2 lg:mx-10 text-justify font-normal text-xl text-muted-foreground">
            Shoe Store is a dream footwear store for all the shoe lovers. We
            have a wide range of shoes for all the occasions. Fluffy sneakers.
            Cushy slippers. Nights out. Days in. Quick errands. Transcontinental
            trips. Durable. Comfortable. Planet-friendly. Home or away, we’ve
            got what you needs to chill the most.
          </p>
          <div className="flex gap-2 items-center justify-around py-2">
            <Button size="lg" onClick={ShoeForMen}>
              Men Shoes
            </Button>
            <Button size="lg" onClick={ShoeForWomen}>
              Women Shoes
            </Button>
            <Button
              size="lg"
              className="hidden sm:inline-flex"
              onClick={ShoeForKids}
            >
              Kids Shoes
            </Button>
          </div>
        </div>
        <div className="basis-1/3 flex-1">
          <div
            style={{
              backgroundImage:
                "linear-gradient(360deg, #fb7185 0%, #fff1f2 75%)",
            }}
            className="m-auto bg-white rounded-full w-84 h-84 relative overflow-hidden md:h-104 md:w-104 lg:h-120 lg:w-120"
          >
            <img
              className="cursor-pointer scale-90 hover:scale-95 transition-transform duration-300 ease-in-out"
              width={620}
              src={Image}
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
