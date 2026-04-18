// ─────────────────────────────────────────────────────────────
// src/api/logs.ts (CLEAN + SECURE)
// ─────────────────────────────────────────────────────────────

import client from "./client";

export interface LogEntry {
  id: number;
  timestamp: string;
  severity: "error" | "warning" | "info" | "debug" | "success";
  module: string;
  message: string;
  user_name?: string;
  user_id?: number;
  stack_trace?: string | null;
  metadata?: Record<string, any>;
}

export interface LogsResponse {
  data: LogEntry[];
  counts: {
    error: number;
    warning: number;
    info: number;
    debug: number;
    success: number;
  };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogStats {
  total: number;
  last_24h: number;
  last_7d: number;
  by_severity: Record<string, number>;
  by_module: Record<string, number>;
  top_errors: Array<{ message: string; count: number; module: string }>;
}

export const apiGetLogs = async (params?: any): Promise<LogsResponse> => {
  const res = await client.get("/logs", { params });
  return res.data;
};

export const apiGetLog = async (id: number): Promise<LogEntry> => {
  const res = await client.get(`/logs/${id}`);
  return res.data;
};

export const apiGetLogStats = async (): Promise<LogStats> => {
  const res = await client.get("/logs/stats");
  return res.data;
};

export const apiClearLogs = async (): Promise<{ success: boolean }> => {
  const res = await client.delete("/logs");
  return res.data;
};

export const apiDeleteLog = async (id: number): Promise<{ success: boolean }> => {
  const res = await client.delete(`/logs/${id}`);
  return res.data;
};

export const apiExportLogs = async (params?: any): Promise<Blob> => {
  const res = await client.post("/logs/export", params, {
    responseType: "blob",
  });
  return res.data;
};