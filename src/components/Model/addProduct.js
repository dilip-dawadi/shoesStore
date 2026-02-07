import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { useCreateProduct } from "../../hooks/useProducts";
import { NotifySuccess, NotifyWarning } from "../../toastify";
import { GiRunningShoe } from "react-icons/gi";
import Category from "./productFunctions/category";
import ShoeForOption from "./productFunctions/shoeForOption";

export default function AddProduct() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { mutate: createProduct, isPending } = useCreateProduct();

  const [AddProductData, setAddProductData] = React.useState({
    title: "",
    description: "",
    price: "",
    category: ["Men", "Women", "Kids"],
    shoeFor: ["Lounging", "Everyday", "Running"],
    quantity: "",
    images: [], // Changed from selectedFile to images for S3
    brand: "",
  });

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!AddProductData.title || !AddProductData.price) {
      return NotifyWarning("Please fill all required fields");
    }

    createProduct(AddProductData, {
      onSuccess: () => {
        NotifySuccess("Product created successfully!");
        closeModal();
        setAddProductData({
          title: "",
          description: "",
          price: "",
          category: ["Men", "Women", "Kids"],
          shoeFor: ["Lounging", "Everyday", "Running"],
          quantity: "",
          images: [],
          brand: "",
        });
      },
      onError: (error) => {
        NotifyWarning(
          error.response?.data?.message || "Failed to create product",
        );
      },
    });
  };

  const handleChange = (e) => {
    setAddProductData({ ...AddProductData, [e.target.name]: e.target.value });
  };

  const size = window.innerWidth > 768 ? "md" : "sm";
  return (
    <>
      <button
        className={`bg-primary hover:bg-primary-900 ${size === "md" && "fixed right-0 bottom-12 mr-7 mb-8"} z-50 rounded-full p-2 text-white text-2xl cursor-pointer hover:scale-110 tansition-transform duration-300 ease-in-out`}
        onClick={openModal}
      >
        <p className="absolute text-white text-sm font-bold -mt-1 ml-4">+</p>
        <GiRunningShoe className="text-2xl" title="Add Product" />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="mb-0 md:space-y-4 space-y-2">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium -m-2 text-gray-900 text-center"
                    >
                      Add New Shoes
                    </Dialog.Title>
                    <div>
                      <label htmlFor="title">Title</label>
                      <div className="mt-1">
                        <input
                          onChange={handleChange}
                          id="title"
                          name="title"
                          type="text"
                          autoComplete="title"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="brand">Brand Name</label>
                      <div className="mt-1">
                        <input
                          onChange={handleChange}
                          id="brand"
                          name="brand"
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="w-full">
                      <label htmlFor="description">Description</label>
                      <div className="mt-1">
                        <textarea
                          onChange={handleChange}
                          id="description"
                          name="description"
                          type="text"
                          rows={1}
                        />
                      </div>
                    </div>
                    <div className="w-full">
                      <UploadImage
                        AddProductData={AddProductData}
                        setAddProductData={setAddProductData}
                      />
                    </div>
                    <div className="w-full">
                      <label htmlFor="category">Category</label>
                      <div className="mt-1">
                        <Category
                          category={AddProductData.category}
                          setCategory={setAddProductData}
                          AddProductData={AddProductData}
                        />
                      </div>
                    </div>
                    <div className="w-full">
                      <label htmlFor="category">Shoe For</label>
                      <div className="mt-1">
                        <ShoeForOption
                          shoeFor={AddProductData.shoeFor}
                          setShoeFor={setAddProductData}
                          AddProductData={AddProductData}
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 md:inline-block md:mr-1">
                      <label htmlFor="quantity">Quantity</label>
                      <div className="mt-1">
                        <input
                          onChange={handleChange}
                          name="quantity"
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-[48%] md:inline-block">
                      <label htmlFor="price">Price</label>
                      <div className="mt-1">
                        <div className="flex">
                          <span className="inline-flex items-center px-3 text-sm rounded-l-md border border-r-0 dark:bg-[#fff] dark:text-black dark:border-[#edd5da]">
                            Rs.
                          </span>
                          <input
                            type="text"
                            onChange={handleChange}
                            pattern="[0-9]*"
                            name="price"
                            className="rounded-none rounded-r-lg bg-gray-50 border text-gray-900 focus:border-primary
                                                        focus:border-l-0 block flex-1 min-w-0 w-full text-sm border-[#edd5da] p-2.5 dark:bg-white dark:text-black dark:border-[#edd5da]"
                            placeholder="price"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="submit"
                      onClick={(e) => handleSubmit(e)}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700"
                    >
                      Add Product
                    </button>
                    <p
                      className="text-center text-sm text-gray-500
                                        first-letter:capitalize"
                    >
                      click on the overlay to close the popup window
                    </p>
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
