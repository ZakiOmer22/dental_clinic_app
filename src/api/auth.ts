import client from "./client";

// ─────────────────────────────────────────────
// TYPES (HARDENED)
// ─────────────────────────────────────────────

export interface AuthUser {
  username: string;
  id: number;
  fullName: string;
  email: string;
  role: "super_admin" | "admin" | "dentist" | "receptionist" | "assistant" | "accountant" | "nurse";
  clinicId: number;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

export const apiLogin = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const res = await client.post("/auth/login", { email, password });
  return res.data;
};

// ─────────────────────────────────────────────
// REGISTER (SECURED)
// backend MUST assign role + clinicId
// ─────────────────────────────────────────────

export const apiRegister = async (
  data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }
): Promise<AuthResponse> => {
  const res = await client.post("/auth/register", data);
  return res.data;
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

export const apiLogout = async (): Promise<void> => {
  await client.post("/auth/logout").catch(() => {});
};

// ─────────────────────────────────────────────
// PASSWORD RESET FLOW
// ─────────────────────────────────────────────

export const apiForgotPassword = async (email: string) => {
  const res = await client.post("/auth/forgot-password", { email });
  return res.data;
};

export const apiResetPassword = async (
  token: string,
  newPassword: string
) => {
  const res = await client.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return res.data;
};