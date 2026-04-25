import client, { withApi } from "./client";

// ─────────────────────────────
// TAX RATES
// ─────────────────────────────

export const apiGetTaxRates = async (params = {}) => {
  const res = await client.get(withApi("/financial/taxes"), { params });
  return res.data;
};

export const apiCreateTaxRate = async (data: any) => {
  const res = await client.post(withApi("/financial/taxes"), data);
  return res.data;
};

export const apiUpdateTaxRate = async (id: number, data: any) => {
  const res = await client.put(withApi(`/financial/taxes/${id}`), data);
  return res.data;
};

export const apiDeleteTaxRate = async (id: number) => {
  const res = await client.delete(withApi(`/financial/taxes/${id}`));
  return res.data;
};

// ─────────────────────────────
// PAYMENT TERMS
// ─────────────────────────────

export const apiGetPaymentTerms = async (params = {}) => {
  const res = await client.get(withApi("/financial/payment-terms"), { params });
  return res.data;
};

export const apiCreatePaymentTerm = async (data: any) => {
  const res = await client.post(withApi("/financial/payment-terms"), data);
  return res.data;
};

export const apiUpdatePaymentTerm = async (id: number, data: any) => {
  const res = await client.put(withApi(`/financial/payment-terms/${id}`), data);
  return res.data;
};

export const apiDeletePaymentTerm = async (id: number) => {
  const res = await client.delete(withApi(`/financial/payment-terms/${id}`));
  return res.data;
};

// ─────────────────────────────
// SETTINGS
// ─────────────────────────────

export const apiGetFinancialSettings = async () => {
  const res = await client.get(withApi("/financial/settings"));
  return res.data;
};

export const apiUpdateFinancialSettings = async (data: any) => {
  const res = await client.put(withApi("/financial/settings"), data);
  return res.data;
};