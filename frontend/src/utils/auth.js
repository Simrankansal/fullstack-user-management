import axios from "axios";

// If token expires or is invalid, API returns 401 — clear storage and go to login
export const setupAxiosAuthInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const path = window.location.pathname;
        const isAuthPage =
          path === "/login" || path === "/signup";

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (!isAuthPage) {
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }
  );
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
};