
// ─────────────────────────────────────────────────────────────
// src/api/labOrders.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiGetLabOrders = async (params?: any) => {
  const res = await client.get("/lab-orders", { params });
  return res.data;
};
 
export const apiGetLabOrder = async (id: number) => {
  const res = await client.get(`/lab-orders/${id}`);
  return res.data;
};
 
export const apiCreateLabOrder = async (data: any) => {
  const res = await client.post("/lab-orders", data);
  return res.data;
};
 
export const apiUpdateLabOrder = async (id: number, data: any) => {
  const res = await client.put(`/lab-orders/${id}`, data);
  return res.data;
};
 
export const apiDeleteLabOrder = async (id: number) => {
  const res = await client.delete(`/lab-orders/${id}`);
  return res.data;
};