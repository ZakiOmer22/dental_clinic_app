// ─────────────────────────────────────────────────────────────
// src/api/prescriptions.ts (UPDATED WITH VERSIONING)
// ─────────────────────────────────────────────────────────────

import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetPrescriptions = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/prescriptions`, { params })).data;
};

export const apiGetPrescription = async (id: number) => {
  return (await client.get(`${API_PREFIX}/prescriptions/${id}`)).data;
};

export const apiCreatePrescription = async (data: any) => {
  return (await client.post(`${API_PREFIX}/prescriptions`, data)).data;
};

export const apiUpdatePrescription = async (id: number, data: any) => {
  return (await client.put(`${API_PREFIX}/prescriptions/${id}`, data)).data;
};

export const apiMarkDispensed = async (id: number) => {
  return (await client.patch(`${API_PREFIX}/prescriptions/${id}/dispense`)).data;
};

export const apiDeletePrescription = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/prescriptions/${id}`)).data;
};