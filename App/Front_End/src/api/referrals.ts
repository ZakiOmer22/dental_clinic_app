// ─────────────────────────────────────────────────────────────
// src/api/referrals.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiGetReferrals = async (params?: any) => {
  const res = await client.get("/referrals", { params });
  return res.data;
};
 
export const apiGetReferral = async (id: number) => {
  const res = await client.get(`/referrals/${id}`);
  return res.data;
};
 
export const apiCreateReferral = async (data: any) => {
  const res = await client.post("/referrals", data);
  return res.data;
};
 
export const apiUpdateReferral = async (id: number, data: any) => {
  const res = await client.put(`/referrals/${id}`, data);
  return res.data;
};
 
export const apiUpdateReferralStatus = async (id: number, status: string, feedbackNotes?: string) => {
  const res = await client.patch(`/referrals/${id}/status`, { status, feedbackNotes });
  return res.data;
};
 
export const apiDeleteReferral = async (id: number) => {
  const res = await client.delete(`/referrals/${id}`);
  return res.data;
};