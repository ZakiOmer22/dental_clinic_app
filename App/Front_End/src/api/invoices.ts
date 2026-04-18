import client from "./client";

// ─────────────────────────────
// TYPES
// ─────────────────────────────

export interface Invoice {
  id: number;
  patient_id: number;
  treatment_id?: number;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: "draft" | "unpaid" | "partial" | "paid" | "void";
  created_at: string;
}

export interface CreateInvoiceData {
  patient_id: number;
  treatment_id?: number;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  discount_type?: "percent" | "fixed" | "none";
  discount_value?: number;
  notes?: string;
}

export interface CreatePaymentData {
  invoice_id: number;
  amount: number;
  method: "cash" | "card" | "mobile_money" | "bank_transfer";
  reference_number?: string;
}

// ─────────────────────────────
// INVOICES
// ─────────────────────────────

export const apiGetInvoices = async (params?: any) => {
  const res = await client.get("/invoices", { params });
  return res.data;
};

export const apiGetInvoiceById = async (id: number): Promise<Invoice> => {
  const res = await client.get(`/invoices/${id}`);
  return res.data;
};

export const apiGetInvoiceItems = async (invoiceId: number) => {
  const res = await client.get(`/invoices/${invoiceId}/items`);
  return res.data;
};

export const apiCreateInvoice = async (data: CreateInvoiceData) => {
  const res = await client.post("/invoices", data);
  return res.data;
};

export const apiUpdateInvoice = async (id: number, data: any) => {
  const res = await client.patch(`/invoices/${id}`, data);
  return res.data;
};

export const apiDeleteInvoice = async (id: number) => {
  const res = await client.delete(`/invoices/${id}`);
  return res.data;
};

// ─────────────────────────────
// PAYMENTS
// ─────────────────────────────

export const apiCreatePayment = async (data: CreatePaymentData) => {
  const res = await client.post("/payments", data);
  return res.data;
};

export const apiGetPayments = async (params?: any) => {
  const res = await client.get("/payments", { params });
  return res.data;
};

export const apiGetPaymentById = async (id: number) => {
  const res = await client.get(`/payments/${id}`);
  return res.data;
};

// ─────────────────────────────
// RECEIPTS
// ─────────────────────────────

export const apiPrintReceipt = async (paymentId: number): Promise<Blob> => {
  const res = await client.get(`/payments/${paymentId}/receipt`, {
    responseType: "blob",
  });
  return res.data;
};