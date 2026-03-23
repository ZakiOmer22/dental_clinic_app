import client from "./client";

export const apiGetAppointments = async (params?: any) => {
  const res = await client.get("/appointments", { params });
  return res.data;
};

export const apiGetTodayAppointments = async () => {
  const res = await client.get("/appointments/today");
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

export const apiUpdateAppointmentStatus = async (id: number, status: string) => {
  const res = await client.patch(`/appointments/${id}/status`, { status });
  return res.data;
};

export const apiDeleteAppointment = async (id: number) => {
  const res = await client.delete(`/appointments/${id}`);
  return res.data;
};
