// ─────────────────────────────────────────────────────────────
// src/api/patients.ts (UPDATED WITH VERSIONING)
// ─────────────────────────────────────────────────────────────

import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetPatients = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/patients`, { params })).data;
};

export const apiGetPatient = async (id: number) => {
  return (await client.get(`${API_PREFIX}/patients/${id}`)).data;
};

export const apiCreatePatient = async (data: any) => {
  return (await client.post(`${API_PREFIX}/patients`, data)).data;
};

export const apiUpdatePatient = async (id: number, data: any) => {
  return (await client.put(`${API_PREFIX}/patients/${id}`, data)).data;
};

export const apiDeletePatient = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/patients/${id}`)).data;
};

export const apiSearchPatients = async (query: string) => {
  return (await client.get(`${API_PREFIX}/patients/search`, { params: { q: query } })).data;
};

export const apiGetPatientHistory = async (id: number) => {
  return (await client.get(`${API_PREFIX}/patients/${id}/history`)).data;
};

export const apiGetPatientBalance = async (id: number) => {
  return (await client.get(`${API_PREFIX}/patients/${id}/balance`)).data;
};

export const apiGetPatientFiles = async (id: number) => {
  return (await client.get(`${API_PREFIX}/patients/${id}/files`)).data;
};

// ─── Dental Chart ───────────────────────────────────────────

export const apiGetDentalChart = async (id: number) => {
  return (await client.get(`${API_PREFIX}/patients/${id}/chart`)).data;
};

export const apiUpdateDentalChart = async (patientId: number, data: any) => {
  return (await client.put(`${API_PREFIX}/patients/${patientId}/chart`, data)).data;
};

export const apiUpdateToothCondition = async (
  patientId: number,
  toothData: any
) => {
  return (await client.patch(`${API_PREFIX}/patients/${patientId}/chart/tooth`, toothData)).data;
};

export const apiGetAllergies = async (patientId: number) => {
  return (await client.get(`${API_PREFIX}/patients/${patientId}/allergies`)).data;
};

export const apiGetConditions = async (patientId: number) => {
  return (await client.get(`${API_PREFIX}/patients/${patientId}/conditions`)).data;
};