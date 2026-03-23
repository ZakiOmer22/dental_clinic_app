// ─────────────────────────────────────────────────────────────
// src/api/logs.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

export interface LogEntry {
    id: number;
    timestamp: string;
    severity: 'error' | 'warning' | 'info' | 'debug' | 'success';
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

/**
 * Get system logs with filtering
 */
export const apiGetLogs = async (params?: {
    severity?: string;
    module?: string;
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
}): Promise<LogsResponse> => {
    try {
        const res = await client.get("/logs", { params });
        return res.data;
    } catch (error: any) {
        console.error('Error fetching logs:', error.response?.data || error.message);
        // Return empty data on error
        return {
            data: [],
            counts: { error: 0, warning: 0, info: 0, debug: 0, success: 0 },
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0
        };
    }
};

/**
 * Clear all logs (admin only)
 */
export const apiClearLogs = async (): Promise<{ success: boolean; message: string; count: number }> => {
    try {
        const res = await client.delete("/logs");
        return res.data;
    } catch (error: any) {
        console.error('Error clearing logs:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Export logs as CSV
 */
export const apiExportLogs = async (params?: {
    severity?: string;
    module?: string;
    start_date?: string;
    end_date?: string;
}): Promise<Blob> => {
    try {
        const res = await client.post("/logs/export", params, {
            responseType: 'blob'
        });
        return res.data;
    } catch (error: any) {
        console.error('Error exporting logs:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get log statistics
 */
export const apiGetLogStats = async (): Promise<LogStats> => {
    try {
        const res = await client.get("/logs/stats");
        return res.data;
    } catch (error: any) {
        console.error('Error fetching log stats:', error.response?.data || error.message);
        return {
            total: 0,
            last_24h: 0,
            last_7d: 0,
            by_severity: {},
            by_module: {},
            top_errors: []
        };
    }
};

/**
 * Get a single log entry by ID
 */
export const apiGetLog = async (id: number): Promise<LogEntry> => {
    try {
        const res = await client.get(`/logs/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('Error fetching log:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete a single log entry (admin only)
 */
export const apiDeleteLog = async (id: number): Promise<{ success: boolean }> => {
    try {
        const res = await client.delete(`/logs/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('Error deleting log:', error.response?.data || error.message);
        throw error;
    }
};