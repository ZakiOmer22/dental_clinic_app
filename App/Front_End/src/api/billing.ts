import client from "./client";

// ─── Invoices ────────────────────────────────────────────────
export const apiGetInvoices = async (params?: any) => {
  return (await client.get("/billing/invoices", { params })).data;
};

export const apiGetInvoice = async (id: number) => {
  return (await client.get(`/billing/invoices/${id}`)).data;
};

export const apiCreateInvoice = async (data: any) => {
  return (await client.post("/billing/invoices", data)).data;
};

export const apiDeleteInvoice = async (id: number) => {
  return (await client.delete(`/billing/invoices/${id}`)).data;
};

// ─── Payments (FIXED ROUTE) ─────────────────────────────────
export const apiCreatePayment = async (data: any) => {
  return (await client.post("/billing/payments", data)).data;
};

export const apiGetPayments = async (params?: any) => {
  return (await client.get("/billing/payments", { params })).data;
};

export const apiRecordPayment = async (invoiceId: number, data: any) => {
  return (await client.post(`/billing/invoices/${invoiceId}/payment`, data)).data;
};

// ─── Patient Balance ─────────────────────────────────────────
export const apiGetPatientBillingBalance = async (patientId: number) => {
  return (await client.get(`/billing/patient/${patientId}/balance`)).data;
};