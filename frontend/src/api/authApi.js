import { httpClient } from "./httpClient";

export const signupUser = async (userData) => {
  const response = await httpClient.post("/auth/signup", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await httpClient.post("/auth/login", userData);
  return response.data;
};
