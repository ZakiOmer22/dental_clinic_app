import client from "./client";

// ─────────────────────────────
// APPOINTMENTS (SAFE BASE CRUD ONLY)
// ─────────────────────────────

export const apiGetAppointments = async (params?: any) => {
  const res = await client.get("/appointments", { params });
  return res.data;
};

export const apiCreateAppointment = async (data: any) => {
  const res = await client.post("/appointments", data);
  return res.data;
};

export const apiUpdateAppointment = async (id: number, data: any) => {
  const res = await client.put(`/appointments/${id}`, data);
  return res.data;
};

export const apiDeleteAppointment = async (id: number) => {
  const res = await client.delete(`/appointments/${id}`);
  return res.data;
};

export const apiSendAppointmentReminder = async (id: number) => {
  const res = await client.post(`/appointments/${id}/send-reminder`);
  return res.data;
};