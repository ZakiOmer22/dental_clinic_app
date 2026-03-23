// ─────────────────────────────────────────────────────────────
// src/api/consentForms.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiGetConsentForms = async (params?: any) => {
  const res = await client.get("/consent-forms", { params });
  return res.data;
};
 
export const apiGetConsentForm = async (id: number) => {
  const res = await client.get(`/consent-forms/${id}`);
  return res.data;
};
 
export const apiCreateConsentForm = async (data: any) => {
  const res = await client.post("/consent-forms", data);
  return res.data;
};
 
export const apiSignConsentForm = async (id: number, data: { signedBy: string; witness?: string }) => {
  const res = await client.patch(`/consent-forms/${id}/sign`, data);
  return res.data;
};
 
export const apiDeleteConsentForm = async (id: number) => {
  const res = await client.delete(`/consent-forms/${id}`);
  return res.data;
};