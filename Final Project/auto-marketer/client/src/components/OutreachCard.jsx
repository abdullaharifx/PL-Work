"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const OutreachCard = ({ outreach, onDelete, onRun }) => {
  // Function to determine status badge color
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

  // Function to get reply type display text
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

  return (
    <motion.div
      className="bg-white overflow-hidden shadow rounded-lg flex flex-col justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {outreach.subreddits && outreach.subreddits.length > 0
              ? `r/${outreach.subreddits[0]}`
              : "No subreddit specified"}
          </h3>
          {/* <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              outreach.status
            )}`}
          >
            {outreach.status.charAt(0).toUpperCase() + outreach.status.slice(1)}
          </span> */}
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-500">
            Product: {outreach.product.name}
          </p>

          {outreach.subreddits && outreach.subreddits.length > 1 && (
            <p className="text-sm text-gray-500">
              Targeting {outreach.subreddits.length} subreddits
            </p>
          )}

          <p className="text-sm text-gray-500">
            Date range: {outreach.startDate} to {outreach.endDate}
          </p>

          {outreach.maxPosts && (
            <p className="text-sm text-gray-500">
              Max posts: {outreach.maxPosts}
            </p>
          )}

          <p className="text-sm text-gray-500">
            Reply type: {getReplyTypeText(outreach.replyType)}
          </p>

          <p className="text-sm text-gray-500">Created: {outreach.createdAt}</p>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between">
        <div className="flex space-x-2">
          {outreach.subreddits && outreach.subreddits.length > 0 && (
            <a
              href={`https://reddit.com/${outreach.subreddits[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-[#0079D3] hover:bg-[#006bb9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0079D3]"
            >
              Visit Subreddit
            </a>
          )}
          <Link
            to={`/outreaches/${outreach.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
          >
            View Details
          </Link>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRun(outreach);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Run
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(outreach);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OutreachCard;
