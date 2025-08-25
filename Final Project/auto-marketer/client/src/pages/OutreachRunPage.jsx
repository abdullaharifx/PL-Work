"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOutreachById,
  fetchOutreachPosts,
  initiateConversation,
  resetOutreachPosts,
  resetConversationState,
} from "../redux/slices/outreachSlice";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import MessageGenerationPanel from "../components/MessageGenerationPanel";
import OutreachMetrics from "../components/OutreachMetrics";
import { useMessageApi } from "../api/message.api";

const OutreachRunPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { generateMessages, saveGeneratedMessage, executeOutreach } = useMessageApi();
  
  const {
    currentOutreach,
    posts,
    loading,
    postsLoading,
    error,
    initiatingConversation,
    conversationInitiated,
    initiateSuccess,
  } = useSelector((state) => state.outreaches);

  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedReplyType, setSelectedReplyType] = useState("auto_reply_once");
  const [manualMessage, setManualMessage] = useState("");
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [selectedPostType, setSelectedPostType] = useState("all");
  const [showMessageGeneration, setShowMessageGeneration] = useState(false);
  const [messageGenerationLoading, setMessageGenerationLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchOutreachById(id));
    dispatch(fetchOutreachPosts(id));

    // Clean up when component unmounts
    return () => {
      dispatch(resetOutreachPosts());
      dispatch(resetConversationState());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (conversationInitiated) {
      // Reset the state
      setShowReplyOptions(false);
      setSelectedPostId(null);
      setManualMessage("");
      setMessageError("");
      dispatch(resetConversationState());
    }
  }, [conversationInitiated, dispatch]);

  const handleBack = () => {
    navigate("/outreaches");
  };

  const handleInitiateClick = (postId) => {
    setSelectedPostId(postId);
  };

  const handleReplyTypeChange = (e) => {
    setSelectedReplyType(e.target.value);
    // Clear any error when changing reply type
    setMessageError("");
  };

  const handleManualMessageChange = (e) => {
    setManualMessage(e.target.value);
    // Clear error when user types
    if (messageError) {
      setMessageError("");
    }
  };

  const validateForm = () => {
    if (selectedReplyType === "manual_reply_once" && !manualMessage.trim()) {
      setMessageError("Please enter a message for manual reply");
      return false;
    }
    return true;
  };

  const handleStartConversation = (postId) => {
    if (postId) {
      dispatch(
        initiateConversation({
          outreachId: id,
          postId: postId,
        })
      );
    }
  };

  // Message generation handlers
  const handleGenerateMessages = async (postIds) => {
    setMessageGenerationLoading(true);
    try {
      const result = await generateMessages(id, postIds);
      if (result?.status === 'success') {
        toast.success(`Generated ${result.data.generatedCount} messages`);
        return result.data.messages;
      } else {
        throw new Error(result?.message || 'Failed to generate messages');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate messages');
      return null;
    } finally {
      setMessageGenerationLoading(false);
    }
  };

  const handleApproveMessage = async (postId, message, approved) => {
    try {
      const result = await saveGeneratedMessage(postId, message, approved);
      if (result?.status === 'success') {
        toast.success(approved ? 'Message approved' : 'Message rejected');
      } else {
        throw new Error('Failed to save message approval');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save message approval');
    }
  };

  const handleExecuteOutreach = async (postIds, executionType) => {
    try {
      const result = await executeOutreach(id, postIds, executionType);
      if (result?.status === 'success') {
        if (executionType === 'manual') {
          toast.success('Messages prepared for manual posting');
          // You could show a modal with the prepared messages and Reddit links
        } else {
          toast.success('Messages scheduled for automatic posting');
        }
        // Refresh the posts to show updated status
        dispatch(fetchOutreachPosts(id));
      } else {
        throw new Error(result?.message || 'Failed to execute outreach');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to execute outreach');
    }
  };

  const handleCancelReply = () => {
    setShowReplyOptions(false);
    setSelectedPostId(null);
    setManualMessage("");
    setMessageError("");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading || postsLoading) {
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
      {initiatingConversation && (
        <>
          <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
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
          </div>
        </>
      )}

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
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate py-1">
                Run Outreach Campaign
              </h2>
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="inline-flex ms-9 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentOutreach.subreddits &&
                  currentOutreach.subreddits.length > 0
                    ? currentOutreach.subreddits.join(", ")
                    : "No subreddit specified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Metrics Dashboard */}
        <OutreachMetrics 
          outreach={currentOutreach} 
          posts={posts.all || []} 
        />

        {/* Message Generation Panel */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Automated Message Generation
            </h3>
            <button
              onClick={() => setShowMessageGeneration(!showMessageGeneration)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showMessageGeneration ? 'Hide' : 'Show'} Message Generation
            </button>
          </div>
          
          {showMessageGeneration && (
            <MessageGenerationPanel
              posts={posts.all || []}
              onGenerateMessages={handleGenerateMessages}
              onApproveMessage={handleApproveMessage}
              onExecuteOutreach={handleExecuteOutreach}
              loading={messageGenerationLoading}
            />
          )}
        </div>

        <select
          name=""
          id=""
          value={selectedPostType}
          className=" px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mt-2 mb-4"
          onChange={(e) => setSelectedPostType(e.target.value)}
        >
          <option value="all">All Posts</option>
          <option value="relevant">Relevant Posts</option>
        </select>

        {/* Posts */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {selectedPostType == "all" ? "All Posts" : "Relevant Posts"}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {selectedPostType == "all"
                ? ""
                : "These posts match your outreach criteria. Initiate conversations to engage with potential clients."}
            </p>
          </div>

          {initiateSuccess && (
            <div className=" w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Success
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Message Initiated Successfully</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {posts[selectedPostType].length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No posts found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No posts matching your outreach criteria were found. Try
                adjusting your outreach settings.
              </p>
            </div>
          ) : (
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <div className="space-y-6 sm:p-6">
                {posts[selectedPostType].map((post) => (
                  <div
                    key={post.id}
                    className={`bg-white shadow overflow-hidden sm:rounded-lg border ${
                      selectedPostId === post.id
                        ? "border-[#FF4500]"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {post.title}
                          </h3>
                          {post.canSolve && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Solvable
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {post.subreddit}
                        </span>
                      </div>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Posted by u/{post.author} on {formatDate(post.date)}
                      </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <p className="text-sm text-gray-700">{post.text}</p>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#0079D3] hover:text-[#006bb9]"
                      >
                        View on Reddit
                      </a>
                      {selectedPostId === post.id && showReplyOptions ? (
                        <div className="flex flex-col space-y-3 w-full max-w-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-1/3">
                              <label
                                htmlFor={`reply-type-${post.id}`}
                                className="block text-sm font-medium text-gray-700"
                              >
                                Reply Type
                              </label>
                              <select
                                id={`reply-type-${post.id}`}
                                name="replyType"
                                value={selectedReplyType}
                                onChange={handleReplyTypeChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#FF4500] focus:border-[#FF4500] sm:text-sm rounded-md"
                              >
                                <option value="auto_reply_once">
                                  Auto Reply Once
                                </option>
                                <option value="manual_reply_once">
                                  Manual Reply Once
                                </option>
                                <option value="auto_reply_complete">
                                  Auto Reply Complete
                                </option>
                              </select>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleStartConversation}
                                disabled={initiatingConversation}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] disabled:opacity-50"
                              >
                                {initiatingConversation
                                  ? "Starting..."
                                  : "Start Conversation"}
                              </button>
                              <button
                                onClick={handleCancelReply}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          {/* Manual message input */}
                          {selectedReplyType === "manual_reply_once" && (
                            <div className="w-full">
                              <label
                                htmlFor={`manual-message-${post.id}`}
                                className="block text-sm font-medium text-gray-700"
                              >
                                Custom Message
                              </label>
                              <div className="mt-1">
                                <textarea
                                  id={`manual-message-${post.id}`}
                                  name="manualMessage"
                                  rows={3}
                                  value={manualMessage}
                                  onChange={handleManualMessageChange}
                                  placeholder="Enter your custom reply message here..."
                                  className={`shadow-sm focus:ring-[#FF4500] focus:border-[#FF4500] block w-full sm:text-sm border-gray-300 rounded-md ${
                                    messageError ? "border-red-300" : ""
                                  }`}
                                />
                                {messageError && (
                                  <p className="mt-2 text-sm text-red-600">
                                    {messageError}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        selectedPostType == "relevant" && (
                          <button
                            onClick={() => {
                              handleStartConversation(post.id);
                            }}
                            disabled={initiatingConversation}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] disabled:opacity-50"
                          >
                            Initiate AI Conversation
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* <div className="mt-6 flex justify-end">
          <Link
            to="/chat"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
          >
            View All Conversations
          </Link>
        </div> */}
      </motion.div>
    </div>
  );
};

export default OutreachRunPage;
