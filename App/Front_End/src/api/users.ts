import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

/* ─────────────────────────────────────────────
   TYPES (unchanged)
───────────────────────────────────────────── */

export type UserRole = "admin" | "doctor" | "receptionist" | "assistant" | "patient";
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/* ─────────────────────────────────────────────
   API FUNCTIONS (V1 PREFIXED)
───────────────────────────────────────────── */

export const apiGetUsers = async (params?: any) => {
  const res = await client.get(`${API_PREFIX}/users`, { params });
  return res.data;
};

export const apiGetUser = async (id: number) => {
  const res = await client.get(`${API_PREFIX}/users/${id}`);
  return res.data;
};

export const apiCreateUser = async (data: any) => {
  const res = await client.post(`${API_PREFIX}/users`, data);
  return res.data;
};

export const apiUpdateUser = async (id: number, data: any) => {
  const res = await client.put(`${API_PREFIX}/users/${id}`, data);
  return res.data;
};

export const apiUpdateUserStatus = async (id: number, status: string) => {
  const res = await client.patch(`${API_PREFIX}/users/${id}/status`, { status });
  return res.data;
};

export const apiDeleteUser = async (id: number) => {
  const res = await client.delete(`${API_PREFIX}/users/${id}`);
  return res.data;
};

export const apiResetPassword = async (id: number) => {
  const res = await client.post(`${API_PREFIX}/users/${id}/reset-password`);
  return res.data;
};

export const apiGetCurrentUser = async () => {
  const res = await client.get(`${API_PREFIX}/users/me`);
  return res.data;
};

export const apiUpdateCurrentUser = async (data: any) => {
  const res = await client.put(`${API_PREFIX}/users/me`, data);
  return res.data;
};

export const apiChangePassword = async (data: any) => {
  const res = await client.post(`${API_PREFIX}/users/change-password`, data);
  return res.data;
};

export const apiGetUserActivity = async (id: number) => {
  const res = await client.get(`${API_PREFIX}/users/${id}/activity`);
  return res.data;
};