import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CreditCard, ReceiptText, Search,
  TrendingUp, TrendingDown, CheckCircle2, Clock,
  AlertCircle, Wallet, Download, Filter, X,
  ChevronDown, ChevronRight, DollarSign, Eye,
  Printer, Mail, MoreVertical, Calendar, User,
  Phone, Mail as MailIcon, FileText, RefreshCw,
  AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { apiGetInvoices, apiRecordPayment, apiDeleteInvoice } from "@/api/billing";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ["cash", "card", "mobile_money", "bank_transfer", "insurance", "cheque", "other"];

const EMPTY_PAY = {
  amount: "",
  method: "cash",
  referenceNumber: "",
  notes: ""
};

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
      background: `linear-gradient(135deg, ${C.red}, #b91c1c)`,
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
    unpaid: { bg: C.redBg, color: C.redText, border: C.redBorder, label: "Unpaid", icon: AlertCircle },
    partial: { bg: C.amberBg, color: C.amberText, border: C.amberBorder, label: "Partial", icon: Clock },
    overdue: { bg: C.redBg, color: C.redText, border: C.redBorder, label: "Overdue", icon: AlertTriangle }
  };
  
  const cfg = configs[status] || configs.unpaid;
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

function DaysOverdue({ dueDate }: { dueDate: string }) {
  if (!dueDate) return null;
  
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return null;
  
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      color: C.redText,
      background: C.redBg,
      padding: "2px 6px",
      borderRadius: 12,
      marginLeft: 6
    }}>
      {diffDays} day{diffDays !== 1 ? 's' : ''} overdue
    </span>
  );
}

const InputStyle: React.CSSProperties = {
  width: "100%",
  height: 38,
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: C.muted,
        marginBottom: 6
      }}>
        {label}
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
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
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
    success: { bg: C.successBg, color: C.tealText, border: `1px solid ${C.tealBorder}`, hoverBg: "#e6f7f0" }
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

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ 
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
  const [form, setForm] = useState(EMPTY_PAY);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(s => s.user);
  
  const remaining = Math.max(0, (invoice?.total_amount || 0) - (invoice?.paid_amount || 0));
  
  useEffect(() => {
    if (open && invoice) {
      setForm({
        amount: String(remaining),
        method: "cash",
        referenceNumber: "",
        notes: ""
      });
    }
  }, [open, invoice, remaining]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (parseFloat(form.amount) > remaining) {
      toast.error("Amount cannot exceed remaining balance");
      return;
    }
    
    setLoading(true);
    try {
      await apiRecordPayment(invoice.id, {
        amount: parseFloat(form.amount),
        method: form.method,
        referenceNumber: form.referenceNumber,
        receivedBy: user?.id,
        notes: form.notes
      });
      toast.success("Payment recorded successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to record payment");
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
        maxWidth: 480,
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
            Record Payment
          </h3>
          <button onClick={onClose} style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.bgMuted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
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
              <span style={{ fontSize: 12, color: C.muted }}>Total Amount</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {formatCurrency(invoice?.total_amount)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Already Paid</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.tealText }}>
                {formatCurrency(invoice?.paid_amount)}
              </span>
            </div>
            <div style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: 8,
              marginTop: 4,
              display: "flex",
              justifyContent: "space-between"
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Remaining</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.redText }}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
          
          <Field label="Payment Amount">
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
          
          <Field label="Payment Method">
            <select
              value={form.method}
              onChange={e => setForm({ ...form, method: e.target.value })}
              style={InputStyle}
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </option>
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
              placeholder="Additional notes..."
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
            <Button variant="primary" loading={loading} type="submit">
              <CreditCard size={14} /> Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Send Reminder Modal ─────────────────────────────────────────────────────
function ReminderModal({ 
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    if (open && invoice) {
      const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
      setMessage(`Dear ${invoice.patient_name},\n\nThis is a friendly reminder that invoice #${invoice.invoice_number} for ${formatCurrency(balance)} is due. Please make payment at your earliest convenience.\n\nThank you,\nDental Clinic`);
    }
  }, [open, invoice]);
  
  const handleSend = async () => {
    setLoading(true);
    try {
      // Simulate sending - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Reminder sent successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send reminder");
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
        maxWidth: 500,
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
            Send Payment Reminder
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
          <div style={{
            background: C.blueBg,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            border: `1px solid ${C.blueBorder}`
          }}>
            <div style={{ fontSize: 12, color: C.blueText }}>
              <strong>Invoice #{invoice?.invoice_number}</strong><br />
              Patient: {invoice?.patient_name}<br />
              Due Amount: {formatCurrency((invoice?.total_amount || 0) - (invoice?.paid_amount || 0))}
            </div>
          </div>
          
          <Field label="Reminder Message">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={8}
              style={{
                ...InputStyle,
                height: "auto",
                padding: "8px 12px",
                resize: "vertical",
                fontFamily: "monospace",
                fontSize: 12
              }}
            />
          </Field>
          
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSend}>
              <Mail size={14} /> Send Reminder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantUnpaidInvoicesPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [sortField, setSortField] = useState<string>("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Fetch all invoices first, then filter unpaid/partial client-side
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({}) // Fetch all invoices
  });
  
  // Filter invoices to show only unpaid and partial
  const allInvoices: any[] = data?.data || [];
  
  // Filter for unpaid and partial invoices
  const invoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const status = inv.status?.toLowerCase();
      return status === "unpaid" || status === "partial";
    });
  }, [allInvoices]);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: apiDeleteInvoice,
    onSuccess: () => {
      toast.success("Invoice deleted");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      refetch();
    },
    onError: () => toast.error("Failed to delete invoice")
  });
  
  // Filter and sort invoices
  const filteredAndSorted = useMemo(() => {
    let filtered = [...invoices];
    
    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(inv => {
        return (inv.patient_name?.toLowerCase().includes(q) || 
                inv.invoice_number?.toLowerCase().includes(q));
      });
    }
    
    // Apply date filters
    if (dateFrom) {
      filtered = filtered.filter(inv => {
        return inv.created_at >= dateFrom;
      });
    }
    
    if (dateTo) {
      filtered = filtered.filter(inv => {
        return inv.created_at <= `${dateTo}T23:59:59`;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "due_date") {
        aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
        bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
      } else if (sortField === "balance") {
        aVal = (a.total_amount || 0) - (a.paid_amount || 0);
        bVal = (b.total_amount || 0) - (b.paid_amount || 0);
      } else if (sortField === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [invoices, search, dateFrom, dateTo, sortField, sortDirection]);
  
  // Calculate totals
  const totalUnpaid = filteredAndSorted.reduce((sum, inv) => 
    sum + Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)), 0);
  const totalCount = filteredAndSorted.length;
  const overdueCount = filteredAndSorted.filter(inv => {
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    const today = new Date();
    return dueDate < today && inv.status !== "paid";
  }).length;
  
  // Calculate collection rate based on all invoices (not just unpaid)
  const totalPaidCount = allInvoices.filter(inv => inv.status === "paid").length;
  const collectionRate = allInvoices.length > 0 
    ? Math.round((totalPaidCount / allInvoices.length) * 100) 
    : 0;
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const handleRecordPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };
  
  const handleSendReminder = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowReminderModal(true);
  };
  
  const handleDelete = (invoice: any) => {
    if (confirm(`Delete invoice #${invoice.invoice_number}? This action cannot be undone.`)) {
      deleteMutation.mutate(invoice.id);
    }
  };
  
  const handleSuccess = () => {
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
  
  // Debug log to see what's happening
  console.log("All invoices count:", allInvoices.length);
  console.log("Unpaid/Partial invoices count:", invoices.length);
  console.log("Filtered sorted count:", filteredAndSorted.length);
  
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
        .invoice-row:hover {
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
              Unpaid & Partial Invoices
            </h1>
            <p style={{ fontSize: 13, color: C.muted }}>
              Track and manage outstanding payments
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" onClick={() => refetch()}>
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
            <Button variant="primary" onClick={() => window.location.href = "/accountant/invoices/create"}>
              <Plus size={14} /> New Invoice
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
            { label: "Total Outstanding", value: formatCurrency(totalUnpaid), icon: Wallet, color: C.red, bg: C.redBg, sub: `${totalCount} invoices` },
            { label: "Overdue Invoices", value: overdueCount, icon: AlertTriangle, color: C.amber, bg: C.amberBg, sub: `${overdueCount} need attention` },
            { label: "Average Balance", value: formatCurrency(totalCount ? totalUnpaid / totalCount : 0), icon: DollarSign, color: C.blue, bg: C.blueBg, sub: "per invoice" },
            { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: C.teal, bg: C.tealBg, sub: "paid vs total" }
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
            border: `1px solid ${C.tealBorder}`,
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
              placeholder="Search by patient or invoice #..."
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
                background: C.tealBg,
                color: C.tealText,
                border: `1px solid ${C.tealBorder}`
              }}>
                {f}
                <X
                  size={10}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (f.startsWith('"')) setSearch("");
                    else if (f.startsWith("From")) setDateFrom("");
                    else setDateTo("");
                  }}
                />
              </span>
            ))}
          </div>
        </div>
        
        {/* Invoices Table */}
        <div style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: "hidden"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "100px 1.5fr 100px 120px 120px 120px 100px 140px",
            padding: "12px 20px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`,
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <span style={{ cursor: "pointer" }} onClick={() => handleSort("invoice_number")}>
              Invoice # <SortIcon field="invoice_number" />
            </span>
            <span>Patient</span>
            <span style={{ cursor: "pointer" }} onClick={() => handleSort("created_at")}>
              Date <SortIcon field="created_at" />
            </span>
            <span style={{ cursor: "pointer", textAlign: "right" }} onClick={() => handleSort("total_amount")}>
              Total <SortIcon field="total_amount" />
            </span>
            <span style={{ cursor: "pointer", textAlign: "right" }} onClick={() => handleSort("paid_amount")}>
              Paid <SortIcon field="paid_amount" />
            </span>
            <span style={{ cursor: "pointer", textAlign: "right" }} onClick={() => handleSort("balance")}>
              Balance <SortIcon field="balance" />
            </span>
            <span style={{ cursor: "pointer" }} onClick={() => handleSort("due_date")}>
              Due Date <SortIcon field="due_date" />
            </span>
            <span style={{ textAlign: "center" }}>Actions</span>
          </div>
          
          {isLoading ? (
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
              <p style={{ fontSize: 13, color: C.muted }}>Loading invoices...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <CheckCircle2 size={40} color={C.teal} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
                No unpaid or partial invoices found
              </p>
              <p style={{ fontSize: 11, color: C.faint }}>
                {search ? "Try adjusting your search filters" : "All invoices are either paid or void"}
              </p>
              {allInvoices.length > 0 && (
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setSearch("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  style={{ marginTop: 12 }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            filteredAndSorted.map((invoice, idx) => {
              const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
              const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== "paid";
              
              return (
                <div
                  key={invoice.id}
                  className="invoice-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1.5fr 100px 120px 120px 120px 100px 140px",
                    padding: "14px 20px",
                    borderBottom: idx < filteredAndSorted.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    background: isOverdue ? C.redBg : "transparent"
                  }}
                >
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: isOverdue ? C.redText : C.teal
                  }}>
                    {invoice.invoice_number}
                  </span>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={invoice.patient_name} size={28} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                        {invoice.patient_name}
                      </div>
                      <div style={{ fontSize: 10, color: C.faint }}>
                        {invoice.patient_phone || "No phone"}
                      </div>
                    </div>
                  </div>
                  
                  <span style={{ fontSize: 12, color: C.muted }}>
                    {formatDate(invoice.created_at)}
                  </span>
                  
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: C.text }}>
                    {formatCurrency(invoice.total_amount)}
                  </span>
                  
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: C.tealText }}>
                    {formatCurrency(invoice.paid_amount)}
                  </span>
                  
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: balance > 0 ? C.redText : C.tealText
                    }}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                  
                  <div>
                    <StatusBadge status={isOverdue ? "overdue" : invoice.status} />
                    {isOverdue && <DaysOverdue dueDate={invoice.due_date} />}
                  </div>
                  
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleRecordPayment(invoice)}
                      title="Record Payment"
                    >
                      <CreditCard size={12} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSendReminder(invoice)}
                      title="Send Reminder"
                    >
                      <Mail size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/accountant/invoices/${invoice.id}`, "_blank")}
                      title="View Details"
                    >
                      <Eye size={12} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(invoice)}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              );
            })
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
              Showing {filteredAndSorted.length} of {invoices.length} unpaid/partial invoices
            </span>
            <div style={{ display: "flex", gap: 24 }}>
              <span>
                <strong>Total Outstanding:</strong>{" "}
                <span style={{ color: C.redText, fontWeight: 700 }}>
                  {formatCurrency(totalUnpaid)}
                </span>
              </span>
              <span>
                <strong>Overdue:</strong>{" "}
                <span style={{ color: C.amberText, fontWeight: 700 }}>
                  {overdueCount}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={selectedInvoice}
        onSuccess={handleSuccess}
      />
      
      {/* Reminder Modal */}
      <ReminderModal
        open={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        invoice={selectedInvoice}
        onSuccess={handleSuccess}
      />
    </>
  );
}