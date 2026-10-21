/** Project CRUD, members, labels, and archive API client. */
import { httpClient } from "./httpClient";

export const getProjects = async (params = {}) => {
  const response = await httpClient.get("/projects", { params });
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await httpClient.post("/projects", projectData);
  return response.data;
};

export const updateProject = async (id, projectData) => {
  const response = await httpClient.put(`/projects/${id}`, projectData);
  return response.data;
};

export const getProjectTasks = async (projectId) => {
  const response = await httpClient.get(`/projects/${projectId}/tasks`);
  return response.data;
};

export const getProjectById = async (projectId) => {
  const response = await httpClient.get(`/projects/${projectId}`);
  return response.data;
};

export const archiveProject = async (projectId) => {
  const response = await httpClient.patch(`/projects/${projectId}/archive`, {});
  return response.data;
};

export const restoreProject = async (projectId) => {
  const response = await httpClient.patch(`/projects/${projectId}/restore`, {});
  return response.data;
};

export const addProjectMember = async (projectId, userId, role = "member") => {
  const response = await httpClient.post(`/projects/${projectId}/members`, {
    userId,
    role,
  });
  return response.data;
};

export const removeProjectMember = async (projectId, userId) => {
  const response = await httpClient.delete(
    `/projects/${projectId}/members/${userId}`
  );
  return response.data;
};

export const listProjectLabels = async (projectId) => {
  const response = await httpClient.get(`/projects/${projectId}/labels`);
  return response.data;
};

export const createProjectLabel = async (projectId, labelData) => {
  const response = await httpClient.post(
    `/projects/${projectId}/labels`,
    labelData
  );
  return response.data;
};
