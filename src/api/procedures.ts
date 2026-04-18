// ─────────────────────────────────────────────────────────────
// src/api/procedures.ts (CLEAN + SECURE)
// ─────────────────────────────────────────────────────────────

import client from "./client";

export interface Procedure {
  id: number;
  clinic_id: number;
  name: string;
  category: string;
  cdt_code?: string;
  base_price: number;
  duration_minutes: number;
  description?: string;
  requires_lab: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ProcedureFilters {
  category?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface ProcedureListResponse {
  data: Procedure[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProcedureData {
  name: string;
  category: string;
  cdt_code?: string;
  base_price: number;
  duration_minutes?: number;
  description?: string;
  requires_lab?: boolean;
}

// ─── Core CRUD ──────────────────────────────────────────────

export const apiGetProcedures = async (
  params?: ProcedureFilters
): Promise<ProcedureListResponse> => {
  const res = await client.get("/procedures", { params });
  return res.data;
};

export const apiGetProcedure = async (id: number): Promise<Procedure> => {
  const res = await client.get(`/procedures/${id}`);
  return res.data;
};

export const apiCreateProcedure = async (
  data: CreateProcedureData
): Promise<Procedure> => {
  const res = await client.post("/procedures", data);
  return res.data;
};

export const apiUpdateProcedure = async (
  id: number,
  data: Partial<CreateProcedureData>
): Promise<Procedure> => {
  const res = await client.put(`/procedures/${id}`, data);
  return res.data;
};

export const apiDeleteProcedure = async (
  id: number
): Promise<{ ok: boolean }> => {
  const res = await client.delete(`/procedures/${id}`);
  return res.data;
};

// ─── Additional features ────────────────────────────────────

export const apiGetProceduresByCategory = async (
  category: string
): Promise<Procedure[]> => {
  const res = await client.get(`/procedures/category/${category}`);
  return res.data;
};

export const apiGetProcedureCategories = async (): Promise<string[]> => {
  const res = await client.get("/procedures/categories");
  return res.data;
};

export const apiToggleProcedureStatus = async (
  id: number
): Promise<Procedure> => {
  const res = await client.patch(`/procedures/${id}/toggle`);
  return res.data;
};

export const apiGetProcedureStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  by_category: Record<string, number>;
}> => {
  const res = await client.get("/procedures/stats/summary");
  return res.data;
};

export const apiBulkImportProcedures = async (
  procedures: CreateProcedureData[]
): Promise<{ success: boolean; inserted: number }> => {
  const res = await client.post("/procedures/bulk-import", {
    procedures,
  });
  return res.data;
};