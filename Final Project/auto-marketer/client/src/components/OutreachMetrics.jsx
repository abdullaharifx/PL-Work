import React from 'react';
import { motion } from 'framer-motion';

const OutreachMetrics = ({ outreach, posts = [] }) => {
  const totalPosts = posts.length;
  const relevantPosts = posts.filter(post => post.canSolve).length;
  const messagesGenerated = posts.filter(post => post.generatedMessage).length;
  const messagesApproved = posts.filter(post => post.messageApproved).length;
  const messagesSent = posts.filter(post => post.messageStatus === 'sent').length;
  const messagesScheduled = posts.filter(post => post.messageStatus === 'scheduled').length;
  const readyForManual = posts.filter(post => post.messageStatus === 'ready_for_manual').length;

  const relevanceRate = totalPosts > 0 ? ((relevantPosts / totalPosts) * 100).toFixed(1) : 0;
  const approvalRate = messagesGenerated > 0 ? ((messagesApproved / messagesGenerated) * 100).toFixed(1) : 0;
  const completionRate = relevantPosts > 0 ? ((messagesSent / relevantPosts) * 100).toFixed(1) : 0;

  const metrics = [
    {
      name: 'Total Posts Found',
      value: totalPosts,
      icon: '📊',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      name: 'Relevant Posts',
      value: relevantPosts,
      percentage: `${relevanceRate}%`,
      icon: '🎯',
      color: 'bg-green-50 text-green-700',
    },
    {
      name: 'Messages Generated',
      value: messagesGenerated,
      icon: '💬',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      name: 'Messages Approved',
      value: messagesApproved,
      percentage: approvalRate > 0 ? `${approvalRate}%` : undefined,
      icon: '✅',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      name: 'Messages Sent',
      value: messagesSent,
      icon: '🚀',
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      name: 'Scheduled',
      value: messagesScheduled,
      icon: '⏰',
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      name: 'Ready for Manual',
      value: readyForManual,
      icon: '✋',
      color: 'bg-orange-50 text-orange-700',
    },
  ];

  const progressMetrics = [
    {
      name: 'Relevance Rate',
      value: relevanceRate,
      description: 'Posts matching your criteria',
      color: 'bg-green-500',
    },
    {
      name: 'Approval Rate',
      value: approvalRate,
      description: 'Generated messages approved',
      color: 'bg-blue-500',
    },
    {
      name: 'Completion Rate',
      value: completionRate,
      description: 'Outreach messages sent',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Campaign Performance Metrics
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Track your outreach campaign progress and success rates
        </p>
      </div>

      <div className="border-t border-gray-200">
        {/* Key Metrics Grid */}
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${metric.color} rounded-lg p-4 text-center`}
              >
                <div className="text-2xl mb-2">{metric.icon}</div>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.percentage && (
                  <div className="text-sm font-medium">{metric.percentage}</div>
                )}
                <div className="text-xs font-medium mt-1">{metric.name}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Success Rates</h4>
          <div className="space-y-4">
            {progressMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center"
              >
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{metric.name}</span>
                    <span className="text-gray-500">{metric.value}%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ delay: 1 + index * 0.2, duration: 0.8 }}
                      className={`h-2 rounded-full ${metric.color}`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{metric.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900">Campaign Status</h4>
              <p className="text-sm text-gray-500">
                {outreach?.status === 'active' ? 'Campaign is running' : 'Campaign completed'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {((messagesSent + messagesScheduled + readyForManual) / Math.max(relevantPosts, 1) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutreachMetrics;
