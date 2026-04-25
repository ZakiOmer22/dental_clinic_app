// ─────────────────────────────────────────────────────────────
// src/api/logs.ts (UPDATED WITH VERSIONING)
// ─────────────────────────────────────────────────────────────

import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

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
  return (await client.get(`${API_PREFIX}/logs`, { params })).data;
};

export const apiGetLog = async (id: number): Promise<LogEntry> => {
  return (await client.get(`${API_PREFIX}/logs/${id}`)).data;
};

export const apiGetLogStats = async (): Promise<LogStats> => {
  return (await client.get(`${API_PREFIX}/logs/stats`)).data;
};

export const apiClearLogs = async (): Promise<{ success: boolean }> => {
  return (await client.delete(`${API_PREFIX}/logs`)).data;
};

export const apiDeleteLog = async (id: number): Promise<{ success: boolean }> => {
  return (await client.delete(`${API_PREFIX}/logs/${id}`)).data;
};

export const apiExportLogs = async (params?: any): Promise<Blob> => {
  const res = await client.post(`${API_PREFIX}/logs/export`, params, {
    responseType: "blob",
  });
  return res.data;
};