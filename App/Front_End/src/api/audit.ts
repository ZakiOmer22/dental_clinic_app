// ─────────────────────────────────────────────────────────────
// src/api/audit.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

export interface AuditEntry {
    id: number;
    user_id: number | null;
    user_name?: string;
    clinic_id: number;
    table_name: string;
    action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'backup' | 'restore' | 'clear';
    record_id: number | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    description?: string;
    changes?: {
        old: Record<string, any>;
        new: Record<string, any>;
    };
}

export interface AuditResponse {
    data: AuditEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AuditFilters {
    tableName?: string;
    action?: string;
    userId?: number;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    search?: string;
}

/**
 * Get audit logs with filtering
 */
export const apiGetAuditLogs = async (params?: AuditFilters): Promise<AuditResponse> => {
    try {
        const res = await client.get("/audit-logs", { params });
        return res.data;
    } catch (error: any) {
        console.error('Error fetching audit logs:', error.response?.data || error.message);
        return {
            data: [],
            total: 0,
            page: params?.page || 1,
            limit: params?.limit || 50,
            totalPages: 0
        };
    }
};

/**
 * Get audit trail for a specific record
 */
export const apiGetAuditTrailForRecord = async (tableName: string, recordId: number): Promise<AuditEntry[]> => {
    try {
        const res = await client.get(`/audit-logs/record/${tableName}/${recordId}`);
        return res.data;
    } catch (error: any) {
        console.error('Error fetching record audit trail:', error.response?.data || error.message);
        return [];
    }
};

/**
 * Get audit statistics
 */
export const apiGetAuditStats = async (params?: { from?: string; to?: string }): Promise<{
    total: number;
    by_action: Record<string, number>;
    by_table: Record<string, number>;
    by_user: Record<string, number>;
    recent_activity: AuditEntry[];
}> => {
    try {
        const res = await client.get("/audit-logs/stats", { params });
        return res.data;
    } catch (error: any) {
        console.error('Error fetching audit stats:', error.response?.data || error.message);
        return {
            total: 0,
            by_action: {},
            by_table: {},
            by_user: {},
            recent_activity: []
        };
    }
};

/**
 * Export audit logs as CSV
 */
export const apiExportAuditLogs = async (params?: AuditFilters): Promise<Blob> => {
    try {
        const res = await client.post("/audit-logs/export", params, {
            responseType: 'blob'
        });
        return res.data;
    } catch (error: any) {
        console.error('Error exporting audit logs:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get unique tables that have audit logs
 */
export const apiGetAuditTables = async (): Promise<string[]> => {
    try {
        const res = await client.get("/audit-logs/tables");
        return res.data;
    } catch (error: any) {
        console.error('Error fetching audit tables:', error.response?.data || error.message);
        return [];
    }
};

/**
 * Get unique actions that appear in audit logs
 */
export const apiGetAuditActions = async (): Promise<string[]> => {
    try {
        const res = await client.get("/audit-logs/actions");
        return res.data;
    } catch (error: any) {
        console.error('Error fetching audit actions:', error.response?.data || error.message);
        return [];
    }
};

/**
 * Get a single audit entry by ID
 */
export const apiGetAuditEntry = async (id: number): Promise<AuditEntry | null> => {
    try {
        const res = await client.get(`/audit-logs/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('Error fetching audit entry:', error.response?.data || error.message);
        return null;
    }
};