import client from "./client";

// ─────────────────────────────
// TAX RATES
// ─────────────────────────────

export const apiGetTaxRates = async (params = {}) => {
  const res = await client.get("/financial/taxes", { params });
  return res.data;
};

export const apiCreateTaxRate = async (data: any) => {
  const res = await client.post("/financial/taxes", data);
  return res.data;
};

export const apiUpdateTaxRate = async (id: number, data: any) => {
  const res = await client.put(`/financial/taxes/${id}`, data);
  return res.data;
};

export const apiDeleteTaxRate = async (id: number) => {
  const res = await client.delete(`/financial/taxes/${id}`);
  return res.data;
};

// ─────────────────────────────
// PAYMENT TERMS
// ─────────────────────────────

export const apiGetPaymentTerms = async (params = {}) => {
  const res = await client.get("/financial/payment-terms", { params });
  return res.data;
};

export const apiCreatePaymentTerm = async (data: any) => {
  const res = await client.post("/financial/payment-terms", data);
  return res.data;
};

export const apiUpdatePaymentTerm = async (id: number, data: any) => {
  const res = await client.put(`/financial/payment-terms/${id}`, data);
  return res.data;
};

export const apiDeletePaymentTerm = async (id: number) => {
  const res = await client.delete(`/financial/payment-terms/${id}`);
  return res.data;
};

// ─────────────────────────────
// SETTINGS
// ─────────────────────────────

export const apiGetFinancialSettings = async () => {
  const res = await client.get("/financial/settings");
  return res.data;
};

export const apiUpdateFinancialSettings = async (data: any) => {
  const res = await client.put("/financial/settings", data);
  return res.data;
};