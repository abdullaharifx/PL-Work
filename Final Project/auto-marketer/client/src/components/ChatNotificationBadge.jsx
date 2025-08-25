"use client";

import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const ChatNotificationBadge = () => {
  const { conversations } = useSelector(
    (state) => state.chat || { conversations: [] }
  );

  // Calculate total unread messages
  const unreadCount = conversations.reduce(
    (total, conv) => total + (conv.unreadCount || 0),
    0
  );

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Link to="/chat" className="fixed bottom-4 right-4 z-50">
      <div className="bg-[#FF4500] text-white rounded-full p-3 shadow-lg flex items-center space-x-2 hover:bg-[#e03d00] transition-colors">
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
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span className="font-bold">{unreadCount}</span>
      </div>
    </Link>
  );
};

export default ChatNotificationBadge;
