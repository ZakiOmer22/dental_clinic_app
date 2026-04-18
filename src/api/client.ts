import axios from "axios";
import { useAuthStore } from "@/app/store";

let _navigate: ((path: string) => void) | null = null;

export function setNavigate(fn: (path: string) => void) {
  _navigate = fn;
}

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

// Guard: prevents multiple simultaneous 401s from each calling clear() + redirect
let isHandling401 = false;

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    // ✅ FIX 2: Only handle 401 once, not for every concurrent failed request
    if (status === 401 && !isHandling401) {
      isHandling401 = true;

      useAuthStore.getState().clear();

      if (_navigate) {
        _navigate("/login");
      } else {
        window.location.replace("/login");
      }

      // Reset after navigation settles
      setTimeout(() => {
        isHandling401 = false;
      }, 2000);
    }

    return Promise.reject(err);
  }
);

export default client;