 
// ─────────────────────────────────────────────────────────────
// src/api/notifications.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiGetNotifications = async (params?: { isRead?: boolean; type?: string }) => {
  const res = await client.get("/notifications", { params });
  return res.data;
};
 
export const apiMarkNotificationRead = async (id: number) => {
  const res = await client.patch(`/notifications/${id}/read`);
  return res.data;
};
 
export const apiMarkAllRead = async () => {
  const res = await client.patch("/notifications/read-all");
  return res.data;
};
 
export const apiDeleteNotification = async (id: number) => {
  const res = await client.delete(`/notifications/${id}`);
  return res.data;
};
 
export const apiGetUnreadCount = async () => {
  const res = await client.get("/notifications/unread-count");
  return res.data; // { count: number }
};
 