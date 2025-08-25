import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearOutreachError,
  clearOutreachSuccess,
} from "../redux/slices/outreachSlice";
import { fetchProducts } from "../redux/slices/productSlice";
import { motion } from "framer-motion";
import OutreachForm from "../components/OutreachForm";

const OutreachCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: productsLoading, error: productsError } = useSelector(
    (state) => state.products
  );
  const { error: outreachError } = useSelector((state) => state.outreaches);

  useEffect(() => {
    // Fetch products for the dropdown
    dispatch(fetchProducts());

    // Clear any previous errors or success messages
    dispatch(clearOutreachError());
    dispatch(clearOutreachSuccess());

    // Clean up when component unmounts
    return () => {
      dispatch(clearOutreachError());
      dispatch(clearOutreachSuccess());
    };
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate pb-2">
              Create New Outreach Campaign
            </h2>
          </div>
        </div>

        {(outreachError || productsError) && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{outreachError || productsError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {productsLoading ? (
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
        ) : (
          <OutreachForm />
        )}
      </motion.div>
    </div>
  );
};

export default OutreachCreatePage;
