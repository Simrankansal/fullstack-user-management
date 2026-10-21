/** Normalize API error messages for UI alerts. */
export const getApiErrorMessage = (error, fallback = "Something went wrong") => {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (error?.message === "Network Error") {
    return "Cannot reach the server. Check that the backend is running.";
  }
  return fallback;
};
