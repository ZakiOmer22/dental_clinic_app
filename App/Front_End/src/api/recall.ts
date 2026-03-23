
// ─────────────────────────────────────────────────────────────
// src/api/recall.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiGetRecallSchedule = async (params?: { status?: string }) => {
  const res = await client.get("/recall", { params });
  return res.data;
};
 
export const apiUpdateRecallStatus = async (id: number, status: string) => {
  const res = await client.patch(`/recall/${id}/status`, { status });
  return res.data;
};