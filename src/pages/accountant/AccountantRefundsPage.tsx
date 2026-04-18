import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CreditCard, ReceiptText, Search,
  TrendingUp, TrendingDown, CheckCircle2, Clock,
  AlertCircle, Wallet, Download, Filter, X,
  ChevronDown, ChevronRight, DollarSign, Eye,
  Printer, Mail, MoreVertical, Calendar, User,
  Phone, Mail as MailIcon, FileText, RefreshCw,
  AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown,
  Undo2, Receipt, Banknote, Calendar as CalendarIcon,
  Check, FileCheck, XCircle, Loader2
} from "lucide-react";
import { apiGetInvoices, apiCreatePayment, apiRecordPayment, apiGetPatientBillingBalance } from "@/api/billing";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const REFUND_METHODS = [
  { value: "cash", label: "Cash Refund", icon: Banknote },
  { value: "card", label: "Card Refund", icon: CreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: Wallet },
  { value: "mobile_money", label: "Mobile Money", icon: Receipt },
  { value: "cheque", label: "Cheque", icon: ReceiptText }
];

const REFUND_REASONS = [
  "Overpayment",
  "Cancelled Service",
  "Duplicate Payment",
  "Insurance Adjustment",
  "Patient Request",
  "Billing Error",
  "Service Not Rendered",
  "Other"
];

// Key for storing refunds in localStorage
const REFUNDS_STORAGE_KEY = "dental_clinic_refunds";

// ─── Color Tokens ────────────────────────────────────────────────────────────
const C = {
  border: "#e2e8f0",
  bg: "#ffffff",
  bgMuted: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b",
  faint: "#94a3b8",
  teal: "#0d9488",
  tealBg: "#f0fdfa",
  tealText: "#115e59",
  tealBorder: "#ccfbf1",
  amber: "#f59e0b",
  amberBg: "#fffbeb",
  amberText: "#92400e",
  amberBorder: "#fde68a",
  red: "#ef4444",
  redBg: "#fef2f2",
  redText: "#b91c1c",
  redBorder: "#fee2e2",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1e40af",
  blueBorder: "#bfdbfe",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  purpleText: "#5b21b6",
  purpleBorder: "#ede9fe",
  gray: "#6b7280",
  grayBg: "#f9fafb",
  success: "#10b981",
  successBg: "#f0fdf4",
  warning: "#f59e0b",
  warningBg: "#fffbeb"
};

// Helper functions for localStorage refunds
const getStoredRefunds = (): any[] => {
  try {
    const stored = localStorage.getItem(REFUNDS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRefund = (refund: any) => {
  const refunds = getStoredRefunds();
  refunds.push({
    ...refund,
    id: refund.id || `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    status: "completed"
  });
  localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(refunds));
  return refunds;
};

const updateRefundStatus = (id: string, status: string) => {
  const refunds = getStoredRefunds();
  const updated = refunds.map(r => r.id === id ? { ...r, status } : r);
  localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(updated));
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = (name || "?").split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.purple}, #5b21b6)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.4,
      fontWeight: 600,
      color: "white",
      flexShrink: 0
    }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, any> = {
    pending: { bg: C.amberBg, color: C.amberText, border: C.amberBorder, label: "Pending", icon: Clock },
    completed: { bg: C.successBg, color: C.tealText, border: C.tealBorder, label: "Completed", icon: CheckCircle2 },
    rejected: { bg: C.redBg, color: C.redText, border: C.redBorder, label: "Rejected", icon: XCircle }
  };
  
  const cfg = configs[status] || configs.completed;
  const Icon = cfg.icon;
  
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: 100,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap"
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

const InputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  background: C.bg,
  fontSize: 13,
  color: C.text,
  fontFamily: "inherit",
  outline: "none",
  transition: "all 0.2s ease"
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: C.muted,
        marginBottom: 6,
        letterSpacing: "0.3px"
      }}>
        {label}
        {required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Button({ 
  children, 
  variant = "primary", 
  loading = false,
  onClick,
  type = "button",
  disabled,
  size = "md"
}: { 
  children: React.ReactNode; 
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const variants = {
    primary: { bg: C.teal, color: "white", border: "none", hoverBg: "#0f766e" },
    secondary: { bg: C.bg, color: C.muted, border: `1.5px solid ${C.border}`, hoverBg: C.bgMuted },
    danger: { bg: C.redBg, color: C.redText, border: `1px solid ${C.redBorder}`, hoverBg: "#fee2e2" },
    ghost: { bg: "transparent", color: C.muted, border: "none", hoverBg: C.bgMuted },
    success: { bg: C.successBg, color: C.tealText, border: `1px solid ${C.tealBorder}`, hoverBg: "#e6f7f0" },
    warning: { bg: C.warningBg, color: C.amberText, border: `1px solid ${C.amberBorder}`, hoverBg: "#fef3c7" }
  };
  
  const sizes = {
    sm: { padding: "4px 10px", fontSize: 11 },
    md: { padding: "8px 16px", fontSize: 13 }
  };
  
  const style = variants[variant];
  const sizeStyle = sizes[size];
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: sizeStyle.padding,
        borderRadius: 8,
        background: style.bg,
        color: style.color,
        border: style.border,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        cursor: loading || disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        opacity: loading || disabled ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!loading && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = style.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = style.bg;
        }
      }}
    >
      {loading && <span style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        border: `2px solid ${variant === "primary" ? "rgba(255,255,255,.3)" : C.faint}`,
        borderTopColor: variant === "primary" ? "white" : C.text,
        animation: "spin 0.7s linear infinite",
        display: "inline-block"
      }} />}
      {children}
    </button>
  );
}

// ─── Invoice Selector Modal ─────────────────────────────────────────────────
function InvoiceSelector({ 
  open, 
  onClose, 
  onSelect 
}: { 
  open: boolean; 
  onClose: () => void; 
  onSelect: (invoice: any) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Fetch all invoices
  const { data, isLoading } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({})
  });
  
  // Get existing refunds to know which invoices have been refunded
  const existingRefunds = getStoredRefunds();
  
  // Only show invoices that have paid_amount > 0 and not fully refunded
  const invoices = useMemo(() => {
    const allInvoices = data?.data || [];
    return allInvoices.filter((inv: any) => {
      const paidAmount = inv.paid_amount || 0;
      if (paidAmount <= 0) return false;
      
      // Check if already refunded
      const refundedAmount = existingRefunds
        .filter(r => r.invoiceId === inv.id)
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      
      return refundedAmount < paidAmount;
    });
  }, [data, existingRefunds]);
  
  const filteredInvoices = useMemo(() => {
    if (!search) return invoices;
    const q = search.toLowerCase();
    return invoices.filter((inv: any) => 
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.patient_name?.toLowerCase().includes(q)
    );
  }, [invoices, search]);
  
  const handleConfirm = () => {
    if (selectedInvoice) {
      onSelect(selectedInvoice);
      onClose();
    }
  };
  
  if (!open) return null;
  
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200,
      padding: 16
    }} onClick={onClose}>
      <div style={{
        background: C.bg,
        borderRadius: 16,
        width: "100%",
        maxWidth: 600,
        maxHeight: "90vh",
        overflow: "hidden"
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            Select Invoice for Refund
          </h3>
          <button onClick={onClose} style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.bgMuted,
            cursor: "pointer"
          }}>
            <X size={14} />
          </button>
        </div>
        
        <div style={{ padding: 20 }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={14} style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.faint
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by invoice # or patient name..."
              style={{
                ...InputStyle,
                paddingLeft: 32
              }}
            />
          </div>
          
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {isLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: C.teal }} />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
                No invoices available for refund
              </div>
            ) : (
              filteredInvoices.map((invoice: any) => {
                const paidAmount = invoice.paid_amount || 0;
                const refundedAmount = existingRefunds
                  .filter(r => r.invoiceId === invoice.id)
                  .reduce((sum, r) => sum + (r.amount || 0), 0);
                const available = paidAmount - refundedAmount;
                
                return (
                  <div
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    style={{
                      padding: "12px",
                      border: `1px solid ${selectedInvoice?.id === invoice.id ? C.teal : C.border}`,
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: "pointer",
                      background: selectedInvoice?.id === invoice.id ? C.tealBg : C.bg,
                      transition: "all 0.1s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>
                          {invoice.invoice_number}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {invoice.patient_name}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: C.teal }}>
                          {formatCurrency(paidAmount)}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted }}>
                          Available: {formatCurrency(available)}
                        </div>
                      </div>
                    </div>
                    {refundedAmount > 0 && (
                      <div style={{ fontSize: 10, color: C.amber, marginTop: 4 }}>
                        Already refunded: {formatCurrency(refundedAmount)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm} disabled={!selectedInvoice}>
              Select Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Refund Modal ───────────────────────────────────────────────────────────
function RefundModal({ 
  open, 
  onClose, 
  invoice,
  onSuccess 
}: { 
  open: boolean; 
  onClose: () => void; 
  invoice: any;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    invoiceId: "",
    amount: "",
    method: "cash",
    reason: "",
    referenceNumber: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(s => s.user);
  
  const existingRefunds = getStoredRefunds();
  const paidAmount = invoice?.paid_amount || 0;
  const refundedAmount = existingRefunds
    .filter(r => r.invoiceId === invoice?.id)
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const maxRefund = paidAmount - refundedAmount;
  
  useEffect(() => {
    if (open && invoice) {
      setForm({
        invoiceId: invoice.id,
        amount: String(maxRefund),
        method: "cash",
        reason: "",
        referenceNumber: "",
        notes: ""
      });
    }
  }, [open, invoice, maxRefund]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    
    if (parseFloat(form.amount) > maxRefund) {
      toast.error(`Amount cannot exceed ${formatCurrency(maxRefund)}`);
      return;
    }
    
    if (!form.reason) {
      toast.error("Please select a refund reason");
      return;
    }
    
    setLoading(true);
    try {
      // Save refund to localStorage
      const refund = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        patientName: invoice.patient_name,
        amount: parseFloat(form.amount),
        method: form.method,
        reason: form.reason,
        referenceNumber: form.referenceNumber,
        notes: form.notes,
        processedBy: user?.id,
        status: "completed"
      };
      
      saveRefund(refund);
      
      toast.success("Refund processed successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };
  
  if (!open) return null;
  
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200,
      padding: 16
    }} onClick={onClose}>
      <div style={{
        background: C.bg,
        borderRadius: 16,
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflow: "auto"
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            Process Refund
          </h3>
          <button onClick={onClose} style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.bgMuted,
            cursor: "pointer"
          }}>
            <X size={14} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{
            background: C.bgMuted,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Invoice #</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {invoice?.invoice_number}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Patient</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                {invoice?.patient_name}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Total Paid</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>
                {formatCurrency(paidAmount)}
              </span>
            </div>
            {refundedAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Already Refunded</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>
                  {formatCurrency(refundedAmount)}
                </span>
              </div>
            )}
            <div style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: 8,
              marginTop: 4,
              display: "flex",
              justifyContent: "space-between"
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Available Refund</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.purple }}>
                {formatCurrency(maxRefund)}
              </span>
            </div>
          </div>
          
          <Field label="Refund Amount" required>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              required
              style={InputStyle}
            />
          </Field>
          
          <Field label="Refund Method" required>
            <select
              value={form.method}
              onChange={e => setForm({ ...form, method: e.target.value })}
              style={InputStyle}
            >
              {REFUND_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>
          
          <Field label="Reason for Refund" required>
            <select
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              style={InputStyle}
            >
              <option value="">Select reason...</option>
              {REFUND_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          
          <Field label="Reference Number (optional)">
            <input
              type="text"
              value={form.referenceNumber}
              onChange={e => setForm({ ...form, referenceNumber: e.target.value })}
              placeholder="Transaction ID, Check #, etc."
              style={InputStyle}
            />
          </Field>
          
          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Additional notes about this refund..."
              style={{
                ...InputStyle,
                height: "auto",
                padding: "8px 12px",
                resize: "vertical"
              }}
            />
          </Field>
          
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="warning" loading={loading} type="submit">
              <Undo2 size={14} /> Process Refund
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantRefundsPage() {
  const qc = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [refunds, setRefunds] = useState<any[]>([]);
  
  // Fetch invoices to get patient names
  const { data: invoicesData, isLoading: invoicesLoading, refetch } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({})
  });
  
  // Load refunds from localStorage
  useEffect(() => {
    const loadRefunds = () => {
      const stored = getStoredRefunds();
      setRefunds(stored);
    };
    
    loadRefunds();
    
    // Listen for storage changes
    window.addEventListener("storage", loadRefunds);
    return () => window.removeEventListener("storage", loadRefunds);
  }, []);
  
  // Enrich refunds with invoice data
  const enrichedRefunds = useMemo(() => {
    const invoices = invoicesData?.data || [];
    return refunds.map(refund => {
      const invoice = invoices.find((inv: any) => inv.id === refund.invoiceId);
      return {
        ...refund,
        invoice_number: refund.invoiceNumber || invoice?.invoice_number,
        patient_name: refund.patientName || invoice?.patient_name
      };
    });
  }, [refunds, invoicesData]);
  
  // Filter and sort refunds
  const filteredAndSorted = useMemo(() => {
    let filtered = [...enrichedRefunds];
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.invoice_number?.toLowerCase().includes(q) ||
        r.patient_name?.toLowerCase().includes(q) ||
        r.referenceNumber?.toLowerCase().includes(q)
      );
    }
    
    if (dateFrom) {
      filtered = filtered.filter(r => r.created_at >= dateFrom);
    }
    
    if (dateTo) {
      filtered = filtered.filter(r => r.created_at <= `${dateTo}T23:59:59`);
    }
    
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (sortField === "amount") {
        aVal = a.amount;
        bVal = b.amount;
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [enrichedRefunds, search, dateFrom, dateTo, sortField, sortDirection]);
  
  // Calculate totals
  const totalRefunded = filteredAndSorted.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalCount = filteredAndSorted.length;
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const handleNewRefund = () => {
    setSelectedInvoice(null);
    setShowInvoiceSelector(true);
  };
  
  const handleInvoiceSelect = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceSelector(false);
    setShowRefundModal(true);
  };
  
  const handleSuccess = () => {
    // Reload refunds from localStorage
    const stored = getStoredRefunds();
    setRefunds(stored);
    qc.invalidateQueries({ queryKey: ["invoices"] });
    refetch();
  };
  
  const activeFilters = [
    search && `"${search}"`,
    dateFrom && `From: ${dateFrom}`,
    dateTo && `To: ${dateTo}`
  ].filter(Boolean);
  
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={12} />;
    return sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };
  
  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        input:focus, select:focus, textarea:focus {
          border-color: ${C.teal} !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1) !important;
          outline: none;
        }
        .refund-row:hover {
          background: ${C.bgMuted};
          transition: background 0.15s;
        }
      `}</style>
      
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        animation: "slideUp 0.3s ease-out"
      }}>
        {/* Page Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
              Refunds
            </h1>
            <p style={{ fontSize: 13, color: C.muted }}>
              Manage and track payment refunds
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" onClick={() => {
              const stored = getStoredRefunds();
              setRefunds(stored);
              refetch();
            }}>
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button variant="secondary" onClick={() => setShowFilters(v => !v)}>
              <Filter size={14} /> Filters
              {activeFilters.length > 0 && (
                <span style={{
                  background: C.teal,
                  color: "white",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 4
                }}>
                  {activeFilters.length}
                </span>
              )}
            </Button>
            <Button variant="primary" onClick={handleNewRefund}>
              <Undo2 size={14} /> New Refund
            </Button>
          </div>
        </div>
        
        {/* KPI Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24
        }}>
          {[
            { label: "Total Refunded", value: formatCurrency(totalRefunded), icon: Undo2, color: C.purple, bg: C.purpleBg, sub: `${totalCount} refunds` },
            { label: "Total Transactions", value: totalCount, icon: Receipt, color: C.blue, bg: C.blueBg, sub: "All time" },
            { label: "Average Refund", value: formatCurrency(totalCount ? totalRefunded / totalCount : 0), icon: DollarSign, color: C.teal, bg: C.tealBg, sub: "per transaction" },
            { label: "This Month", value: formatCurrency(enrichedRefunds.filter(r => {
              const date = new Date(r.created_at);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).reduce((sum, r) => sum + (r.amount || 0), 0)), icon: CalendarIcon, color: C.amber, bg: C.amberBg, sub: "Current period" }
          ].map(k => (
            <div key={k.label} style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "16px 20px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{k.label}</span>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: k.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <k.icon size={16} color={k.color} />
                </div>
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
              </p>
              <p style={{ fontSize: 11, color: C.faint }}>{k.sub}</p>
            </div>
          ))}
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div style={{
            background: C.bg,
            border: `1px solid ${C.purpleBorder}`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 16,
            animation: "slideUp 0.2s ease"
          }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                style={InputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                style={InputStyle}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setSearch("");
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12
        }}>
          <div style={{ position: "relative", width: 300 }}>
            <Search size={14} style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.faint
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by invoice, patient, or reference..."
              style={{
                ...InputStyle,
                paddingLeft: 32,
                height: 36
              }}
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
                  color: C.faint
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeFilters.map((f, i) => (
              <span key={i} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 100,
                background: C.purpleBg,
                color: C.purpleText,
                border: `1px solid ${C.purpleBorder}`
              }}>
                {f}
                <X
                  size={10}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (f.startsWith('"')) setSearch("");
                    else if (f.startsWith("From")) setDateFrom("");
                    else if (f.startsWith("To")) setDateTo("");
                  }}
                />
              </span>
            ))}
          </div>
        </div>
        
        {/* Refunds Table */}
        <div style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: "hidden"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "100px 1.2fr 100px 120px 120px 140px 100px",
            padding: "12px 20px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`,
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <span style={{ cursor: "pointer" }} onClick={() => handleSort("id")}>
              Refund # <SortIcon field="id" />
            </span>
            <span>Invoice / Patient</span>
            <span style={{ cursor: "pointer" }} onClick={() => handleSort("created_at")}>
              Date <SortIcon field="created_at" />
            </span>
            <span style={{ cursor: "pointer", textAlign: "right" }} onClick={() => handleSort("amount")}>
              Amount <SortIcon field="amount" />
            </span>
            <span>Method</span>
            <span>Reason</span>
            <span>Reference</span>
          </div>
          
          {invoicesLoading ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `2px solid ${C.border}`,
                borderTopColor: C.teal,
                animation: "spin 0.7s linear infinite",
                margin: "0 auto 12px"
              }} />
              <p style={{ fontSize: 13, color: C.muted }}>Loading refunds...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <Undo2 size={40} color={C.faint} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
                No refunds found
              </p>
              <p style={{ fontSize: 11, color: C.faint }}>
                {search ? "Try adjusting your search filters" : "Process your first refund by clicking 'New Refund'"}
              </p>
              {search && (
                <Button variant="secondary" onClick={() => setSearch("")} style={{ marginTop: 12 }}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredAndSorted.map((refund, idx) => (
              <div
                key={refund.id}
                className="refund-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1.2fr 100px 120px 120px 140px 100px",
                  padding: "14px 20px",
                  borderBottom: idx < filteredAndSorted.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center"
                }}
              >
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: C.purple
                }}>
                  {refund.id?.slice(-8) || `REF-${String(idx + 1).padStart(4, "0")}`}
                </span>
                
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {refund.invoice_number}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Avatar name={refund.patient_name} size={20} />
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {refund.patient_name}
                    </span>
                  </div>
                </div>
                
                <span style={{ fontSize: 12, color: C.muted }}>
                  {formatDate(refund.created_at)}
                </span>
                
                <span style={{ fontSize: 14, fontWeight: 700, textAlign: "right", color: C.purpleText }}>
                  {formatCurrency(refund.amount)}
                </span>
                
                <span style={{ fontSize: 12, color: C.muted }}>
                  {REFUND_METHODS.find(m => m.value === refund.method)?.label || refund.method}
                </span>
                
                <span style={{ fontSize: 11, color: C.muted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {refund.reason}
                </span>
                
                <span style={{ fontSize: 11, fontFamily: "monospace", color: C.faint }}>
                  {refund.referenceNumber || "—"}
                </span>
              </div>
            ))
          )}
        </div>
        
        {/* Summary Footer */}
        {filteredAndSorted.length > 0 && (
          <div style={{
            marginTop: 16,
            padding: "12px 20px",
            background: C.bgMuted,
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12
          }}>
            <span style={{ color: C.muted }}>
              Showing {filteredAndSorted.length} of {enrichedRefunds.length} refunds
            </span>
            <div>
              <strong>Total Refunded:</strong>{" "}
              <span style={{ color: C.purpleText, fontWeight: 700 }}>
                {formatCurrency(totalRefunded)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Invoice Selector Modal */}
      <InvoiceSelector
        open={showInvoiceSelector}
        onClose={() => setShowInvoiceSelector(false)}
        onSelect={handleInvoiceSelect}
      />
      
      {/* Refund Modal */}
      <RefundModal
        open={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        invoice={selectedInvoice}
        onSuccess={handleSuccess}
      />
    </>
  );
}