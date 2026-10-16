import axios from "axios";

const API_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};
//create a new task
export const createTask = async (taskData) => {
  const response = await axios.post(`${API_URL}/tasks`, taskData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
//update the status of a task
export const updateTaskStatus = async (taskId, status) => {
  const response = await axios.patch(
    `${API_URL}/tasks/${taskId}/status`,
    { status },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
//assigna task to a user
export const assignTask = async (taskId, assigneeId) => {
  const response = await axios.patch(
    `${API_URL}/tasks/${taskId}/assign`,
    { assigneeId: assigneeId || null },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
//add a comment to a task
export const addTaskComment = async (taskId, body) => {
  const response = await axios.post(
    `${API_URL}/tasks/${taskId}/comments`,
    { body },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
//get the activity of a task
export const getTaskActivity = async (taskId) => {
  const response = await axios.get(`${API_URL}/tasks/${taskId}/activity`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
