import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export interface LabOrder {
  id: number;
  patient_id: number;
  treatment_id?: number;
  lab_name?: string;
  order_type: string;
  shade?: string;
  instructions?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  created_at?: string;
}

// ─────────────────────────────
// LAB ORDERS
// ─────────────────────────────

export const apiGetLabOrders = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/lab-orders`, { params })).data;
};

export const apiGetLabOrder = async (id: number) => {
  return (await client.get(`${API_PREFIX}/lab-orders/${id}`)).data;
};

export const apiCreateLabOrder = async (data: Partial<LabOrder>) => {
  return (await client.post(`${API_PREFIX}/lab-orders`, data)).data;
};

export const apiUpdateLabOrder = async (id: number, data: Partial<LabOrder>) => {
  return (await client.put(`${API_PREFIX}/lab-orders/${id}`, data)).data;
};

export const apiDeleteLabOrder = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/lab-orders/${id}`)).data;
};