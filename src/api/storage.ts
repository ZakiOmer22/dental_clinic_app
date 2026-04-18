import client from "./client";

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
  const res = await client.get("/storage/stats");
  return res.data;
};

// GET files
export const apiGetFiles = async (params?: any) => {
  const res = await client.get("/storage/files", { params });
  return res.data;
};

// UPLOAD file
export const apiUploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await client.post("/storage/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

// DELETE file
export const apiDeleteFile = async (id: number) => {
  const res = await client.delete(`/storage/files/${id}`);
  return res.data;
};

// GET download URL
export const apiGetFileUrl = async (id: number) => {
  const res = await client.get(`/storage/files/${id}/download`);
  return res.data;
};

// CLEANUP
export const apiCleanupStorage = async (data?: any) => {
  const res = await client.post("/storage/cleanup", data || {});
  return res.data;
};

// SEARCH
export const apiSearchFiles = async (query: string) => {
  const res = await client.get("/storage/search", { params: { q: query } });
  return res.data;
};