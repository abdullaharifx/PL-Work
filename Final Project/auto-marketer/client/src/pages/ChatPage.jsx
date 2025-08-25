"use client";

import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { fetchConversations, sendMessage } from "../redux/slices/chatSlice";
import { Link } from "react-router-dom";

const ChatPage = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversation, loading } = useSelector(
    (state) => state.chat
  );
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch conversations when component mounts
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && activeConversation) {
      dispatch(
        sendMessage({
          conversationId: activeConversation.id,
          content: message,
          sender: "user",
        })
      );
      setMessage("");
    }
  };

  const handleSetActiveConversation = (conversation) => {
    dispatch({ type: "chat/setActiveConversation", payload: conversation });
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        className="bg-white shadow-lg rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex h-[calc(100vh-12rem)]">
          {/* Conversation List Sidebar */}
          <div className="w-1/4 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Conversations
              </h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-4rem)]">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <svg
                    className="animate-spin h-8 w-8 text-[#FF4500]"
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
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Start conversations by running outreach campaigns and engaging with potential customers.</p>
                  <Link 
                    to="/outreaches" 
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Outreach Campaigns
                  </Link>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                      activeConversation &&
                      activeConversation.id === conversation.id
                        ? "bg-gray-200"
                        : ""
                    }`}
                    onClick={() => handleSetActiveConversation(conversation)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={
                            conversation.redditUser.avatar ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={conversation.redditUser.username}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {conversation.redditUser.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.messages.length > 0
                            ? conversation.messages[
                                conversation.messages.length - 1
                              ].content.substring(0, 30) + "..."
                            : "No messages"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">
                        {conversation.subreddit
                          ? `r/${conversation.subreddit}`
                          : ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        {conversation.messages.length > 0
                          ? formatTimestamp(
                              conversation.messages[
                                conversation.messages.length - 1
                              ].timestamp
                            )
                          : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="w-3/4 flex flex-col">
            {/* Chat Header */}
            {activeConversation ? (
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={
                      activeConversation.redditUser.avatar ||
                      "/placeholder.svg?height=40&width=40"
                    }
                    alt={activeConversation.redditUser.username}
                  />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {activeConversation.redditUser.username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeConversation.subreddit
                        ? `r/${activeConversation.subreddit}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div>
                  <a
                    href={`https://reddit.com/user/${activeConversation.redditUser.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-[#FF4500] hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
                  >
                    View on Reddit
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    Select a conversation to start chatting
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose a conversation from the sidebar to view messages and continue the discussion.
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {activeConversation ? (
                activeConversation.messages.length > 0 ? (
                  <div className="space-y-4">
                    {activeConversation.messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender === "user"
                              ? "bg-[#FF4500] text-white"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          <div className="flex items-end">
                            <p className="text-sm">{msg.content}</p>
                            <span className="ml-2 text-xs opacity-70">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          {msg.postLink && (
                            <a
                              href={msg.postLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline mt-1 block"
                            >
                              View Post
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      No messages in this conversation yet
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg
                    className="h-16 w-16 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    Select a conversation to start chatting
                  </p>
                </div>
              )}
            </div>

            {/* Message Input */}
            {activeConversation && (
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-[#FF4500] text-white px-4 py-2 rounded-r-md hover:bg-[#e03d00] focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatPage;
