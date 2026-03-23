import client from "./client";

// ─── Response types ───────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: "admin" | "dentist" | "receptionist" | "assistant" | "accountant" | "nurse";
  clinicId: number;
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ─── Register payload ─────────────────────────────────────────────────────────
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: AuthUser["role"];
  clinicId: number;
  phone?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const apiLogin = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const res = await client.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
};

export const apiRegister = async (
  data: RegisterPayload
): Promise<AuthResponse> => {
  const res = await client.post<AuthResponse>("/auth/register", data);
  return res.data;
};

export const apiLogout = async (): Promise<void> => {
  await client.post("/auth/logout").catch(() => {
    // server-side session cleanup — safe to ignore if it fails,
    // the client clears the token regardless (handled in authStore)
  });
};