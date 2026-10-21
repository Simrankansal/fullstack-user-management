/** User profile and admin user management API client. */
import { httpClient } from "./httpClient";

export const getProfile = async () => {
  const response = await httpClient.get("/users/profile");
  return response.data;
};

export const getUsers = async () => {
  const response = await httpClient.get("/users");
  return response.data;
};

export const getUserById = async (id) => {
  const response = await httpClient.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await httpClient.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await httpClient.delete(`/users/${id}`);
  return response.data;
};

export const getActiveUsers = async () => {
  const response = await httpClient.get("/users/active");
  return response.data;
};
