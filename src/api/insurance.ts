import client from "./client";

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
  const res = await client.get("/insurance/policies", { params });
  return res.data;
};

export const apiGetInsurancePolicy = async (id: number) => {
  const res = await client.get(`/insurance/policies/${id}`);
  return res.data;
};

export const apiCreateInsurancePolicy = async (data: Partial<InsurancePolicy>) => {
  const res = await client.post("/insurance/policies", data);
  return res.data;
};

export const apiUpdateInsurancePolicy = async (
  id: number,
  data: Partial<InsurancePolicy>
) => {
  const res = await client.put(`/insurance/policies/${id}`, data);
  return res.data;
};

export const apiDeleteInsurancePolicy = async (id: number) => {
  const res = await client.delete(`/insurance/policies/${id}`);
  return res.data;
};

// ─────────────────────────────
// CLAIMS
// ─────────────────────────────

export const apiGetInsuranceClaims = async (params?: any) => {
  const res = await client.get("/insurance/claims", { params });
  return res.data;
};

export const apiGetInsuranceClaim = async (id: number) => {
  const res = await client.get(`/insurance/claims/${id}`);
  return res.data;
};

export const apiCreateInsuranceClaim = async (data: Partial<InsuranceClaim>) => {
  const res = await client.post("/insurance/claims", data);
  return res.data;
};

export const apiUpdateInsuranceClaim = async (
  id: number,
  data: Partial<InsuranceClaim>
) => {
  const res = await client.put(`/insurance/claims/${id}`, data);
  return res.data;
};

export const apiDeleteInsuranceClaim = async (id: number) => {
  const res = await client.delete(`/insurance/claims/${id}`);
  return res.data;
};

// ─────────────────────────────
// ACTIONS
// ─────────────────────────────

export const apiSubmitInsuranceClaim = async (id: number) => {
  const res = await client.patch(`/insurance/claims/${id}/submit`);
  return res.data;
};

// ─────────────────────────────
// VALIDATION (IMPORTANT SECURITY FIX)
// ─────────────────────────────

export const apiValidateInsuranceCoverage = async (data: {
  policyId: number;
  procedureCode: string;
  amount: number;
}) => {
  const res = await client.post("/insurance/validate-coverage", data);
  return res.data;
};