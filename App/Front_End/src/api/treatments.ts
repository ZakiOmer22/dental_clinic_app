import client from "./client";

export const apiGetTreatments = async (params?: any) => {
  const res = await client.get("/treatments", { params });
  return res.data;
};

export const apiGetTreatment = async (id: number) => {
  const res = await client.get(`/treatments/${id}`);
  return res.data;
};

export const apiCreateTreatment = async (data: any) => {
  const res = await client.post("/treatments", data);
  return res.data;
};

export const apiUpdateTreatment = async (id: number, data: any) => {
  const res = await client.put(`/treatments/${id}`, data);
  return res.data;
};

export const apiAddProcedure = async (treatmentId: number, data: any) => {
  const res = await client.post(`/treatments/${treatmentId}/procedures`, data);
  return res.data;
};

export const apiAddPrescription = async (treatmentId: number, data: any) => {
  const res = await client.post(`/treatments/${treatmentId}/prescriptions`, data);
  return res.data;
};

export const apiAddLabOrder = async (treatmentId: number, data: any) => {
  const res = await client.post(`/treatments/${treatmentId}/lab-orders`, data);
  return res.data;
};

export const apiGetProceduresCatalog = async () => {
  const res = await client.get("/procedures");
  return res.data;
};
