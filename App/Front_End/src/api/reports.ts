import client from "./client";

export const apiGetRevenueReport = async (params?: any) => {
  const res = await client.get("/reports/revenue", { params });
  return res.data;
};

export const apiGetDailySchedule = async (params?: any) => {
  const res = await client.get("/reports/schedule", { params });
  return res.data;
};

export const apiGetRecallsDue = async () => {
  const res = await client.get("/reports/recalls");
  return res.data;
};

export const apiGetExpenses = async (params?: any) => {
  const res = await client.get("/reports/expenses", { params });
  return res.data;
};

export const apiGetReports = async (reportType: string, params?: any) => {
  const res = await client.get(`/reports/${reportType}`, { params });
  return res.data;
};

export const apiGetRevenue = async (params?: any) => {
  const res = await client.get("/reports/revenue-breakdown", { params });
  return res.data;
};
