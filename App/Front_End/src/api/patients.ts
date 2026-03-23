import client from "./client";

export const apiGetPatients = async (params?: any) => {
  const res = await client.get("/patients", { params });
  return res.data; // { data: [], total, page }
};

export const apiGetPatient = async (id: number) => {
  const res = await client.get(`/patients/${id}`);
  return res.data;
};

export const apiCreatePatient = async (data: any) => {
  const res = await client.post("/patients", data);
  return res.data;
};

export const apiUpdatePatient = async (id: number, data: any) => {
  const res = await client.put(`/patients/${id}`, data);
  return res.data;
};

export const apiDeletePatient = async (id: number) => {
  const res = await client.delete(`/patients/${id}`);
  return res.data;
};

export const apiGetPatientHistory = async (id: number) => {
  const res = await client.get(`/patients/${id}/history`);
  return res.data;
};

export const apiGetPatientBalance = async (id: number) => {
  const res = await client.get(`/patients/${id}/balance`);
  return res.data;
};

export const apiGetPatientFiles = async (id: number) => {
  const res = await client.get(`/patients/${id}/files`);
  return res.data;
};

export const apiGetDentalChart = async (id: number) => {
  const res = await client.get(`/patients/${id}/chart`);
  return res.data;
};

// Add this missing function
export const apiUpdatePatientDentalChart = async (patientId: number, data: any) => {
  const res = await client.post(`/patients/${patientId}/chart`, data);
  return res.data;
};

export const apiUpdateToothCondition = async (patientId: number, toothData: any) => {
  const res = await client.patch(`/patients/${patientId}/chart/tooth`, toothData);
  return res.data;
};

export const apiBulkUpdateDentalChart = async (patientId: number, chartData: any[]) => {
  const res = await client.put(`/patients/${patientId}/chart`, { chart: chartData });
  return res.data;
};