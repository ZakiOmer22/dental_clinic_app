// ─────────────────────────────────────────────────────────────
// src/api/notifications.ts (UPDATED WITH VERSIONING)
// ─────────────────────────────────────────────────────────────

import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

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
  return (await client.get(`${API_PREFIX}/notifications`, { params })).data;
};

export const apiGetUnreadCount = async (): Promise<{ count: number }> => {
  return (await client.get(`${API_PREFIX}/notifications/unread-count`)).data;
};

export const apiMarkNotificationRead = async (id: number) => {
  return (await client.patch(`${API_PREFIX}/notifications/${id}/read`)).data;
};

export const apiMarkAllRead = async () => {
  return (await client.patch(`${API_PREFIX}/notifications/read-all`)).data;
};

export const apiCreateNotification = async (data: {
  userId: number;
  type: "system" | "appointment" | "reminder";
  channel: "sms" | "email" | "in_app";
  title?: string;
  message: string;
}) => {
  return (await client.post(`${API_PREFIX}/notifications`, data)).data;
};

export const apiDeleteNotification = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/notifications/${id}`)).data;
};