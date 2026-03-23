// ─────────────────────────────────────────────────────────────
// src/api/users.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

export const apiGetUsers = async (params?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await client.get("/users", { params });
  return res.data;
};

export const apiGetUser = async (id: number) => {
  const res = await client.get(`/users/${id}`);
  return res.data;
};

export const apiCreateUser = async (data: any) => {
  const res = await client.post("/users", data);
  return res.data;
};

export const apiUpdateUser = async (id: number, data: any) => {
  const res = await client.put(`/users/${id}`, data);
  return res.data;
};

export const apiUpdateUserStatus = async (id: number, status: string) => {
  const res = await client.patch(`/users/${id}/status`, { status });
  return res.data;
};

export const apiDeleteUser = async (id: number) => {
  const res = await client.delete(`/users/${id}`);
  return res.data;
};

export const apiResetPassword = async (id: number) => {
  const res = await client.post(`/users/${id}/reset-password`);
  return res.data;
};

export const apiGetCurrentUser = async () => {
  const res = await client.get("/users/me");
  return res.data;
};

export const apiUpdateCurrentUser = async (data: any) => {
  const res = await client.put("/users/me", data);
  return res.data;
};

export const apiChangePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const res = await client.post("/users/change-password", data);
  return res.data;
};

export const apiGetUserActivity = async (id: number) => {
  const res = await client.get(`/users/${id}/activity`);
  return res.data;
};