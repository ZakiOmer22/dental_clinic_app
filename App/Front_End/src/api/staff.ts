
// ─────────────────────────────────────────────────────────────
// src/api/staff.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiGetStaff = async (params?: any) => {
  const res = await client.get("/staff", { params });
  return res.data;
};
 
export const apiGetStaffMember = async (id: number) => {
  const res = await client.get(`/staff/${id}`);
  return res.data;
};
 
export const apiCreateStaff = async (data: any) => {
  const res = await client.post("/staff", data);
  return res.data;
};
 
export const apiUpdateStaff = async (id: number, data: any) => {
  const res = await client.put(`/staff/${id}`, data);
  return res.data;
};
 
export const apiToggleStaffActive = async (id: number, isActive: boolean) => {
  const res = await client.patch(`/staff/${id}/status`, { isActive });
  return res.data;
};
 
export const apiResetStaffPassword = async (id: number, newPassword: string) => {
  const res = await client.patch(`/staff/${id}/password`, { newPassword });
  return res.data;
};
 
export const apiDeleteStaff = async (id: number) => {
  const res = await client.delete(`/staff/${id}`);
  return res.data;
};
 