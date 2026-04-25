// ─────────────────────────────
// APPOINTMENTS 
// ─────────────────────────────
import client, { withApi } from "./client";

export const apiGetAppointments = async (params?: any) => {
  const res = await client.get(withApi("/appointments"), { params });
  return res.data;
};

export const apiCreateAppointment = async (data: any) => {
  const res = await client.post(withApi("/appointments"), data);
  return res.data;
};

export const apiUpdateAppointment = async (id: number, data: any) => {
  const res = await client.put(withApi(`/appointments/${id}`), data);
  return res.data;
};

export const apiDeleteAppointment = async (id: number) => {
  const res = await client.delete(withApi(`/appointments/${id}`));
  return res.data;
};

export const apiSendAppointmentReminder = async (id: number) => {
  const res = await client.post(withApi(`/appointments/${id}/send-reminder`));
  return res.data;
};