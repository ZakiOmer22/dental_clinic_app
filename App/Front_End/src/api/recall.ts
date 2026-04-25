import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetRecallSchedule = async (params?: { status?: string }) => {
  return (await client.get(`${API_PREFIX}/recall`, { params })).data;
};

export const apiUpdateRecallStatus = async (id: number, status: string) => {
  return (
    await client.patch(`${API_PREFIX}/recall/${id}/status`, { status })
  ).data;
};