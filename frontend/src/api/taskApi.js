/** Task CRUD, comments, attachments, and watchers API client. */
import { httpClient, UPLOADS_BASE_URL } from "./httpClient";

export const getAttachmentUrl = (fileName) => `${UPLOADS_BASE_URL}/${fileName}`;

export const createTask = async (taskData) => {
  const response = await httpClient.post("/tasks", taskData);
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await httpClient.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};

export const assignTask = async (taskId, assigneeId) => {
  const response = await httpClient.patch(`/tasks/${taskId}/assign`, {
    assigneeId: assigneeId || null,
  });
  return response.data;
};

export const addTaskComment = async (taskId, body) => {
  const response = await httpClient.post(`/tasks/${taskId}/comments`, { body });
  return response.data;
};

export const getTaskActivity = async (taskId) => {
  const response = await httpClient.get(`/tasks/${taskId}/activity`);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await httpClient.patch(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const listTaskAttachments = async (taskId) => {
  const response = await httpClient.get(`/tasks/${taskId}/attachments`);
  return response.data;
};

export const uploadTaskAttachment = async (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post(
    `/tasks/${taskId}/attachments`,
    formData
  );
  return response.data;
};

export const deleteTaskAttachment = async (attachmentId) => {
  const response = await httpClient.delete(`/attachments/${attachmentId}`);
  return response.data;
};

export const listTaskWatchers = async (taskId) => {
  const response = await httpClient.get(`/tasks/${taskId}/watchers`);
  return response.data;
};

export const addTaskWatcher = async (taskId, userId) => {
  const response = await httpClient.post(
    `/tasks/${taskId}/watchers`,
    userId ? { userId } : {}
  );
  return response.data;
};

export const removeTaskWatcher = async (taskId, userId) => {
  const response = await httpClient.delete(
    `/tasks/${taskId}/watchers/${userId}`
  );
  return response.data;
};
