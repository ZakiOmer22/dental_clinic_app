import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, X, Filter, Users, UserCheck,
  CalendarDays, TrendingUp, ChevronRight,
  ChevronLeft, Stethoscope, Activity,
  AlertCircle, Heart, Pill, Clock,
  Calendar, Phone, Mail, MapPin,
} from "lucide-react";
import { apiGetPatients, apiCreatePatient } from "@/api/patients";
import { apiGetAppointments } from "@/api/appointments";
import { formatCurrency, formatDate } from "@/utils";
import toast from "react-hot-toast";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8",
  bg: "#fff",
  bgMuted: "#f7f9f8",
  bgPage: "#f0f2f1",
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
};

const GENDERS = ["Male", "Female", "Other"];
const BLOOD_TPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const EMPTY = {
  fullName: "",
  phone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  city: "",
  bloodType: "",
  nationalId: "",
  occupation: "",
  medicalHistory: "",
  emergencyContact: "",
  emergencyPhone: "",
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

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({ name, size = 34, status }: { name: string; size?: number; status?: string }) {
  const colors = [
    "linear-gradient(135deg,#0d9e75,#0a7d5d)",
    "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    "linear-gradient(135deg,#8b5cf6,#5b21b6)",
    "linear-gradient(135deg,#f59e0b,#92400e)"
  ];
  const c = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  const initials = (name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: c,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "white",
        flexShrink: 0,
        letterSpacing: "-.01em"
      }}>
        {initials}
      </div>
      {status && (
        <span style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: status === "checked-in" ? C.teal : status === "waiting" ? C.amber : C.faint,
          border: `2px solid white`,
        }} />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 20px",
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

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
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

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: wide ? 680 : 520, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-.01em" }}>{title}</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><X size={14} /></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
// ─── Appointment Status Card ──────────────────────────────────────────────────
function TodayAppointments() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: () => apiGetAppointments(),
  });

  const stats = useMemo(() => {
    const total = appointments?.length || 0;
    const checkedIn = appointments?.filter((a: any) => a.status === "checked-in").length || 0;
    const waiting = appointments?.filter((a: any) => a.status === "waiting").length || 0;
    const completed = appointments?.filter((a: any) => a.status === "completed").length || 0;
    return { total, checkedIn, waiting, completed };
  }, [appointments]);

  if (isLoading) {
    return (
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 13, color: C.faint }}>Loading today's schedule...</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} color={C.teal} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Today's Schedule</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: C.teal }}>{stats.total}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 11, color: C.faint }}>Checked In</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.tealText }}>{stats.checkedIn}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 11, color: C.faint }}>Waiting</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.amberText }}>{stats.waiting}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 11, color: C.faint }}>Completed</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.blueText }}>{stats.completed}</p>
        </div>
      </div>

      {appointments?.slice(0, 3).map((apt: any) => (
        <div key={apt.id} style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 0",
          borderTop: `1px solid ${C.border}`
        }}>
          <Avi name={apt.patient_name} size={28} status={apt.status} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{apt.patient_name}</p>
            <p style={{ fontSize: 11, color: C.faint }}>{apt.time} • {apt.type}</p>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: 100,
            background: apt.status === "checked-in" ? C.tealBg : apt.status === "waiting" ? C.amberBg : C.bgMuted,
            color: apt.status === "checked-in" ? C.tealText : apt.status === "waiting" ? C.amberText : C.muted,
          }}>
            {apt.status}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Clinical Alerts Card ─────────────────────────────────────────────────────
function ClinicalAlerts({ patients }: { patients: any[] }) {
  const alerts = useMemo(() => {
    const allergies = patients.filter(p => p.allergies?.length > 0).length;
    const conditions = patients.filter(p => p.medical_conditions?.length > 0).length;
    const medications = patients.filter(p => p.current_medications?.length > 0).length;
    const urgent = patients.filter(p => p.urgent_flag).length;
    return { allergies, conditions, medications, urgent };
  }, [patients]);

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AlertCircle size={16} color={C.red} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Clinical Alerts</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Heart size={12} color={C.red} />
            <span style={{ fontSize: 12, color: C.muted }}>Allergies</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: alerts.allergies > 0 ? C.redText : C.text }}>
            {alerts.allergies}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={12} color={C.amber} />
            <span style={{ fontSize: 12, color: C.muted }}>Medical Conditions</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: alerts.conditions > 0 ? C.amberText : C.text }}>
            {alerts.conditions}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Pill size={12} color={C.blue} />
            <span style={{ fontSize: 12, color: C.muted }}>On Medications</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: alerts.medications > 0 ? C.blueText : C.text }}>
            {alerts.medications}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} color={C.red} />
            <span style={{ fontSize: 12, color: C.muted }}>Urgent Follow-up</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: alerts.urgent > 0 ? C.redText : C.text }}>
            {alerts.urgent}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Patients ──────────────────────────────────────────────────────────
function RecentPatients({ patients }: { patients: any[] }) {
  const recent = patients.slice(0, 5);

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Recent Patients</p>

      {recent.map((p: any) => (
        <div key={p.id} style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 0",
          borderBottom: `1px solid ${C.border}`
        }}>
          <Avi name={p.full_name} size={32} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.full_name}</p>
            <p style={{ fontSize: 11, color: C.faint }}>Last visit: {p.last_visit ? formatDate(p.last_visit) : "Never"}</p>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: 100,
            background: p.status === "active" ? C.tealBg : C.bgMuted,
            color: p.status === "active" ? C.tealText : C.muted,
          }}>
            {p.status || "active"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DoctorPatientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [alertFilter, setAlertFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["patients", search, page, alertFilter],
    queryFn: () => apiGetPatients({ search, page, limit: LIMIT, alerts: alertFilter }),
    placeholderData: (prev: any) => prev,
  });

  const patients: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

  const filtered = useMemo(() => {
    let filtered = patients;
    if (genderFilter !== "all") {
      filtered = filtered.filter(p => p.gender === genderFilter);
    }
    return filtered;
  }, [patients, genderFilter]);

  const createMut = useMutation({
    mutationFn: apiCreatePatient,
    onSuccess: () => {
      toast.success("Patient registered successfully");
      qc.invalidateQueries({ queryKey: ["patients"] });
      setModal(false);
      setForm(EMPTY);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to register patient"),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) {
      toast.error("Name and phone are required");
      return;
    }
    createMut.mutate(form);
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const activeFilters = [
    genderFilter !== "all" && `Gender: ${genderFilter}`,
    alertFilter && `Alert: ${alertFilter}`,
    search && `"${search}"`
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes modalIn { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .pt-row:hover { background: ${C.bgMuted} !important; cursor: pointer }
        .inp:focus { border-color: ${C.teal} !important; box-shadow: 0 0 0 3px rgba(13,158,117,.1) !important }
        .pg-btn:hover:not(:disabled) { background: ${C.tealBg} !important; border-color: ${C.tealBorder} !important; color: ${C.tealText} !important }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>My Patients</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{total} patients under your care</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "0 14px",
                height: 34,
                border: `1px solid ${showFilters ? C.tealBorder : C.border}`,
                borderRadius: 9,
                background: showFilters ? C.tealBg : C.bg,
                fontSize: 12,
                fontWeight: 500,
                color: showFilters ? C.tealText : C.muted,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s"
              }}
            >
              <Filter size={13} /> Filters
              {activeFilters.length > 0 && (
                <span style={{
                  background: C.teal,
                  color: "white",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {activeFilters.length}
                </span>
              )}
            </button>
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
                boxShadow: "0 2px 10px rgba(13,158,117,.3)",
                transition: "background .15s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0a8a66")}
              onMouseLeave={e => (e.currentTarget.style.background = C.teal)}
            >
              <Plus size={15} /> New Patient
            </button>
          </div>
        </div>

        {/* ── Clinical Dashboard Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            {
              label: "Today's Appointments",
              value: "8",
              icon: Calendar,
              color: C.teal,
              sub: "2 waiting, 3 checked in"
            },
            {
              label: "Pending Treatments",
              value: "12",
              icon: Stethoscope,
              color: C.blue,
              sub: "4 urgent"
            },
            {
              label: "Lab Orders",
              value: "5",
              icon: Activity,
              color: C.purple,
              sub: "3 pending, 2 ready"
            },
            {
              label: "Recall Due",
              value: "24",
              icon: Clock,
              color: C.amber,
              sub: "This month"
            },
          ].map(k => (
            <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{k.label}</span>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: k.color + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <k.icon size={13} color={k.color} strokeWidth={1.8} />
                </div>
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Sidebar-style cards grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <TodayAppointments />
          <ClinicalAlerts patients={patients} />
          <RecentPatients patients={patients} />
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div style={{
            background: C.bg,
            border: `1px solid ${C.tealBorder}`,
            borderRadius: 12,
            padding: "16px 18px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 12,
            animation: "fadeUp .2s ease both"
          }}>
            <Field label="Filter by Gender">
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
                className="inp"
                style={{ ...IS, cursor: "pointer" }}
              >
                <option value="all">All genders</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>

            <Field label="Clinical Alerts">
              <select
                value={alertFilter || ""}
                onChange={e => setAlertFilter(e.target.value || null)}
                className="inp"
                style={{ ...IS, cursor: "pointer" }}
              >
                <option value="">All patients</option>
                <option value="allergies">With allergies</option>
                <option value="conditions">With medical conditions</option>
                <option value="medications">On medications</option>
                <option value="urgent">Urgent follow-up</option>
              </select>
            </Field>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={() => {
                  setGenderFilter("all");
                  setAlertFilter(null);
                  setSearch("");
                }}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: C.bgMuted,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.muted,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* ── Search + quick filters ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 300 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone, or ID…"
              className="inp"
              style={{ ...IS, paddingLeft: 30, height: 34 }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
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

          <div style={{ display: "flex", gap: 4 }}>
            {[{ value: "all", label: "All" }, ...GENDERS.map(g => ({ value: g, label: g }))].map(t => (
              <button
                key={t.value}
                onClick={() => setGenderFilter(t.value)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${genderFilter === t.value ? C.tealBorder : C.border}`,
                  background: genderFilter === t.value ? C.tealBg : C.bg,
                  color: genderFilter === t.value ? C.tealText : C.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .12s"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeFilters.map((f, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 100,
                background: C.tealBg,
                color: C.tealText,
                border: `1px solid ${C.tealBorder}`
              }}
            >
              {f}
              <X
                size={10}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (f?.startsWith("Gender")) setGenderFilter("all");
                  else if (f?.startsWith("Alert")) setAlertFilter(null);
                  else setSearch("");
                }}
              />
            </span>
          ))}
        </div>

        {/* ── Patient table ── */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 130px 80px 100px 100px 80px 100px 40px",
            padding: "9px 18px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`
          }}>
            {["Patient", "Phone", "Gender", "Age", "Last Visit", "Status", "Alerts", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading && (
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
              <p style={{ fontSize: 13, color: C.faint }}>Loading patients…</p>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div style={{ padding: "48px 18px", textAlign: "center" }}>
              <Users size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: C.faint }}>No patients found</p>
              {search && <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>Try adjusting your search or filters</p>}
            </div>
          )}

          {!isLoading && filtered.map((row: any, i: number) => {
            const age = row.date_of_birth
              ? new Date().getFullYear() - new Date(row.date_of_birth).getFullYear()
              : null;

            const alertCount = (row.allergies?.length || 0) + (row.medical_conditions?.length || 0);

            return (
              <div
                key={row.id}
                className="pt-row"
                onClick={() => navigate(`/Doctor/patients/${row.id}`)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 130px 80px 100px 100px 80px 100px 40px",
                  padding: "11px 18px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  transition: "background .1s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avi name={row.full_name ?? "?"} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.full_name}
                    </p>
                    <p style={{ fontSize: 11, color: C.faint }}>{row.patient_number ?? "—"}</p>
                  </div>
                </div>

                <span style={{ fontSize: 12, color: C.muted }}>{row.phone ?? "—"}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{row.gender ?? "—"}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{age ? `${age} yrs` : "—"}</span>
                <span style={{ fontSize: 11, color: C.faint }}>
                  {row.last_visit ? formatDate(row.last_visit) : "Never"}
                </span>

                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: row.is_active !== false ? C.tealBg : C.bgMuted,
                  color: row.is_active !== false ? C.tealText : C.muted,
                  border: `1px solid ${row.is_active !== false ? C.tealBorder : C.border}`,
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  textAlign: "center"
                }}>
                  {row.is_active !== false ? "Active" : "Inactive"}
                </span>

                <div style={{ display: "flex", gap: 4 }}>
                  {row.allergies?.length > 0 && (
                    <span title={`Allergies: ${row.allergies.map((a: any) => a.allergen).join(", ")}`} style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: C.redBg,
                      border: `1px solid ${C.redBorder}`,
                      color: C.redText,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      A
                    </span>
                  )}
                  {row.medical_conditions?.length > 0 && (
                    <span title={`Conditions: ${row.medical_conditions.map((c: any) => c.condition_name).join(", ")}`} style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: C.amberBg,
                      border: `1px solid ${C.amberBorder}`,
                      color: C.amberText,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      M
                    </span>
                  )}
                  {alertCount === 0 && <span style={{ width: 20 }} />}
                </div>

                <ChevronRight size={14} color={C.faint} style={{ marginLeft: "auto" }} />
              </div>
            );
          })}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, color: C.faint }}>Page {page} of {totalPages} · {total} patients</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="pg-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  fontWeight: 500,
                  color: page <= 1 ? C.faint : C.muted,
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all .15s"
                }}
              >
                <ChevronLeft size={13} /> Prev
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${p === page ? C.tealBorder : C.border}`,
                      background: p === page ? C.tealBg : C.bg,
                      fontSize: 12,
                      fontWeight: p === page ? 700 : 500,
                      color: p === page ? C.tealText : C.muted,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all .12s"
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="pg-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  fontWeight: 500,
                  color: page >= totalPages ? C.faint : C.muted,
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all .15s"
                }}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Register Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title="Register New Patient" wide>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Full Name *"><input value={form.fullName} onChange={f("fullName")} placeholder="Ahmed Hassan" className="inp" style={IS} /></Field>
            </div>
            <Field label="Phone *"><input value={form.phone} onChange={f("phone")} placeholder="+252 61 xxx xxxx" className="inp" style={IS} /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={f("email")} placeholder="patient@email.com" className="inp" style={IS} /></Field>
            <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")} className="inp" style={IS} /></Field>
            <Field label="Gender">
              <select value={form.gender} onChange={f("gender")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Blood Type">
              <select value={form.bloodType} onChange={f("bloodType")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                <option value="">Select blood type</option>
                {BLOOD_TPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="National ID"><input value={form.nationalId} onChange={f("nationalId")} placeholder="National ID number" className="inp" style={IS} /></Field>
            <Field label="Address"><input value={form.address} onChange={f("address")} placeholder="District / Street" className="inp" style={IS} /></Field>
            <Field label="City"><input value={form.city} onChange={f("city")} placeholder="Hargeisa" className="inp" style={IS} /></Field>
            <Field label="Occupation"><input value={form.occupation} onChange={f("occupation")} placeholder="Teacher, Engineer…" className="inp" style={IS} /></Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Medical History / Allergies / Notes">
                <textarea value={form.medicalHistory} onChange={f("medicalHistory")} rows={3} placeholder="Known allergies, chronic conditions, current medications…" className="inp" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }} />
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <GhostBtn onClick={() => setModal(false)}>Cancel</GhostBtn>
            <SubmitBtn loading={createMut.isPending}><Users size={14} /> Register Patient</SubmitBtn>
          </div>
        </form>
      </Modal>
    </>
  );
}