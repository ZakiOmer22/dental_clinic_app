import axios from "axios";
import { useAuthStore } from "@/app/store";

const api = axios.create({
  baseURL: "http://localhost:3000", // adjust to your backend
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;