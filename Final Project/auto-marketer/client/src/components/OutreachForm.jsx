"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createOutreach,
  suggestSubreddits,
  clearSuggestedSubreddits,
} from "../redux/slices/outreachSlice";
import { motion } from "framer-motion";

const OutreachForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const { loading, success, suggestedSubreddits, suggestingSubreddits } =
    useSelector((state) => state.outreaches);

  const [formData, setFormData] = useState({
    subreddits: [],
    productId: "",
    dateRange: {
      startDate: "",
      endDate: "",
    },
    maxPosts: 50,
    replyType: "auto_reply_once", // Default to auto reply once
    replyTemplate: "Thanks for your post! Our product might help with that.", // For manual reply
  });

  const [subredditInput, setSubredditInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (success) {
      navigate("/outreaches");
    }
  }, [success, navigate]);

  // Effect to add suggested subreddits to the form data
  useEffect(() => {
    if (suggestedSubreddits.length > 0) {
      // Filter out subreddits that are already in the list
      const newSubreddits = suggestedSubreddits.filter(
        (subreddit) => !formData.subreddits.includes(subreddit)
      );

      if (newSubreddits.length > 0) {
        setFormData((prev) => ({
          ...prev,
          subreddits: [...prev.subreddits, ...newSubreddits],
        }));

        // Clear subreddits error if it exists
        if (errors.subreddits) {
          setErrors((prev) => ({
            ...prev,
            subreddits: undefined,
          }));
        }
      }
    }
  }, [suggestedSubreddits, formData.subreddits, errors.subreddits]);

  // Clean up suggested subreddits when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearSuggestedSubreddits());
    };
  }, [dispatch]);

  const validateForm = () => {
    const newErrors = {};

    if (formData.subreddits.length === 0) {
      newErrors.subreddits = "At least one subreddit is required";
    }

    if (!formData.productId) {
      newErrors.productId = "Please select a product";
    }

    if (!formData.dateRange.startDate) {
      newErrors["dateRange.startDate"] = "Start date is required";
    }

    if (!formData.dateRange.endDate) {
      newErrors["dateRange.endDate"] = "End date is required";
    }

    if (formData.dateRange.startDate && formData.dateRange.endDate) {
      const start = new Date(formData.dateRange.startDate);
      const end = new Date(formData.dateRange.endDate);
      if (start > end) {
        newErrors["dateRange.endDate"] = "End date must be after start date";
      }
    }

    if (!formData.maxPosts || formData.maxPosts <= 0) {
      newErrors.maxPosts = "Maximum posts must be a positive number";
    }

    if (
      formData.replyType === "manual_reply_once" &&
      !formData.replyTemplate.trim()
    ) {
      newErrors.replyTemplate = "Reply message is required for manual reply";
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

  const handleSuggestSubreddits = () => {
    if (formData.productId) {
      dispatch(suggestSubreddits(formData.productId));
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [name]: value,
      },
    }));

    // Clear error for this field when user types
    if (errors[`dateRange.${name}`]) {
      setErrors((prev) => ({
        ...prev,
        [`dateRange.${name}`]: undefined,
      }));
    }
  };

  const handleSubredditInputChange = (e) => {
    setSubredditInput(e.target.value);
  };

  const handleSubredditKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSubreddit();
    }
  };

  const addSubreddit = () => {
    const subreddit = subredditInput.trim();
    if (subreddit && !formData.subreddits.includes(subreddit)) {
      // Format subreddit to ensure it starts with r/
      const formattedSubreddit = subreddit.startsWith("r/")
        ? subreddit.replace("r/", "")
        : subreddit;
      setFormData((prev) => ({
        ...prev,
        subreddits: [...prev.subreddits, formattedSubreddit],
      }));
      setSubredditInput("");

      // Clear subreddits error if it exists
      if (errors.subreddits) {
        setErrors((prev) => ({
          ...prev,
          subreddits: undefined,
        }));
      }
    }
  };

  const removeSubreddit = (index) => {
    setFormData((prev) => ({
      ...prev,
      subreddits: prev.subreddits.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Find the selected product to include its name
    const selectedProduct = products.find(
      (p) => p.id.toString() === formData.productId.toString()
    );

    const outreachData = {
      ...formData,
      productName: selectedProduct ? selectedProduct.name : "Unknown Product",
    };

    dispatch(createOutreach(outreachData));
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
        {/* Product Selection */}
        <div className="sm:col-span-4">
          <label
            htmlFor="productId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product
          </label>
          <div>
            <select
              id="productId"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors.productId ? "border-red-300" : ""
              }`}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="mt-2 text-sm text-red-600">{errors.productId}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Select the product you want to promote in these subreddits.
          </p>
        </div>

        {/* Subreddits Input */}
        <div className="sm:col-span-6">
          <label
            htmlFor="subreddit-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Subreddits
          </label>
          <div>
            <div className="flex">
              <input
                type="text"
                id="subreddit-input"
                value={subredditInput}
                onChange={handleSubredditInputChange}
                onKeyDown={handleSubredditKeyDown}
                placeholder="Enter subreddit and press Enter (e.g., r/marketing)"
                className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                  errors.subreddits ? "border-red-300" : ""
                }`}
              />
              <button
                type="button"
                onClick={addSubreddit}
                className="ml-3 inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
              >
                Add
              </button>
              {formData.productId && (
                <button
                  type="button"
                  onClick={handleSuggestSubreddits}
                  disabled={suggestingSubreddits || !formData.productId}
                  className="ml-3 inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0079D3] hover:bg-[#006bb9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0079D3] disabled:opacity-50"
                >
                  {suggestingSubreddits ? (
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
                      Suggesting...
                    </span>
                  ) : (
                    "Suggest Subreddits"
                  )}
                </button>
              )}
            </div>
            {errors.subreddits && (
              <p className="mt-2 text-sm text-red-600">{errors.subreddits}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Enter subreddits you want to target (e.g., r/marketing).
          </p>

          {/* Subreddit Tags */}
          {formData.subreddits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.subreddits.map((subreddit, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {`r/${subreddit}`}
                  <button
                    type="button"
                    onClick={() => removeSubreddit(index)}
                    className="ml-2 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="sm:col-span-3">
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <div>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.dateRange.startDate}
              onChange={handleDateRangeChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors["dateRange.startDate"] ? "border-red-300" : ""
              }`}
            />
            {errors["dateRange.startDate"] && (
              <p className="mt-2 text-sm text-red-600">
                {errors["dateRange.startDate"]}
              </p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Target posts from this date.
          </p>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date
          </label>
          <div>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.dateRange.endDate}
              onChange={handleDateRangeChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors["dateRange.endDate"] ? "border-red-300" : ""
              }`}
            />
            {errors["dateRange.endDate"] && (
              <p className="mt-2 text-sm text-red-600">
                {errors["dateRange.endDate"]}
              </p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Target posts until this date.
          </p>
        </div>

        {/* Max Posts */}
        <div className="sm:col-span-2">
          <label
            htmlFor="maxPosts"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Maximum Posts
          </label>
          <div>
            <input
              type="number"
              id="maxPosts"
              name="maxPosts"
              min="1"
              value={formData.maxPosts}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                errors.maxPosts ? "border-red-300" : ""
              }`}
            />
            {errors.maxPosts && (
              <p className="mt-2 text-sm text-red-600">{errors.maxPosts}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Maximum number of posts to process.
          </p>
        </div>

        {/* Reply Type */}
        {/* <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Reply Type
          </label>
          <div className="space-y-5">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="auto_reply_once"
                  name="replyType"
                  type="radio"
                  value="auto_reply_once"
                  checked={formData.replyType === "auto_reply_once"}
                  onChange={handleChange}
                  className="focus:ring-[#FF4500] h-4 w-4 text-[#FF4500] border-gray-300"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="auto_reply_once"
                  className="font-medium text-gray-700"
                >
                  Auto Reply Once
                </label>
                <p className="text-gray-500">
                  The bot will reply once using a predefined template message.
                </p>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="manual_reply_once"
                  name="replyType"
                  type="radio"
                  value="manual_reply_once"
                  checked={formData.replyType === "manual_reply_once"}
                  onChange={handleChange}
                  className="focus:ring-[#FF4500] h-4 w-4 text-[#FF4500] border-gray-300"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="manual_reply_once"
                  className="font-medium text-gray-700"
                >
                  Manual Reply Once
                </label>
                <p className="text-gray-500">
                  You will provide a custom message to reply once.
                </p>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="auto_reply_complete"
                  name="replyType"
                  type="radio"
                  value="auto_reply_complete"
                  checked={formData.replyType === "auto_reply_complete"}
                  onChange={handleChange}
                  className="focus:ring-[#FF4500] h-4 w-4 text-[#FF4500] border-gray-300"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="auto_reply_complete"
                  className="font-medium text-gray-700"
                >
                  Auto Reply Complete
                </label>
                <p className="text-gray-500">
                  The bot will continuously reply to the potential client.
                </p>
              </div>
            </div>
          </div>
        </div> */}

        {/* Manual Reply Message */}
        {/* {formData.replyType === "manual_reply_once" && (
          <div className="sm:col-span-6">
            <label
              htmlFor="replyTemplate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reply Message
            </label>
            <div>
              <textarea
                id="replyTemplate"
                name="replyTemplate"
                rows={4}
                value={formData.replyTemplate}
                onChange={handleChange}
                placeholder="Enter your custom reply message here..."
                className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md p-2.5 ${
                  errors.replyTemplate ? "border-red-300" : ""
                }`}
              />
              {errors.replyTemplate && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.replyTemplate}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This message will be sent as a reply to posts matching your
              criteria.
            </p>
          </div>
        )} */}
      </div>

      <div className="pt-5 border-t border-gray-200">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/outreaches")}
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
                Creating...
              </span>
            ) : (
              "Create Outreach"
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

export default OutreachForm;
