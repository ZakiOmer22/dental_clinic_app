import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetRevenueReport = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/reports/revenue`, { params })).data;
};

export const apiGetDailySchedule = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/reports/schedule`, { params })).data;
};

export const apiGetRecallsDue = async () => {
  return (await client.get(`${API_PREFIX}/reports/recalls`)).data;
};

export const apiGetExpensesReport = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/reports/expenses`, { params })).data;
};

export const apiGetRevenueBreakdown = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/reports/revenue-breakdown`, { params })).data;
};

export const apiGetDashboardStats = async () => {
  return (await client.get(`${API_PREFIX}/reports/dashboard`)).data;
};