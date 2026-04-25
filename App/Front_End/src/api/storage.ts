import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export interface StorageFile {
  id: number;
  name: string;
  path: string;
  type: "image" | "pdf" | "document" | "backup" | "other";
  mime_type: string;
  size: number;
  uploaded_at: string;
  last_accessed: string;
  uploaded_by: number;
  clinic_id: number;
  cloudinary_public_id: string;
  cloudinary_url: string;
}

export interface StorageStats {
  total: number;
  used: number;
  free: number;
  byType: Record<string, number>;
  fileCount: number;
  usedPercent: number;
  cloudinary?: {
    plan: string;
    credits: any;
    usage: any;
  };
  formatted: {
    total: string;
    used: string;
    free: string;
  };
}

// GET stats
export const apiGetStorageStats = async () => {
  return (await client.get(`${API_PREFIX}/storage/stats`)).data;
};

// GET files
export const apiGetFiles = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/storage/files`, { params })).data;
};

// UPLOAD file
export const apiUploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return (
    await client.post(`${API_PREFIX}/storage/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};

// DELETE file
export const apiDeleteFile = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/storage/files/${id}`)).data;
};

// GET download URL
export const apiGetFileUrl = async (id: number) => {
  return (await client.get(`${API_PREFIX}/storage/files/${id}/download`)).data;
};

// CLEANUP
export const apiCleanupStorage = async (data?: any) => {
  return (await client.post(`${API_PREFIX}/storage/cleanup`, data || {})).data;
};

// SEARCH
export const apiSearchFiles = async (query: string) => {
  return (await client.get(`${API_PREFIX}/storage/search`, { params: { q: query } })).data;
};