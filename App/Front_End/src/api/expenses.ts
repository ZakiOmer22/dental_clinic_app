// ─────────────────────────────────────────────────────────────
// src/api/expenses.ts
// ─────────────────────────────────────────────────────────────
import client from "./client";
 
export const apiGetExpenses = async (params?: any) => {
  const res = await client.get("/expenses", { params });
  return res.data;
};
 
export const apiCreateExpense = async (data: any) => {
  const res = await client.post("/expenses", data);
  return res.data;
};
 
export const apiUpdateExpense = async (id: number, data: any) => {
  const res = await client.put(`/expenses/${id}`, data);
  return res.data;
};
 
export const apiDeleteExpense = async (id: number) => {
  const res = await client.delete(`/expenses/${id}`);
  return res.data;
};
 
export const apiGetExpenseSummary = async (params?: any) => {
  const res = await client.get("/expenses/summary", { params });
  return res.data; // { total, by_category: [], by_month: [] }
};