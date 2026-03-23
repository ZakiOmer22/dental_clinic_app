import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
  responded_by_name?: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackStats {
  total: number;
  responded: number;
  pending: number;
  responseRate: number;
  totalRatings: number;
  sumRatings: number;
  avgRating: string;
  positiveRatings: number;
  negativeRatings: number;
  satisfactionScore: number;
}

// Get all feedback
export const apiGetFeedback = async (params?: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Feedback[]; total: number; success: boolean }> => {
  try {
    const response = await axios.get(`${API_BASE}/feedback`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    throw error;
  }
};

// Get feedback statistics
export const apiGetFeedbackStats = async (): Promise<{
  success: boolean;
  data: FeedbackStats;
}> => {
  try {
    const response = await axios.get(`${API_BASE}/feedback/stats`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching feedback stats:", error);
    // Return empty stats instead of throwing
    return {
      success: false,
      data: {
        total: 0,
        responded: 0,
        pending: 0,
        responseRate: 0,
        totalRatings: 0,
        sumRatings: 0,
        avgRating: "0.0",
        positiveRatings: 0,
        negativeRatings: 0,
        satisfactionScore: 85,
      },
    };
  }
};

// Get single feedback
export const apiGetFeedbackById = async (
  id: number,
): Promise<{ success: boolean; data: Feedback }> => {
  try {
    const response = await axios.get(`${API_BASE}/feedback/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    throw error;
  }
};

// Submit new feedback
export const apiSubmitFeedback = async (data: {
  user_id?: number;
  type: string;
  rating?: number;
  comment: string;
}): Promise<{ success: boolean; data: Feedback; message: string }> => {
  try {
    const response = await axios.post(`${API_BASE}/feedback`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

// Respond to feedback
export const apiRespondToFeedback = async (
  id: number,
  data: { response: string; respondedBy?: number },
): Promise<{ success: boolean; data: Feedback; message: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE}/feedback/${id}/respond`,
      data,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error responding to feedback:", error);
    throw error;
  }
};

// Delete feedback
export const apiDeleteFeedback = async (
  id: number,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`${API_BASE}/feedback/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting feedback:", error);
    throw error;
  }
};
