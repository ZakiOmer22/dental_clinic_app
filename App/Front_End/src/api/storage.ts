// ─────────────────────────────────────────────────────────────
// src/api/storage.ts - CLOUDINARY VERSION
// ─────────────────────────────────────────────────────────────

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

export interface StorageFilesResponse {
  data: StorageFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CleanupResponse {
  success: boolean;
  message: string;
  filesDeleted: number;
  spaceFreed: number;
  formattedSpaceFreed: string;
}

export interface UploadResponse extends StorageFile {}

/**
 * Get storage statistics from Cloudinary
 */
export const apiGetStorageStats = async (): Promise<StorageStats> => {
  try {
    const res = await client.get("/storage/stats");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching storage stats:", error);
    throw new Error(
      error.response?.data?.error || "Failed to fetch storage stats",
    );
  }
};

/**
 * Get files from database
 */
export const apiGetFiles = async (params?: {
  type?: string;
  page?: number;
  limit?: number;
}): Promise<StorageFilesResponse> => {
  try {
    const res = await client.get("/storage/files", { params });
    return res.data;
  } catch (error: any) {
    console.error("Error fetching files:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch files");
  }
};

/**
 * Upload file to Cloudinary
 */
export const apiUploadFile = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await client.post("/storage/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });
    return res.data;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw new Error(error.response?.data?.error || "Failed to upload file");
  }
};

/**
 * Delete file from Cloudinary
 */
export const apiDeleteFile = async (
  id: number,
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await client.delete(`/storage/files/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("Error deleting file:", error);
    throw new Error(error.response?.data?.error || "Failed to delete file");
  }
};

/**
 * Get file download URL
 */
export const apiGetFileUrl = async (id: number): Promise<{ url: string }> => {
  try {
    const res = await client.get(`/storage/files/${id}/download`);
    return res.data;
  } catch (error: any) {
    console.error("Error getting file URL:", error);
    throw new Error(error.response?.data?.error || "Failed to get file URL");
  }
};

/**
 * Download file from Cloudinary
 */
export const apiDownloadFile = async (id: number): Promise<void> => {
  try {
    const { url } = await apiGetFileUrl(id);
    window.open(url, "_blank");
  } catch (error: any) {
    console.error("Error downloading file:", error);
    throw new Error(error.response?.data?.error || "Failed to download file");
  }
};

/**
 * Clean up old files
 */
export const apiCleanupStorage = async (data?: {
  older_than_days?: number;
}): Promise<CleanupResponse> => {
  try {
    const res = await client.post(
      "/storage/cleanup",
      data || { older_than_days: 30 },
    );
    return res.data;
  } catch (error: any) {
    console.error("Error cleaning up storage:", error);
    throw new Error(
      error.response?.data?.error || "Failed to clean up storage",
    );
  }
};

/**
 * Search files
 */
export const apiSearchFiles = async (
  query: string,
): Promise<{ data: StorageFile[]; total: number }> => {
  try {
    const res = await client.get("/storage/search", { params: { q: query } });
    return res.data;
  } catch (error: any) {
    console.error("Error searching files:", error);
    throw new Error(error.response?.data?.error || "Failed to search files");
  }
};
