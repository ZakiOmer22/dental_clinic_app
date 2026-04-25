import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetStaff = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/staff`, { params })).data;
};

export const apiGetStaffMember = async (id: number) => {
  return (await client.get(`${API_PREFIX}/staff/${id}`)).data;
};

export const apiCreateStaff = async (data: any) => {
  return (await client.post(`${API_PREFIX}/staff`, data)).data;
};

export const apiUpdateStaff = async (id: number, data: any) => {
  return (await client.put(`${API_PREFIX}/staff/${id}`, data)).data;
};

export const apiToggleStaffActive = async (id: number, isActive: boolean) => {
  return (await client.patch(`${API_PREFIX}/staff/${id}/status`, { isActive })).data;
};

export const apiResetStaffPassword = async (id: number, newPassword: string) => {
  return (await client.patch(`${API_PREFIX}/staff/${id}/password`, { newPassword })).data;
};

export const apiDeleteStaff = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/staff/${id}`)).data;
};