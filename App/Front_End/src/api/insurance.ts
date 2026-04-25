import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

// ─────────────────────────────
// TYPES
// ─────────────────────────────

export interface InsurancePolicy {
  id: number;
  patient_id: number;
  provider: string;
  policy_number: string;
  coverage_percentage?: number;
  max_coverage?: number;
  expiry_date?: string;
  status?: string;
}

export interface InsuranceClaim {
  id: number;
  policy_id: number;
  patient_id: number;
  amount: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  created_at: string;
}

// ─────────────────────────────
// POLICIES
// ─────────────────────────────

export const apiGetInsurancePolicies = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/insurance/policies`, { params })).data;
};

export const apiGetInsurancePolicy = async (id: number) => {
  return (await client.get(`${API_PREFIX}/insurance/policies/${id}`)).data;
};

export const apiCreateInsurancePolicy = async (data: Partial<InsurancePolicy>) => {
  return (await client.post(`${API_PREFIX}/insurance/policies`, data)).data;
};

export const apiUpdateInsurancePolicy = async (id: number, data: Partial<InsurancePolicy>) => {
  return (await client.put(`${API_PREFIX}/insurance/policies/${id}`, data)).data;
};

export const apiDeleteInsurancePolicy = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/insurance/policies/${id}`)).data;
};

// ─────────────────────────────
// CLAIMS
// ─────────────────────────────

export const apiGetInsuranceClaims = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/insurance/claims`, { params })).data;
};

export const apiGetInsuranceClaim = async (id: number) => {
  return (await client.get(`${API_PREFIX}/insurance/claims/${id}`)).data;
};

export const apiCreateInsuranceClaim = async (data: Partial<InsuranceClaim>) => {
  return (await client.post(`${API_PREFIX}/insurance/claims`, data)).data;
};

export const apiUpdateInsuranceClaim = async (id: number, data: Partial<InsuranceClaim>) => {
  return (await client.put(`${API_PREFIX}/insurance/claims/${id}`, data)).data;
};

export const apiDeleteInsuranceClaim = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/insurance/claims/${id}`)).data;
};

// ─────────────────────────────
// ACTIONS
// ─────────────────────────────

export const apiSubmitInsuranceClaim = async (id: number) => {
  return (await client.patch(`${API_PREFIX}/insurance/claims/${id}/submit`)).data;
};

// ─────────────────────────────
// VALIDATION
// ─────────────────────────────

export const apiValidateInsuranceCoverage = async (data: {
  policyId: number;
  procedureCode: string;
  amount: number;
}) => {
  return (await client.post(`${API_PREFIX}/insurance/validate-coverage`, data)).data;
};