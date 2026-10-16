import axios from "axios";

const API_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const getProjects = async (params = {}) => {
  const response = await axios.get(`${API_URL}/projects`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await axios.post(`${API_URL}/projects`, projectData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateProject = async (id, projectData) => {
  const response = await axios.put(`${API_URL}/projects/${id}`, projectData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getProjectTasks = async (projectId) => {
  const response = await axios.get(`${API_URL}/projects/${projectId}/tasks`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
