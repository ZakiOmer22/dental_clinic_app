import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Auth Store ────────────────────────────────────────────────────────────────
interface User {
  id: number;
  clinicId: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  _hasHydrated: boolean;           // ← NEW: tracks when localStorage is loaded
  setAuth: (token: string, user: User) => void;
  clear: () => void;
  isLoggedIn: () => boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      _hasHydrated: false,

      setAuth: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
      isLoggedIn: () => !!get().token,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "dentiflow-auth",

      // Fires when Zustand finishes reading from localStorage
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ─── UI Store ──────────────────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (v) => set({ sidebarOpen: v }),
}));