import client from "./client";

export interface AuditEntry {
  id: number;
  created_at: string;
}

/**
 * NOTE:
 * Audit system is not implemented in backend yet.
 * These functions are disabled safely to prevent runtime errors.
 */

export const apiGetAuditLogs = async () => {
  console.warn("Audit logs API not implemented on backend");
  return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
};

export const apiGetAuditTrailForRecord = async () => {
  console.warn("Audit trail API not implemented on backend");
  return [];
};

export const apiGetAuditStats = async () => {
  console.warn("Audit stats API not implemented on backend");
  return {
    total: 0,
    by_action: {},
    by_table: {},
    by_user: {},
    recent_activity: []
  };
};

export const apiExportAuditLogs = async () => {
  throw new Error("Audit export not implemented on backend");
};

export const apiGetAuditTables = async () => [];
export const apiGetAuditActions = async () => [];
export const apiGetAuditEntry = async () => null;