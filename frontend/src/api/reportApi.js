/** Dashboard and project report statistics API client. */
import { httpClient } from "./httpClient";

export const getDashboardStats = async () => {
  const response = await httpClient.get("/reports/dashboard");
  return response.data;
};

export const getProjectReport = async (projectId) => {
  const response = await httpClient.get(`/reports/projects/${projectId}`);
  return response.data;
};
