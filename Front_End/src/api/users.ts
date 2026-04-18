// ─────────────────────────────────────────────────────────────
// src/api/users.ts (Enterprise Grade)
// ─────────────────────────────────────────────────────────────

import client from "./client";

/* ─────────────────────────────────────────────
   TYPES
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

export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  module: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserListParams {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/* ─────────────────────────────────────────────
   REQUEST TYPES
───────────────────────────────────────────── */

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/* ─────────────────────────────────────────────
   API FUNCTIONS
───────────────────────────────────────────── */

/**
 * Get all users (paginated)
 */
export const apiGetUsers = async (
  params?: UserListParams
): Promise<PaginatedResponse<User>> => {
  const res = await client.get("/users", { params });
  return res.data;
};

/**
 * Get single user
 */
export const apiGetUser = async (id: number): Promise<User> => {
  const res = await client.get(`/users/${id}`);
  return res.data;
};

/**
 * Create user (admin only)
 */
export const apiCreateUser = async (
  data: CreateUserRequest
): Promise<User> => {
  const res = await client.post("/users", data);
  return res.data;
};

/**
 * Update user
 */
export const apiUpdateUser = async (
  id: number,
  data: UpdateUserRequest
): Promise<User> => {
  const res = await client.put(`/users/${id}`, data);
  return res.data;
};

/**
 * Update user status
 */
export const apiUpdateUserStatus = async (
  id: number,
  status: UserStatus
): Promise<User> => {
  const res = await client.patch(`/users/${id}/status`, { status });
  return res.data;
};

/**
 * Delete user
 */
export const apiDeleteUser = async (
  id: number
): Promise<{ success: boolean }> => {
  const res = await client.delete(`/users/${id}`);
  return res.data;
};

/**
 * Reset password (admin action)
 */
export const apiResetPassword = async (
  id: number
): Promise<{ success: boolean; tempPassword?: string }> => {
  const res = await client.post(`/users/${id}/reset-password`);
  return res.data;
};

/**
 * Get current authenticated user
 */
export const apiGetCurrentUser = async (): Promise<User> => {
  const res = await client.get("/users/me");
  return res.data;
};

/**
 * Update current user profile
 */
export const apiUpdateCurrentUser = async (
  data: UpdateUserRequest
): Promise<User> => {
  const res = await client.put("/users/me", data);
  return res.data;
};

/**
 * Change password (self-service)
 */
export const apiChangePassword = async (
  data: UpdatePasswordRequest
): Promise<{ success: boolean }> => {
  const res = await client.post("/users/change-password", data);
  return res.data;
};

/**
 * Get user activity logs
 */
export const apiGetUserActivity = async (
  id: number
): Promise<UserActivity[]> => {
  const res = await client.get(`/users/${id}/activity`);
  return res.data;
};