import client, { withApi } from "./client";

// ────────────────────────────────
// TYPES
// ────────────────────────────────
export interface ConsentForm {
  id: number;
  patient_id: number;
  title: string;
  content: string;
  status: "pending" | "signed";
  signed_by?: string;
  witness?: string;
  created_at: string;
}

// ────────────────────────────────
// API
// ────────────────────────────────
export const apiGetConsentForms = async (params?: {
  patientId?: number;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return (await client.get(withApi("/consent-forms"), { params })).data;
};

export const apiGetConsentForm = async (id: number) => {
  return (await client.get(withApi(`/consent-forms/${id}`))).data;
};

export const apiCreateConsentForm = async (data: {
  patientId: number;
  title: string;
  content: string;
}) => {
  return (await client.post(withApi("/consent-forms"), data)).data;
};

export const apiSignConsentForm = async (
  id: number,
  data: { signedBy: string; witness?: string }
) => {
  return (await client.patch(
    withApi(`/consent-forms/${id}/sign`),
    data
  )).data;
};

export const apiDeleteConsentForm = async (id: number) => {
  return (await client.delete(withApi(`/consent-forms/${id}`))).data;
};