import api from "../axios/axios.config";

const path = "/chats";

export const initiateConversationApiCall = async (outreachId, postId) => {
  try {
    const response = await api.post(
      `${path}/outreach/${outreachId}/post/${postId}/start`
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
