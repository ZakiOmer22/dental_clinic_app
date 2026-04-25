import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetReferrals = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/referrals`, { params })).data;
};

export const apiGetReferral = async (id: number) => {
  return (await client.get(`${API_PREFIX}/referrals/${id}`)).data;
};

export const apiCreateReferral = async (data: any) => {
  return (await client.post(`${API_PREFIX}/referrals`, data)).data;
};

export const apiUpdateReferral = async (id: number, data: any) => {
  return (await client.put(`${API_PREFIX}/referrals/${id}`, data)).data;
};

export const apiUpdateReferralStatus = async (
  id: number,
  status: string,
  feedbackNotes?: string
) => {
  return (
    await client.patch(`${API_PREFIX}/referrals/${id}/status`, {
      status,
      feedbackNotes,
    })
  ).data;
};

export const apiDeleteReferral = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/referrals/${id}`)).data;
};