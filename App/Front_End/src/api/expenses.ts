import client from "./client";

// ────────────────────────────────
// TYPES
// ────────────────────────────────
export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

// ────────────────────────────────
// API
// ────────────────────────────────
export const apiGetExpenses = async (params?: {
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) => {
  return (await client.get("/expenses", { params })).data;
};

export const apiCreateExpense = async (data: {
  title: string;
  amount: number;
  category: string;
  date: string;
}) => {
  return (await client.post("/expenses", data)).data;
};

export const apiUpdateExpense = async (
  id: number,
  data: Partial<Expense>
) => {
  return (await client.put(`/expenses/${id}`, data)).data;
};

export const apiDeleteExpense = async (id: number) => {
  return (await client.delete(`/expenses/${id}`)).data;
};

export const apiGetExpenseSummary = async (params?: {
  from?: string;
  to?: string;
}) => {
  return (await client.get("/expenses/summary", { params })).data;
};