import { BsEyeFill } from "react-icons/bs";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useProducts } from "../hooks/useProducts";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Carousel = () => {
  const { data, isLoading } = useProducts({ limit: 10, sort: "-sales" });
  const topShoeData = data?.products || [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnInteraction: false })],
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (isLoading) return <div></div>;
  return (
    <div className="container mx-auto">
      <div className="relative">
        <div className="absolute w-[40px] h-[1px] bg-[#f53737] top-[-16px] left-1/2 transform -translate-x-1/2 ml-[-10px]"></div>
        <div className="text-center text-[1.75rem] font-bold text-black mb-2">
          Top Sales
        </div>
        <div className="text-center text-gray-700 mb-7 mx-auto text-md font-light max-w-2xl italic">
          Add our products to weekly lineup
        </div>
        <div className="absolute w-[40px] h-[1px] bg-[#f53737] top-[-24px] left-1/2 transform -translate-x-1/2 z-[1000]"></div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {topShoeData?.map((item, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_25%] pb-10"
              >
                <div className="shadow-xl px-3 pt-3 pb-2 rounded-lg rounded-tl-[90px] w-full max-w-[352px] mx-auto cursor-pointer hover:shadow-xl transition relative">
                  <center>
                    <img
                      className="mb-3 rounded-tl-[90px] min-w-[240px] max-w-[240px] min-h-[240px] max-h-[240px] object-cover"
                      src={item?.selectedFile[0]}
                      alt={item?.title}
                    />
                  </center>
                  <div className="w-full h-full flex justify-center items-center rounded-lg rounded-tl-[90px] opacity-0 hover:opacity-100 transition duration-500 absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 ease-in-out hover:bg-[#00000003]">
                    <Link to={`/product/${item?._id}`}>
                      <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-900 transition duration-300">
                        <BsEyeFill className="text-xl" />
                      </button>
                    </Link>
                  </div>
                  <div className="mb-2 flex text-sm justify-between px-2 align-center">
                    {item?.shoeFor
                      ?.map((shoeF, idx) => {
                        const IndexStyle =
                          idx === 0 ? "bg-yellow-400" : "bg-primary";
                        return (
                          <span
                            className={`capitalize ${IndexStyle} rounded-lg text-white px-4 py-[0.35rem] tracking-[.04em]`}
                            key={idx}
                          >
                            {shoeF}
                          </span>
                        );
                      })
                      .splice(0, 2)}
                  </div>
                  <div className="flex justify-between mb-0 bg-gray-200 px-4 py-[0.7rem] rounded-lg text-black font-medium">
                    <div className="max-w-[120px]">
                      {item?.title.split(" ").slice(0, 6).join(" ")}
                    </div>
                    <div className="text-black">Rs. {item?.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          className="embla__button absolute top-1/2 -translate-y-1/2 -left-4 z-10"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
        >
          <FiChevronLeft size={18} />
        </button>
        <button
          className="embla__button absolute top-1/2 -translate-y-1/2 -right-4 z-10"
          onClick={scrollNext}
          disabled={!canScrollNext}
        >
          <FiChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Carousel;
