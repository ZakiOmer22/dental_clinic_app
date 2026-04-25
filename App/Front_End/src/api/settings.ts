import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetClinic = async () => {
  return (await client.get(`${API_PREFIX}/settings/clinic`)).data;
};

export const apiUpdateClinic = async (data: any) => {
  return (await client.put(`${API_PREFIX}/settings/clinic`, data)).data;
};