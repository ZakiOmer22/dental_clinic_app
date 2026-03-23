import client from "./client";

export const apiGetInvoices = async (params?: any) => {
  const res = await client.get("/billing/invoices", { params });
  return res.data;
};

export const apiGetInvoice = async (id: number) => {
  const res = await client.get(`/billing/invoices/${id}`);
  return res.data;
};

export const apiCreateInvoice = async (data: any) => {
  const res = await client.post("/billing/invoices", data);
  return res.data;
};

export const apiRecordPayment = async (invoiceId: number, data: any) => {
  const res = await client.post(`/billing/invoices/${invoiceId}/payment`, data);
  return res.data;
};

export const apiGetPatientBillingBalance = async (patientId: number) => {
  const res = await client.get(`/billing/patient/${patientId}/balance`);
  return res.data;
};

export const apiDeleteInvoice = async (id: number) => {
  const res = await client.delete(`/billing/invoices/${id}`);
  return res.data;
};

export const apiCreatePayment = async (data: any) => {
  const res = await client.post("/billing/payments", data);
  return res.data;
};