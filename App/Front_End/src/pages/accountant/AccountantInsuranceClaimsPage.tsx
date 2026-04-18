import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Search, Filter, X, Eye, Edit, Send, RefreshCw,
  Shield, Building2, FileText, CheckCircle, XCircle, Clock,
  DollarSign, Download, User, Calendar, Percent, Receipt, ChevronDown
} from "lucide-react";
import { apiGetInvoices } from "@/api/billing";
import { apiGetPatients } from "@/api/patients";
import {
  apiGetInsuranceClaims,
  apiCreateInsuranceClaim,
  apiUpdateInsuranceClaim,
  apiSubmitInsuranceClaim,
  apiDeleteInsuranceClaim,
  apiGetInsurancePolicies
} from "@/api/insurance";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate } from "@/utils";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const CLAIM_STATUSES = [
  { value: "draft", label: "Draft", color: "gray", icon: FileText, bg: "#f3f4f6", text: "#6b7280" },
  { value: "submitted", label: "Submitted", color: "blue", icon: Send, bg: "#eff6ff", text: "#1e40af" },
  { value: "approved", label: "Approved", color: "teal", icon: CheckCircle, bg: "#f0fdfa", text: "#115e59" },
  { value: "rejected", label: "Rejected", color: "red", icon: XCircle, bg: "#fef2f2", text: "#b91c1c" },
  { value: "paid", label: "Paid", color: "green", icon: CheckCircle, bg: "#f0fdf4", text: "#166534" }
];

const EMPTY_CLAIM = {
  patientId: "",
  invoiceId: "",
  insurancePolicyId: null,
  submissionDate: new Date().toISOString().split('T')[0],
  totalAmount: 0,
  coveredAmount: 0,
  deductible: 0,
  copay: 0,
  notes: ""
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8",
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
function Badge({ status }: { status: string }) {
  const cfg = CLAIM_STATUSES.find(s => s.value === status) || CLAIM_STATUSES[0];
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 100,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.bg}`,
      whiteSpace: "nowrap"
    }}>
      <Icon size={10} />
      {cfg.label}
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
      onMouseEnter={(e) => { if (!loading && !disabled) (e.currentTarget as HTMLButtonElement).style.background = style.hoverBg; }}
      onMouseLeave={(e) => { if (!loading && !disabled) (e.currentTarget as HTMLButtonElement).style.background = style.bg; }}
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

// ─── Invoice Selector ─────────────────────────────────────────────────────────
function InvoiceSelector({ patientId, selectedInvoice, onSelectInvoice }: {
  patientId: number | null;
  selectedInvoice: any;
  onSelectInvoice: (invoice: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices", patientId],
    queryFn: () => apiGetInvoices({ patientId }),
    enabled: !!patientId,
  });

  const invoices = invoicesData?.data || [];

  const handleSelect = (invoice: any) => {
    onSelectInvoice(invoice);
    setIsOpen(false);
  };

  if (!patientId) {
    return (
      <Field label="Invoice">
        <div style={{
          border: `1.5px solid ${C.border}`,
          borderRadius: 9,
          padding: "10px 12px",
          background: C.bgMuted,
          color: C.muted,
          fontSize: 13,
        }}>
          Select a patient first
        </div>
      </Field>
    );
  }

  return (
    <Field label="Invoice" required>
      {selectedInvoice ? (
        <div style={{
          background: C.tealBg,
          border: `1px solid ${C.tealBorder}`,
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{selectedInvoice.invoice_number}</p>
            <p style={{ fontSize: 11, color: C.muted }}>Amount: {formatCurrency(selectedInvoice.total_amount)}</p>
          </div>
          <button
            onClick={() => onSelectInvoice(null)}
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
              {isOpen ? "Select an invoice..." : "Click to select an invoice"}
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
              maxHeight: 300,
              overflow: "auto",
            }}>
              {isLoading ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </div>
              ) : invoices.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: C.muted }}>
                  No invoices found for this patient
                </div>
              ) : (
                invoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    onClick={() => handleSelect(invoice)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${C.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.bgMuted; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{invoice.invoice_number}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>Date: {formatDate(invoice.created_at)}</p>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>
                      {formatCurrency(invoice.total_amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </Field>
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

function ViewClaimModal({ open, onClose, claim }: { open: boolean; onClose: () => void; claim: any }) {
  if (!claim) return null;

  // Log the claim to see what data we have
  console.log("Claim data:", claim);

  return (
    <Modal open={open} onClose={onClose} title="Claim Details" size="lg">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Claim Information</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Claim Number</span>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{claim.claim_number || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Submission Date</span>
            <span style={{ fontSize: 13 }}>{formatDate(claim.submission_date)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Status</span>
            <Badge status={claim.status} />
          </div>
        </div>

        <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Patient & Insurance</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Avatar name={claim.patient_name} size={32} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{claim.patient_name || "—"}</div>
              <div style={{ fontSize: 11, color: C.muted }}>Policy: {claim.policy_number || "—"}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Provider</span>
            <span style={{ fontSize: 13 }}>{claim.provider_name || "—"}</span>
          </div>
        </div>

        <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16, gridColumn: "span 2" }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Financial Summary</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Total Amount</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(claim.total_amount || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Covered Amount</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.teal }}>{formatCurrency(claim.covered_amount || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Deductible</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(claim.deductible || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Copay</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(claim.copay || 0)}</div>
            </div>
          </div>
        </div>

        {claim.notes && (
          <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16, gridColumn: "span 2" }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Notes</h4>
            <p style={{ fontSize: 13, color: C.text }}>{claim.notes}</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

function CreateEditClaimModal({ open, onClose, claim, onSave, isLoading }: {
  open: boolean;
  onClose: () => void;
  claim?: any;
  onSave: (data: any) => void;
  isLoading?: boolean;
}) {
  const [form, setForm] = useState(EMPTY_CLAIM);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [policySearch, setPolicySearch] = useState("");

  // Fetch ALL insurance policies (not filtered by patient)
  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ["insurance-policies"],
    queryFn: () => apiGetInsurancePolicies({ isActive: true }),
  });

  const policies = policiesData?.data || [];

  // Filter policies by search
  const filteredPolicies = useMemo(() => {
    if (!policySearch) return policies;
    const q = policySearch.toLowerCase();
    return policies.filter((p: any) =>
      p.provider_name?.toLowerCase().includes(q) ||
      p.policy_number?.toLowerCase().includes(q)
    );
  }, [policies, policySearch]);

  useEffect(() => {
    if (claim && open) {
      setForm({
        patientId: claim.patientId,
        invoiceId: claim.invoiceId,
        insurancePolicyId: claim.insurancePolicyId || null,
        submissionDate: claim.submissionDate,
        totalAmount: claim.totalAmount,
        coveredAmount: claim.coveredAmount,
        deductible: claim.deductible,
        copay: claim.copay,
        notes: claim.notes || ""
      });
      setSelectedPatient({ id: claim.patientId, full_name: claim.patientName });
      setSelectedInvoice({ id: claim.invoiceId, invoice_number: claim.invoiceNumber, total_amount: claim.totalAmount });
      if (claim.insurancePolicyId) {
        const policy = policies.find((p: any) => p.id === claim.insurancePolicyId);
        setSelectedPolicy(policy || { id: claim.insurancePolicyId, provider_name: claim.providerName, policy_number: claim.policyNumber });
      }
    } else if (open && !claim) {
      setForm({
        ...EMPTY_CLAIM,
        submissionDate: new Date().toISOString().split('T')[0]
      });
      setSelectedPatient(null);
      setSelectedInvoice(null);
      setSelectedPolicy(null);
    }
  }, [claim, open, policies]);

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setForm({ ...form, patientId: patient.id });
    setSelectedInvoice(null);
  };

  const handleInvoiceSelect = (invoice: any) => {
    setSelectedInvoice(invoice);
    setForm({
      ...form,
      invoiceId: invoice.id,
      totalAmount: invoice.total_amount
    });
  };

  const handlePolicySelect = (policy: any) => {
    setSelectedPolicy(policy);
    setForm({
      ...form,
      insurancePolicyId: policy.id
    });
    setIsPolicyOpen(false);
    setPolicySearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error("Please select a patient"); return; }
    if (!selectedInvoice) { toast.error("Please select an invoice"); return; }

    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={claim ? "Edit Claim" : "Create New Claim"} size="lg">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <PatientSelector selectedPatient={selectedPatient} onSelectPatient={handlePatientSelect} />

        <InvoiceSelector
          patientId={selectedPatient?.id || null}
          selectedInvoice={selectedInvoice}
          onSelectInvoice={handleInvoiceSelect}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Insurance Policy">
            {selectedPolicy ? (
              <div style={{
                background: C.tealBg,
                border: `1px solid ${C.tealBorder}`,
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{selectedPolicy.provider_name}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>Policy: {selectedPolicy.policy_number}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicy(null);
                    setForm({ ...form, insurancePolicyId: null });
                  }}
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
                  onClick={() => setIsPolicyOpen(true)}
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
                    {isPolicyOpen ? "Search for a policy..." : "Click to select an insurance policy"}
                  </span>
                  <ChevronDown size={14} color={C.muted} />
                </div>

                {isPolicyOpen && (
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
                    maxHeight: 300,
                    overflow: "auto",
                  }}>
                    <div style={{ padding: "12px", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                        <input
                          autoFocus
                          value={policySearch}
                          onChange={(e) => setPolicySearch(e.target.value)}
                          placeholder="Search by provider name or policy number..."
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

                    {policiesLoading ? (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                      </div>
                    ) : filteredPolicies.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: C.muted }}>
                        {policySearch ? "No policies found" : "No insurance policies available"}
                      </div>
                    ) : (
                      filteredPolicies.map((policy: any) => (
                        <div
                          key={policy.id}
                          onClick={() => handlePolicySelect(policy)}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${C.border}`,
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.bgMuted; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{policy.provider_name}</p>
                            <p style={{ fontSize: 11, color: C.muted }}>
                              Policy: {policy.policy_number} • {policy.coverage_percent}% coverage
                            </p>
                          </div>
                          {policy.used_amount > 0 && (
                            <div style={{ marginTop: 4 }}>
                              <div style={{ fontSize: 10, color: C.amber }}>
                                Used: {formatCurrency(policy.used_amount)} / {formatCurrency(policy.annual_limit)}
                              </div>
                              <div style={{ height: 2, background: C.border, borderRadius: 1, marginTop: 2 }}>
                                <div style={{
                                  width: `${(policy.used_amount / policy.annual_limit) * 100}%`,
                                  height: 2,
                                  background: C.amber,
                                  borderRadius: 1,
                                }} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </Field>

          <Field label="Submission Date">
            <input type="date" value={form.submissionDate} onChange={e => setForm({ ...form, submissionDate: e.target.value })} style={InputStyle} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Total Amount">
            <input type="number" step="0.01" value={form.totalAmount} disabled style={{ ...InputStyle, background: C.bgMuted }} />
          </Field>
          <Field label="Covered Amount">
            <input type="number" step="0.01" value={form.coveredAmount} onChange={e => setForm({ ...form, coveredAmount: parseFloat(e.target.value) || 0 })} style={InputStyle} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Deductible">
            <input type="number" step="0.01" value={form.deductible} onChange={e => setForm({ ...form, deductible: parseFloat(e.target.value) || 0 })} style={InputStyle} />
          </Field>
          <Field label="Copay">
            <input type="number" step="0.01" value={form.copay} onChange={e => setForm({ ...form, copay: parseFloat(e.target.value) || 0 })} style={InputStyle} />
          </Field>
        </div>

        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...InputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={isLoading}>Save Claim</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantInsuranceClaimsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewingClaim, setViewingClaim] = useState<any>(null);
  const [editingClaim, setEditingClaim] = useState<any>(null);
  const [creatingClaim, setCreatingClaim] = useState(false);

  // Fetch claims from API
  const { data: claimsData, isLoading: claimsLoading, refetch } = useQuery({
    queryKey: ["insurance-claims", statusFilter, dateFrom, dateTo],
    queryFn: () => apiGetInsuranceClaims({
      status: statusFilter !== "all" ? statusFilter : undefined,
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined
    })
  });

  const claims = claimsData?.data || [];

  // Filter claims locally for search
  const filteredClaims = useMemo(() => {
    let filtered = [...claims];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.patient_name?.toLowerCase().includes(q) ||
        c.claim_number?.toLowerCase().includes(q) ||
        c.invoice_number?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [claims, search]);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = claims.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const totalCovered = claims.reduce((sum, c) => sum + (c.covered_amount || 0), 0);
    const byStatus = CLAIM_STATUSES.map(s => ({
      ...s,
      count: claims.filter(c => c.status === s.value).length
    }));
    return { totalAmount, totalCovered, byStatus, totalClaims: claims.length };
  }, [claims]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: apiCreateInsuranceClaim,
    onSuccess: () => {
      toast.success("Claim created successfully");
      refetch();
      setCreatingClaim(false);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to create claim")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiUpdateInsuranceClaim(id, data),
    onSuccess: () => {
      toast.success("Claim updated successfully");
      refetch();
      setEditingClaim(null);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to update claim")
  });

  const submitMutation = useMutation({
    mutationFn: apiSubmitInsuranceClaim,
    onSuccess: () => {
      toast.success("Claim submitted");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to submit claim")
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteInsuranceClaim,
    onSuccess: () => {
      toast.success("Claim deleted");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to delete claim")
  });

  const handleView = (claim: any) => setViewingClaim(claim);
  const handleEdit = (claim: any) => setEditingClaim(claim);
  const handleCreate = () => setCreatingClaim(true);

  const handleSaveClaim = (data: any) => {
    if (editingClaim) {
      updateMutation.mutate({ id: editingClaim.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSubmitClaim = (claim: any) => {
    if (confirm(`Submit claim ${claim.claim_number}?`)) {
      submitMutation.mutate(claim.id);
    }
  };

  const handleDeleteClaim = (claim: any) => {
    if (confirm(`Delete claim ${claim.claim_number}? This cannot be undone.`)) {
      deleteMutation.mutate(claim.id);
    }
  };

  const activeFilters = [
    search && `"${search}"`,
    statusFilter !== "all" && `Status: ${CLAIM_STATUSES.find(s => s.value === statusFilter)?.label}`,
    dateFrom && `From: ${dateFrom}`,
    dateTo && `To: ${dateTo}`
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .claim-row:hover{background:${C.purpleBg}!important;transform:translateX(2px);transition:all 0.15s}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Insurance Claims</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{stats.totalClaims} claims</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1px solid ${showFilters ? C.purpleBorder : C.border}`, borderRadius: 9, background: showFilters ? C.purpleBg : C.bg, fontSize: 12, fontWeight: 500, color: showFilters ? C.purpleText : C.muted, cursor: "pointer" }}>
              <Filter size={13} /> Filters {activeFilters.length > 0 && <span style={{ background: C.purple, color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{activeFilters.length}</span>}
            </button>
            <button onClick={() => refetch()} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={handleCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(139,92,246,.3)" }}>
              <Plus size={15} /> New Claim
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "Total Claims", value: stats.totalClaims, icon: FileText, color: C.purple, bg: C.purpleBg },
            { label: "Total Value", value: formatCurrency(stats.totalAmount), icon: DollarSign, color: C.teal, bg: C.tealBg },
            { label: "Covered", value: formatCurrency(stats.totalCovered), icon: Shield, color: C.blue, bg: C.blueBg },
            { label: "Coverage Rate", value: `${stats.totalAmount > 0 ? ((stats.totalCovered / stats.totalAmount) * 100).toFixed(0) : 0}%`, icon: Percent, color: C.amber, bg: C.amberBg },
            { label: "Approved", value: stats.byStatus.find(s => s.value === "approved")?.count || 0, icon: CheckCircle, color: C.success, bg: C.successBg }
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
          <div style={{ background: C.bg, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, animation: "fadeUp .2s ease" }}>
            <Field label="Status">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                <option value="all">All Statuses</option>
                {CLAIM_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Date From">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="inp" style={InputStyle} />
            </Field>
            <Field label="Date To">
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="inp" style={InputStyle} />
            </Field>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={() => { setStatusFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgMuted, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Search + Status Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 280 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient or claim #…" className="inp" style={{ ...InputStyle, paddingLeft: 30, height: 34 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint }}><X size={13} /></button>}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {CLAIM_STATUSES.map(s => {
              const active = statusFilter === s.value;
              return (
                <button key={s.value} onClick={() => setStatusFilter(active ? "all" : s.value)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? (s.color === "teal" ? C.tealBorder : C.purpleBorder) : C.border}`, background: active ? (s.color === "teal" ? C.tealBg : C.purpleBg) : C.bg, color: active ? (s.color === "teal" ? C.tealText : C.purpleText) : C.muted, cursor: "pointer" }}>
                  {s.label}
                </button>
              );
            })}
          </div>
          {activeFilters.map((f, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>
              {f}<X size={10} style={{ cursor: "pointer" }} onClick={() => { if (f.startsWith('"')) setSearch(""); else if (f.startsWith("Status")) setStatusFilter("all"); else if (f.startsWith("From")) setDateFrom(""); else if (f.startsWith("To")) setDateTo(""); }} />
            </span>
          ))}
        </div>

        {/* Claims Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1.5fr 100px 100px 100px 120px 80px", padding: "9px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
            {["Claim #", "Patient / Policy", "Date", "Total", "Covered", "Status", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {claimsLoading ? (
            <div style={{ padding: "48px 18px", textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: C.faint }}>Loading claims...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div style={{ padding: "48px 18px", textAlign: "center" }}>
              <Shield size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: C.faint }}>No insurance claims found</p>
            </div>
          ) : (
            filteredClaims.map((row: any, i: number) => (
              <div key={row.id} className="claim-row" style={{ display: "grid", gridTemplateColumns: "100px 1.5fr 100px 100px 100px 120px 80px", padding: "11px 18px", borderBottom: i < filteredClaims.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "all .1s", cursor: "pointer" }} onClick={() => handleView(row)}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: C.purple }}>{row.claim_number}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={row.patient_name} size={28} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{row.patient_name}</p>
                    <p style={{ fontSize: 10, color: C.faint }}>Policy: {row.policy_number || "—"}</p>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{formatDate(row.submission_date)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatCurrency(row.total_amount)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>{formatCurrency(row.covered_amount)}</span>
                <Badge status={row.status} />
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); handleView(row); }} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.blue }}><Eye size={12} /></button>
                  {row.status === "draft" && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.amber }}><Edit size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleSubmitClaim(row); }} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.teal }}><Send size={12} /></button>
                    </>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClaim(row); }} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.red }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {filteredClaims.length > 0 && (
          <div style={{ marginTop: 8, padding: "12px 18px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: C.muted }}>{filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} found</span>
            <div style={{ display: "flex", gap: 20 }}>
              <span>Total: <strong>{formatCurrency(filteredClaims.reduce((s, c) => s + c.total_amount, 0))}</strong></span>
              <span>Covered: <strong style={{ color: C.teal }}>{formatCurrency(filteredClaims.reduce((s, c) => s + c.covered_amount, 0))}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewClaimModal open={!!viewingClaim} onClose={() => setViewingClaim(null)} claim={viewingClaim} />
      <CreateEditClaimModal
        open={!!editingClaim}
        onClose={() => setEditingClaim(null)}
        claim={editingClaim}
        onSave={handleSaveClaim}
        isLoading={updateMutation.isPending}
      />
      <CreateEditClaimModal
        open={creatingClaim}
        onClose={() => setCreatingClaim(false)}
        onSave={handleSaveClaim}
        isLoading={createMutation.isPending}
      />
    </>
  );
}