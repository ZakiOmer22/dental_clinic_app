import { useState, useMemo } from "react";
import { Users, Plus, Shield, Edit2, Trash2, MoreVertical, Key, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { PageWrapper, PageHeader, Card, Badge, Btn, TableHead, SearchInput, SectionTitle, SA, EmptyState } from "./shared";

const USERS = [
  { id: 1, name: "Zaki Omar", email: "zaki@ealif.com", role: "super_admin", status: "active", lastLogin: "2h ago", clinic: "Platform", createdAt: "Jan 1, 2024" },
  { id: 2, name: "Aisha Jama", email: "aisha@ealif.com", role: "super_admin", status: "active", lastLogin: "1d ago", clinic: "Platform", createdAt: "Jan 5, 2024" },
  { id: 3, name: "Dr. Ahmed Hassan", email: "ahmed@brightsmile.so", role: "admin", status: "active", lastLogin: "3h ago", clinic: "Bright Smile Clinic", createdAt: "Apr 14, 2025" },
  { id: 4, name: "Fadumo Omar", email: "fadumo@brightsmile.so", role: "receptionist", status: "active", lastLogin: "30m ago", clinic: "Bright Smile Clinic", createdAt: "Apr 14, 2025" },
  { id: 5, name: "Ali Jama", email: "ali@brightsmile.so", role: "assistant", status: "active", lastLogin: "2d ago", clinic: "Bright Smile Clinic", createdAt: "Apr 15, 2025" },
  { id: 6, name: "Dr. Mahad Ali", email: "mahad@dentacareplus.so", role: "admin", status: "pending", lastLogin: "Never", clinic: "DentaCare Plus", createdAt: "Apr 10, 2025" },
  { id: 7, name: "Sara Hassan", email: "sara@smilepro.dj", role: "dentist", status: "active", lastLogin: "5h ago", clinic: "SmilePro Clinic", createdAt: "Feb 18, 2025" },
  { id: 8, name: "Omar Nuur", email: "omar@sunrise.ke", role: "admin", status: "inactive", lastLogin: "14d ago", clinic: "Sunrise Dental", createdAt: "Jan 12, 2025" },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  dentist: "Dentist",
  receptionist: "Receptionist",
  assistant: "Assistant",
  accountant: "Accountant",
};

const roleVariant = (r: string) =>
  r === "super_admin" ? "purple" : r === "admin" ? "info" : "neutral";

const statusVariant = (s: string) =>
  s === "active" ? "success" : s === "pending" ? "warning" : "neutral";

export default function PlatformUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const roles = ["All Roles", ...Object.keys(ROLE_LABELS)];

  const filtered = useMemo(() => {
    return USERS.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.clinic.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [search, roleFilter]);

  const handleAction = (action: string, user: typeof USERS[0]) => {
    setMenuOpen(null);
    if (action === "reset") toast.success(`Password reset email sent to ${user.email}`);
    else if (action === "disable") toast.error(`${user.name}'s account disabled`);
    else if (action === "delete") toast.error(`${user.name} deleted`);
  };

  return (
    <PageWrapper>
      <PageHeader
        breadcrumb="Super Admin · Management"
        title="Platform Users"
        subtitle="All users across every clinic on the platform"
        action={
          <Btn label="Add Super Admin" variant="primary" icon={<Plus size={14} />} onClick={() => toast("Invite super admin")} />
        }
      />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Users", value: USERS.length, color: SA.textPrimary },
          { label: "Super Admins", value: USERS.filter(u => u.role === "super_admin").length, color: SA.accent },
          { label: "Active", value: USERS.filter(u => u.status === "active").length, color: SA.success },
          { label: "Inactive/Pending", value: USERS.filter(u => u.status !== "active").length, color: SA.warning },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: `1px solid ${SA.border}`, borderRadius: 12, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: SA.textSecondary }}>{s.label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${SA.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search users, emails, clinics…" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ height: 38, padding: "0 12px", border: `1.5px solid ${SA.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", color: SA.textPrimary, background: "white", cursor: "pointer" }}
          >
            {roles.map((r) => <option key={r} value={r}>{r === "All Roles" ? r : ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        <TableHead
          cols={["User", "Role", "Clinic", "Status", "Last Login", "Joined", ""]}
          template="2fr 110px 1.5fr 90px 100px 100px 40px"
        />

        {filtered.length === 0
          ? <EmptyState message="No users found" />
          : filtered.map((u) => (
            <div key={u.id} className="sa-row-hover" style={{ display: "grid", gridTemplateColumns: "2fr 110px 1.5fr 90px 100px 100px 40px", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${SA.border}`, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: SA.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: SA.accent, flexShrink: 0 }}>
                  {u.name[0]}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary, margin: 0 }}>{u.name}</p>
                  <p style={{ fontSize: 11, color: SA.textMuted, margin: "2px 0 0" }}>{u.email}</p>
                </div>
              </div>
              <Badge label={ROLE_LABELS[u.role] || u.role} variant={roleVariant(u.role)} />
              <span style={{ fontSize: 12, color: SA.textSecondary }}>{u.clinic}</span>
              <Badge label={u.status} variant={statusVariant(u.status)} />
              <span style={{ fontSize: 12, color: SA.textMuted }}>{u.lastLogin}</span>
              <span style={{ fontSize: 12, color: SA.textMuted }}>{u.createdAt.split(",")[0]}</span>
              <div style={{ position: "relative" }}>
                <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: SA.textMuted }}>
                  <MoreVertical size={15} />
                </button>
                {menuOpen === u.id && (
                  <div style={{ position: "absolute", right: 0, top: 32, background: "white", border: `1px solid ${SA.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: 170, overflow: "hidden" }}>
                    {[
                      { label: "Reset Password", icon: <Key size={13} />, action: "reset" },
                      { label: "Send Email", icon: <Mail size={13} />, action: "email" },
                      { label: "Disable Account", icon: <Shield size={13} />, action: "disable" },
                      { label: "Delete User", icon: <Trash2 size={13} />, action: "delete", danger: true },
                    ].map((item) => (
                      <button key={item.action} onClick={() => handleAction(item.action, u)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: (item as any).danger ? SA.error : SA.textPrimary, fontFamily: "inherit" }}>
                        {item.icon}{item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        }

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${SA.border}`, fontSize: 12, color: SA.textMuted }}>
          Showing {filtered.length} of {USERS.length} users
        </div>
      </Card>
    </PageWrapper>
  );
}