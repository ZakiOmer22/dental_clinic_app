import client from "./client";

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

// ─────────────────────────────
// INVENTORY ITEMS
// ─────────────────────────────

export const apiGetInventory = async (params?: any) => {
  const res = await client.get("/inventory", { params });
  return res.data;
};

export const apiCreateInventoryItem = async (data: Partial<InventoryItem>) => {
  const res = await client.post("/inventory", data);
  return res.data;
};

export const apiUpdateInventoryItem = async (
  id: number,
  data: Partial<InventoryItem>
) => {
  const res = await client.put(`/inventory/${id}`, data);
  return res.data;
};

// ─────────────────────────────
// ALERTS
// ─────────────────────────────

export const apiGetLowStock = async () => {
  const res = await client.get("/inventory/alerts");
  return res.data;
};

// ─────────────────────────────
// TRANSACTIONS
// ─────────────────────────────

export const apiRecordInventoryTransaction = async (
  data: InventoryTransaction
) => {
  const res = await client.post("/inventory/transaction", data);
  return res.data;
};