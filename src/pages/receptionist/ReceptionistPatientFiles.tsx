// ReceptionistPatientFiles.tsx - Enhanced with complete medical records
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Trash2, CalendarDays, Clock, Search,
    ChevronRight, CheckCircle2, XCircle, RefreshCw,
    LayoutGrid, List, Filter, ChevronDown,
    CalendarCheck, Timer, Ban, RotateCcw, X,
    FileText, User, Phone, Mail, MapPin, Calendar,
    Download, Eye, Edit2, UserPlus, Activity,
    Heart, Droplet, Thermometer, Ruler, Weight,
    ChevronLeft, TrendingUp, AlertCircle, MoreVertical,
    Printer, Share2, Archive, FileSignature, Users,
    Stethoscope, Syringe, Pill, Shield, AlertTriangle,
    Briefcase, CreditCard, FileHeart, Bone,
} from "lucide-react";
import {
    apiGetPatients,
    apiCreatePatient,
    apiUpdatePatient,
    apiDeletePatient,
} from "@/api/patients";
import { apiGetAppointments } from "@/api/appointments";
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
    green: "#10b981", greenBg: "#f0fdf4", greenText: "#059669", greenBorder: "#d1fae5",
    gray: "#6b7f75", grayBg: "#f4f7f5",
    pink: "#ec489a", pinkBg: "#fdf2f8", pinkText: "#be185d", pinkBorder: "#fce7f3",
};

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({ name, size = 30 }: { name: string; size?: number }) {
    const i = (name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    return <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#0d9e75,#0a7d5d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.37, fontWeight: 700, color: "white", flexShrink: 0 }}>{i}</div>;
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

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, size = "medium" }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "small" | "medium" | "large" | "xl";
}) {
    if (!open) return null;

    const width = size === "small" ? 400 : size === "medium" ? 520 : size === "large" ? 800 : 1000;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: width, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-.01em" }}>{title}</h3>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><X size={14} /></button>
                </div>
                <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    );
}

// ─── Search Input ────────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ ...IS, paddingLeft: 36, height: 42, fontSize: 14 }}
            />
            {value && (
                <button onClick={() => onChange("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint }}>
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

// ─── Patient Card ───────────────────────────────────────────────────────────
function PatientCard({ patient, onClick, onEdit, onDelete, appointmentCount }: {
    patient: any;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    appointmentCount: number;
}) {
    // Check for important medical alerts
    const hasAllergies = patient.allergies && patient.allergies.length > 0;
    const hasConditions = patient.medical_conditions && patient.medical_conditions.length > 0;

    return (
        <div
            onClick={onClick}
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 16,
                transition: "all 0.2s",
                cursor: "pointer",
                position: "relative",
                ...(hasAllergies && { borderLeft: `4px solid ${C.amber}` }),
                ...(hasConditions && { borderRight: `4px solid ${C.blue}` }),
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Medical Alert Badges */}
            {(hasAllergies || hasConditions) && (
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                    {hasAllergies && (
                        <div style={{ background: C.amberBg, padding: "2px 6px", borderRadius: 12, fontSize: 9, fontWeight: 600, color: C.amberText, display: "flex", alignItems: "center", gap: 2 }}>
                            <AlertCircle size={8} /> Allergy
                        </div>
                    )}
                    {hasConditions && (
                        <div style={{ background: C.blueBg, padding: "2px 6px", borderRadius: 12, fontSize: 9, fontWeight: 600, color: C.blueText, display: "flex", alignItems: "center", gap: 2 }}>
                            <Heart size={8} /> Medical
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Avi name={patient.full_name} size={48} />
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{patient.full_name}</h3>
                        <div style={{ display: "flex", gap: 4 }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}
                                onMouseEnter={e => e.currentTarget.style.background = C.tealBg}
                                onMouseLeave={e => e.currentTarget.style.background = C.bgMuted}
                            >
                                <Edit2 size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (confirm("Delete this patient?")) onDelete(); }}
                                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}
                                onMouseEnter={e => e.currentTarget.style.background = C.redBg}
                                onMouseLeave={e => e.currentTarget.style.background = C.bgMuted}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={12} color={C.muted} />
                            <span style={{ fontSize: 12, color: C.text }}>{patient.phone || "N/A"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Mail size={12} color={C.muted} />
                            <span style={{ fontSize: 12, color: C.text }}>{patient.email || "N/A"}</span>
                        </div>
                        {patient.blood_type && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <Droplet size={12} color={C.red} />
                                <span style={{ fontSize: 12, color: C.text }}>Blood: {patient.blood_type}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: C.tealBg,
                            color: C.tealText,
                            border: `1px solid ${C.tealBorder}`
                        }}>
                            {appointmentCount} appointments
                        </span>
                        {patient.last_visit && (
                            <span style={{ fontSize: 11, color: C.faint }}>
                                Last visit: {new Date(patient.last_visit).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Patient Details Modal with Complete Medical Records ───────────────────
function PatientDetailsModal({ open, onClose, patient, appointments, onEdit }: {
    open: boolean;
    onClose: () => void;
    patient: any;
    appointments: any[];
    onEdit: () => void;
}) {
    if (!open || !patient) return null;

    const recentAppointments = appointments
        .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
        .slice(0, 5);

    // Calculate age
    const calculateAge = (dob: string) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = calculateAge(patient.date_of_birth);

    return (
        <Modal open={open} onClose={onClose} title="Patient Details" size="xl">
            <div>
                {/* Header with Medical Alerts */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <Avi name={patient.full_name} size={80} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{patient.full_name}</h2>
                                <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                                    Patient ID: {patient.patient_number || "N/A"} • Age: {age ? `${age} years` : "N/A"} • {patient.gender || "Gender not specified"}
                                </p>
                            </div>
                            <button
                                onClick={onEdit}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 12 }}
                            >
                                <Edit2 size={12} /> Edit Profile
                            </button>
                        </div>
                        
                        {/* Medical Alert Banner */}
                        {(patient.allergies || patient.medical_conditions) && (
                            <div style={{ marginTop: 12, padding: "10px 12px", background: C.amberBg, borderRadius: 8, border: `1px solid ${C.amberBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
                                <AlertCircle size={16} color={C.amber} />
                                <span style={{ fontSize: 12, color: C.amberText, fontWeight: 500 }}>
                                    {patient.allergies && `Allergies: ${patient.allergies}`}
                                    {patient.allergies && patient.medical_conditions && " • "}
                                    {patient.medical_conditions && `Medical Conditions: ${patient.medical_conditions}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs Layout */}
                <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        {["Personal", "Medical", "Emergency", "Insurance", "Dental", "History"].map(tab => (
                            <button key={tab} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, color: C.muted, background: "transparent", border: "none", cursor: "pointer", borderBottom: `2px solid transparent` }}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Personal Information */}
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <User size={14} /> Personal Information
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Phone</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.phone || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Secondary Phone</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.secondary_phone || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Email</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.email || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Date of Birth</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Gender</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.gender || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>National ID</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.national_id || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Occupation</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.occupation || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Marital Status</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.marital_status || "N/A"}</p>
                        </div>
                        <div style={{ gridColumn: "span 2", padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Address</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.address || "N/A"}</p>
                        </div>
                    </div>
                </div>

                {/* Medical Information */}
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Stethoscope size={14} /> Medical Information
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                        <div style={{ padding: "8px 12px", background: patient.blood_type ? C.blueBg : C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Blood Type</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.blood_type || "Not recorded"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: patient.allergies ? C.amberBg : C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Allergies</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.allergies || "No known allergies"}</p>
                        </div>
                        <div style={{ gridColumn: "span 2", padding: "8px 12px", background: patient.medical_conditions ? C.blueBg : C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Medical Conditions</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.medical_conditions || "No known conditions"}</p>
                        </div>
                        <div style={{ gridColumn: "span 2", padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Current Medications</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.medications || "None reported"}</p>
                        </div>
                    </div>
                </div>

                {/* Emergency Contacts */}
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <AlertTriangle size={14} /> Emergency Contacts
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Emergency Contact Name</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.emergency_contact_name || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Emergency Contact Phone</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.emergency_contact_phone || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Relationship</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.emergency_contact_relationship || "N/A"}</p>
                        </div>
                    </div>
                </div>

                {/* Insurance Information */}
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <CreditCard size={14} /> Insurance Information
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Insurance Provider</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.insurance_provider || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Policy Number</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.insurance_policy_number || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Coverage Type</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.insurance_coverage || "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Expiry Date</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.insurance_expiry ? new Date(patient.insurance_expiry).toLocaleDateString() : "N/A"}</p>
                        </div>
                    </div>
                </div>

                {/* Dental Information */}
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Bone size={14} /> Dental Information
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Dentist Since</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.dentist_since ? new Date(patient.dentist_since).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Last Cleaning</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.last_cleaning ? new Date(patient.last_cleaning).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div style={{ gridColumn: "span 2", padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Dental Concerns</span>
                            <p style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{patient.dental_concerns || "None reported"}</p>
                        </div>
                    </div>
                </div>

                {/* Recent Appointments */}
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <CalendarDays size={14} /> Recent Appointments
                    </h3>
                    {recentAppointments.length === 0 ? (
                        <p style={{ fontSize: 13, color: C.faint, textAlign: "center", padding: 20 }}>No appointments found</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {recentAppointments.map((apt, idx) => (
                                <div key={idx} style={{ padding: "12px", background: C.bgMuted, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{apt.type?.replace(/_/g, " ")}</p>
                                        <p style={{ fontSize: 11, color: C.muted }}>{new Date(apt.scheduled_at).toLocaleString()}</p>
                                        {apt.chief_complaint && <p style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{apt.chief_complaint}</p>}
                                    </div>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: apt.status === "completed" ? C.greenBg : C.amberBg, color: apt.status === "completed" ? C.greenText : C.amberText }}>
                                        {apt.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

// ─── Patient Form Modal with Complete Fields ─────────────────────────────────
function PatientFormModal({ open, onClose, patient, onSave, isLoading }: {
    open: boolean;
    onClose: () => void;
    patient: any;
    onSave: (data: any) => void;
    isLoading: boolean;
}) {
    const [form, setForm] = useState({
        full_name: patient?.full_name || "",
        phone: patient?.phone || "",
        secondary_phone: patient?.secondary_phone || "",
        email: patient?.email || "",
        date_of_birth: patient?.date_of_birth || "",
        gender: patient?.gender || "",
        address: patient?.address || "",
        national_id: patient?.national_id || "",
        occupation: patient?.occupation || "",
        marital_status: patient?.marital_status || "",
        blood_type: patient?.blood_type || "",
        allergies: patient?.allergies || "",
        medical_conditions: patient?.medical_conditions || "",
        medications: patient?.medications || "",
        emergency_contact_name: patient?.emergency_contact_name || "",
        emergency_contact_phone: patient?.emergency_contact_phone || "",
        emergency_contact_relationship: patient?.emergency_contact_relationship || "",
        insurance_provider: patient?.insurance_provider || "",
        insurance_policy_number: patient?.insurance_policy_number || "",
        insurance_coverage: patient?.insurance_coverage || "",
        insurance_expiry: patient?.insurance_expiry || "",
        dentist_since: patient?.dentist_since || "",
        last_cleaning: patient?.last_cleaning || "",
        dental_concerns: patient?.dental_concerns || "",
        notes: patient?.notes || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose} title={patient ? "Edit Patient" : "Add New Patient"} size="xl">
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
                    {/* Basic Information */}
                    <Field label="Full Name *">
                        <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={IS} />
                    </Field>
                    <Field label="Phone *">
                        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={IS} />
                    </Field>
                    <Field label="Secondary Phone">
                        <input type="tel" value={form.secondary_phone} onChange={e => setForm({ ...form, secondary_phone: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Email">
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Date of Birth">
                        <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Gender">
                        <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={IS}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </Field>
                    <Field label="National ID">
                        <input type="text" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Occupation">
                        <input type="text" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Marital Status">
                        <select value={form.marital_status} onChange={e => setForm({ ...form, marital_status: e.target.value })} style={IS}>
                            <option value="">Select</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                        </select>
                    </Field>
                    <Field label="Address" style={{ gridColumn: "span 2" }}>
                        <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none" }} />
                    </Field>

                    {/* Medical Information */}
                    <Field label="Blood Type">
                        <select value={form.blood_type} onChange={e => setForm({ ...form, blood_type: e.target.value })} style={IS}>
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </Field>
                    <Field label="Allergies">
                        <input type="text" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} placeholder="e.g., Penicillin, Peanuts, Latex" style={IS} />
                    </Field>
                    <Field label="Medical Conditions">
                        <input type="text" value={form.medical_conditions} onChange={e => setForm({ ...form, medical_conditions: e.target.value })} placeholder="e.g., Diabetes, Hypertension, Asthma" style={IS} />
                    </Field>
                    <Field label="Current Medications">
                        <input type="text" value={form.medications} onChange={e => setForm({ ...form, medications: e.target.value })} placeholder="List all current medications" style={IS} />
                    </Field>

                    {/* Emergency Contact */}
                    <Field label="Emergency Contact Name">
                        <input type="text" value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Emergency Contact Phone">
                        <input type="tel" value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Relationship">
                        <input type="text" value={form.emergency_contact_relationship} onChange={e => setForm({ ...form, emergency_contact_relationship: e.target.value })} placeholder="e.g., Spouse, Parent, Sibling" style={IS} />
                    </Field>

                    {/* Insurance Information */}
                    <Field label="Insurance Provider">
                        <input type="text" value={form.insurance_provider} onChange={e => setForm({ ...form, insurance_provider: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Policy Number">
                        <input type="text" value={form.insurance_policy_number} onChange={e => setForm({ ...form, insurance_policy_number: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Coverage Type">
                        <input type="text" value={form.insurance_coverage} onChange={e => setForm({ ...form, insurance_coverage: e.target.value })} placeholder="e.g., Full, Partial, Dental Only" style={IS} />
                    </Field>
                    <Field label="Insurance Expiry">
                        <input type="date" value={form.insurance_expiry} onChange={e => setForm({ ...form, insurance_expiry: e.target.value })} style={IS} />
                    </Field>

                    {/* Dental Information */}
                    <Field label="Dentist Since">
                        <input type="date" value={form.dentist_since} onChange={e => setForm({ ...form, dentist_since: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Last Cleaning">
                        <input type="date" value={form.last_cleaning} onChange={e => setForm({ ...form, last_cleaning: e.target.value })} style={IS} />
                    </Field>
                    <Field label="Dental Concerns" style={{ gridColumn: "span 2" }}>
                        <textarea value={form.dental_concerns} onChange={e => setForm({ ...form, dental_concerns: e.target.value })} rows={2} placeholder="Any specific dental concerns or previous treatments" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none" }} />
                    </Field>
                    <Field label="Additional Notes" style={{ gridColumn: "span 2" }}>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any other relevant information" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none" }} />
                    </Field>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
                    <GhostBtn onClick={onClose}>Cancel</GhostBtn>
                    <SubmitBtn loading={isLoading}>
                        {patient ? "Update Patient" : "Create Patient"}
                    </SubmitBtn>
                </div>
            </form>
        </Modal>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReceptionistPatientFiles() {
    const qc = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<any>(null);

    // Fetch patients
    const { data, isLoading } = useQuery({
        queryKey: ["patients", "all"],
        queryFn: () => apiGetPatients({ limit: 500 }),
    });

    // Fetch appointments for patient details
    const { data: appointmentsData } = useQuery({
        queryKey: ["appointments", "all"],
        queryFn: () => apiGetAppointments({}),
        enabled: detailsModalOpen,
    });

    const patients: any[] = data?.data ?? [];
    const allAppointments: any[] = appointmentsData?.data ?? [];

    // Filter patients by search
    const filteredPatients = useMemo(() => {
        if (!searchQuery) return patients;
        const query = searchQuery.toLowerCase();
        return patients.filter(p =>
            p.full_name?.toLowerCase().includes(query) ||
            p.phone?.includes(query) ||
            p.email?.toLowerCase().includes(query) ||
            p.patient_number?.toLowerCase().includes(query) ||
            p.national_id?.toLowerCase().includes(query)
        );
    }, [patients, searchQuery]);

    // Get appointment count for each patient
    const getPatientAppointmentCount = (patientId: number) => {
        return allAppointments.filter(apt => apt.patient_id === patientId).length;
    };

    // Get patient appointments
    const getPatientAppointments = (patientId: number) => {
        return allAppointments.filter(apt => apt.patient_id === patientId);
    };

    // Statistics
    const totalPatients = patients.length;
    const patientsWithAllergies = patients.filter(p => p.allergies).length;
    const patientsWithConditions = patients.filter(p => p.medical_conditions).length;
    const patientsWithInsurance = patients.filter(p => p.insurance_provider).length;

    // Mutations
    const createMut = useMutation({
        mutationFn: apiCreatePatient,
        onSuccess: () => {
            toast.success("Patient created successfully");
            qc.invalidateQueries({ queryKey: ["patients"] });
            setFormModalOpen(false);
            setEditingPatient(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to create patient"),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, ...data }: any) => apiUpdatePatient(id, data),
        onSuccess: () => {
            toast.success("Patient updated successfully");
            qc.invalidateQueries({ queryKey: ["patients"] });
            setFormModalOpen(false);
            setEditingPatient(null);
            setDetailsModalOpen(false);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to update patient"),
    });

    const deleteMut = useMutation({
        mutationFn: apiDeletePatient,
        onSuccess: () => {
            toast.success("Patient deleted successfully");
            qc.invalidateQueries({ queryKey: ["patients"] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to delete patient"),
    });

    const handleSavePatient = (formData: any) => {
        if (editingPatient) {
            updateMut.mutate({ id: editingPatient.id, ...formData });
        } else {
            createMut.mutate(formData);
        }
    };

    const handleEditPatient = (patient: any) => {
        setEditingPatient(patient);
        setFormModalOpen(true);
    };

    const handleAddPatient = () => {
        setEditingPatient(null);
        setFormModalOpen(true);
    };

    const handleViewPatient = (patient: any) => {
        setSelectedPatient(patient);
        setDetailsModalOpen(true);
    };

    const isLoadingModal = createMut.isPending || updateMut.isPending || deleteMut.isPending;

    return (
        <>
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            `}</style>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
                            <FileText size={24} color={C.teal} /> Patient Files
                        </h1>
                        <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                            Complete patient records, medical history, allergies, and insurance information
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden" }}>
                            {(["grid", "list"] as const).map(v => (
                                <button key={v} onClick={() => setView(v)} style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: view === v ? C.tealBg : "transparent", border: "none", cursor: "pointer", color: view === v ? C.tealText : C.faint, transition: "all .15s" }}>
                                    {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleAddPatient} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(13,158,117,.3)" }}>
                            <Plus size={15} /> Add Patient
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Users size={14} color={C.teal} /><span style={{ fontSize: 12, color: C.muted }}>Total Patients</span></div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{totalPatients}</p>
                    </div>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><AlertCircle size={14} color={C.amber} /><span style={{ fontSize: 12, color: C.muted }}>With Allergies</span></div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{patientsWithAllergies}</p>
                    </div>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Heart size={14} color={C.blue} /><span style={{ fontSize: 12, color: C.muted }}>With Conditions</span></div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{patientsWithConditions}</p>
                    </div>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><CreditCard size={14} color={C.green} /><span style={{ fontSize: 12, color: C.muted }}>With Insurance</span></div>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{patientsWithInsurance}</p>
                    </div>
                </div>

                {/* Search */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, phone, email, ID, or national ID..." />
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        <span style={{ fontSize: 12, color: C.muted, padding: "0 8px" }}>{filteredPatients.length} patients found</span>
                    </div>
                </div>

                {/* Grid View */}
                {view === "grid" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 12 }}>
                        {isLoading ? Array.from({ length: 6 }).map((_, i) => (<div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, height: 140, animation: "fadeUp .4s ease both" }} />))
                            : filteredPatients.length === 0 ? (
                                <div style={{ gridColumn: "1/-1", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "60px 20px", textAlign: "center" }}>
                                    <FileText size={48} color={C.border} style={{ margin: "0 auto 16px", display: "block" }} />
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No patients found</h3>
                                    <p style={{ fontSize: 13, color: C.faint }}>{searchQuery ? "Try a different search term" : "Click 'Add Patient' to create your first patient record"}</p>
                                </div>
                            ) : filteredPatients.map(patient => (
                                <PatientCard key={patient.id} patient={patient} onClick={() => handleViewPatient(patient)} onEdit={() => handleEditPatient(patient)} onDelete={() => deleteMut.mutate(patient.id)} appointmentCount={getPatientAppointmentCount(patient.id)} />
                            ))}
                    </div>
                )}

                {/* List View */}
                {view === "list" && (
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "60px 2fr 1.5fr 1fr 100px 80px", padding: "12px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                            {["", "Name", "Contact", "Patient ID", "Appointments", ""].map(h => (<span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>))}
                        </div>
                        {isLoading ? (<div style={{ padding: "40px 18px", textAlign: "center" }}><div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 13, color: C.faint }}>Loading...</p></div>)
                            : filteredPatients.length === 0 ? (<div style={{ padding: "48px 18px", textAlign: "center" }}><FileText size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} /><p style={{ fontSize: 13, color: C.faint }}>No patients found</p></div>)
                                : filteredPatients.map((patient, i) => (
                                    <div key={patient.id} onClick={() => handleViewPatient(patient)} style={{ display: "grid", gridTemplateColumns: "60px 2fr 1.5fr 1fr 100px 80px", padding: "12px 18px", borderBottom: i < filteredPatients.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background .1s", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.bgMuted} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <Avi name={patient.full_name} size={36} />
                                        <div><p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{patient.full_name}</p><p style={{ fontSize: 11, color: C.faint }}>DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "N/A"}</p></div>
                                        <div><p style={{ fontSize: 12, color: C.text }}>{patient.phone || "N/A"}</p><p style={{ fontSize: 11, color: C.faint }}>{patient.email || "N/A"}</p></div>
                                        <span style={{ fontSize: 12, color: C.muted }}>{patient.patient_number || "N/A"}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{getPatientAppointmentCount(patient.id)}</span>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <button onClick={(e) => { e.stopPropagation(); handleEditPatient(patient); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><Edit2 size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this patient?")) deleteMut.mutate(patient.id); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                    </div>
                )}
            </div>

            {/* Patient Details Modal */}
            <PatientDetailsModal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} patient={selectedPatient} appointments={getPatientAppointments(selectedPatient?.id)} onEdit={() => { setDetailsModalOpen(false); handleEditPatient(selectedPatient); }} />

            {/* Patient Form Modal */}
            <PatientFormModal open={formModalOpen} onClose={() => { setFormModalOpen(false); setEditingPatient(null); }} patient={editingPatient} onSave={handleSavePatient} isLoading={isLoadingModal} />
        </>
    );
}