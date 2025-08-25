import { useApi } from "../hooks/useApi";

export const useMessageApi = () => {
  const { apiCall } = useApi();

  const generateMessages = async (outreachId, postIds) => {
    return await apiCall(`/messages/${outreachId}/generate`, {
      method: "POST",
      body: JSON.stringify({ postIds }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const saveGeneratedMessage = async (postId, message, approved) => {
    return await apiCall("/messages/save", {
      method: "POST",
      body: JSON.stringify({ postId, message, approved }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const executeOutreach = async (outreachId, postIds, executionType) => {
    return await apiCall(`/messages/${outreachId}/execute`, {
      method: "POST",
      body: JSON.stringify({ postIds, executionType }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return {
    generateMessages,
    saveGeneratedMessage,
    executeOutreach,
  };
};
