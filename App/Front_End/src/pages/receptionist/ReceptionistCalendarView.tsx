// ReceptionistCalendarView.tsx
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeft, ChevronRight, Plus, Trash2,
    Clock, Calendar, X, CheckCircle2, AlertCircle
} from "lucide-react";
import {
    apiCreateAppointment,
    apiDeleteAppointment,
} from "@/api/appointments";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

// ─── Design tokens ────────────────────────────────────────────────────
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
    in_progress: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "In Progress", icon: Clock },
    completed: { bg: C.tealBg, text: C.tealText, border: C.tealBorder, label: "Completed", icon: CheckCircle2 },
    cancelled: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Cancelled", icon: X },
    no_show: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "No Show", icon: X },
    rescheduled: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "Rescheduled", icon: Clock },
};

// ─── Helper Components ──────────────────────────────────────────────
function Avi({ name, size = 30 }: { name: string; size?: number }) {
    const i = (name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    return <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg,#0d9e75,#0a7d5d)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.37, fontWeight: 700, color: "white", flexShrink: 0
    }}>{i}</div>;
}

function TypeBadge({ type }: { type: string }) {
    return <span style={{
        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
        background: C.blueBg, color: C.blueText, border: `1px solid ${C.blueBorder}`,
        whiteSpace: "nowrap", textTransform: "capitalize"
    }}>{type?.replace(/_/g, " ")}</span>;
}

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const cfg = STATUS_CFG[value] || STATUS_CFG.scheduled;
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px 3px 6px", borderRadius: 100,
            background: cfg.bg, border: `1px solid ${cfg.border}`, cursor: "pointer"
        }}>
            <cfg.icon size={10} color={cfg.text} strokeWidth={2.5} />
            <select
                value={value}
                onChange={e => { e.stopPropagation(); onChange(e.target.value); }}
                onClick={e => e.stopPropagation()}
                style={{
                    appearance: "none", WebkitAppearance: "none", background: "transparent",
                    border: "none", outline: "none", fontSize: 11, fontWeight: 600,
                    color: cfg.text, cursor: "pointer", fontFamily: "inherit", paddingRight: 2
                }}
            >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>)}
            </select>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{label}</label>
        {children}
    </div>;
}

function SubmitBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
    return <button type="submit" disabled={loading} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "9px 20px",
        borderRadius: 9, background: loading ? "#9ab5ae" : C.teal, border: "none",
        color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)"
    }}>
        {loading ? <><span style={{
            width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)",
            borderTopColor: "white", animation: "spin .7s linear infinite", display: "inline-block"
        }} />Saving…</> : children}
    </button>;
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return <button type="button" onClick={onClick} style={{
        padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`,
        background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted,
        cursor: "pointer", fontFamily: "inherit"
    }}>{children}</button>;
}

// ─── Patient Combobox ─────────────────────────────────────────────────
function PatientCombobox({ patients, value, onSelect }: {
    patients: any[]; value: string; onSelect: (id: string, label: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const selectedPt = patients.find(p => String(p.id) === value);
    const filtered = patients.filter(p =>
        !q || p.full_name?.toLowerCase().includes(q.toLowerCase()) ||
        p.phone?.includes(q) || p.patient_number?.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 50);

    return (
        <div style={{ position: "relative" }}>
            <div
                onClick={() => setOpen(v => !v)}
                style={{
                    width: "100%", height: 38, padding: "0 12px",
                    border: `1.5px solid ${C.border}`, borderRadius: 9,
                    background: C.bg, fontSize: 13, display: "flex",
                    alignItems: "center", justifyContent: "space-between", cursor: "pointer"
                }}
            >
                {selectedPt
                    ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avi name={selectedPt.full_name} size={22} />
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{selectedPt.full_name}</span>
                    </div>
                    : <span style={{ color: C.faint, fontSize: 13 }}>Search patient…</span>
                }
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: C.bg, border: `1.5px solid ${C.tealBorder}`, borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 100
                }}>
                    <div style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>
                        <input
                            autoFocus
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Type name or phone…"
                            style={{
                                width: "100%", height: 34, padding: "0 12px",
                                border: `1.5px solid ${C.border}`, borderRadius: 9,
                                fontSize: 12, outline: "none"
                            }}
                        />
                    </div>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {filtered.map(p => (
                            <div
                                key={p.id}
                                onClick={() => { onSelect(String(p.id), p.full_name); setOpen(false); setQ(""); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer" }}
                                onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <Avi name={p.full_name} size={28} />
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.full_name}</p>
                                    <p style={{ fontSize: 11, color: C.faint }}>{p.patient_number || ""} · {p.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Calendar Day Cell with Highlighting ─────────────────────────────────
function CalendarDay({ date, appointments, onClick, isToday, isCurrentMonth }: {
    date: Date;
    appointments: Record<string, any[]>;
    onClick: (date: Date, appointments: any[]) => void;
    isToday: boolean;
    isCurrentMonth: boolean;
}) {
    const dateKey = date.toISOString().split("T")[0];
    const dayAppointments = appointments[dateKey] || [];
    const hasAppointments = dayAppointments.length > 0;
    
    // Count appointments by status
    const statusCounts = dayAppointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    // Determine background color for dates with appointments
    const getBackgroundColor = () => {
        if (!isCurrentMonth) return C.bgMuted;
        if (hasAppointments) return `${C.teal}08`; // Very subtle teal tint
        return C.bg;
    };

    return (
        <div
            onClick={() => onClick(date, dayAppointments)}
            style={{
                minHeight: 100,
                padding: 8,
                border: `1px solid ${C.border}`,
                background: getBackgroundColor(),
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                ...(isToday && { 
                    border: `2px solid ${C.teal}`,
                    boxShadow: `0 0 0 1px ${C.teal}`,
                }),
            }}
            onMouseEnter={(e) => { 
                if (isCurrentMonth) {
                    e.currentTarget.style.background = hasAppointments ? `${C.teal}15` : C.tealBg;
                }
            }}
            onMouseLeave={(e) => { 
                e.currentTarget.style.background = getBackgroundColor();
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? C.teal : (isCurrentMonth ? C.text : C.faint),
                    background: isToday ? C.tealBg : "transparent",
                    width: 28, height: 28, display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: "50%"
                }}>
                    {date.getDate()}
                </span>
                {hasAppointments && (
                    <div style={{ 
                        display: "flex", 
                        gap: 3,
                        alignItems: "center"
                    }}>
                        {/* Status indicators */}
                        {statusCounts.confirmed > 0 && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue }} />
                        )}
                        {statusCounts.scheduled > 0 && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} />
                        )}
                        {statusCounts.in_progress > 0 && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.amber }} />
                        )}
                        {statusCounts.completed > 0 && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gray }} />
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginLeft: 2 }}>
                            {dayAppointments.length}
                        </span>
                    </div>
                )}
            </div>

            {/* Show appointments */}
            <div style={{ fontSize: 11, maxHeight: 60, overflow: "hidden" }}>
                {dayAppointments.slice(0, 2).map((apt, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: "2px 4px",
                            marginBottom: 2,
                            background: STATUS_CFG[apt.status]?.bg || C.grayBg,
                            borderRadius: 3,
                            fontSize: 10,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: STATUS_CFG[apt.status]?.text || C.text,
                        }}
                    >
                        {apt.time} - {apt.patient_name?.split(" ")[0]}
                    </div>
                ))}
                {dayAppointments.length > 2 && (
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        +{dayAppointments.length - 2} more
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Appointment Modal ──────────────────────────────────────────────────
function AppointmentModal({ open, onClose, selectedDate, editingAppointment, onSave, onDelete, isLoading }: {
    open: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    editingAppointment: any;
    onSave: (form: any) => void;
    onDelete: () => void;
    isLoading: boolean;
}) {
    const { data: patientsRes } = useQuery({
        queryKey: ["patients", "select"],
        queryFn: () => apiGetPatients({ limit: 500 }),
    });
    const patients = patientsRes?.data ?? [];

    const [form, setForm] = useState(() => {
        if (editingAppointment) {
            const date = new Date(editingAppointment.scheduled_at);
            return {
                id: editingAppointment.id,
                patientId: String(editingAppointment.patient_id),
                patientLabel: editingAppointment.patient_name,
                date: date.toISOString().split("T")[0],
                time: date.toTimeString().slice(0, 5),
                type: editingAppointment.type || "checkup",
                notes: editingAppointment.notes || "",
                chiefComplaint: editingAppointment.chief_complaint || "",
                status: editingAppointment.status,
            };
        }
        return {
            ...EMPTY,
            date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
            time: "09:00",
        };
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.patientId || !form.date || !form.time) {
            toast.error("Patient, date and time required");
            return;
        }
        onSave(form);
    };

    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 16
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: C.bg, borderRadius: 16, width: "100%", maxWidth: 520,
                    boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)"
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px", borderBottom: `1px solid ${C.border}`
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {editingAppointment ? "Edit Appointment" : "New Appointment"}
                    </h3>
                    <button onClick={onClose} style={{
                        width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`,
                        background: C.bgMuted, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: C.muted
                    }}>
                        <X size={14} />
                    </button>
                </div>

                <form onSubmit={handleSave} style={{ padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                                style={{
                                    width: "100%", height: 38, padding: "0 12px",
                                    border: `1.5px solid ${C.border}`, borderRadius: 9,
                                    background: C.bg, fontSize: 13, cursor: "pointer"
                                }}
                            >
                                {TYPES.map(t => (
                                    <option key={t} value={t}>
                                        {t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Field label="Date *">
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                    style={{
                                        width: "100%", height: 38, padding: "0 12px",
                                        border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13
                                    }}
                                />
                            </Field>
                            <Field label="Time *">
                                <input
                                    type="time"
                                    value={form.time}
                                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                                    style={{
                                        width: "100%", height: 38, padding: "0 12px",
                                        border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13
                                    }}
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
                                style={{
                                    width: "100%", height: 38, padding: "0 12px",
                                    border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13
                                }}
                            />
                        </Field>

                        <Field label="Notes">
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                rows={2}
                                placeholder="Additional notes…"
                                style={{
                                    width: "100%", padding: "8px 12px",
                                    border: `1.5px solid ${C.border}`, borderRadius: 9,
                                    fontSize: 13, resize: "none", fontFamily: "inherit"
                                }}
                            />
                        </Field>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
                            {editingAppointment && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={isLoading}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "9px 16px", borderRadius: 9,
                                        border: `1.5px solid ${C.redBorder}`, background: C.redBg,
                                        color: C.red, fontSize: 13, fontWeight: 500,
                                        cursor: isLoading ? "not-allowed" : "pointer"
                                    }}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            )}
                            <GhostBtn onClick={onClose}>Cancel</GhostBtn>
                            <SubmitBtn loading={isLoading}>
                                <Calendar size={14} /> {editingAppointment ? "Update" : "Schedule"}
                            </SubmitBtn>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Calendar View Component ───────────────────────────────────────────
export default function CalendarView({ appointments = [], isLoading: appointmentsLoading = false }: { 
    appointments: any[]; 
    isLoading?: boolean;
}) {
    const qc = useQueryClient();
    const user = useAuthStore(s => s.user);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Organize appointments by date
    const appointmentsByDate = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        
        // Handle appointments array
        if (appointments && Array.isArray(appointments) && appointments.length > 0) {
            appointments.forEach(apt => {
                const dateKey = apt.scheduled_at?.split("T")[0];
                if (dateKey) {
                    if (!grouped[dateKey]) grouped[dateKey] = [];
                    const time = new Date(apt.scheduled_at).toLocaleTimeString([], {
                        hour: "2-digit", minute: "2-digit"
                    });
                    grouped[dateKey].push({ ...apt, time });
                }
            });
            
            // Sort appointments by time
            Object.keys(grouped).forEach(date => {
                grouped[date].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
            });
        }
        
        return grouped;
    }, [appointments]);

    // Calendar calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthDays - i);
        calendarDays.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        calendarDays.push({ date, isCurrentMonth: true });
    }

    // Next month days
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        calendarDays.push({ date, isCurrentMonth: false });
    }

    const today = new Date();
    const isToday = (date: Date) => date.toDateString() === today.toDateString();

    // Handle date click
    const handleDateClick = (date: Date, dayAppointments: any[]) => {
        setSelectedDate(date);
        if (dayAppointments && dayAppointments.length === 1) {
            setEditingAppointment(dayAppointments[0]);
        } else {
            setEditingAppointment(null);
        }
        setModalOpen(true);
    };

    // Mutations
    const createMut = useMutation({
        mutationFn: apiCreateAppointment,
        onSuccess: () => {
            toast.success("Appointment scheduled");
            qc.invalidateQueries({ queryKey: ["appointments"] });
            setModalOpen(false);
            setEditingAppointment(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to schedule"),
    });

    const updateMut = useMutation({
        
        onSuccess: () => {
            toast.success("Appointment updated");
            qc.invalidateQueries({ queryKey: ["appointments"] });
            setModalOpen(false);
            setEditingAppointment(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to update"),
    });

    const deleteMut = useMutation({
        mutationFn: apiDeleteAppointment,
        onSuccess: () => {
            toast.success("Appointment deleted");
            qc.invalidateQueries({ queryKey: ["appointments"] });
            setModalOpen(false);
            setEditingAppointment(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to delete"),
    });

    const handleSave = (formData: any) => {
        if (editingAppointment) {
            updateMut.mutate({
                id: editingAppointment.id,
                status: formData.status,
            });
        } else {
            createMut.mutate({
                patientId: Number(formData.patientId),
                doctorId: user?.id,
                scheduledAt: `${formData.date}T${formData.time}:00`,
                type: formData.type,
                notes: formData.notes,
                chiefComplaint: formData.chiefComplaint,
            });
        }
    };

    const handleDelete = () => {
        if (editingAppointment && confirm("Delete this appointment?")) {
            deleteMut.mutate(editingAppointment.id);
        }
    };

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    const isLoadingModal = createMut.isPending || updateMut.isPending || deleteMut.isPending;

    // Calculate statistics
    const totalAppointments = appointments?.length || 0;
    const upcomingAppointments = appointments?.filter(a => a && ["scheduled", "confirmed"].includes(a.status)).length || 0;

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div style={{ animation: "fadeUp 0.4s ease both" }}>
                {/* Calendar Header */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 24, flexWrap: "wrap", gap: 16
                }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text }}>Calendar View</h2>
                        <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                            {totalAppointments} total · {upcomingAppointments} upcoming
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            onClick={handleToday}
                            style={{
                                padding: "6px 12px", fontSize: 12, fontWeight: 500,
                                border: `1px solid ${C.border}`, borderRadius: 8,
                                background: C.bg, cursor: "pointer", color: C.text
                            }}
                        >
                            Today
                        </button>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={handlePrevMonth}
                                style={{
                                    width: 32, height: 32, display: "flex", alignItems: "center",
                                    justifyContent: "center", border: `1px solid ${C.border}`,
                                    borderRadius: 8, background: C.bg, cursor: "pointer"
                                }}
                            >
                                <ChevronLeft size={16} color={C.muted} />
                            </button>

                            <div style={{
                                padding: "6px 16px", background: C.bg, border: `1px solid ${C.border}`,
                                borderRadius: 8, fontSize: 14, fontWeight: 600, color: C.text
                            }}>
                                {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                            </div>

                            <button
                                onClick={handleNextMonth}
                                style={{
                                    width: 32, height: 32, display: "flex", alignItems: "center",
                                    justifyContent: "center", border: `1px solid ${C.border}`,
                                    borderRadius: 8, background: C.bg, cursor: "pointer"
                                }}
                            >
                                <ChevronRight size={16} color={C.muted} />
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedDate(new Date());
                                setEditingAppointment(null);
                                setModalOpen(true);
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "0 18px",
                                height: 38, borderRadius: 9, background: C.teal, border: "none",
                                color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer"
                            }}
                        >
                            <Plus size={15} /> New Appointment
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div style={{
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden"
                }}>
                    {/* Weekday headers */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                        background: C.bgMuted, borderBottom: `1px solid ${C.border}`
                    }}>
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} style={{
                                padding: "12px 8px", textAlign: "center", fontSize: 11,
                                fontWeight: 600, color: C.faint, textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    {appointmentsLoading ? (
                        <div style={{ padding: 48, textAlign: "center" }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                border: `2px solid ${C.border}`, borderTopColor: C.teal,
                                animation: "spin 0.7s linear infinite", margin: "0 auto 8px"
                            }} />
                            <p style={{ fontSize: 13, color: C.faint }}>Loading appointments...</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                            {calendarDays.map(({ date, isCurrentMonth }, idx) => (
                                <CalendarDay
                                    key={idx}
                                    date={date}
                                    appointments={appointmentsByDate}
                                    onClick={handleDateClick}
                                    isToday={isToday(date)}
                                    isCurrentMonth={isCurrentMonth}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Appointment Modal */}
            <AppointmentModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingAppointment(null);
                }}
                selectedDate={selectedDate}
                editingAppointment={editingAppointment}
                onSave={handleSave}
                onDelete={handleDelete}
                isLoading={isLoadingModal}
            />
        </>
    );
}