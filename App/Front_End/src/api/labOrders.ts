import client from "./client";

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
  const res = await client.get("/lab-orders", { params });
  return res.data;
};

export const apiGetLabOrder = async (id: number) => {
  const res = await client.get(`/lab-orders/${id}`);
  return res.data;
};

export const apiCreateLabOrder = async (data: Partial<LabOrder>) => {
  const res = await client.post("/lab-orders", data);
  return res.data;
};

export const apiUpdateLabOrder = async (id: number, data: Partial<LabOrder>) => {
  const res = await client.put(`/lab-orders/${id}`, data);
  return res.data;
};

export const apiDeleteLabOrder = async (id: number) => {
  const res = await client.delete(`/lab-orders/${id}`);
  return res.data;
};