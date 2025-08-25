"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createProduct, updateProduct } from "../redux/slices/productSlice";
import { motion } from "framer-motion";

const ProductForm = ({ product, isNew }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, success } = useSelector((state) => state.products);

  // Update the initial form state to include the new fields and remove image
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    keywords: "",
    domain: "",
    location: {
      city: "",
      country: "",
    },
  });

  const [errors, setErrors] = useState({});

  // Update the useEffect to handle the new fields when editing an existing product
  useEffect(() => {
    if (product && !isNew) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price ? product.price.toString() : "",
        keywords: product.keywords || "",
        domain: product.domain || "",
        location: product.location || { city: "", country: "" },
      });
    }
  }, [product, isNew]);

  useEffect(() => {
    if (success) {
      navigate("/products");
    }
  }, [success, navigate]);

  // Update the validateForm function to validate the new fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Product description is required";
    }

    if (formData.price && isNaN(Number.parseFloat(formData.price))) {
      newErrors.price = "Price must be a valid number";
    }

    if (!formData.keywords.trim()) {
      newErrors.keywords = "keywordss are required";
    }

    if (!formData.domain.trim()) {
      newErrors.domain = "Domain is required";
    }

    if (!formData.location.city.trim()) {
      newErrors["location.city"] = "City is required";
    }

    if (!formData.location.country.trim()) {
      newErrors["location.country"] = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Add a function to handle nested location changes
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value,
      },
    }));

    // Clear error for this field when user types
    if (errors[`location.${name}`]) {
      setErrors((prev) => ({
        ...prev,
        [`location.${name}`]: undefined,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const productData = {
      ...formData,
      price: formData.price ? Number.parseFloat(formData.price) : 0,
    };

    if (!isNew) {
      dispatch(updateProduct({ id: product.id, ...productData }));
    } else {
      dispatch(createProduct(productData));
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white shadow px-6 py-6 sm:rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
        {/* Product Name */}
        <div className="sm:col-span-4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Name
          </label>
          <div>
            <input
              placeholder="Enter product name"
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors.name ? "border-red-300" : ""
              }`}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="sm:col-span-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <div>
            <textarea
              placeholder="Enter description"
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors.description ? "border-red-300" : ""
              }`}
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Write a few sentences about your product.
          </p>
        </div>

        {/* keywordss */}
        <div className="sm:col-span-4">
          <label
            htmlFor="keywords"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            keywordss
          </label>
          <div>
            <input
              type="text"
              name="keywords"
              id="keywords"
              value={formData.keywords}
              onChange={handleChange}
              placeholder="marketing, sales, technology"
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors.keywords ? "border-red-300" : ""
              }`}
            />
            {errors.keywords && (
              <p className="mt-2 text-sm text-red-600">{errors.keywords}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Enter keywordss separated by commas.
          </p>
        </div>

        {/* Domain */}
        <div className="sm:col-span-4">
          <label
            htmlFor="domain"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Domain
          </label>
          <div>
            <input
              type="text"
              name="domain"
              id="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="ecommerce, saas, healthcare"
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors.domain ? "border-red-300" : ""
              }`}
            />
            {errors.domain && (
              <p className="mt-2 text-sm text-red-600">{errors.domain}</p>
            )}
          </div>
        </div>

        {/* Location - City */}
        <div className="sm:col-span-3">
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            City
          </label>
          <div>
            <select
              id="city"
              name="city"
              value={formData.location.city}
              onChange={handleLocationChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors["location.city"] ? "border-red-300" : ""
              }`}
            >
              <option value="">Select a city</option>
              <option value="New York">New York</option>
              <option value="San Francisco">San Francisco</option>
              <option value="London">London</option>
              <option value="Paris">Paris</option>
              <option value="Tokyo">Tokyo</option>
              <option value="Sydney">Sydney</option>
              <option value="Berlin">Berlin</option>
              <option value="Toronto">Toronto</option>
            </select>
            {errors["location.city"] && (
              <p className="mt-2 text-sm text-red-600">
                {errors["location.city"]}
              </p>
            )}
          </div>
        </div>

        {/* Location - Country */}
        <div className="sm:col-span-3">
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Country
          </label>
          <div>
            <select
              id="country"
              name="country"
              value={formData.location.country}
              onChange={handleLocationChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors["location.country"] ? "border-red-300" : ""
              }`}
            >
              <option value="">Select a country</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Japan">Japan</option>
              <option value="China">China</option>
              <option value="India">India</option>
            </select>
            {errors["location.country"] && (
              <p className="mt-2 text-sm text-red-600">
                {errors["location.country"]}
              </p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="sm:col-span-2">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="text"
              name="price"
              id="price"
              value={formData.price}
              onChange={handleChange}
              className={`focus:ring-[#FF4500] focus:border-[#FF4500] block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors.price ? "border-red-300" : ""
              }`}
              placeholder="0.00"
              aria-describedby="price-currency"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm" id="price-currency">
                USD
              </span>
            </div>
          </div>
          {errors.price && (
            <p className="mt-2 text-sm text-red-600">{errors.price}</p>
          )}
        </div>
      </div>

      <div className="pt-5 border-t border-gray-200">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

export default ProductForm;
