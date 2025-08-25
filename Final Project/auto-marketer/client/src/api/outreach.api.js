import api from "../axios/axios.config";

const path = "/outreach";

export const getAllOutreachesApiCall = async () => {
  try {
    const response = await api.get(`${path}/`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const createOutreachApiCall = async (body) => {
  try {
    const response = await api.post(`${path}/`, body);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getOutreachByIdApiCall = async (id) => {
  try {
    const response = await api.get(`${path}/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const updateOutreachByIdApiCall = async (id, body) => {
  try {
    const response = await api.patch(`${path}/${id}`, body);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const deleteOutreachByIdApiCall = async (id) => {
  try {
    const response = await api.delete(`${path}/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const runOutreachByIdApiCall = async (id) => {
  try {
    const response = await api.post(`${path}/${id}/run`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
