/** Notification inbox API client (list, unread count, mark read). */
import { httpClient } from "./httpClient";

export const getNotifications = async (params = {}) => {
  const response = await httpClient.get("/notifications", { params });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await httpClient.get("/notifications/unread-count");
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await httpClient.patch(`/notifications/${id}/read`, {});
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await httpClient.patch("/notifications/read-all", {});
  return response.data;
};

export const getAdminDeliveryLog = async (params = {}) => {
  const response = await httpClient.get("/notifications/admin/delivery-log", {
    params,
  });
  return response.data;
};

export const getAdminInsights = async () => {
  const response = await httpClient.get("/notifications/admin/insights");
  return response.data;
};
