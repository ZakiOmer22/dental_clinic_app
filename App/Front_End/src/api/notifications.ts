// ─────────────────────────────────────────────────────────────
// src/api/notifications.ts (CLEAN + SECURE)
// ─────────────────────────────────────────────────────────────

import client from "./client";

export interface Notification {
  id: number;
  userId: number;
  type: "system" | "appointment" | "reminder";
  channel: "sms" | "email" | "in_app";
  title?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const apiGetNotifications = async (params?: {
  isRead?: boolean;
  type?: string;
}) => {
  const res = await client.get("/notifications", { params });
  return res.data;
};

export const apiGetUnreadCount = async (): Promise<{ count: number }> => {
  const res = await client.get("/notifications/unread-count");
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

export const apiCreateNotification = async (data: {
  userId: number;
  type: "system" | "appointment" | "reminder";
  channel: "sms" | "email" | "in_app";
  title?: string;
  message: string;
}) => {
  const res = await client.post("/notifications", data);
  return res.data;
};

export const apiDeleteNotification = async (id: number) => {
  const res = await client.delete(`/notifications/${id}`);
  return res.data;
};