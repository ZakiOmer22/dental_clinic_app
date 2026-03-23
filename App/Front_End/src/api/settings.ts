
// ─────────────────────────────────────────────────────────────
// src/api/settings.ts
// ─────────────────────────────────────────────────────────────

import client from "./client";

 
export const apiGetClinic = async () => {
  const res = await client.get("/settings/clinic");
  return res.data;
};
 
export const apiUpdateClinic = async (data: any) => {
  const res = await client.put("/settings/clinic", data);
  return res.data;
};
 
export const apiGetRooms = async () => {
  const res = await client.get("/rooms");
  return res.data;
};
 
export const apiCreateRoom = async (data: any) => {
  const res = await client.post("/rooms", data);
  return res.data;
};
 
export const apiUpdateRoom = async (id: number, data: any) => {
  const res = await client.put(`/rooms/${id}`, data);
  return res.data;
};
 
export const apiDeleteRoom = async (id: number) => {
  const res = await client.delete(`/rooms/${id}`);
  return res.data;
};