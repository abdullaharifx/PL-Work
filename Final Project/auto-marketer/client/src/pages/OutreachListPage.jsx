"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchOutreaches,
  deleteOutreach,
  clearOutreachError,
  clearOutreachSuccess,
  resetOutreachRunSuccess,
} from "../redux/slices/outreachSlice";
import { motion, AnimatePresence } from "framer-motion";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import RunOutreachModal from "../components/RunOutreachModal";
import OutreachCard from "../components/OutreachCard";

const OutreachListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { outreaches, loading, error, success, outreachRunSuccess } =
    useSelector((state) => state.outreaches);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [outreachToDelete, setOutreachToDelete] = useState(null);
  const [outreachToRun, setOutreachToRun] = useState(null);

  useEffect(() => {
    dispatch(fetchOutreaches());

    // Clear any previous errors or success messages
    return () => {
      dispatch(clearOutreachError());
      dispatch(clearOutreachSuccess());
    };
  }, [dispatch]);

  useEffect(() => {
    if (outreachRunSuccess && outreachToRun) {
      navigate(`/outreaches/${outreachToRun.id}/run`);
      dispatch(resetOutreachRunSuccess());
    }
  }, [outreachRunSuccess, outreachToRun, navigate, dispatch]);

  const handleDeleteClick = (outreach) => {
    setOutreachToDelete(outreach);
    setIsDeleteModalOpen(true);
  };

  const handleRunClick = (outreach) => {
    setOutreachToRun(outreach);
    setIsRunModalOpen(true);
  };

  const confirmDelete = () => {
    if (outreachToDelete) {
      dispatch(deleteOutreach(outreachToDelete.id));
      setIsDeleteModalOpen(false);
      setOutreachToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setOutreachToDelete(null);
  };

  const confirmRun = (outreachId) => {
    setIsRunModalOpen(false);
    setOutreachToRun(null);
    navigate(`/outreaches/${outreachId}/run`);
  };

  const cancelRun = () => {
    setIsRunModalOpen(false);
    setOutreachToRun(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Your Outreach Campaigns
        </h1>
        <Link
          to="/outreaches/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
        >
          Create New Outreach
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Operation completed successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
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
      ) : outreaches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No outreach campaigns
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new outreach campaign.
          </p>
          <div className="mt-6">
            <Link
              to="/outreaches/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Outreach
            </Link>
          </div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {outreaches.map((outreach) => (
              <OutreachCard
                key={outreach.id}
                outreach={outreach}
                onDelete={() => handleDeleteClick(outreach)}
                onRun={() => handleRunClick(outreach)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Outreach Campaign"
        message={`Are you sure you want to delete the outreach campaign for "${outreachToDelete?.subreddits}"? This action cannot be undone.`}
      />

      <RunOutreachModal
        isOpen={isRunModalOpen}
        onClose={cancelRun}
        onConfirm={confirmRun}
        outreach={outreachToRun}
      />
    </div>
  );
};

export default OutreachListPage;
