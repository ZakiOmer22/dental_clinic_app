// ─────────────────────────────────────────────────────────────
// src/api/backups.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

export interface Backup {
  id: number;
  filename: string;
  file_size: number;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'completed' | 'failed' | 'in_progress';
  notes?: string;
  download_url?: string;
}

export interface BackupResponse {
  data: Backup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BackupSettings {
  auto_backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_time: string;
  retention_days: number;
  backup_location: string;
  cloud_backup_enabled?: boolean;
  last_cleanup_at?: string | null;
}

export interface BackupStatus {
  latest_backup: {
    created_at: string;
    status: string;
    type: string;
    file_size: number;
  } | null;
  stats: {
    total_backups: number;
    total_size: number;
    formatted_total_size: string;
    successful_backups: number;
    failed_backups: number;
    last_backup: string | null;
  };
  storage: {
    free: number;
    total: number;
    formatted_free: string;
    formatted_total: string;
    backup_count: number;
  };
}

/**
 * Get all backups
 */
export const apiGetBackups = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}): Promise<BackupResponse> => {
  try {
    const res = await client.get("/backups", { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching backups:', error);
    // Return empty data on error
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0
    };
  }
};

/**
 * Create a new backup
 */
export const apiCreateBackup = async (data?: {
  type?: 'manual' | 'scheduled';
  notes?: string;
}): Promise<Backup> => {
  try {
    const res = await client.post("/backups", data || {});
    return res.data;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Download a backup file
 */
export const apiDownloadBackup = async (id: number): Promise<Blob> => {
  try {
    const res = await client.get(`/backups/${id}/download`, {
      responseType: 'blob'
    });
    return res.data;
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
};

/**
 * Restore from a backup
 */
export const apiRestoreBackup = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await client.post(`/backups/${id}/restore`);
    return res.data;
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
};

/**
 * Delete a backup
 */
export const apiDeleteBackup = async (id: number): Promise<{ success: boolean }> => {
  try {
    const res = await client.delete(`/backups/${id}`);
    return res.data;
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw error;
  }
};

/**
 * Get backup settings
 */
export const apiGetBackupSettings = async (): Promise<BackupSettings> => {
  try {
    const res = await client.get("/backups/settings");
    return res.data;
  } catch (error) {
    console.error('Error fetching backup settings:', error);
    // Return default settings on error
    return {
      auto_backup_enabled: true,
      backup_frequency: 'daily',
      backup_time: '02:00',
      retention_days: 30,
      backup_location: './backups',
      cloud_backup_enabled: false,
      last_cleanup_at: null
    };
  }
};

/**
 * Update backup settings
 */
export const apiUpdateBackupSettings = async (data: Partial<BackupSettings>): Promise<BackupSettings> => {
  try {
    const res = await client.put("/backups/settings", data);
    return res.data;
  } catch (error) {
    console.error('Error updating backup settings:', error);
    throw error;
  }
};

/**
 * Test backup connection
 */
export const apiTestBackupConnection = async (): Promise<{ 
  success: boolean; 
  message: string;
  details: {
    host: string;
    port: string;
    database: string;
    user: string;
  }
}> => {
  try {
    const res = await client.post("/backups/test-connection");
    return res.data;
  } catch (error) {
    console.error('Error testing backup connection:', error);
    throw error;
  }
};

/**
 * Get backup status
 */
export const apiGetBackupStatus = async (): Promise<BackupStatus> => {
  try {
    const res = await client.get("/backups/status");
    return res.data;
  } catch (error) {
    console.error('Error fetching backup status:', error);
    // Return default status on error
    return {
      latest_backup: null,
      stats: {
        total_backups: 0,
        total_size: 0,
        formatted_total_size: '0 B',
        successful_backups: 0,
        failed_backups: 0,
        last_backup: null
      },
      storage: {
        free: 0,
        total: 0,
        formatted_free: '0 B',
        formatted_total: '0 B',
        backup_count: 0
      }
    };
  }
};

/**
 * Get backup logs
 */
export const apiGetBackupLogs = async (params?: {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}): Promise<{ data: Backup[]; total: number; page: number; limit: number }> => {
  try {
    const res = await client.get("/backups/logs", { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching backup logs:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 50
    };
  }
};

/**
 * Verify backup integrity
 */
export const apiVerifyBackup = async (id: number): Promise<{
  verified: boolean;
  file_exists: boolean;
  size_match: boolean;
  is_valid_sql: boolean;
  file_size: number;
  expected_size: number;
  message: string;
  error?: string;
}> => {
  try {
    const res = await client.post(`/backups/${id}/verify`);
    return res.data;
  } catch (error) {
    console.error('Error verifying backup:', error);
    throw error;
  }
};

/**
 * Clean up old backups
 */
export const apiCleanupBackups = async (data: {
  older_than_days: number;
}): Promise<{
  success: boolean;
  message: string;
  deleted_count: number;
  freed_space: number;
  formatted_freed_space: string;
}> => {
  try {
    const res = await client.post("/backups/cleanup", data);
    return res.data;
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    throw error;
  }
};