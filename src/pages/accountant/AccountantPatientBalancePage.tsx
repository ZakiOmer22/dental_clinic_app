import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Search, Filter, X, Eye, Edit, RefreshCw,
  Shield, Building2, FileText, CheckCircle, XCircle, Clock,
  DollarSign, Download, User, Calendar, Percent, Receipt, ChevronDown,
  AlertCircle, FileCheck, CreditCard, Calendar as CalendarIcon,
  TrendingUp, TrendingDown, Wallet, Home, Car, Coffee, ShoppingBag,
  MoreVertical, Printer, Upload, Tag, Briefcase, Landmark, Users,
  Wrench, BookOpen, Laptop, Utensils, Fuel, GraduationCap, Heart,
  BarChart3, PieChart, LineChart, Activity, Award, Target, Zap,
  ArrowUp, ArrowDown, Minus, Phone, Mail, MapPin, Activity as ActivityIcon
} from "lucide-react";
import { apiGetInvoices } from "@/api/billing";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate } from "@/utils";
import toast from "react-hot-toast";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ede9fe",
  green: "#10b981", greenBg: "#f0fdf4", greenText: "#059669", greenBorder: "#d1fae5",
  gray: "#6b7f75", grayBg: "#f4f7f5",
};

// Helper to safely parse numbers
const safeParseNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
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
      background: `linear-gradient(135deg, ${C.teal}, #0a7d5d)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.37,
      fontWeight: 600,
      color: "white",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Button({ children, variant = "primary", loading = false, onClick, type = "button", disabled, size = "md" }: any) {
  const variants: any = {
    primary: { bg: C.teal, color: "white", border: "none", hoverBg: "#0a8a66" },
    secondary: { bg: C.bg, color: C.muted, border: `1.5px solid ${C.border}`, hoverBg: C.bgMuted },
    danger: { bg: C.redBg, color: C.redText, border: `1px solid ${C.redBorder}`, hoverBg: "#fee2e2" },
    ghost: { bg: "transparent", color: C.muted, border: "none", hoverBg: C.bgMuted },
    success: { bg: C.greenBg, color: C.greenText, border: `1px solid ${C.greenBorder}`, hoverBg: "#e6f7f0" }
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

// ─── Patient Balance Card ─────────────────────────────────────────────────────
function PatientBalanceCard({ patient, onViewDetails }: { patient: any; onViewDetails: () => void }) {
  const totalBilled = safeParseNumber(patient.total_billed);
  const totalPaid = safeParseNumber(patient.total_paid);
  const balance = totalBilled - totalPaid;
  const paymentPercent = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

  let statusColor = C.green;
  let statusBg = C.greenBg;
  let statusText = "Paid";
  
  if (balance > 0 && balance < totalBilled) {
    statusColor = C.amber;
    statusBg = C.amberBg;
    statusText = "Partial";
  } else if (balance > 0) {
    statusColor = C.red;
    statusBg = C.redBg;
    statusText = "Outstanding";
  }

  return (
    <div
      onClick={onViewDetails}
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        transition: "all 0.2s",
        cursor: "pointer",
        position: "relative",
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
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={patient.patient_name} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{patient.patient_name}</h3>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 12,
              background: statusBg,
              color: statusColor,
            }}>
              {statusText}
            </span>
          </div>
          
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Phone size={12} color={C.muted} />
              <span style={{ fontSize: 11, color: C.muted }}>{patient.phone || "N/A"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FileText size={12} color={C.muted} />
              <span style={{ fontSize: 11, color: C.muted }}>{patient.invoice_count || 0} invoices</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Balance Due</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: balance > 0 ? C.redText : C.greenText }}>
              {formatCurrency(balance)}
            </span>
          </div>

          <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${paymentPercent}%`,
              height: 4,
              background: paymentPercent === 100 ? C.green : paymentPercent > 0 ? C.amber : C.red,
              borderRadius: 2
            }} />
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 10, color: C.faint }}>Billed: {formatCurrency(totalBilled)}</span>
            <span style={{ fontSize: 10, color: C.faint }}>Paid: {formatCurrency(totalPaid)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Details Modal ────────────────────────────────────────────────────
function PatientDetailsModal({ open, onClose, patient, invoices }: { 
  open: boolean; 
  onClose: () => void; 
  patient: any; 
  invoices: any[];
}) {
  if (!open || !patient) return null;

  const totalBilled = safeParseNumber(patient.total_billed);
  const totalPaid = safeParseNumber(patient.total_paid);
  const balance = totalBilled - totalPaid;
  const paymentPercent = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

  const patientInvoices = invoices.filter(inv => inv.patient_id === patient.patient_id);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Patient Balance Details</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {/* Patient Info */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <Avatar name={patient.patient_name} size={64} />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{patient.patient_name}</h2>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
                {patient.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Phone size={12} color={C.muted} />
                    <span style={{ fontSize: 12, color: C.muted }}>{patient.phone}</span>
                  </div>
                )}
                {patient.patient_number && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FileText size={12} color={C.muted} />
                    <span style={{ fontSize: 12, color: C.muted }}>ID: {patient.patient_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: C.bgMuted, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 11, color: C.muted }}>Total Billed</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{formatCurrency(totalBilled)}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{patient.invoice_count} invoices</p>
            </div>
            <div style={{ background: C.bgMuted, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 11, color: C.muted }}>Total Paid</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.teal }}>{formatCurrency(totalPaid)}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{paymentPercent.toFixed(0)}% paid</p>
            </div>
            <div style={{ background: balance > 0 ? C.redBg : C.greenBg, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 11, color: C.muted }}>Balance Due</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: balance > 0 ? C.redText : C.greenText }}>{formatCurrency(balance)}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{balance > 0 ? "Needs payment" : "Fully paid"}</p>
            </div>
          </div>

          {/* Invoices Table */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Invoice History</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Invoice #</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Date</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Amount</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Paid</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Balance</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.faint }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patientInvoices.map((inv, idx) => {
                    const invTotal = safeParseNumber(inv.total_amount);
                    const invPaid = safeParseNumber(inv.paid_amount);
                    const invBalance = invTotal - invPaid;
                    return (
                      <tr key={inv.id} style={{ borderBottom: idx < patientInvoices.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: C.purple }}>{inv.invoice_number}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.muted }}>{formatDate(inv.created_at)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "right", color: C.text }}>{formatCurrency(invTotal)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "right", color: C.teal }}>{formatCurrency(invPaid)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "right", color: invBalance > 0 ? C.redText : C.greenText }}>{formatCurrency(invBalance)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600,
                            background: inv.status === "paid" ? C.greenBg : inv.status === "partial" ? C.amberBg : C.redBg,
                            color: inv.status === "paid" ? C.greenText : inv.status === "partial" ? C.amberText : C.redText
                          }}>
                            {inv.status || "unpaid"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {patientInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: C.faint }}>No invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={() => window.location.href = `/accountant/invoices/create?patientId=${patient.patient_id}`}>
              <Plus size={14} /> New Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantPatientBalancePage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"balance" | "name" | "billed">("balance");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch invoices
  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({})
  });

  // Fetch patients
  const { data: patientsData } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: () => apiGetPatients({ limit: 500 })
  });

  const invoices = invoicesData?.data || [];
  const patients = patientsData?.data || [];

  // Calculate patient balances
  const patientBalances = useMemo(() => {
    const balanceMap = new Map();

    // Initialize with all patients
    patients.forEach(patient => {
      balanceMap.set(patient.id, {
        patient_id: patient.id,
        patient_name: patient.full_name,
        phone: patient.phone,
        patient_number: patient.patient_number,
        total_billed: 0,
        total_paid: 0,
        invoice_count: 0
      });
    });

    // Aggregate invoice data
    invoices.forEach(invoice => {
      const patientId = invoice.patient_id;
      if (balanceMap.has(patientId)) {
        const data = balanceMap.get(patientId);
        const totalAmount = safeParseNumber(invoice.total_amount);
        const paidAmount = safeParseNumber(invoice.paid_amount);
        
        data.total_billed += totalAmount;
        data.total_paid += paidAmount;
        data.invoice_count += 1;
      }
    });

    // Convert to array and filter out patients with zero balance if needed
    let result = Array.from(balanceMap.values());
    
    // Filter out patients with no invoices and zero balance? Keep all for now
    result = result.filter(p => p.invoice_count > 0 || p.total_billed > 0);
    
    return result;
  }, [patients, invoices]);

  // Filter and sort
  const filteredPatients = useMemo(() => {
    let filtered = [...patientBalances];
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.patient_name?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.patient_number?.toLowerCase().includes(q)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "balance") {
        const balanceA = a.total_billed - a.total_paid;
        const balanceB = b.total_billed - b.total_paid;
        return balanceB - balanceA;
      } else if (sortBy === "billed") {
        return b.total_billed - a.total_billed;
      } else {
        return a.patient_name.localeCompare(b.patient_name);
      }
    });
    
    return filtered;
  }, [patientBalances, search, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalOutstanding = patientBalances.reduce((sum, p) => sum + (p.total_billed - p.total_paid), 0);
    const totalBilled = patientBalances.reduce((sum, p) => sum + p.total_billed, 0);
    const totalPaid = patientBalances.reduce((sum, p) => sum + p.total_paid, 0);
    const patientsWithBalance = patientBalances.filter(p => (p.total_billed - p.total_paid) > 0).length;
    const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
    
    return { totalOutstanding, totalBilled, totalPaid, patientsWithBalance, collectionRate };
  }, [patientBalances]);

  const handleViewDetails = (patient: any) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    toast.success("Export feature coming soon");
  };

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
              <Wallet size={24} color={C.red} /> Patient Balances
            </h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              Track outstanding balances and patient accounts
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => refetch()} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={handleExport} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Total Outstanding", value: formatCurrency(stats.totalOutstanding), icon: DollarSign, color: C.red, bg: C.redBg, sub: `${stats.patientsWithBalance} patients owe` },
            { label: "Total Billed", value: formatCurrency(stats.totalBilled), icon: Receipt, color: C.purple, bg: C.purpleBg, sub: `All time` },
            { label: "Total Collected", value: formatCurrency(stats.totalPaid), icon: CheckCircle, color: C.green, bg: C.greenBg, sub: `${patientBalances.length} patients` },
            { label: "Collection Rate", value: `${stats.collectionRate.toFixed(1)}%`, icon: TrendingUp, color: C.blue, bg: C.blueBg, sub: "Overall collection" }
          ].map(k => (
            <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{k.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <k.icon size={14} color={k.color} />
                </div>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{k.value}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Search and Sort */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ position: "relative", width: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name, phone, or ID..."
              style={{
                width: "100%",
                height: 42,
                paddingLeft: 36,
                border: `1.5px solid ${C.border}`,
                borderRadius: 9,
                fontSize: 14,
                background: C.bg,
                outline: "none"
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint }}>
                <X size={14} />
              </button>
            )}
          </div>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.muted }}>Sort by:</span>
            <div style={{ display: "flex", gap: 4, background: C.bgMuted, borderRadius: 8, padding: 2 }}>
              {[
                { value: "balance", label: "Balance" },
                { value: "billed", label: "Billed" },
                { value: "name", label: "Name" }
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value as any)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    background: sortBy === s.value ? C.teal : "transparent",
                    color: sortBy === s.value ? "white" : C.muted,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patient Cards Grid */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, height: 140, animation: "fadeUp .4s ease both" }} />
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "60px 20px", textAlign: "center" }}>
            <Wallet size={48} color={C.border} style={{ margin: "0 auto 16px", display: "block" }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No patients found</h3>
            <p style={{ fontSize: 13, color: C.faint }}>{search ? "Try a different search term" : "No patient balance data available"}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
            {filteredPatients.map(patient => (
              <PatientBalanceCard
                key={patient.patient_id}
                patient={patient}
                onViewDetails={() => handleViewDetails(patient)}
              />
            ))}
          </div>
        )}

        {/* Footer Summary */}
        {filteredPatients.length > 0 && (
          <div style={{ marginTop: 8, padding: "12px 20px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: C.muted }}>{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} with balances</span>
            <div style={{ display: "flex", gap: 24 }}>
              <span>Total Outstanding: <strong style={{ color: C.redText }}>{formatCurrency(filteredPatients.reduce((s, p) => s + (p.total_billed - p.total_paid), 0))}</strong></span>
              <span>Average Balance: <strong>{formatCurrency(filteredPatients.reduce((s, p) => s + (p.total_billed - p.total_paid), 0) / filteredPatients.length)}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        patient={selectedPatient}
        invoices={invoices}
      />
    </>
  );
}