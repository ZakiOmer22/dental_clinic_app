// ─────────────────────────────────────────────────────────────
// src/api/patients.ts (CLEAN + SECURE)
// ─────────────────────────────────────────────────────────────

import client from "./client";

export const apiGetPatients = async (params?: any) => {
  const res = await client.get("/patients", { params });
  return res.data;
};

export const apiGetPatient = async (id: number) => {
  const res = await client.get(`/patients/${id}`);
  return res.data;
};

export const apiCreatePatient = async (data: any) => {
  const res = await client.post("/patients", data);
  return res.data;
};

export const apiUpdatePatient = async (id: number, data: any) => {
  const res = await client.put(`/patients/${id}`, data);
  return res.data;
};

export const apiDeletePatient = async (id: number) => {
  const res = await client.delete(`/patients/${id}`);
  return res.data;
};

export const apiSearchPatients = async (query: string) => {
  const res = await client.get("/patients/search", { params: { q: query } });
  return res.data;
};

export const apiGetPatientHistory = async (id: number) => {
  const res = await client.get(`/patients/${id}/history`);
  return res.data;
};

export const apiGetPatientBalance = async (id: number) => {
  const res = await client.get(`/patients/${id}/balance`);
  return res.data;
};

export const apiGetPatientFiles = async (id: number) => {
  const res = await client.get(`/patients/${id}/files`);
  return res.data;
};

// ─── Dental Chart ───────────────────────────────────────────

export const apiGetDentalChart = async (id: number) => {
  const res = await client.get(`/patients/${id}/chart`);
  return res.data;
};

// unified update endpoint (IMPORTANT: consistent REST style)
export const apiUpdateDentalChart = async (patientId: number, data: any) => {
  const res = await client.put(`/patients/${patientId}/chart`, data);
  return res.data;
};

export const apiUpdateToothCondition = async (
  patientId: number,
  toothData: any
) => {
  const res = await client.patch(
    `/patients/${patientId}/chart/tooth`,
    toothData
  );
  return res.data;
};

export const apiGetAllergies = async (patientId: number) => {
  const res = await client.get(`/patients/${patientId}/allergies`);
  return res.data;
};

export const apiGetConditions = async (patientId: number) => {
  const res = await client.get(`/patients/${patientId}/conditions`);
  return res.data;
};