import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

// (TYPES unchanged)

export const apiGetInvoices = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/invoices`, { params })).data;
};

export const apiGetInvoiceById = async (id: number) => {
  return (await client.get(`${API_PREFIX}/invoices/${id}`)).data;
};

export const apiGetInvoiceItems = async (invoiceId: number) => {
  return (await client.get(`${API_PREFIX}/invoices/${invoiceId}/items`)).data;
};

export const apiCreateInvoice = async (data: any) => {
  return (await client.post(`${API_PREFIX}/invoices`, data)).data;
};

export const apiUpdateInvoice = async (id: number, data: any) => {
  return (await client.patch(`${API_PREFIX}/invoices/${id}`, data)).data;
};

export const apiDeleteInvoice = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/invoices/${id}`)).data;
};

// PAYMENTS

export const apiCreatePayment = async (data: any) => {
  return (await client.post(`${API_PREFIX}/payments`, data)).data;
};

export const apiGetPayments = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/payments`, { params })).data;
};

export const apiGetPaymentById = async (id: number) => {
  return (await client.get(`${API_PREFIX}/payments/${id}`)).data;
};

// RECEIPTS

export const apiPrintReceipt = async (paymentId: number): Promise<Blob> => {
  const res = await client.get(`${API_PREFIX}/payments/${paymentId}/receipt`, {
    responseType: "blob",
  });
  return res.data;
};