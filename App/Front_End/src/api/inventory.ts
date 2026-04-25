import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  min_stock_level?: number;
  unit?: string;
  cost_price?: number;
  selling_price?: number;
}

export interface InventoryTransaction {
  id?: number;
  item_id: number;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  created_at?: string;
}

// ITEMS

export const apiGetInventory = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/inventory`, { params })).data;
};

export const apiCreateInventoryItem = async (data: Partial<InventoryItem>) => {
  return (await client.post(`${API_PREFIX}/inventory`, data)).data;
};

export const apiUpdateInventoryItem = async (id: number, data: Partial<InventoryItem>) => {
  return (await client.put(`${API_PREFIX}/inventory/${id}`, data)).data;
};

// ALERTS

export const apiGetLowStock = async () => {
  return (await client.get(`${API_PREFIX}/inventory/alerts`)).data;
};

// TRANSACTIONS

export const apiRecordInventoryTransaction = async (data: InventoryTransaction) => {
  return (await client.post(`${API_PREFIX}/inventory/transaction`, data)).data;
};