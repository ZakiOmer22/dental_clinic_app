// ─────────────────────────────────────────────────────────────
// src/api/prescriptions.ts (CLEAN + SECURE)
// ─────────────────────────────────────────────────────────────

import client from "./client";

export const apiGetPrescriptions = async (params?: any) => {
  const res = await client.get("/prescriptions", { params });
  return res.data;
};

export const apiGetPrescription = async (id: number) => {
  const res = await client.get(`/prescriptions/${id}`);
  return res.data;
};

export const apiCreatePrescription = async (data: any) => {
  const res = await client.post("/prescriptions", data);
  return res.data;
};

export const apiUpdatePrescription = async (id: number, data: any) => {
  const res = await client.put(`/prescriptions/${id}`, data);
  return res.data;
};

export const apiMarkDispensed = async (id: number) => {
  const res = await client.patch(`/prescriptions/${id}/dispense`);
  return res.data;
};

export const apiDeletePrescription = async (id: number) => {
  const res = await client.delete(`/prescriptions/${id}`);
  return res.data;
};