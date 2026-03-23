// api/invoices.ts
import client from "./client";

export interface Invoice {
  id: number;
  clinic_id: number;
  patient_id: number;
  treatment_id?: number;
  invoice_number: string;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount_type: 'percent' | 'fixed' | 'none';
  discount_value: number;
  discount_amount: number;
  insurance_covered: number;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'unpaid' | 'partial' | 'paid' | 'void' | 'refunded';
  due_date?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceData {
  patient_id: number;
  treatment_id?: number;
  items: Array<{
    procedure_id?: number;
    description: string;
    tooth_number?: string;
    quantity: number;
    unit_price: number;
  }>;
  discount_type?: 'percent' | 'fixed' | 'none';
  discount_value?: number;
  insurance_covered?: number;
  due_date?: string;
  notes?: string;
}

export interface CreatePaymentData {
  invoice_id: number;
  amount: number;
  method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'insurance' | 'cheque' | 'other';
  reference_number?: string;
  change_given?: number;
  notes?: string;
}

/**
 * Get all invoices
 */
export const apiGetInvoices = async (params?: any) => {
  const res = await client.get("/invoices", { params });
  return res.data;
};

/**
 * Get a single invoice by ID
 */
export const apiGetInvoiceById = async (id: number): Promise<Invoice> => {
  const res = await client.get(`/invoices/${id}`);
  return res.data;
};

/**
 * Get invoice items for a specific invoice
 */
export const apiGetInvoiceItems = async (invoiceId: number) => {
  const res = await client.get(`/invoices/${invoiceId}/items`);
  return res.data;
};

/**
 * Get payments for a specific invoice
 */
export const apiGetInvoicePayments = async (invoiceId: number) => {
  const res = await client.get(`/invoices/${invoiceId}/payments`);
  return res.data;
};

/**
 * Create a new invoice
 */
export const apiCreateInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
  const res = await client.post("/invoices", data);
  return res.data;
};

/**
 * Update an invoice
 */
export const apiUpdateInvoice = async (id: number, data: any): Promise<Invoice> => {
  const res = await client.patch(`/invoices/${id}`, data);
  return res.data;
};

/**
 * Delete an invoice
 */
export const apiDeleteInvoice = async (id: number): Promise<void> => {
  const res = await client.delete(`/invoices/${id}`);
  return res.data;
};

/**
 * Create a payment for an invoice
 */
export const apiCreatePayment = async (data: CreatePaymentData) => {
  const res = await client.post("/payments", data);
  return res.data;
};

/**
 * Get all payments
 */
export const apiGetPayments = async (params?: any) => {
  const res = await client.get("/payments", { params });
  return res.data;
};

/**
 * Get payment by ID
 */
export const apiGetPaymentById = async (id: number) => {
  const res = await client.get(`/payments/${id}`);
  return res.data;
};

/**
 * Print receipt for payment
 */
export const apiPrintReceipt = async (paymentId: number): Promise<Blob> => {
  const res = await client.get(`/payments/${paymentId}/receipt`, {
    responseType: 'blob',
  });
  return res.data;
};