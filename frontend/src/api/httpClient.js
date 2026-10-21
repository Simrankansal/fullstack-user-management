/** Shared Axios instance: auth header on requests, 401 handling on responses. */
import axios from "axios";

const defaultApiRoot =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const API_BASE_URL = defaultApiRoot.replace(/\/$/, "");

export const UPLOADS_BASE_URL =
  process.env.REACT_APP_UPLOADS_URL ||
  API_BASE_URL.replace(/\/api\/?$/, "") + "/uploads";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
});

let configured = false;

export const setupHttpClient = () => {
  if (configured) {
    return;
  }
  configured = true;

  const attachAuthHeader = (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };

  const handleUnauthorized = (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isAuthPage = path === "/login" || path === "/signup";

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!isAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  };

  httpClient.interceptors.request.use(attachAuthHeader);
  httpClient.interceptors.response.use((response) => response, handleUnauthorized);

  // Auth endpoints and legacy direct axios calls still get the same behavior.
  axios.interceptors.request.use(attachAuthHeader);
  axios.interceptors.response.use((response) => response, handleUnauthorized);
};
