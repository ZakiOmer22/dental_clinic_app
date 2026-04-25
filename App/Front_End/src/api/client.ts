import axios from "axios";
import { useAuthStore } from "@/app/store";

let _navigate: ((path: string) => void) | null = null;

export function setNavigate(fn: (path: string) => void) {
  _navigate = fn;
}

// ✅ NEW: API VERSION PREFIX (controlled from .env)
const API_VERSION = import.meta.env.VITE_API_VERSION || "v1";

// ✅ helper to prefix routes automatically
export const withApi = (url: string) => `/api/${API_VERSION}${url}`;

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ────────────────────────────────
// REQUEST INTERCEPTOR
// ────────────────────────────────
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ────────────────────────────────
// RESPONSE INTERCEPTOR
// ────────────────────────────────

let isHandling401 = false;

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401 && !isHandling401) {
      isHandling401 = true;

      useAuthStore.getState().clear();

      if (_navigate) {
        _navigate("/login");
      } else {
        window.location.replace("/login");
      }

      setTimeout(() => {
        isHandling401 = false;
      }, 2000);
    }

    return Promise.reject(err);
  }
);

export default client;