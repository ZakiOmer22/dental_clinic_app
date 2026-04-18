import client from "./client";

// ────────────────────────────────
// TYPES
// ────────────────────────────────
export interface Feedback {
  id: number;
  user_id: number | null;
  user_name?: string;
  user_email?: string;
  type: string;
  rating: number | null;
  comment: string;
  response: string | null;
  responded_by: number | null;
  responded_at: string | null;
  created_at: string;
}

// ────────────────────────────────
// API
// ────────────────────────────────
export const apiGetFeedback = async (params?: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return (await client.get("/feedback", { params })).data;
};

export const apiGetFeedbackStats = async () => {
  return (await client.get("/feedback/stats")).data;
};

export const apiGetFeedbackById = async (id: number) => {
  return (await client.get(`/feedback/${id}`)).data;
};

export const apiSubmitFeedback = async (data: {
  type: string;
  rating?: number;
  comment: string;
}) => {
  return (await client.post("/feedback", data)).data;
};

export const apiRespondToFeedback = async (
  id: number,
  data: { response: string }
) => {
  return (await client.post(`/feedback/${id}/respond`, data)).data;
};

export const apiDeleteFeedback = async (id: number) => {
  return (await client.delete(`/feedback/${id}`)).data;
};