// ReceptionistTodaySchedule.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CalendarDays, Clock, Search,
  ChevronRight, CheckCircle2, XCircle, RefreshCw,
  LayoutGrid, List, Filter, ChevronDown,
  CalendarCheck, Timer, Ban, RotateCcw, X,
  ChevronLeft, TrendingUp,
} from "lucide-react";
import {
  apiGetAppointments, apiCreateAppointment, apiDeleteAppointment,
} from "@/api/appointments";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
    text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
    teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
    amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
    red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
    blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
    purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
    gray: "#6b7f75", grayBg: "#f4f7f5",
};

const STATUSES = ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show", "rescheduled"];
const TYPES = ["checkup", "follow_up", "emergency", "procedure", "consultation", "xray", "cleaning", "surgery"];
const EMPTY = { patientId: "", patientLabel: "", date: "", time: "", type: "checkup", notes: "", chiefComplaint: "" };

const STATUS_CFG: Record<string, { bg: string; text: string; border: string; label: string; icon: any }> = {
    scheduled: { bg: C.grayBg, text: C.gray, border: C.border, label: "Scheduled", icon: Clock },
    confirmed: { bg: C.blueBg, text: C.blueText, border: C.blueBorder, label: "Confirmed", icon: CheckCircle2 },
    in_progress: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "In Progress", icon: RefreshCw },
    completed: { bg: C.tealBg, text: C.tealText, border: C.tealBorder, label: "Completed", icon: CheckCircle2 },
    cancelled: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Cancelled", icon: XCircle },
    no_show: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "No Show", icon: Ban },
    rescheduled: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "Rescheduled", icon: RotateCcw },
};

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({ name, size = 30 }: { name: string; size?: number }) {
    const i = (name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    return <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#0d9e75,#0a7d5d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.37, fontWeight: 700, color: "white", flexShrink: 0 }}>{i}</div>;
}

function Badge({ status }: { status: string }) {
    const cfg = STATUS_CFG[status] ?? { bg: C.grayBg, text: C.gray, border: C.border, label: status, icon: Clock };
    return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

function TypeBadge({ type }: { type: string }) {
    return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: C.blueBg, color: C.blueText, border: `1px solid ${C.blueBorder}`, whiteSpace: "nowrap", textTransform: "capitalize" }}>{type?.replace(/_/g, " ")}</span>;
}

const IS = { width: "100%", height: 38, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{label}</label>{children}</div>;
}

function SubmitBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
    return <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, background: loading ? "#9ab5ae" : C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)" }}>{loading ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", animation: "spin .7s linear infinite", display: "inline-block" }} />Saving…</> : children}</button>;
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return <button type="button" onClick={onClick} style={{ padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>;
}

// ─── Patient combobox ───────────────────────────────────────────────────
function PatientCombobox({ patients, value, onSelect }: {
    patients: any[]; value: string; onSelect: (id: string, label: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const selectedPt = patients.find(p => String(p.id) === value);
    const filtered = patients.filter(p =>
        !q || p.full_name?.toLowerCase().includes(q.toLowerCase())
        || p.phone?.includes(q) || p.patient_number?.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 50);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) };
        document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div
                onClick={() => setOpen(v => !v)}
                style={{ ...IS, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", height: 38, padding: "0 12px" }}
            >
                {selectedPt
                    ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avi name={selectedPt.full_name} size={22} />
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{selectedPt.full_name}</span>
                        <span style={{ fontSize: 11, color: C.faint }}>·  {selectedPt.patient_number ?? selectedPt.phone}</span>
                    </div>
                    : <span style={{ color: C.faint, fontSize: 13 }}>Search patient by name, phone, or ID…</span>
                }
                <ChevronDown size={13} color={C.faint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
            </div>
            {open && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.bg, border: `1.5px solid ${C.tealBorder}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 100, overflow: "hidden" }}>
                    <div style={{ padding: "10px 10px 6px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ position: "relative" }}>
                            <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                            <input
                                autoFocus
                                value={q}
                                onChange={e => { setQ(e.target.value) }}
                                placeholder="Type name, phone, or patient number…"
                                style={{ ...IS, paddingLeft: 28, height: 34, fontSize: 12 }}
                            />
                        </div>
                    </div>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {filtered.length === 0
                            ? <p style={{ padding: "16px 12px", textAlign: "center", fontSize: 12, color: C.faint }}>No patients found</p>
                            : filtered.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => { onSelect(String(p.id), p.full_name); setOpen(false); setQ(""); }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", transition: "background .1s" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = C.bgMuted)}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    <Avi name={p.full_name} size={28} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.full_name}</p>
                                        <p style={{ fontSize: 11, color: C.faint }}>{p.patient_number ?? ""} · {p.phone}</p>
                                    </div>
                                    {String(p.id) === value && <CheckCircle2 size={13} color={C.teal} />}
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Status inline select ─────────────────────────────────────────────────────
function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const cfg = STATUS_CFG[value] ?? STATUS_CFG.scheduled;
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px 3px 6px", borderRadius: 100, background: cfg.bg, border: `1px solid ${cfg.border}`, cursor: "pointer" }}>
            <cfg.icon size={10} color={cfg.text} strokeWidth={2.5} />
            <select
                value={value}
                onChange={e => { e.stopPropagation(); onChange(e.target.value); }}
                onClick={e => e.stopPropagation()}
                style={{ appearance: "none", WebkitAppearance: "none", background: "transparent", border: "none", outline: "none", fontSize: 11, fontWeight: 600, color: cfg.text, cursor: "pointer", fontFamily: "inherit", paddingRight: 2 }}
            >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>)}
            </select>
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-.01em" }}>{title}</h3>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><X size={14} /></button>
                </div>
                <div style={{ padding: 20, maxHeight: "80vh", overflowY: "auto" }}>{children}</div>
            </div>
        </div>
    );
}

// ─── Time slot component ─────────────────────────────────────────────────────
function TimeSlot({ time, appointments, onSlotClick }: {
    time: string;
    appointments: any[];
    onSlotClick: (time: string) => void;
}) {
    const hasAppointments = appointments.length > 0;

    return (
        <div
            onClick={() => onSlotClick(time)}
            style={{
                padding: "12px",
                borderBottom: `1px solid ${C.border}`,
                background: hasAppointments ? C.bg : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = hasAppointments ? `${C.teal}10` : C.bgMuted;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = hasAppointments ? C.bg : "transparent";
            }}
        >
            <div style={{ width: 60, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{time}</span>
            </div>
            <div style={{ flex: 1 }}>
                {appointments.length === 0 ? (
                    <div style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: C.bgMuted,
                        border: `1px dashed ${C.border}`,
                        textAlign: "center"
                    }}>
                        <span style={{ fontSize: 12, color: C.faint }}>No appointments scheduled</span>
                    </div>
                ) : (
                    appointments.map((apt, idx) => {
                        const cfg = STATUS_CFG[apt.status] ?? STATUS_CFG.scheduled;
                        return (
                            <div
                                key={idx}
                                style={{
                                    padding: "10px 12px",
                                    marginBottom: idx < appointments.length - 1 ? 8 : 0,
                                    background: cfg.bg,
                                    border: `1px solid ${cfg.border}`,
                                    borderRadius: 10,
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateX(4px)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateX(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Avi name={apt.patient_name ?? "?"} size={28} />
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                                                {apt.patient_name ?? "—"}
                                            </p>
                                            <p style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>
                                                {apt.chief_complaint ?? "No complaint noted"}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge status={apt.status} />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                                    <TypeBadge type={apt.type ?? "—"} />
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <Avi name={apt.doctor_name ?? "D"} size={20} />
                                        <span style={{ fontSize: 11, color: C.muted }}>{apt.doctor_name ?? "—"}</span>
                                    </div>
                                    {apt.room_name && (
                                        <span style={{ fontSize: 11, color: C.faint }}>Room: {apt.room_name}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReceptionistTodaySchedule() {
    const qc = useQueryClient();
    const user = useAuthStore(s => s.user);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [modal, setModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<any>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
    const [form, setForm] = useState(EMPTY);
    const [view, setView] = useState<"timeline" | "list">("timeline");
    const [statusFilter, setStatusFilter] = useState("all");

    // Fetch appointments
    const { data, isLoading } = useQuery({
        queryKey: ["appointments", "today", selectedDate.toISOString().split("T")[0]],
        queryFn: () => apiGetAppointments({
            date: selectedDate.toISOString().split("T")[0]
        }),
    });

    const { data: patientsRes } = useQuery({
        queryKey: ["patients", "select"],
        queryFn: () => apiGetPatients({ limit: 500 }),
    });

    const appts: any[] = data?.data ?? [];
    const patients: any[] = patientsRes?.data ?? [];

    // Filter appointments by status
    const filteredAppointments = useMemo(() => {
        if (statusFilter === "all") return appts;
        return appts.filter(apt => apt.status === statusFilter);
    }, [appts, statusFilter]);

    // Group appointments by time
    const appointmentsByTime = useMemo(() => {
        const grouped: Record<string, any[]> = {};

        filteredAppointments.forEach(apt => {
            const time = new Date(apt.scheduled_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
            if (!grouped[time]) grouped[time] = [];
            grouped[time].push(apt);
        });

        // Sort appointments within each time slot
        Object.keys(grouped).forEach(time => {
            grouped[time].sort((a, b) => a.status.localeCompare(b.status));
        });

        return grouped;
    }, [filteredAppointments]);

    // Generate time slots from 8 AM to 6 PM
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 8; i <= 18; i++) {
            const hour = i;
            const ampm = hour >= 12 ? "PM" : "AM";
            const displayHour = hour > 12 ? hour - 12 : hour;
            slots.push(`${displayHour}:00 ${ampm}`);
            if (i !== 18) {
                slots.push(`${displayHour}:30 ${ampm}`);
            }
        }
        return slots;
    }, []);

    // Calculate statistics
    const totalAppointments = appts.length;
    const completedAppointments = appts.filter(a => a.status === "completed").length;
    const pendingAppointments = appts.filter(a => ["scheduled", "confirmed", "in_progress"].includes(a.status)).length;
    const cancelledAppointments = appts.filter(a => ["cancelled", "no_show"].includes(a.status)).length;

    const completionRate = totalAppointments > 0
        ? Math.round((completedAppointments / totalAppointments) * 100)
        : 0;

    // Mutations
    const createMut = useMutation({
        mutationFn: apiCreateAppointment,
        onSuccess: () => {
            toast.success("Appointment scheduled");
            qc.invalidateQueries({ queryKey: ["appointments"] });
            setModal(false);
            setEditingAppointment(null);
            setForm(EMPTY);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to schedule"),
    });

    const updateMut = useMutation({
        
        onSuccess: () => {
            toast.success("Appointment updated");
            qc.invalidateQueries({ queryKey: ["appointments"] });
        },
    });

    const deleteMut = useMutation({
        mutationFn: apiDeleteAppointment,
        onSuccess: () => {
            toast.success("Appointment deleted");
            qc.invalidateQueries({ queryKey: ["appointments"] });
            setModal(false);
            setEditingAppointment(null);
        },
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.patientId || !form.date || !form.time) {
            toast.error("Patient, date and time required");
            return;
        }

        if (editingAppointment) {
            updateMut.mutate({ id: editingAppointment.id, status: form.status });
            setModal(false);
        } else {
            createMut.mutate({
                patientId: Number(form.patientId),
                doctorId: user?.id,
                scheduledAt: `${form.date}T${form.time}:00`,
                type: form.type,
                notes: form.notes,
                chiefComplaint: form.chiefComplaint,
            });
        }
    };

    const handleSlotClick = (time: string) => {
        setSelectedTimeSlot(time);
        setEditingAppointment(null);
        setForm({
            ...EMPTY,
            date: selectedDate.toISOString().split("T")[0],
            time: time,
        });
        setModal(true);
    };

    const handleEditAppointment = (apt: any) => {
        const date = new Date(apt.scheduled_at);
        setEditingAppointment(apt);
        setForm({
            patientId: String(apt.patient_id),
            patientLabel: apt.patient_name,
            date: date.toISOString().split("T")[0],
            time: date.toTimeString().slice(0, 5),
            type: apt.type || "checkup",
            notes: apt.notes || "",
            chiefComplaint: apt.chief_complaint || "",
            status: apt.status,
        });
        setModal(true);
    };

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const isToday = selectedDate.toDateString() === new Date().toDateString();

    return (
        <>
            <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .timeline-slot:hover{background:${C.bgMuted}!important}
        .appointment-card:hover{transform:translateX(4px);box-shadow:0 2px 8px rgba(0,0,0,0.05)}
      `}</style>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>
                            Today's Schedule
                        </h1>
                        <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                            {selectedDate.toLocaleDateString("en-US", {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                            {isToday && <span style={{ marginLeft: 8, color: C.teal, fontWeight: 600 }}>· Today</span>}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden" }}>
                            {(["timeline", "list"] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    style={{
                                        width: 34, height: 34, display: "flex", alignItems: "center",
                                        justifyContent: "center", background: view === v ? C.tealBg : "transparent",
                                        border: "none", cursor: "pointer", color: view === v ? C.tealText : C.faint,
                                        transition: "all .15s"
                                    }}
                                >
                                    {v === "timeline" ? <Clock size={14} /> : <List size={14} />}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setEditingAppointment(null);
                                setForm({
                                    ...EMPTY,
                                    date: selectedDate.toISOString().split("T")[0],
                                    time: "09:00",
                                });
                                setModal(true);
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34,
                                borderRadius: 9, background: C.teal, border: "none", color: "white",
                                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                boxShadow: "0 2px 10px rgba(13,158,117,.3)"
                            }}
                        >
                            <Plus size={15} /> New Appointment
                        </button>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <CalendarDays size={14} color={C.teal} />
                            <span style={{ fontSize: 12, color: C.muted }}>Total Appointments</span>
                        </div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{totalAppointments}</p>
                    </div>

                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <CheckCircle2 size={14} color={C.teal} />
                            <span style={{ fontSize: 12, color: C.muted }}>Completed</span>
                        </div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{completedAppointments}</p>
                    </div>

                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Timer size={14} color={C.amber} />
                            <span style={{ fontSize: 12, color: C.muted }}>Pending</span>
                        </div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{pendingAppointments}</p>
                    </div>

                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <TrendingUp size={14} color={C.blue} />
                            <span style={{ fontSize: 12, color: C.muted }}>Completion Rate</span>
                        </div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{completionRate}%</p>
                    </div>
                </div>

                {/* ── Date Navigation ── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: "12px 16px"
                }}>
                    <button
                        onClick={() => handleDateChange(-1)}
                        style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                            borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg,
                            cursor: "pointer", color: C.text, fontSize: 12
                        }}
                    >
                        <ChevronLeft size={14} /> Previous Day
                    </button>

                    <button
                        onClick={() => setSelectedDate(new Date())}
                        style={{
                            padding: "6px 16px", borderRadius: 8, background: C.tealBg,
                            border: `1px solid ${C.tealBorder}`, cursor: "pointer",
                            color: C.tealText, fontSize: 12, fontWeight: 600
                        }}
                    >
                        Today
                    </button>

                    <button
                        onClick={() => handleDateChange(1)}
                        style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                            borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg,
                            cursor: "pointer", color: C.text, fontSize: 12
                        }}
                    >
                        Next Day <ChevronRight size={14} />
                    </button>
                </div>

                {/* ── Status Filter Tabs ── */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {[{ value: "all", label: "All" }, ...STATUSES.map(s => ({ value: s, label: STATUS_CFG[s]?.label ?? s }))].map(t => {
                        const active = statusFilter === t.value;
                        const cfg = STATUS_CFG[t.value];
                        return (
                            <button
                                key={t.value}
                                onClick={() => setStatusFilter(t.value)}
                                style={{
                                    padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                                    border: `1px solid ${active ? (cfg?.border ?? C.tealBorder) : C.border}`,
                                    background: active ? (cfg?.bg ?? C.tealBg) : C.bg,
                                    color: active ? (cfg?.text ?? C.tealText) : C.muted,
                                    cursor: "pointer", fontFamily: "inherit", transition: "all .12s"
                                }}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Timeline View ── */}
                {view === "timeline" && (
                    <div style={{
                        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14,
                        overflow: "hidden"
                    }}>
                        {isLoading ? (
                            <div style={{ padding: "40px 18px", textAlign: "center" }}>
                                <div style={{
                                    width: 22, height: 22, borderRadius: "50%",
                                    border: `2px solid ${C.border}`, borderTopColor: C.teal,
                                    animation: "spin .7s linear infinite", margin: "0 auto 8px"
                                }} />
                                <p style={{ fontSize: 13, color: C.faint }}>Loading schedule...</p>
                            </div>
                        ) : (
                            timeSlots.map(time => (
                                <TimeSlot
                                    key={time}
                                    time={time}
                                    appointments={appointmentsByTime[time] || []}
                                    onSlotClick={handleSlotClick}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* ── List View ── */}
                {view === "list" && (
                    <div style={{
                        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14,
                        overflow: "hidden"
                    }}>
                        <div style={{
                            display: "grid", gridTemplateColumns: "100px 2fr 120px 100px 80px",
                            padding: "9px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}`
                        }}>
                            {["Time", "Patient", "Type", "Status", ""].map(h => (
                                <span key={h} style={{
                                    fontSize: 10, fontWeight: 700, color: C.faint,
                                    letterSpacing: ".07em", textTransform: "uppercase"
                                }}>{h}</span>
                            ))}
                        </div>
                        {isLoading && (
                            <div style={{ padding: "40px 18px", textAlign: "center" }}>
                                <div style={{
                                    width: 22, height: 22, borderRadius: "50%",
                                    border: `2px solid ${C.border}`, borderTopColor: C.teal,
                                    animation: "spin .7s linear infinite", margin: "0 auto 8px"
                                }} />
                                <p style={{ fontSize: 13, color: C.faint }}>Loading...</p>
                            </div>
                        )}
                        {!isLoading && filteredAppointments.length === 0 && (
                            <div style={{ padding: "48px 18px", textAlign: "center" }}>
                                <Clock size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
                                <p style={{ fontSize: 13, color: C.faint }}>No appointments scheduled for this day</p>
                            </div>
                        )}
                        {!isLoading && filteredAppointments.map((apt: any, i: number) => {
                            const time = new Date(apt.scheduled_at).toLocaleTimeString([], {
                                hour: "2-digit", minute: "2-digit"
                            });
                            return (
                                <div
                                    key={apt.id}
                                    onClick={() => handleEditAppointment(apt)}
                                    style={{
                                        display: "grid", gridTemplateColumns: "100px 2fr 120px 100px 80px",
                                        padding: "11px 18px", borderBottom: i < filteredAppointments.length - 1 ? `1px solid ${C.border}` : "none",
                                        alignItems: "center", transition: "background .1s", cursor: "pointer"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{time}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <Avi name={apt.patient_name ?? "?"} size={32} />
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{apt.patient_name ?? "—"}</p>
                                            <p style={{ fontSize: 11, color: C.faint }}>{apt.chief_complaint ?? "No complaint"}</p>
                                        </div>
                                    </div>
                                    <TypeBadge type={apt.type ?? "—"} />
                                    <Badge status={apt.status} />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this appointment?")) deleteMut.mutate(apt.id);
                                        }}
                                        style={{
                                            width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`,
                                            background: C.bgMuted, display: "flex", alignItems: "center",
                                            justifyContent: "center", cursor: "pointer", color: C.faint,
                                            transition: "all .12s", marginLeft: "auto"
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Schedule/Edit Modal ── */}
            <Modal
                open={modal}
                onClose={() => {
                    setModal(false);
                    setEditingAppointment(null);
                    setForm(EMPTY);
                }}
                title={editingAppointment ? "Edit Appointment" : "Schedule New Appointment"}
            >
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Field label="Patient *">
                        <PatientCombobox
                            patients={patients}
                            value={form.patientId}
                            onSelect={(id, label) => setForm(p => ({ ...p, patientId: id, patientLabel: label }))}
                        />
                    </Field>
                    <Field label="Appointment Type">
                        <select
                            value={form.type}
                            onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                            className="inp"
                            style={{ ...IS, cursor: "pointer" }}
                        >
                            {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                        </select>
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Date *">
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                className="inp"
                                style={IS}
                            />
                        </Field>
                        <Field label="Time *">
                            <input
                                type="time"
                                value={form.time}
                                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                                className="inp"
                                style={IS}
                            />
                        </Field>
                    </div>
                    {editingAppointment && (
                        <Field label="Status">
                            <StatusSelect
                                value={form.status}
                                onChange={v => setForm(p => ({ ...p, status: v }))}
                            />
                        </Field>
                    )}
                    <Field label="Chief Complaint">
                        <input
                            value={form.chiefComplaint}
                            onChange={e => setForm(p => ({ ...p, chiefComplaint: e.target.value }))}
                            placeholder="Reason for visit…"
                            className="inp"
                            style={IS}
                        />
                    </Field>
                    <Field label="Notes">
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            rows={2}
                            placeholder="Additional notes…"
                            className="inp"
                            style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }}
                        />
                    </Field>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
                        <GhostBtn onClick={() => {
                            setModal(false);
                            setEditingAppointment(null);
                            setForm(EMPTY);
                        }}>Cancel</GhostBtn>
                        <SubmitBtn loading={createMut.isPending || updateMut.isPending}>
                            <CalendarCheck size={14} /> {editingAppointment ? "Update" : "Schedule"}
                        </SubmitBtn>
                    </div>
                </form>
            </Modal>
        </>
    );
}