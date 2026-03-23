import client from "./client";

export const apiGetInventory = async (params?: any) => {
  const res = await client.get("/inventory", { params });
  return res.data;
};

export const apiGetLowStock = async () => {
  const res = await client.get("/inventory/alerts");
  return res.data;
};

export const apiCreateInventoryItem = async (data: any) => {
  const res = await client.post("/inventory", data);
  return res.data;
};

export const apiUpdateInventoryItem = async (id: number, data: any) => {
  const res = await client.put(`/inventory/${id}`, data);
  return res.data;
};

export const apiRecordInventoryTransaction = async (data: any) => {
  const res = await client.post("/inventory/transaction", data);
  return res.data;
};
