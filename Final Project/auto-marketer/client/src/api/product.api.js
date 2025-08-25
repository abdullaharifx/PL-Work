import api from "../axios/axios.config";

const path = "/products";

export const getAllProductsApiCall = async () => {
  try {
    const response = await api.get(`${path}/`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const createProductApiCall = async (body) => {
  try {
    const response = await api.post(`${path}/`, body);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getProductByIdApiCall = async (id) => {
  try {
    const response = await api.get(`${path}/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const updateProductByIdApiCall = async (id, body) => {
  try {
    const response = await api.patch(`${path}/${id}`, body);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const deleteProductByIdApiCall = async (id) => {
  try {
    const response = await api.delete(`${path}/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const suggestSubredditsApiCall = async (id) => {
  try {
    const response = await api.get(`${path}/${id}/suggestions`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
