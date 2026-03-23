import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays, Clock, Search, X, CheckCircle2, XCircle,
  RefreshCw, Filter, ChevronDown, ChevronRight, User,
  Stethoscope, Activity, FileText, Camera, Syringe,
  Loader2, AlertCircle, ChevronLeft, ChevronRight as ChevronRightIcon,
  MoreHorizontal, Phone, Mail, MapPin, Calendar, Clock as ClockIcon,
  Bed, UserCheck, UserX, Users, Check
} from "lucide-react";
import { apiGetAppointments, apiUpdateAppointmentStatus } from "@/api/appointments";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";
import { format, isToday, isTomorrow, differenceInMinutes, parseISO } from "date-fns";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8",
  bg: "#ffffff",
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
  gray: "#6b7f75",
  grayBg: "#f4f7f5",
};

const STATUS_CFG = {
  scheduled: { bg: C.grayBg, text: C.gray, border: C.border, label: "Scheduled", icon: Clock, action: "check_in" },
  confirmed: { bg: C.blueBg, text: C.blueText, border: C.blueBorder, label: "Confirmed", icon: CheckCircle2, action: "start" },
  in_progress: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "In Progress", icon: RefreshCw, action: "complete" },
  completed: { bg: C.tealBg, text: C.tealText, border: C.tealBorder, label: "Completed", icon: CheckCircle2, action: null },
  cancelled: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Cancelled", icon: XCircle, action: null },
  no_show: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "No Show", icon: XCircle, action: null },
  waiting: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "Waiting", icon: Clock, action: "start" },
};

// ─── Components ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, src }: { name: string; size?: number; src?: string }) {
  const initials = (name ?? "?").split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: src ? "transparent" : `linear-gradient(135deg, ${C.teal}, #0a7d5d)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.37,
      fontWeight: 600,
      color: "white",
      flexShrink: 0,
      overflow: "hidden",
    }}>
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.scheduled;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: 100,
      background: cfg.bg,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap",
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function TimeSlot({ time, status }: { time: string; status: string }) {
  const isLate = status === "scheduled" && differenceInMinutes(new Date(), parseISO(time)) > 15;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Clock size={12} color={isLate ? C.red : C.faint} />
      <span style={{
        fontSize: 12,
        fontWeight: isLate ? 600 : 400,
        color: isLate ? C.red : C.text,
        fontVariantNumeric: "tabular-nums",
      }}>
        {format(parseISO(time), "h:mm a")}
      </span>
      {isLate && (
        <span style={{
          fontSize: 9,
          background: C.redBg,
          color: C.redText,
          padding: "2px 6px",
          borderRadius: 10,
          fontWeight: 500,
        }}>
          Late
        </span>
      )}
    </div>
  );
}

function ProcedureCard({ procedure }: { procedure: any }) {
  return (
    <div style={{
      background: C.bgMuted,
      borderRadius: 8,
      padding: "8px 10px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <Syringe size={12} color={C.teal} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{procedure.name}</p>
        <p style={{ fontSize: 10, color: C.faint }}>Tooth #{procedure.tooth_number || "—"}</p>
      </div>
      {procedure.completed && <Check size={12} color={C.teal} />}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssistantTodaySchedule() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showProcedures, setShowProcedures] = useState<string | null>(null);

  // Fetch today's appointments
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["assistant-appointments", format(selectedDate, "yyyy-MM-dd")],
    queryFn: () => apiGetAppointments({
      date: format(selectedDate, "yyyy-MM-dd"),
      limit: 100,
    }),
  });

  const appointments: any[] = data?.data ?? [];

  // Fetch patient details when needed
  const { data: patientData } = useQuery({
    queryKey: ["patient", selectedPatient?.id],
    queryFn: () => apiGetPatients({ id: selectedPatient?.id }),
    enabled: !!selectedPatient?.id,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiUpdateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["assistant-appointments"] });
      refetch();
    },
    onError: () => toast.error("Failed to update status"),
  });

  // Filter appointments
  const filtered = useMemo(() => {
    let filteredApps = appointments;

    if (statusFilter !== "all") {
      filteredApps = filteredApps.filter(a => a.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredApps = filteredApps.filter(a =>
        a.patient_name?.toLowerCase().includes(q) ||
        a.chief_complaint?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q)
      );
    }

    // Sort by time
    return filteredApps.sort((a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  }, [appointments, statusFilter, searchQuery]);

  const handleStatusUpdate = (id: number, currentStatus: string) => {
    const nextStatus: Record<string, string> = {
      scheduled: "confirmed",
      confirmed: "in_progress",
      waiting: "in_progress",
      in_progress: "completed",
    };
    const newStatus = nextStatus[currentStatus];
    if (newStatus) {
      statusMut.mutate({ id, status: newStatus });
    }
  };

  const handlePatientClick = (appointment: any) => {
    setSelectedPatient({
      id: appointment.patient_id,
      name: appointment.patient_name,
      complaint: appointment.chief_complaint,
      notes: appointment.notes,
      phone: appointment.patient_phone,
      email: appointment.patient_email,
    });
    setShowPatientModal(true);
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return "Today";
    if (isTomorrow(selectedDate)) return "Tomorrow";
    return format(selectedDate, "EEEE, MMMM d, yyyy");
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const stats = {
    total: appointments.length,
    waiting: appointments.filter(a => a.status === "scheduled" || a.status === "confirmed").length,
    inProgress: appointments.filter(a => a.status === "in_progress").length,
    completed: appointments.filter(a => a.status === "completed").length,
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .appointment-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); border-color: ${C.tealBorder}; }
        .status-btn:hover { transform: scale(1.02); }
        .modal-overlay { backdrop-filter: blur(2px); }
      `}</style>

      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        animation: "slideIn 0.3s ease-out",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Today's Schedule
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Manage your daily patient appointments and clinical tasks
              </p>
            </div>
            <button
              onClick={() => refetch()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bg,
                fontSize: 12,
                fontWeight: 500,
                color: C.muted,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgMuted; e.currentTarget.style.color = C.teal; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.muted; }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}>
          {[
            { label: "Total Patients", value: stats.total, icon: Users, color: C.teal, bg: C.tealBg },
            { label: "Waiting", value: stats.waiting, icon: Clock, color: C.amber, bg: C.amberBg },
            { label: "In Progress", value: stats.inProgress, icon: Activity, color: C.blue, bg: C.blueBg },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: C.teal, bg: C.tealBg },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{stat.value}</p>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: stat.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <stat.icon size={20} color={stat.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Date Navigator */}
        <div style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => changeDate(-1)}
              style={{
                padding: 6,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.bgMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={16} color={C.muted} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarDays size={18} color={C.teal} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{getDateLabel()}</span>
            </div>
            <button
              onClick={() => changeDate(1)}
              style={{
                padding: 6,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.bgMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRightIcon size={16} color={C.muted} />
            </button>
          </div>

          {/* Search & Filter */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", width: 220 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patients..."
                style={{
                  width: "100%",
                  height: 34,
                  paddingLeft: 32,
                  paddingRight: 30,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={12} color={C.faint} />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                height: 34,
                padding: "0 28px 0 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 12,
                background: C.bg,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Loader2 size={32} color={C.teal} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: C.muted }}>Loading today's schedule...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "60px 20px",
            textAlign: "center",
          }}>
            <CalendarDays size={48} color={C.faint} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>No appointments scheduled</p>
            <p style={{ fontSize: 12, color: C.muted }}>There are no appointments for {getDateLabel().toLowerCase()}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(appointment => (
              <div
                key={appointment.id}
                className="appointment-card"
                style={{
                  background: C.bg,
                  border: `1px solid ${appointment.status === "in_progress" ? C.tealBorder : C.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  {/* Patient Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 2, minWidth: 200 }} onClick={() => handlePatientClick(appointment)}>
                    <Avatar name={appointment.patient_name} size={48} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                          {appointment.patient_name}
                        </span>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <TimeSlot time={appointment.scheduled_at} status={appointment.status} />
                      {appointment.chief_complaint && (
                        <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                          <span style={{ fontWeight: 600 }}>Complaint:</span> {appointment.chief_complaint}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                        Type
                      </span>
                      <span style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        background: C.blueBg,
                        color: C.blueText,
                        borderRadius: 12,
                        textTransform: "capitalize",
                      }}>
                        {appointment.type?.replace(/_/g, " ")}
                      </span>
                    </div>
                    {appointment.room_name && (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                          Room
                        </span>
                        <span style={{ fontSize: 12, color: C.text }}>{appointment.room_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {appointment.status === "scheduled" && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, appointment.status)}
                        className="status-btn"
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${C.blueBorder}`,
                          background: C.blueBg,
                          color: C.blueText,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.15s",
                        }}
                      >
                        <UserCheck size={14} />
                        Check In
                      </button>
                    )}
                    {appointment.status === "confirmed" && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, appointment.status)}
                        className="status-btn"
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${C.tealBorder}`,
                          background: C.tealBg,
                          color: C.tealText,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Activity size={14} />
                        Start Treatment
                      </button>
                    )}
                    {appointment.status === "in_progress" && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, appointment.status)}
                        className="status-btn"
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${C.tealBorder}`,
                          background: C.tealBg,
                          color: C.tealText,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Complete
                      </button>
                    )}
                    {appointment.status === "in_progress" && (
                      <button
                        onClick={() => setShowProcedures(showProcedures === appointment.id ? null : appointment.id)}
                        style={{
                          padding: "8px",
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                          background: C.bgMuted,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Syringe size={14} color={C.muted} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Procedures Section (Expandable) */}
                {showProcedures === appointment.id && (
                  <div style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: `1px solid ${C.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Stethoscope size={14} color={C.teal} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Procedures to Perform</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                      <ProcedureCard procedure={{ name: "Dental Cleaning", tooth_number: null, completed: false }} />
                      <ProcedureCard procedure={{ name: "X-Ray (Full Mouth)", tooth_number: null, completed: false }} />
                      <ProcedureCard procedure={{ name: "Cavity Filling", tooth_number: "14", completed: false }} />
                    </div>
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                      <button style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        background: C.teal,
                        border: "none",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}>
                        Record Procedures
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowPatientModal(false)}
        >
          <div
            style={{
              background: C.bg,
              borderRadius: 16,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflow: "auto",
              animation: "slideIn 0.2s ease-out",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Patient Details</h3>
              <button
                onClick={() => setShowPatientModal(false)}
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
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <Avatar name={selectedPatient.name} size={56} />
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{selectedPatient.name}</h4>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selectedPatient.phone && (
                      <span style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                        <Phone size={10} /> {selectedPatient.phone}
                      </span>
                    )}
                    {selectedPatient.email && (
                      <span style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                        <Mail size={10} /> {selectedPatient.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.faint, marginBottom: 6, textTransform: "uppercase" }}>Chief Complaint</p>
                <p style={{ fontSize: 13, color: C.text, background: C.bgMuted, padding: "10px 12px", borderRadius: 8 }}>
                  {selectedPatient.complaint || "No complaint noted"}
                </p>
              </div>

              {selectedPatient.notes && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.faint, marginBottom: 6, textTransform: "uppercase" }}>Notes</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{selectedPatient.notes}</p>
                </div>
              )}

              <button
                onClick={() => {
                  setShowPatientModal(false);
                  // Navigate to patient profile
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  background: C.teal,
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: 8,
                }}
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}