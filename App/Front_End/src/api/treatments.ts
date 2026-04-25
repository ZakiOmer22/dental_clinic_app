import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

// ─────────────────────────────
// TREATMENTS
// ─────────────────────────────

export const apiGetTreatments = async (params?: any) => {
  const res = await client.get(`${API_PREFIX}/treatments`, { params });
  return res.data;
};

export const apiGetTreatment = async (id: number) => {
  const res = await client.get(`${API_PREFIX}/treatments/${id}`);
  return res.data;
};

export const apiCreateTreatment = async (data: any) => {
  const res = await client.post(`${API_PREFIX}/treatments`, data);
  return res.data;
};

export const apiUpdateTreatment = async (id: number, data: any) => {
  const res = await client.put(`${API_PREFIX}/treatments/${id}`, data);
  return res.data;
};

// ─────────────────────────────
// NESTED RESOURCES
// ─────────────────────────────

export const apiAddProcedure = async (treatmentId: number, data: any) => {
  const res = await client.post(
    `${API_PREFIX}/treatments/${treatmentId}/procedures`,
    data
  );
  return res.data;
};

export const apiAddPrescription = async (treatmentId: number, data: any) => {
  const res = await client.post(
    `${API_PREFIX}/treatments/${treatmentId}/prescriptions`,
    data
  );
  return res.data;
};

export const apiAddLabOrder = async (treatmentId: number, data: any) => {
  const res = await client.post(
    `${API_PREFIX}/treatments/${treatmentId}/lab-orders`,
    data
  );
  return res.data;
};

// DELETE THIS (already v1 routes cover it)
export const apiGetProceduresCatalog = async () => {
  const res = await client.get(`${API_PREFIX}/procedures`);
  return res.data;
};