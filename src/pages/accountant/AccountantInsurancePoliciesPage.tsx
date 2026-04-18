import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Trash2, Search, Filter, X, Eye, Edit, RefreshCw,
    Shield, Building2, FileText, CheckCircle, XCircle, Clock,
    DollarSign, Download, User, Calendar, Percent, Receipt, ChevronDown,
    AlertCircle, FileCheck, CreditCard, Calendar as CalendarIcon
} from "lucide-react";
import { apiGetPatients } from "@/api/patients";
import {
    apiGetInsurancePolicies,
    apiCreateInsurancePolicy,
    apiUpdateInsurancePolicy,
    apiDeleteInsurancePolicy
} from "@/api/insurance";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate } from "@/utils";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const COVERAGE_TYPES = [
    "Full", "Partial", "Dental Only", "Basic", "Premium", "Standard", "Family"
];

const EMPTY_POLICY = {
    patientId: "",
    providerName: "",
    policyNumber: "",
    groupNumber: "",
    memberId: "",
    coverageType: "Standard",
    coveragePercent: 0,
    annualLimit: 0,
    usedAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    isActive: true,
    notes: ""
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
    text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
    teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
    amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
    red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
    blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
    purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ede9fe",
    gray: "#6b7f75", grayBg: "#f4f7f5",
    success: "#10b981", successBg: "#f0fdf4", successText: "#065f46",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Badge({ isActive }: { isActive: boolean }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 100,
            background: isActive ? C.successBg : C.redBg,
            color: isActive ? C.successText : C.redText,
            border: `1px solid ${isActive ? C.tealBorder : C.redBorder}`,
            whiteSpace: "nowrap"
        }}>
            {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {isActive ? "Active" : "Inactive"}
        </span>
    );
}

function CoverageBadge({ percent }: { percent: number }) {
    let color = C.teal;
    let bg = C.tealBg;
    if (percent >= 90) { color = C.success; bg = C.successBg; }
    else if (percent >= 70) { color = C.teal; bg = C.tealBg; }
    else if (percent >= 50) { color = C.blue; bg = C.blueBg; }
    else { color = C.amber; bg = C.amberBg; }

    return (
        <span style={{
            display: "inline-flex", alignItems: "center",
            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 100,
            background: bg, color: color, whiteSpace: "nowrap"
        }}>
            {percent}% Coverage
        </span>
    );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
    const initials = (name || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.purple}, #5b21b6)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.37, fontWeight: 700, color: "white", flexShrink: 0
        }}>
            {initials}
        </div>
    );
}

const InputStyle: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1.5px solid ${C.border}`, borderRadius: 9,
    background: C.bg, fontSize: 13, color: C.text,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box"
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                {label}{required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
            </label>
            {children}
        </div>
    );
}

function Button({ children, variant = "primary", loading = false, onClick, type = "button", disabled, size = "md" }: any) {
    const variants: any = {
        primary: { bg: C.teal, color: "white", border: "none", hoverBg: "#0a8a66" },
        secondary: { bg: C.bg, color: C.muted, border: `1.5px solid ${C.border}`, hoverBg: C.bgMuted },
        danger: { bg: C.redBg, color: C.redText, border: `1px solid ${C.redBorder}`, hoverBg: "#fee2e2" },
        ghost: { bg: "transparent", color: C.muted, border: "none", hoverBg: C.bgMuted },
        success: { bg: C.successBg, color: C.successText, border: `1px solid ${C.tealBorder}`, hoverBg: "#e6f7f0" }
    };
    const sizes = { sm: { padding: "4px 10px", fontSize: 11 }, md: { padding: "8px 16px", fontSize: 13 } };
    const style = variants[variant];
    const sizeStyle = sizes[size];
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading || disabled}
            style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: sizeStyle.padding,
                borderRadius: 8, background: style.bg, color: style.color, border: style.border,
                fontSize: sizeStyle.fontSize, fontWeight: 500, cursor: loading || disabled ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "all 0.15s ease", opacity: loading || disabled ? 0.6 : 1
            }}
        >
            {loading && <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid rgba(255,255,255,.3)`, borderTopColor: "white", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
            {children}
        </button>
    );
}

// ─── Patient Selector ─────────────────────────────────────────────────────────
function PatientSelector({ selectedPatient, onSelectPatient }: {
    selectedPatient: any;
    onSelectPatient: (patient: any) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const { data: patientsData, isLoading } = useQuery({
        queryKey: ["patients", searchQuery],
        queryFn: () => apiGetPatients({ search: searchQuery, limit: 20 }),
    });

    const patients = patientsData?.data || [];

    const handleSelect = (patient: any) => {
        onSelectPatient(patient);
        setIsOpen(false);
        setSearchQuery("");
    };

    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                Patient <span style={{ color: C.red }}>*</span>
            </label>

            {selectedPatient ? (
                <div style={{
                    background: C.tealBg,
                    border: `1px solid ${C.tealBorder}`,
                    borderRadius: 10,
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={selectedPatient.full_name} size={36} />
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{selectedPatient.full_name}</p>
                            <p style={{ fontSize: 11, color: C.muted }}>
                                {selectedPatient.patient_number} · {selectedPatient.phone}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onSelectPatient(null)}
                        style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: `1px solid ${C.border}`,
                            background: C.bg,
                            fontSize: 11,
                            cursor: "pointer",
                            color: C.muted,
                        }}
                    >
                        Change
                    </button>
                </div>
            ) : (
                <div style={{ position: "relative" }}>
                    <div
                        onClick={() => setIsOpen(true)}
                        style={{
                            border: `1.5px solid ${C.border}`,
                            borderRadius: 9,
                            padding: "10px 12px",
                            background: C.bg,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <span style={{ color: C.muted, fontSize: 13 }}>
                            {isOpen ? "Search for a patient..." : "Click to search for a patient"}
                        </span>
                        <ChevronDown size={14} color={C.muted} />
                    </div>

                    {isOpen && (
                        <div style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 100,
                            maxHeight: 400,
                            overflow: "auto",
                        }}>
                            <div style={{ padding: "12px", borderBottom: `1px solid ${C.border}` }}>
                                <div style={{ position: "relative" }}>
                                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                                    <input
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, phone, or ID..."
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px 8px 32px",
                                            border: `1px solid ${C.border}`,
                                            borderRadius: 8,
                                            fontSize: 13,
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>

                            {isLoading ? (
                                <div style={{ padding: "20px", textAlign: "center" }}>
                                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                                </div>
                            ) : patients.length === 0 ? (
                                <div style={{ padding: "20px", textAlign: "center", color: C.muted }}>
                                    No patients found
                                </div>
                            ) : (
                                patients.map((patient: any) => (
                                    <div
                                        key={patient.id}
                                        onClick={() => handleSelect(patient)}
                                        style={{
                                            padding: "12px 16px",
                                            cursor: "pointer",
                                            borderBottom: `1px solid ${C.border}`,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = C.bgMuted; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <Avatar name={patient.full_name} size={36} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{patient.full_name}</p>
                                            <p style={{ fontSize: 11, color: C.muted }}>
                                                {patient.patient_number} · {patient.phone}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Modal Components ─────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, size = "md" }: any) {
    if (!open) return null;
    const widths = { sm: 480, md: 600, lg: 800 };
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: widths[size], maxHeight: "90vh", overflow: "auto", animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
                        <X size={14} />
                    </button>
                </div>
                <div style={{ padding: 20 }}>{children}</div>
            </div>
        </div>
    );
}

function ViewPolicyModal({ open, onClose, policy }: { open: boolean; onClose: () => void; policy: any }) {
    if (!policy) return null;

    return (
        <Modal open={open} onClose={onClose} title="Policy Details" size="lg">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Policy Information</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Provider</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{policy.provider_name || "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Policy Number</span>
                        <span style={{ fontSize: 13, fontFamily: "monospace" }}>{policy.policy_number || "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Group Number</span>
                        <span style={{ fontSize: 13 }}>{policy.group_number || "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Member ID</span>
                        <span style={{ fontSize: 13 }}>{policy.member_id || "—"}</span>
                    </div>
                </div>

                <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Patient Information</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <Avatar name={policy.patient_name} size={32} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{policy.patient_name || "—"}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>ID: {policy.patient_id || "—"}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Status</span>
                        <Badge isActive={policy.is_active} />
                    </div>
                </div>

                <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16, gridColumn: "span 2" }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Coverage Details</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Coverage Type</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{policy.coverage_type || "—"}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Coverage Percent</div>
                            <div><CoverageBadge percent={policy.coverage_percent || 0} /></div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Annual Limit</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(policy.annual_limit || 0)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Used Amount</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.amber }}>{formatCurrency(policy.used_amount || 0)}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                            <span>Annual Limit Usage</span>
                            <span>{((policy.used_amount || 0) / (policy.annual_limit || 1) * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                                width: `${Math.min(((policy.used_amount || 0) / (policy.annual_limit || 1) * 100), 100)}%`,
                                height: 6,
                                background: (policy.used_amount || 0) / (policy.annual_limit || 1) > 0.8 ? C.red : C.teal,
                                borderRadius: 3
                            }} />
                        </div>
                    </div>
                </div>

                <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16, gridColumn: "span 2" }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Validity Period</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Start Date</div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{policy.start_date ? formatDate(policy.start_date) : "—"}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Expiry Date</div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{policy.expiry_date ? formatDate(policy.expiry_date) : "—"}</div>
                        </div>
                    </div>
                </div>

                {policy.notes && (
                    <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16, gridColumn: "span 2" }}>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Notes</h4>
                        <p style={{ fontSize: 13, color: C.text }}>{policy.notes}</p>
                    </div>
                )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
}

function CreateEditPolicyModal({ open, onClose, policy, onSave, isLoading }: {
    open: boolean;
    onClose: () => void;
    policy?: any;
    onSave: (data: any) => void;
    isLoading?: boolean;
}) {
    const [form, setForm] = useState(EMPTY_POLICY);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    useEffect(() => {
        if (policy && open) {
            setForm({
                patientId: policy.patient_id || "",
                providerName: policy.provider_name || "",
                policyNumber: policy.policy_number || "",
                groupNumber: policy.group_number || "",
                memberId: policy.member_id || "",
                coverageType: policy.coverage_type || "Standard",
                coveragePercent: policy.coverage_percent || 0,
                annualLimit: policy.annual_limit || 0,
                usedAmount: policy.used_amount || 0,
                startDate: policy.start_date || new Date().toISOString().split('T')[0],
                expiryDate: policy.expiry_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                isActive: policy.is_active !== undefined ? policy.is_active : true,
                notes: policy.notes || ""
            });
            setSelectedPatient({ id: policy.patient_id, full_name: policy.patient_name });
        } else if (open && !policy) {
            setForm({
                ...EMPTY_POLICY,
                startDate: new Date().toISOString().split('T')[0],
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            });
            setSelectedPatient(null);
        }
    }, [policy, open]);

    const handlePatientSelect = (patient: any) => {
        setSelectedPatient(patient);
        setForm({ ...form, patientId: patient.id });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) { toast.error("Please select a patient"); return; }
        if (!form.providerName) { toast.error("Please enter provider name"); return; }
        if (!form.policyNumber) { toast.error("Please enter policy number"); return; }

        onSave(form);
    };

    return (
        <Modal open={open} onClose={onClose} title={policy ? "Edit Policy" : "Create New Policy"} size="lg">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <PatientSelector selectedPatient={selectedPatient} onSelectPatient={handlePatientSelect} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Provider Name" required>
                        <input type="text" value={form.providerName || ""} onChange={e => setForm({ ...form, providerName: e.target.value })} placeholder="e.g., Takaful Insurance" style={InputStyle} />
                    </Field>
                    <Field label="Policy Number" required>
                        <input type="text" value={form.policyNumber || ""} onChange={e => setForm({ ...form, policyNumber: e.target.value })} placeholder="e.g., TAK-12345" style={InputStyle} />
                    </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Group Number">
                        <input type="text" value={form.groupNumber || ""} onChange={e => setForm({ ...form, groupNumber: e.target.value })} placeholder="Group number" style={InputStyle} />
                    </Field>
                    <Field label="Member ID">
                        <input type="text" value={form.memberId || ""} onChange={e => setForm({ ...form, memberId: e.target.value })} placeholder="Member ID" style={InputStyle} />
                    </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Coverage Type">
                        <select value={form.coverageType || "Standard"} onChange={e => setForm({ ...form, coverageType: e.target.value })} style={InputStyle}>
                            {COVERAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </Field>
                    <Field label="Coverage Percent">
                        <input type="number" step="0.01" value={form.coveragePercent || 0} onChange={e => setForm({ ...form, coveragePercent: parseFloat(e.target.value) || 0 })} placeholder="80" style={InputStyle} />
                    </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Annual Limit">
                        <input type="number" step="0.01" value={form.annualLimit || 0} onChange={e => setForm({ ...form, annualLimit: parseFloat(e.target.value) || 0 })} placeholder="100000" style={InputStyle} />
                    </Field>
                    <Field label="Used Amount">
                        <input type="number" step="0.01" value={form.usedAmount || 0} onChange={e => setForm({ ...form, usedAmount: parseFloat(e.target.value) || 0 })} placeholder="0" style={InputStyle} />
                    </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Start Date">
                        <input type="date" value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} style={InputStyle} />
                    </Field>
                    <Field label="Expiry Date">
                        <input type="date" value={form.expiryDate || ""} onChange={e => setForm({ ...form, expiryDate: e.target.value })} style={InputStyle} />
                    </Field>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text, cursor: "pointer" }}>
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
                        Policy is active
                    </label>
                </div>

                <Field label="Notes">
                    <textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes..." style={{ ...InputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }} />
                </Field>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button variant="primary" type="submit" loading={isLoading}>Save Policy</Button>
                </div>
            </form>
        </Modal>
    );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantInsurancePoliciesPage() {
    const qc = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [viewingPolicy, setViewingPolicy] = useState<any>(null);
    const [editingPolicy, setEditingPolicy] = useState<any>(null);
    const [creatingPolicy, setCreatingPolicy] = useState(false);

    // Fetch policies from API
    const { data: policiesData, isLoading, refetch } = useQuery({
        queryKey: ["insurance-policies", statusFilter],
        queryFn: () => apiGetInsurancePolicies({
            isActive: statusFilter !== "all" ? (statusFilter === "active") : undefined
        }),
    });

    const policies = policiesData?.data || [];

    // Filter policies locally for search
    const filteredPolicies = useMemo(() => {
        let filtered = [...policies];
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.patient_name || "").toLowerCase().includes(q) ||
                (p.provider_name || "").toLowerCase().includes(q) ||
                (p.policy_number || "").toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [policies, search]);

    const stats = useMemo(() => {
        const totalPolicies = policies.length || 0;
        const activePolicies = policies.filter(p => p.is_active).length || 0;
        const totalCoverageValue = policies.reduce((sum, p) => {
            const limit = parseFloat(p.annual_limit) || 0;
            return sum + limit;
        }, 0);
        const totalUsed = policies.reduce((sum, p) => {
            const used = parseFloat(p.used_amount) || 0;
            return sum + used;
        }, 0);
        return { totalPolicies, activePolicies, totalCoverageValue, totalUsed };
    }, [policies]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: apiCreateInsurancePolicy,
        onSuccess: () => {
            toast.success("Policy created successfully");
            refetch();
            setCreatingPolicy(false);
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to create policy")
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => apiUpdateInsurancePolicy(id, data),
        onSuccess: () => {
            toast.success("Policy updated successfully");
            refetch();
            setEditingPolicy(null);
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to update policy")
    });

    const deleteMutation = useMutation({
        mutationFn: apiDeleteInsurancePolicy,
        onSuccess: () => {
            toast.success("Policy deleted");
            refetch();
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to delete policy")
    });

    const handleView = (policy: any) => setViewingPolicy(policy);
    const handleEdit = (policy: any) => setEditingPolicy(policy);
    const handleCreate = () => setCreatingPolicy(true);

    const handleSavePolicy = (data: any) => {
        if (editingPolicy) {
            updateMutation.mutate({ id: editingPolicy.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (policy: any) => {
        if (confirm(`Delete policy for ${policy.patient_name || "this patient"}? This cannot be undone.`)) {
            deleteMutation.mutate(policy.id);
        }
    };

    const activeFilters = [
        search && `"${search}"`,
        statusFilter !== "all" && `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`
    ].filter(Boolean);

    return (
        <>
            <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .policy-row:hover{background:${C.purpleBg}!important;transform:translateX(2px);transition:all 0.15s}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Insurance Policies</h1>
                        <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{stats.totalPolicies} policies · {stats.activePolicies} active</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1px solid ${showFilters ? C.purpleBorder : C.border}`, borderRadius: 9, background: showFilters ? C.purpleBg : C.bg, fontSize: 12, fontWeight: 500, color: showFilters ? C.purpleText : C.muted, cursor: "pointer" }}>
                            <Filter size={13} /> Filters {activeFilters.length > 0 && <span style={{ background: C.purple, color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{activeFilters.length}</span>}
                        </button>
                        <button onClick={() => refetch()} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                            <RefreshCw size={13} /> Refresh
                        </button>
                        <button onClick={handleCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(139,92,246,.3)" }}>
                            <Plus size={15} /> New Policy
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                        { label: "Total Policies", value: stats.totalPolicies, icon: FileText, color: C.purple, bg: C.purpleBg },
                        { label: "Active Policies", value: stats.activePolicies, icon: CheckCircle, color: C.success, bg: C.successBg },
                        { label: "Total Coverage", value: formatCurrency(stats.totalCoverageValue), icon: Shield, color: C.teal, bg: C.tealBg },
                        { label: "Total Used", value: formatCurrency(stats.totalUsed), icon: DollarSign, color: C.amber, bg: C.amberBg }
                    ].map(k => (
                        <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 11, color: C.muted }}>{k.label}</span>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <k.icon size={14} color={k.color} />
                                </div>
                            </div>
                            <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{k.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div style={{ background: C.bg, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, animation: "fadeUp .2s ease" }}>
                        <Field label="Status">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </Field>
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                            <button onClick={() => { setStatusFilter("all"); setSearch(""); }} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgMuted, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
                                Clear All
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", width: 320 }}>
                        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient, provider, or policy number..." className="inp" style={{ ...InputStyle, paddingLeft: 36, height: 42, fontSize: 14 }} />
                        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint }}><X size={14} /></button>}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {activeFilters.map((f, i) => (
                            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>
                                {f}<X size={10} style={{ cursor: "pointer" }} onClick={() => { if (f.startsWith('"')) setSearch(""); else if (f.startsWith("Status")) setStatusFilter("all"); }} />
                            </span>
                        ))}
                    </div>
                </div>

                {/* Policies Table */}
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(140px, 1.2fr) minmax(200px, 1.8fr) minmax(180px, 1.6fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(90px, 0.8fr) minmax(100px, 0.9fr)",
                        padding: "12px 20px",
                        background: C.bgMuted,
                        borderBottom: `1px solid ${C.border}`,
                        gap: "8px"
                    }}>
                        {["Policy #", "Patient", "Provider", "Coverage", "Limit", "Status", ""].map(h => (
                            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
                        ))}
                    </div>

                    {isLoading ? (
                        <div style={{ padding: "48px 20px", textAlign: "center" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
                            <p style={{ fontSize: 13, color: C.faint }}>Loading policies...</p>
                        </div>
                    ) : filteredPolicies.length === 0 ? (
                        <div style={{ padding: "48px 20px", textAlign: "center" }}>
                            <Shield size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
                            <p style={{ fontSize: 13, color: C.faint }}>No insurance policies found</p>
                        </div>
                    ) : (
                        filteredPolicies.map((row: any, i: number) => (
                            <div
                                key={row.id}
                                className="policy-row"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(140px, 1.2fr) minmax(200px, 1.8fr) minmax(180px, 1.6fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(90px, 0.8fr) minmax(100px, 0.9fr)",
                                    padding: "14px 20px",
                                    borderBottom: i < filteredPolicies.length - 1 ? `1px solid ${C.border}` : "none",
                                    alignItems: "center",
                                    transition: "all .1s",
                                    cursor: "pointer",
                                    gap: "8px"
                                }}
                                onClick={() => handleView(row)}
                            >
                                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: C.purple }}>{row.policy_number}</span>

                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <Avatar name={row.patient_name} size={32} />
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.patient_name || "Unknown Patient"}</p>
                                        <p style={{ fontSize: 10, color: C.faint }}>ID: {row.patient_id || "—"}</p>
                                    </div>
                                </div>

                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.provider_name || "—"}</p>
                                    <p style={{ fontSize: 10, color: C.faint }}>{row.coverage_type || "—"}</p>
                                </div>

                                <CoverageBadge percent={row.coverage_percent || 0} />

                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatCurrency(row.annual_limit || 0)}</p>
                                    <p style={{ fontSize: 10, color: C.amber }}>Used: {formatCurrency(row.used_amount || 0)}</p>
                                </div>

                                <Badge isActive={row.is_active} />

                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                    <button onClick={(e) => { e.stopPropagation(); handleView(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.blue }}><Eye size={13} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.amber }}><Edit size={13} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.red }}><Trash2 size={13} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Summary */}
                {filteredPolicies.length > 0 && (
                    <div style={{ marginTop: 8, padding: "12px 20px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                        <span style={{ color: C.muted }}>{filteredPolicies.length} policy{filteredPolicies.length !== 1 ? 's' : ''} found</span>
                        <div style={{ display: "flex", gap: 24 }}>
                            <span>Total Coverage: <strong>{formatCurrency(filteredPolicies.reduce((s, c) => s + (c.annual_limit || 0), 0))}</strong></span>
                            <span>Total Used: <strong style={{ color: C.amber }}>{formatCurrency(filteredPolicies.reduce((s, c) => s + (c.used_amount || 0), 0))}</strong></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ViewPolicyModal open={!!viewingPolicy} onClose={() => setViewingPolicy(null)} policy={viewingPolicy} />
            <CreateEditPolicyModal
                open={!!editingPolicy}
                onClose={() => setEditingPolicy(null)}
                policy={editingPolicy}
                onSave={handleSavePolicy}
                isLoading={updateMutation.isPending}
            />
            <CreateEditPolicyModal
                open={creatingPolicy}
                onClose={() => setCreatingPolicy(false)}
                onSave={handleSavePolicy}
                isLoading={createMutation.isPending}
            />
        </>
    );
}