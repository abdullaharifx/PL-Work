"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOutreachById,
  fetchOutreachAnalytics,
  updateOutreach,
  clearOutreachSuccess,
  clearSuggestedSubreddits,
  suggestSubreddits,
} from "../redux/slices/outreachSlice";
import { fetchProducts } from "../redux/slices/productSlice";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const OutreachDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    currentOutreach,
    analytics,
    loading,
    error,
    success,
    suggestedSubreddits,
    suggestingSubreddits,
  } = useSelector((state) => state.outreaches);
  const { products } = useSelector((state) => state.products);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditMode, setIsEditMode] = useState(false);
  const [subredditInput, setSubredditInput] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Form state for editing
  const [formData, setFormData] = useState({
    subreddits: [],
    productId: "",
    dateRange: {
      startDate: "",
      endDate: "",
    },
    maxPosts: 50,
    replyType: "auto_reply_once",
    replyTemplate: "",
  });

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
        if (formErrors.subreddits) {
          setErrors((prev) => ({
            ...prev,
            subreddits: undefined,
          }));
        }
      }
    }
  }, [suggestedSubreddits, formData.subreddits, formErrors.subreddits]);

  // Clean up suggested subreddits when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearSuggestedSubreddits());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchOutreachById(id));
    dispatch(fetchOutreachAnalytics(id));
    dispatch(fetchProducts());
  }, [dispatch, id]);

  // Initialize form data when outreach data is loaded
  useEffect(() => {
    if (currentOutreach) {
      console.log(currentOutreach);
      setFormData({
        subreddits: currentOutreach.subreddits || [],
        productId: currentOutreach.product.id || "",
        dateRange: {
          startDate: currentOutreach.startDate || "",
          endDate: currentOutreach.endDate || "",
        },
        maxPosts: currentOutreach.maxPosts || 60,
        replyType: currentOutreach.replyType || "auto_reply_once",
        replyTemplate: currentOutreach.replyTemplate || "",
      });
    }
  }, [currentOutreach]);

  // Handle success after update
  useEffect(() => {
    if (success && isEditMode) {
      setIsEditMode(false);
      // Refresh data
      dispatch(fetchOutreachById(id));
      dispatch(clearOutreachSuccess());
    }
  }, [success, isEditMode, dispatch, id]);

  const handleSuggestSubreddits = () => {
    if (formData.productId) {
      dispatch(suggestSubreddits(formData.productId));
    }
  };

  const handleBack = () => {
    navigate("/outreaches");
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
    // Reset form errors when toggling edit mode
    setFormErrors({});
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (formData.subreddits.length === 0) {
      errors.subreddits = "At least one subreddit is required";
    }

    if (!formData.productId) {
      errors.productId = "Please select a product";
    }

    if (!formData.dateRange.startDate) {
      errors["dateRange.startDate"] = "Start date is required";
    }

    if (!formData.dateRange.endDate) {
      errors["dateRange.endDate"] = "End date is required";
    }

    if (formData.dateRange.startDate && formData.dateRange.endDate) {
      const start = new Date(formData.dateRange.startDate);
      const end = new Date(formData.dateRange.endDate);
      if (start > end) {
        errors["dateRange.endDate"] = "End date must be after start date";
      }
    }

    if (!formData.maxPosts || formData.maxPosts <= 0) {
      errors.maxPosts = "Maximum posts must be a positive number";
    }

    if (
      formData.replyType === "manual_reply_once" &&
      !formData.replyTemplate.trim()
    ) {
      errors.replyTemplate = "Reply message is required for manual reply";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
      id: currentOutreach.id,
      ...formData,
      productId: formData.productId,
      productName: selectedProduct ? selectedProduct.name : "Unknown Product",
      status: currentOutreach.status,
      createdAt: currentOutreach.createdAt,
    };

    dispatch(updateOutreach(outreachData));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
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

    // Clear error for this field
    if (formErrors[`dateRange.${name}`]) {
      setFormErrors((prev) => ({
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
        : `${subreddit}`;
      setFormData((prev) => ({
        ...prev,
        subreddits: [...prev.subreddits, formattedSubreddit],
      }));
      setSubredditInput("");

      // Clear subreddits error if it exists
      if (formErrors.subreddits) {
        setFormErrors((prev) => ({
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get product name
  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : "Unknown Product";
  };

  const getReplyTypeText = (replyType) => {
    switch (replyType) {
      case "auto_reply_once":
        return "Auto Reply Once";
      case "manual_reply_once":
        return "Manual Reply Once";
      case "auto_reply_complete":
        return "Auto Reply Complete";
      default:
        return "Unknown";
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Colors for charts
  const COLORS = ["#FF4500", "#0079D3", "#FF9D00", "#FFB000", "#00A6B3"];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center h-64">
        <svg
          className="animate-spin h-10 w-10 text-[#FF4500]"
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentOutreach) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Outreach not found
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Go back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate pb-2">
                {isEditMode
                  ? "Edit Outreach Campaign"
                  : "Outreach Campaign Details"}
              </h2>
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              {/* <div className="mt-2 flex items-center text-sm text-gray-500">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    currentOutreach.status
                  )}`}
                >
                  {currentOutreach.status.charAt(0).toUpperCase() +
                    currentOutreach.status.slice(1)}
                </span>
              </div> */}
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg
                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Created on {formatDate(currentOutreach.createdAt)}
              </div>
            </div>
          </div>
          {!isEditMode && (
            <div className="mt-4 flex md:mt-0">
              <button
                onClick={toggleEditMode}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Campaign
              </button>
            </div>
          )}
        </div>

        {/* Tabs - Only show when not in edit mode */}
        {!isEditMode && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${
                  activeTab === "overview"
                    ? "border-[#FF4500] text-[#FF4500]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`${
                  activeTab === "analytics"
                    ? "border-[#FF4500] text-[#FF4500]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("subreddits")}
                className={`${
                  activeTab === "subreddits"
                    ? "border-[#FF4500] text-[#FF4500]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Subreddits
              </button>
            </nav>
          </div>
        )}

        {/* Content based on active tab or edit mode */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isEditMode ? (
            /* Edit Form */
            <form
              onSubmit={handleSubmit}
              className="px-4 py-5 sm:p-6 space-y-6"
            >
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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
                        formErrors.productId ? "border-red-300" : ""
                      }`}
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.productId && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.productId}
                      </p>
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
                          formErrors.subreddits ? "border-red-300" : ""
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
                    {formErrors.subreddits && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.subreddits}
                      </p>
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
                          {subreddit}
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
                        formErrors["dateRange.startDate"]
                          ? "border-red-300"
                          : ""
                      }`}
                    />
                    {formErrors["dateRange.startDate"] && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors["dateRange.startDate"]}
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
                        formErrors["dateRange.endDate"] ? "border-red-300" : ""
                      }`}
                    />
                    {formErrors["dateRange.endDate"] && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors["dateRange.endDate"]}
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
                        formErrors.maxPosts ? "border-red-300" : ""
                      }`}
                    />
                    {formErrors.maxPosts && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.maxPosts}
                      </p>
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
                          The bot will reply once using a predefined template
                          message.
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
                          The bot will continuously reply to the potential
                          client.
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
                          formErrors.replyTemplate ? "border-red-300" : ""
                        }`}
                      />
                      {formErrors.replyTemplate && (
                        <p className="mt-2 text-sm text-red-600">
                          {formErrors.replyTemplate}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      This message will be sent as a reply to posts matching
                      your criteria.
                    </p>
                  </div>
                )} */}
              </div>

              <div className="pt-5 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={toggleEditMode}
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
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : activeTab === "overview" ? (
            <div>
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Outreach Campaign Information
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Details about this outreach campaign.
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Product
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {currentOutreach.product.name}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Subreddits
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex flex-wrap gap-2">
                        {currentOutreach.subreddits.map((subreddit, index) => (
                          <a
                            key={index}
                            href={`https://reddit.com/${subreddit}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {subreddit}
                          </a>
                        ))}
                      </div>
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Date Range
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {currentOutreach?.startDate} to {currentOutreach?.endDate}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Maximum Posts
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {currentOutreach.maxPosts}
                    </dd>
                  </div>
                  {/* <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Reply Type
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {getReplyTypeText(currentOutreach.replyType)}
                    </dd>
                  </div>
                  {currentOutreach.replyType === "manual_reply_once" &&
                    currentOutreach.replyTemplate && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Reply Message
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="bg-gray-50 p-3 rounded-md">
                            {currentOutreach.replyTemplate}
                          </div>
                        </dd>
                      </div>
                    )} */}
                </dl>
              </div>

              {/* Quick Stats */}
              {analytics && (
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Posts Found
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {analytics.totalPosts}
                        </dd>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Replies
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {analytics.totalReplies}
                        </dd>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Response Rate
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {analytics.responseRate}%
                        </dd>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Conversion Rate
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {analytics.conversionRate}%
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex justify-end space-x-3">
                  <Link
                    to="/chat"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0079D3] hover:bg-[#006bb9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0079D3]"
                  >
                    View Conversations
                  </Link>
                </div>
              </div>
            </div>
          ) : activeTab === "analytics" && analytics ? (
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Performance Analytics
              </h3>

              {/* Engagement Over Time Chart */}
              <div className="mb-8">
                <h4 className="text-base font-medium text-gray-700 mb-4">
                  Engagement Over Time
                </h4>
                <div className="bg-white p-4 rounded-lg shadow">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={analytics.dailyEngagement}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#0079D3"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="replies"
                        stroke="#FF4500"
                      />
                      <Line type="monotone" dataKey="clicks" stroke="#FFB000" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement Distribution Chart */}
              <div className="mb-8">
                <h4 className="text-base font-medium text-gray-700 mb-4">
                  Engagement Distribution
                </h4>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.engagementDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {analytics.engagementDistribution.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <div className="grid grid-cols-1 gap-4">
                        {analytics.engagementDistribution.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-2"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              ></div>
                              <span className="text-sm font-medium text-gray-700">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {item.value} users
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="mb-8">
                <h4 className="text-base font-medium text-gray-700 mb-4">
                  Conversion Funnel
                </h4>
                <div className="bg-white p-4 rounded-lg shadow">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={analytics.conversionFunnel}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#FF4500" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Metrics Table */}
              <div>
                <h4 className="text-base font-medium text-gray-700 mb-4">
                  Key Metrics
                </h4>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Metric
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Value
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.keyMetrics.map((metric, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {metric.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metric.value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                metric.change > 0
                                  ? "bg-green-100 text-green-800"
                                  : metric.change < 0
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {metric.change > 0 ? "+" : ""}
                              {metric.change}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === "subreddits" && analytics ? (
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Subreddit Performance
              </h3>

              {/* Subreddit Comparison Chart */}
              <div className="mb-8">
                <h4 className="text-base font-medium text-gray-700 mb-4">
                  Subreddit Engagement Comparison
                </h4>
                <div className="bg-white p-4 rounded-lg shadow">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={analytics.subredditPerformance}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#0079D3" />
                      <Bar dataKey="replies" fill="#FF4500" />
                      <Bar dataKey="conversions" fill="#FFB000" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subreddit Details Table */}
              <div>
                <h4 className="text-base font-medium text-gray-700 mb-4">
                  Subreddit Details
                </h4>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Subreddit
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Posts
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Replies
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Response Rate
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Conversion Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.subredditDetails.map((subreddit, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <a
                              href={`https://reddit.com/${subreddit.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0079D3] hover:underline"
                            >
                              {subreddit.name}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subreddit.posts}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subreddit.replies}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subreddit.responseRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subreddit.conversionRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OutreachDetailPage;
