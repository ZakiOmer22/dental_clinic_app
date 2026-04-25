import client, { withApi } from "./client";

// ────────────────────────────────
// TYPES (unchanged)
// ────────────────────────────────
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

// ────────────────────────────────
// CORE API (SECURED)
// ────────────────────────────────
export const apiGetBackups = async (params?: any): Promise<BackupResponse> => {
  const res = await client.get(withApi("/backups"), { params });
  return res.data;
};

export const apiCreateBackup = async (data?: any): Promise<Backup> => {
  const res = await client.post(withApi("/backups"), data || {});
  return res.data;
};

export const apiDownloadBackup = async (id: number): Promise<Blob> => {
  const res = await client.get(withApi(`/backups/${id}/download`), {
    responseType: "blob"
  });
  return res.data;
};

export const apiRestoreBackup = async (id: number) => {
  const res = await client.post(withApi(`/backups/${id}/restore`));
  return res.data;
};

export const apiDeleteBackup = async (id: number) => {
  const res = await client.delete(withApi(`/backups/${id}`));
  return res.data;
};