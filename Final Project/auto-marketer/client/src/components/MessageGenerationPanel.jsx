import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MessageGenerationPanel = ({ 
  posts, 
  onGenerateMessages, 
  onApproveMessage, 
  onExecuteOutreach,
  loading = false 
}) => {
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [generatedMessages, setGeneratedMessages] = useState({});
  const [executionType, setExecutionType] = useState('manual');

  const handlePostSelection = (postId) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handleGenerateMessages = async () => {
    if (selectedPosts.size === 0) return;
    
    const messages = await onGenerateMessages(Array.from(selectedPosts));
    if (messages) {
      const messageMap = {};
      messages.forEach(msg => {
        messageMap[msg.postId] = msg;
      });
      setGeneratedMessages(messageMap);
    }
  };

  const handleApproveMessage = (postId, approved) => {
    const message = generatedMessages[postId];
    if (message) {
      onApproveMessage(postId, message.generatedReply, approved);
      setGeneratedMessages(prev => ({
        ...prev,
        [postId]: { ...prev[postId], approved }
      }));
    }
  };

  const handleExecuteOutreach = () => {
    const approvedPostIds = Object.keys(generatedMessages).filter(
      postId => generatedMessages[postId].approved
    );
    
    if (approvedPostIds.length === 0) return;
    
    onExecuteOutreach(approvedPostIds, executionType);
  };

  const relevantPosts = posts.filter(post => post.canSolve);
  const approvedCount = Object.values(generatedMessages).filter(msg => msg.approved).length;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Message Generation & Outreach
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Generate personalized messages and execute your outreach campaign
        </p>
      </div>

      <div className="border-t border-gray-200">
        {/* Step 1: Select Posts */}
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Step 1: Select Posts ({selectedPosts.size} selected)
            </h4>
            <button
              onClick={() => setSelectedPosts(new Set(relevantPosts.map(p => p._id)))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All Relevant
            </button>
          </div>

          <div className="grid gap-3 max-h-60 overflow-y-auto">
            {relevantPosts.slice(0, 10).map((post) => (
              <div key={post._id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedPosts.has(post._id)}
                  onChange={() => handlePostSelection(post._id)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    r/{post.subreddit} • by u/{post.author}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {post.text.substring(0, 150)}...
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerateMessages}
            disabled={selectedPosts.size === 0 || loading}
            className="mt-4 w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              `Generate Messages (${selectedPosts.size})`
            )}
          </button>
        </div>

        {/* Step 2: Review Messages */}
        {Object.keys(generatedMessages).length > 0 && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Step 2: Review Generated Messages
            </h4>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {Object.entries(generatedMessages).map(([postId, message]) => {
                const post = relevantPosts.find(p => p._id === postId);
                return (
                  <div key={postId} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {post?.title}
                        </h5>
                        <p className="text-xs text-gray-500">r/{post?.subreddit}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveMessage(postId, true)}
                          className={`px-3 py-1 text-xs rounded ${
                            message.approved === true
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveMessage(postId, false)}
                          className={`px-3 py-1 text-xs rounded ${
                            message.approved === false
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-700">
                        {message.generatedReply}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Execute Outreach */}
        {approvedCount > 0 && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Step 3: Execute Outreach ({approvedCount} approved messages)
            </h4>

            <div className="flex items-center space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={executionType === 'manual'}
                  onChange={(e) => setExecutionType(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Manual Review</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="automatic"
                  checked={executionType === 'automatic'}
                  onChange={(e) => setExecutionType(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Automatic Posting</span>
              </label>
            </div>

            <button
              onClick={handleExecuteOutreach}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {executionType === 'manual' ? 'Prepare for Manual Posting' : 'Schedule Automatic Posting'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageGenerationPanel;
