// ══════════════════════════════════════════════════════════════════════════════
// USERS PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Search, X, User, Shield, Mail, Key, Edit,
  CheckCircle2, XCircle, Lock, UserCog, Clock, Activity,
  ChevronDown, ChevronUp, Calendar, Info
} from "lucide-react";
import {
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  apiResetPassword
} from "@/api/users";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8",
  bg: "#fff",
  bgMuted: "#f7f9f8",
  text: "#111816",
  muted: "#7a918b",
  faint: "#a0b4ae",
  teal: "#0d9e75",
  tealBg: "#e8f7f2",
  tealText: "#0a7d5d",
  tealBorder: "#c3e8dc",
  amber: "#f59e0b",
  amberBg: "#fffbeb",
  amberText: "#92400e",
  amberBorder: "#fde68a",
  red: "#e53e3e",
  redBg: "#fff5f5",
  redText: "#c53030",
  redBorder: "#fed7d7",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1d4ed8",
  blueBorder: "#bfdbfe",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  purpleText: "#5b21b6",
  purpleBorder: "#ddd6fe",
  gray: "#6b7f75",
  grayBg: "#f4f7f5"
};

const IS: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 9,
  background: C.bg,
  fontSize: 13,
  color: C.text,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box"
};

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.t-row:hover{background:${C.bgMuted}!important;cursor:pointer}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.act-btn:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}.detail-row{animation:fadeUp .2s ease both}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "admin", label: "Administrator", desc: "Full system access", color: C.red },
  { value: "dentist", label: "Dentist", desc: "Clinical & patient access", color: C.purple },
  { value: "receptionist", label: "Receptionist", desc: "Appointments & front desk", color: C.blue },
  { value: "accountant", label: "Accountant", desc: "Billing & financial records", color: C.teal },
  { value: "assistant", label: "Assistant", desc: "Chairside assistance", color: C.amber },
  { value: "nurse", label: "Nurse", desc: "Clinical support", color: C.purple },
  { value: "viewer", label: "Viewer", desc: "Read-only access", color: C.gray },
];

const STATUS_CFG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  active: { bg: C.tealBg, text: C.tealText, border: C.tealBorder, label: "Active" },
  inactive: { bg: C.grayBg, text: C.gray, border: C.border, label: "Inactive" },
  suspended: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Suspended" },
};

const E_USER = {
  username: "",
  email: "",
  password: "",
  role: "viewer",
  full_name: "",
  phone: "",
  status: "active"
};

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Avi({ name, size = 28 }: { name: string; size?: number }) {
  const p = [
    "linear-gradient(135deg,#0d9e75,#0a7d5d)",
    "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    "linear-gradient(135deg,#8b5cf6,#5b21b6)",
    "linear-gradient(135deg,#f59e0b,#92400e)"
  ];
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: p[(name?.charCodeAt(0) ?? 0) % p.length],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.35,
      fontWeight: 700,
      color: "white",
      flexShrink: 0
    }}>
      {(name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  );
}

function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
        {label}
        {req && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 18px",
        borderRadius: 9,
        background: loading ? "#9ab5ae" : C.teal,
        border: "none",
        color: "white",
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)"
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,.3)",
            borderTopColor: "white",
            animation: "spin .7s linear infinite",
            display: "inline-block"
          }} />
          Saving…
        </>
      ) : children}
    </button>
  );
}

function GBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 16px",
        borderRadius: 9,
        border: `1.5px solid ${C.border}`,
        background: C.bg,
        fontSize: 13,
        fontWeight: 500,
        color: C.muted,
        cursor: "pointer",
        fontFamily: "inherit"
      }}
    >
      {children}
    </button>
  );
}

function IBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={danger ? "del-btn" : "act-btn"}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        background: C.bgMuted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: C.faint,
        transition: "all .12s"
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, size = "md", children }: { open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode }) {
  if (!open) return null;
  const mw = size === "sm" ? 420 : size === "lg" ? 700 : 540;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.bg,
          borderRadius: 16,
          width: "100%",
          maxWidth: mw,
          boxShadow: "0 20px 60px rgba(0,0,0,.18)",
          animation: "modalIn .2s cubic-bezier(.22,1,.36,1)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: C.bgMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.muted
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function TH({ cols, tmpl }: { cols: string[]; tmpl: string }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: tmpl,
      padding: "9px 18px",
      background: C.bgMuted,
      borderBottom: `1px solid ${C.border}`
    }}>
      {cols.map(h => (
        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>
          {h}
        </span>
      ))}
    </div>
  );
}

function TEmpty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ padding: "48px 18px", textAlign: "center" }}>
      <Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} />
      <p style={{ fontSize: 13, color: C.faint }}>{text}</p>
    </div>
  );
}

function TLoad() {
  return (
    <div style={{ padding: "40px 18px", textAlign: "center" }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: `2px solid ${C.border}`,
        borderTopColor: C.teal,
        animation: "spin .7s linear infinite",
        margin: "0 auto 8px"
      }} />
      <p style={{ fontSize: 13, color: C.faint }}>Loading…</p>
    </div>
  );
}

function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={13} color={color} strokeWidth={1.8} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function SearchB({ value, onChange, placeholder, width = 280 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number }) {
  return (
    <div style={{ position: "relative", width }}>
      <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="inp"
        style={{ ...IS, paddingLeft: 30, height: 34 }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.faint,
            display: "flex"
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// Detail View Component
function UserDetail({ user, onClose, onResetPassword }: { user: any; onClose: () => void; onResetPassword: () => void }) {
  const roleCfg = ROLES.find(r => r.value === user.role);
  const statusCfg = STATUS_CFG[user.status] || STATUS_CFG.active;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: C.bgMuted,
        borderRadius: 12,
        border: `1px solid ${C.border}`
      }}>
        <Avi name={user.full_name || user.username} size={48} />
        <div>
          <span style={{ fontSize: 11, color: C.faint }}>USER #{user.id}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{user.full_name || user.username}</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Username</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "monospace" }}>{user.username}</p>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Email</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{user.email}</p>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Role</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={11} color={roleCfg?.color ?? C.gray} />
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 100,
              background: (roleCfg?.color ?? C.gray) + "15",
              color: roleCfg?.color ?? C.gray,
              border: `1px solid ${(roleCfg?.color ?? C.gray)}30`
            }}>
              {roleCfg?.label ?? user.role}
            </span>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Status</p>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 100,
            background: statusCfg.bg,
            color: statusCfg.text,
            border: `1px solid ${statusCfg.border}`,
            display: "inline-block"
          }}>
            {statusCfg.label}
          </span>
        </div>
        {user.phone && (
          <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Phone</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{user.phone}</p>
          </div>
        )}
        {user.last_login && (
          <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Last Login</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} color={C.faint} />
              <p style={{ fontSize: 12, color: C.text }}>
                {new Date(user.last_login).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={onResetPassword}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px",
            borderRadius: 9,
            border: "none",
            background: C.amber,
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          <Key size={14} />
          Reset Password
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "10px 16px",
            borderRadius: 9,
            border: `1px solid ${C.border}`,
            background: C.bg,
            fontSize: 13,
            fontWeight: 500,
            color: C.muted,
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function UsersPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState(E_USER);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGetUsers()
  });

  // Handle both wrapped and unwrapped responses
  const users: any[] = data?.data ?? data ?? [];

  const filtered = useMemo(() => users.filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) &&
        !u.username?.toLowerCase().includes(search.toLowerCase()) &&
        !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [users, roleFilter, search]);

  const createMut = useMutation({
    mutationFn: apiCreateUser,
    onSuccess: () => {
      toast.success("User created");
      qc.invalidateQueries({ queryKey: ["users"] });
      setModal(false);
      setForm(E_USER);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed")
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiUpdateUser(id, data),
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditModal(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed")
  });

  const deleteMut = useMutation({
    mutationFn: apiDeleteUser,
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const resetPwdMut = useMutation({
    mutationFn: apiResetPassword,
    onSuccess: () => toast.success("Password reset email sent")
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error("Username, email and password required");
      return;
    }
    createMut.mutate(form);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.username || !editModal.email) {
      toast.error("Username and email required");
      return;
    }
    updateMut.mutate({ id: editModal.id, data: editModal });
  };

  const handleRowClick = (row: any, e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if ((e.target as HTMLElement).closest('.del-btn') ||
        (e.target as HTMLElement).closest('.act-btn')) return;

    setExpandedId(expandedId === row.id ? null : row.id);
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const ef = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditModal((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Users</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              {users.length} users · {users.filter(u => u.status === "active").length} active
            </p>
          </div>
          <button
            onClick={() => setModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 18px",
              height: 34,
              borderRadius: 9,
              background: C.teal,
              border: "none",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 2px 10px rgba(13,158,117,.3)"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#0a8a66"}
            onMouseLeave={e => e.currentTarget.style.background = C.teal}
          >
            <Plus size={15} />
            Add User
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <KPI label="Total Users" value={users.length} icon={User} color={C.teal} sub="All accounts" />
          <KPI label="Active" value={users.filter(u => u.status === "active").length} icon={CheckCircle2} color={C.teal} sub="Currently enabled" />
          <KPI label="Admins" value={users.filter(u => u.role === "admin").length} icon={Shield} color={C.red} sub="Full access" />
          <KPI label="Last Activity" value="2h ago" icon={Activity} color={C.blue} sub="Most recent login" />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <SearchB value={search} onChange={setSearch} placeholder="Search name, username or email…" width={280} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[{ value: "all", label: "All Roles", color: C.border }, ...ROLES].map(r => {
              const active = roleFilter === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setRoleFilter(r.value)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${active ? r.color + "40" : C.border}`,
                    background: active ? r.color + "10" : C.bg,
                    color: active ? r.color : C.muted,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table with clickable rows */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <TH cols={["User", "Username", "Email", "Role", "Status", "Last Login", ""]} tmpl="1.4fr 1fr 1.4fr 1.2fr 100px 130px 100px" />
          {isLoading && <TLoad />}
          {!isLoading && filtered.length === 0 && <TEmpty icon={User} text="No users found" />}
          {!isLoading && filtered.map((row: any, i: number) => {
            const roleCfg = ROLES.find(r => r.value === row.role);
            const isExpanded = expandedId === row.id;

            return (
              <div key={row.id}>
                <div
                  className="t-row"
                  onClick={(e) => handleRowClick(row, e)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1.4fr 1.2fr 100px 130px 100px",
                    padding: "11px 18px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    transition: "background .1s",
                    background: isExpanded ? C.bgMuted : "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avi name={row.full_name ?? row.username ?? "?"} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.full_name ?? row.username ?? "—"}
                        </p>
                        {isExpanded ? (
                          <ChevronUp size={12} color={C.faint} />
                        ) : (
                          <ChevronDown size={12} color={C.faint} />
                        )}
                      </div>
                      {row.phone && <p style={{ fontSize: 10, color: C.faint }}>{row.phone}</p>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{row.username ?? "—"}</span>
                  <span style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.email ?? "—"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Shield size={11} color={roleCfg?.color ?? C.gray} />
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 100,
                      background: (roleCfg?.color ?? C.gray) + "15",
                      color: roleCfg?.color ?? C.gray,
                      border: `1px solid ${(roleCfg?.color ?? C.gray)}30`
                    }}>
                      {roleCfg?.label ?? row.role}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 100,
                    background: (STATUS_CFG[row.status] ?? STATUS_CFG.active).bg,
                    color: (STATUS_CFG[row.status] ?? STATUS_CFG.active).text,
                    border: `1px solid ${(STATUS_CFG[row.status] ?? STATUS_CFG.active).border}`,
                    whiteSpace: "nowrap"
                  }}>
                    {(STATUS_CFG[row.status] ?? STATUS_CFG.active).label}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} color={C.faint} />
                    <span style={{ fontSize: 11, color: C.faint }}>
                      {row.last_login ? new Date(row.last_login).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Never"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IBtn onClick={() => setEditModal(row)} title="Edit">
                      <Edit size={12} />
                    </IBtn>
                    <IBtn onClick={() => resetPwdMut.mutate(row.id)} title="Reset Password">
                      <Key size={12} />
                    </IBtn>
                    {currentUser?.id !== row.id && (
                      <IBtn
                        danger
                        onClick={() => {
                          if (confirm("Delete user?")) deleteMut.mutate(row.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </IBtn>
                    )}
                  </div>
                </div>

                {/* Expanded detail row */}
                {isExpanded && (
                  <div
                    className="detail-row"
                    style={{
                      padding: "20px 18px",
                      background: C.bgMuted,
                      borderTop: `1px solid ${C.border}`,
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none"
                    }}
                  >
                    <UserDetail
                      user={row}
                      onClose={() => setExpandedId(null)}
                      onResetPassword={() => resetPwdMut.mutate(row.id)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Role descriptions */}
        <div style={{ background: C.bgMuted, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8 }}>ROLE DESCRIPTIONS</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {ROLES.map(r => (
              <div key={r.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={11} color={r.color} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{r.label}</p>
                  <p style={{ fontSize: 9, color: C.faint }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add User" size="lg">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <F label="Username" req>
              <input value={form.username} onChange={f("username")} placeholder="johndoe" className="inp" style={IS} />
            </F>
            <F label="Full Name">
              <input value={form.full_name} onChange={f("full_name")} placeholder="John Doe" className="inp" style={IS} />
            </F>
            <F label="Email" req>
              <input type="email" value={form.email} onChange={f("email")} placeholder="john@example.com" className="inp" style={IS} />
            </F>
            <F label="Phone">
              <input type="tel" value={form.phone} onChange={f("phone")} placeholder="+252 61 234 5678" className="inp" style={IS} />
            </F>
            <F label="Password" req>
              <input type="password" value={form.password} onChange={f("password")} placeholder="••••••••" className="inp" style={IS} />
            </F>
            <F label="Role" req>
              <select value={form.role} onChange={f("role")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </F>
            <F label="Status">
              <select value={form.status} onChange={f("status")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </F>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <GBtn onClick={() => setModal(false)}>Cancel</GBtn>
            <SBtn loading={createMut.isPending}><UserCog size={14} />Create User</SBtn>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit User" size="lg">
        {editModal && (
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Username" req>
                <input value={editModal.username} onChange={ef("username")} className="inp" style={IS} />
              </F>
              <F label="Full Name">
                <input value={editModal.full_name} onChange={ef("full_name")} className="inp" style={IS} />
              </F>
              <F label="Email" req>
                <input type="email" value={editModal.email} onChange={ef("email")} className="inp" style={IS} />
              </F>
              <F label="Phone">
                <input type="tel" value={editModal.phone} onChange={ef("phone")} className="inp" style={IS} />
              </F>
              <F label="Role" req>
                <select value={editModal.role} onChange={ef("role")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </F>
              <F label="Status">
                <select value={editModal.status} onChange={ef("status")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </F>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
              <GBtn onClick={() => setEditModal(null)}>Cancel</GBtn>
              <SBtn loading={updateMut.isPending}><CheckCircle2 size={14} />Update User</SBtn>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}