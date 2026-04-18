import client from "./client";

export const apiGetClinic = async () => {
  const res = await client.get("/settings/clinic");
  return res.data;
};

export const apiUpdateClinic = async (data: any) => {
  const res = await client.put("/settings/clinic", data);
  return res.data;
};