import api from "../axios/axios.config";

const path = "/outreach-posts";

export const getRelevantPostsApiCall = async (id) => {
  try {
    const response = await api.get(`${path}/${id}/posts/relevant`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getAllPostsApiCall = async (id) => {
  try {
    const response = await api.get(`${path}/${id}/posts`);

    console.log(response);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
