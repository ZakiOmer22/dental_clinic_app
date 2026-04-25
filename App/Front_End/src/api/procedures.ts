import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

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

// ─────────────────────────────────────────────
// CORE CRUD
// ─────────────────────────────────────────────

export const apiGetProcedures = async (
  params?: ProcedureFilters
): Promise<ProcedureListResponse> => {
  return (
    await client.get(`${API_PREFIX}/procedures`, { params })
  ).data;
};

export const apiGetProcedure = async (id: number): Promise<Procedure> => {
  return (await client.get(`${API_PREFIX}/procedures/${id}`)).data;
};

export const apiCreateProcedure = async (
  data: CreateProcedureData
): Promise<Procedure> => {
  return (await client.post(`${API_PREFIX}/procedures`, data)).data;
};

export const apiUpdateProcedure = async (
  id: number,
  data: Partial<CreateProcedureData>
): Promise<Procedure> => {
  return (
    await client.put(`${API_PREFIX}/procedures/${id}`, data)
  ).data;
};

export const apiDeleteProcedure = async (
  id: number
): Promise<{ ok: boolean }> => {
  return (await client.delete(`${API_PREFIX}/procedures/${id}`)).data;
};

// ─────────────────────────────────────────────
// EXTRA FEATURES
// ─────────────────────────────────────────────

export const apiGetProceduresByCategory = async (
  category: string
): Promise<Procedure[]> => {
  return (
    await client.get(`${API_PREFIX}/procedures/category/${category}`)
  ).data;
};

export const apiGetProcedureCategories = async (): Promise<string[]> => {
  return (await client.get(`${API_PREFIX}/procedures/categories`)).data;
};

export const apiToggleProcedureStatus = async (
  id: number
): Promise<Procedure> => {
  return (
    await client.patch(`${API_PREFIX}/procedures/${id}/toggle`)
  ).data;
};

export const apiGetProcedureStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  by_category: Record<string, number>;
}> => {
  return (
    await client.get(`${API_PREFIX}/procedures/stats/summary`)
  ).data;
};

export const apiBulkImportProcedures = async (
  procedures: CreateProcedureData[]
): Promise<{ success: boolean; inserted: number }> => {
  return (
    await client.post(`${API_PREFIX}/procedures/bulk-import`, {
      procedures,
    })
  ).data;
};