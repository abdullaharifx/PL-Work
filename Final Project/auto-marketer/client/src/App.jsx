"use client";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import NavigationBar from "./components/NavigationBar";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import ProductListPage from "./pages/ProductListPage";
import ProductEditPage from "./pages/ProductEditPage";
import OutreachListPage from "./pages/OutreachListPage";
import OutreachCreatePage from "./pages/OutreachCreatePage";
import ChatPage from "./pages/ChatPage";
import ChatNotificationBadge from "./components/ChatNotificationBadge";
import { AnimatePresence } from "framer-motion";
import OutreachDetailPage from "./pages/OutreachDetailPage";
import LoginSuccessPage from "./pages/LoginSuccessPage";
import OutreachRunPage from "./pages/OutreachRunPage";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { authenticateUser } from "./redux/slices/authSlice";

// PrivateRoute component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(authenticateUser());
  }, [dispatch]);

  if (loading)
    return (
      <>
        <Toaster position="top-right" />
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
      </>
    );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavigationBar />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/success" element={<LoginSuccessPage />} />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <ProductListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <PrivateRoute>
                    <ProductEditPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/outreaches"
                element={
                  <PrivateRoute>
                    <OutreachListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/outreaches/create"
                element={
                  <PrivateRoute>
                    <OutreachCreatePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/outreaches/:id"
                element={
                  <PrivateRoute>
                    <OutreachDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/outreaches/:id/run"
                element={
                  <PrivateRoute>
                    <OutreachRunPage />
                  </PrivateRoute>
                }
              />
              {/* <Route
                path="/chat"
                element={
                  <PrivateRoute>
                    <ChatPage />
                  </PrivateRoute>
                }
              /> */}
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
        {/* {isAuthenticated && <ChatNotificationBadge />} */}
      </div>
    </Router>
  );
}

export default App;
