 
// ─────────────────────────────────────────────────────────────
// src/api/files.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiUploadFile = async (
  patientId: number,
  file: File,
  category: string,
  toothNumber?: string,
  description?: string,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patientId", String(patientId));
  formData.append("category", category);
  if (toothNumber)  formData.append("toothNumber", toothNumber);
  if (description)  formData.append("description", description);
 
  const res = await client.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { url, publicId }
};
 
export const apiDeleteFile = async (id: number) => {
  const res = await client.delete(`/files/${id}`);
  return res.data;
};
 