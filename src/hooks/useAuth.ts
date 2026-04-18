import { useAuthStore } from "@/app/store";

export function useAuth() {
  const user    = useAuthStore((s) => s.user);
  const token   = useAuthStore((s) => s.token);
  const clear   = useAuthStore((s) => s.clear);

  return {
    user,
    token,
    clear,
    isLoggedIn: !!token,
    role:  user?.role  ?? null,
    email: user?.email ?? null,
    uid:   user?.id    ?? null,
    clinicId: user?.clinicId ?? null,
    isAdmin:        user?.role === "admin",
    isDentist:      user?.role === "dentist",
    isReceptionist: user?.role === "receptionist",
  };
}
