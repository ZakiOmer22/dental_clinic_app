import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CreditCard, ReceiptText, Search,
  TrendingUp, TrendingDown, CheckCircle2, Clock,
  AlertCircle, Wallet, Download, Filter, X,
  ChevronDown, ChevronRight, DollarSign, Calculator,
  Percent, Tag, FileText, User, Calendar, Building2,
  Shield, Printer, Eye, Copy, RefreshCw, Edit
} from "lucide-react";
import { apiGetInvoices, apiCreateInvoice } from "@/api/billing";
import { apiGetPatients } from "@/api/patients";
import { apiGetProcedures } from "@/api/procedures";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate } from "@/utils";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const DISCOUNT_TYPES = [
  { value: "none", label: "No Discount", icon: "—" },
  { value: "percent", label: "Percentage (%)", icon: "%" },
  { value: "fixed", label: "Fixed Amount", icon: "$" }
];

const TAX_TYPES = [
  { value: 0, label: "No Tax" },
  { value: 5, label: "5% VAT" },
  { value: 8, label: "8% Sales Tax" },
  { value: 10, label: "10% VAT" },
  { value: 15, label: "15% VAT" },
  { value: 18, label: "18% VAT" }
];

const INVOICE_TEMPLATES = [
  { id: "standard", name: "Standard Invoice", icon: FileText },
  { id: "detailed", name: "Detailed Items", icon: Tag },
  { id: "insurance", name: "Insurance Claim", icon: Shield }
];

const EMPTY_INVOICE_ITEM = {
  procedureId: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  totalPrice: 0
};

const EMPTY_INVOICE = {
  patientId: "",
  invoiceNumber: "",
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [] as any[],
  subtotal: 0,
  discountType: "none" as "none" | "percent" | "fixed",
  discountValue: 0,
  discountAmount: 0,
  taxType: "none",
  taxPercent: 0,
  taxAmount: 0,
  totalAmount: 0,
  notes: "",
  terms: "Payment due within 30 days. Please include invoice number with payment.",
  template: "standard",
  insurancePolicyId: null
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
      background: `linear-gradient(135deg, ${C.teal}, #115e59)`,
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

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" }) {
  const styles = {
    default: { bg: C.grayBg, color: C.muted, border: C.border },
    success: { bg: C.successBg, color: C.tealText, border: C.tealBorder },
    warning: { bg: C.warningBg, color: C.amberText, border: C.amberBorder },
    danger: { bg: C.redBg, color: C.redText, border: C.redBorder },
    info: { bg: C.blueBg, color: C.blueText, border: C.blueBorder }
  };
  
  const style = styles[variant];
  
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: 100,
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      whiteSpace: "nowrap"
    }}>
      {children}
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
  disabled
}: { 
  children: React.ReactNode; 
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants = {
    primary: {
      bg: C.teal,
      color: "white",
      border: "none",
      hoverBg: "#0f766e"
    },
    secondary: {
      bg: C.bg,
      color: C.muted,
      border: `1.5px solid ${C.border}`,
      hoverBg: C.bgMuted
    },
    danger: {
      bg: C.redBg,
      color: C.redText,
      border: `1px solid ${C.redBorder}`,
      hoverBg: "#fee2e2"
    },
    ghost: {
      bg: "transparent",
      color: C.muted,
      border: "none",
      hoverBg: C.bgMuted
    }
  };
  
  const style = variants[variant];
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 10,
        background: style.bg,
        color: style.color,
        border: style.border,
        fontSize: 13,
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
        width: 14,
        height: 14,
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

// ─── Searchable Patient Selector ────────────────────────────────────────────
function PatientSelector({ patients, value, onSelect }: { patients: any[]; value: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = patients.find(p => String(p.id) === value);
  
  const filtered = patients.filter(p => 
    !search || 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) ||
    p.patient_number?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          ...InputStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          height: 40
        }}
      >
        {selected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={selected.full_name} size={28} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {selected.full_name}
              </div>
              <div style={{ fontSize: 11, color: C.faint }}>
                {selected.patient_number} • {selected.phone}
              </div>
            </div>
          </div>
        ) : (
          <span style={{ color: C.faint, fontSize: 13 }}>
            Search patient by name, phone, or ID...
          </span>
        )}
        <ChevronDown size={14} color={C.faint} style={{
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s"
        }} />
      </div>
      
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: C.bg,
          border: `1.5px solid ${C.tealBorder}`,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 100,
          overflow: "hidden"
        }}>
          <div style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.faint
              }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type name, phone, or patient number..."
                style={{
                  ...InputStyle,
                  paddingLeft: 32,
                  height: 36,
                  fontSize: 12
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", fontSize: 12, color: C.faint }}>
                No patients found
              </p>
            ) : (
              filtered.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => {
                    onSelect(String(patient.id));
                    setOpen(false);
                    setSearch("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "background 0.1s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar name={patient.full_name} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                      {patient.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: C.faint }}>
                      {patient.patient_number} • {patient.phone}
                    </div>
                  </div>
                  {String(patient.id) === value && (
                    <CheckCircle2 size={14} color={C.teal} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice Items Table ───────────────────────────────────────────────────
function InvoiceItemsTable({ 
  items, 
  onUpdate,
  procedures = []
}: { 
  items: any[]; 
  onUpdate: (items: any[]) => void;
  procedures: any[];
}) {
  const [showProcedureSelector, setShowProcedureSelector] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  
  const addItem = () => {
    onUpdate([...items, { ...EMPTY_INVOICE_ITEM, description: "New Service" }]);
  };
  
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate(newItems);
  };
  
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total price
    const quantity = field === "quantity" ? value : newItems[index].quantity;
    const unitPrice = field === "unitPrice" ? value : newItems[index].unitPrice;
    const discountPercent = field === "discountPercent" ? value : newItems[index].discountPercent;
    
    const subtotal = quantity * unitPrice;
    const discount = subtotal * (discountPercent / 100);
    newItems[index].totalPrice = subtotal - discount;
    
    onUpdate(newItems);
  };
  
  const selectProcedure = (procedure: any, index: number) => {
    updateItem(index, "procedureId", procedure.id);
    updateItem(index, "description", procedure.name);
    updateItem(index, "unitPrice", procedure.base_price);
    setShowProcedureSelector(false);
    setSelectedItemIndex(null);
  };
  
  return (
    <div>
      <div style={{
        overflowX: "auto",
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        marginBottom: 12
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ background: C.bgMuted }}>
            <tr>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: C.muted }}>Service</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: C.muted, width: 80 }}>Qty</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: C.muted, width: 100 }}>Unit Price</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: C.muted, width: 80 }}>Disc %</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: C.muted, width: 100 }}>Total</th>
              <th style={{ padding: "10px 12px", textAlign: "center", width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ position: "relative" }}>
                    <input
                      value={item.description}
                      onChange={e => updateItem(index, "description", e.target.value)}
                      placeholder="Service description"
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        fontSize: 12,
                        background: C.bg
                      }}
                    />
                    {procedures.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItemIndex(index);
                          setShowProcedureSelector(true);
                        }}
                        style={{
                          position: "absolute",
                          right: 4,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: C.teal,
                          fontSize: 10,
                          padding: "2px 4px"
                        }}
                      >
                        Quick
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    style={{
                      width: 60,
                      padding: "6px 8px",
                      textAlign: "center",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12
                    }}
                  />
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    style={{
                      width: 90,
                      padding: "6px 8px",
                      textAlign: "right",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12
                    }}
                  />
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <input
                    type="number"
                    step="0.1"
                    value={item.discountPercent}
                    onChange={e => updateItem(index, "discountPercent", parseFloat(e.target.value) || 0)}
                    style={{
                      width: 60,
                      padding: "6px 8px",
                      textAlign: "center",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12
                    }}
                  />
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                  {formatCurrency(item.totalPrice)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.muted,
                      padding: 4,
                      borderRadius: 4,
                      display: "inline-flex"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.redBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Button variant="secondary" onClick={addItem}>
        <Plus size={14} /> Add Service
      </Button>
      
      {/* Procedure Selector Modal */}
      {showProcedureSelector && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200
        }} onClick={() => setShowProcedureSelector(false)}>
          <div style={{
            background: C.bg,
            borderRadius: 16,
            width: 500,
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Select Procedure</h3>
              <button onClick={() => setShowProcedureSelector(false)} style={{
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
            <div style={{ padding: 16, maxHeight: "60vh", overflowY: "auto" }}>
              {procedures.map(proc => (
                <div
                  key={proc.id}
                  onClick={() => selectedItemIndex !== null && selectProcedure(proc, selectedItemIndex)}
                  style={{
                    padding: "12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: "pointer",
                    transition: "all 0.1s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{proc.name}</div>
                      <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{proc.category}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>
                      {formatCurrency(proc.base_price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice Preview ────────────────────────────────────────────────────────
function InvoicePreview({ invoice, clinic, patient }: { invoice: any; clinic: any; patient: any }) {
  if (!invoice.patientId) {
    return (
      <div style={{
        background: C.bgMuted,
        borderRadius: 12,
        padding: "40px 20px",
        textAlign: "center",
        border: `2px dashed ${C.border}`
      }}>
        <FileText size={40} color={C.faint} style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 13, color: C.muted }}>Select a patient to see invoice preview</p>
      </div>
    );
  }
  
  const subtotal = invoice.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
  const discountAmount = invoice.discountType === "percent" 
    ? subtotal * (invoice.discountValue / 100)
    : invoice.discountType === "fixed"
    ? invoice.discountValue
    : 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (invoice.taxPercent / 100);
  const total = afterDiscount + taxAmount;
  
  return (
    <div style={{
      background: C.bg,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: "hidden"
    }}>
      {/* Invoice Header */}
      <div style={{
        padding: "20px",
        borderBottom: `2px solid ${C.border}`,
        background: `linear-gradient(135deg, ${C.tealBg}, white)`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.teal, marginBottom: 4 }}>
              {clinic?.name || "Dental Clinic"}
            </h2>
            <p style={{ fontSize: 11, color: C.muted }}>
              {clinic?.address || "Healthcare Facility"}<br />
              {clinic?.phone || "Contact: +252..."}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              background: C.teal,
              color: "white",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600
            }}>
              INVOICE
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              #{invoice.invoiceNumber || "INV-00001"}
            </div>
          </div>
        </div>
      </div>
      
      {/* Patient & Invoice Details */}
      <div style={{
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        borderBottom: `1px solid ${C.border}`
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>BILL TO</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{patient?.full_name || "—"}</div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {patient?.patient_number} • {patient?.phone}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>
            <span style={{ fontSize: 11, color: C.muted }}>Issue Date: </span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{formatDate(invoice.issueDate)}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Due Date: </span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{formatDate(invoice.dueDate)}</span>
          </div>
        </div>
      </div>
      
      {/* Items Table */}
      <div style={{ padding: "20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th style={{ textAlign: "left", padding: "8px 4px", color: C.muted }}>Description</th>
              <th style={{ textAlign: "center", padding: "8px 4px", color: C.muted, width: 60 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: C.muted, width: 80 }}>Unit Price</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: C.muted, width: 80 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 4px" }}>
                  {item.description}
                  {item.discountPercent > 0 && (
                    <Badge variant="warning" style={{ marginLeft: 8 }}>
                      -{item.discountPercent}%
                    </Badge>
                  )}
                </td>
                <td style={{ textAlign: "center", padding: "10px 4px" }}>{item.quantity}</td>
                <td style={{ textAlign: "right", padding: "10px 4px" }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ textAlign: "right", padding: "10px 4px", fontWeight: 600 }}>
                  {formatCurrency(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Totals */}
        <div style={{ marginTop: 20, textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Subtotal:</span>
            <span style={{ fontSize: 13, fontWeight: 500, width: 100, textAlign: "right" }}>
              {formatCurrency(subtotal)}
            </span>
          </div>
          {invoice.discountValue > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>
                Discount ({invoice.discountType === "percent" ? `${invoice.discountValue}%` : "Fixed"}):
              </span>
              <span style={{ fontSize: 13, color: C.red, width: 100, textAlign: "right" }}>
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}
          {invoice.taxPercent > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Tax ({invoice.taxPercent}%):</span>
              <span style={{ fontSize: 13, fontWeight: 500, width: 100, textAlign: "right" }}>
                {formatCurrency(taxAmount)}
              </span>
            </div>
          )}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 20,
            marginTop: 12,
            paddingTop: 12,
            borderTop: `2px solid ${C.border}`
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total:</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.teal, width: 100, textAlign: "right" }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms) && (
        <div style={{
          padding: "16px 20px",
          background: C.bgMuted,
          borderTop: `1px solid ${C.border}`,
          fontSize: 11,
          color: C.muted
        }}>
          {invoice.notes && (
            <div style={{ marginBottom: 8 }}>
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}
          {invoice.terms && (
            <div>
              <strong>Terms:</strong> {invoice.terms}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantCreateInvoicePage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  
  const [invoice, setInvoice] = useState(EMPTY_INVOICE);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  
  // Fetch patients
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ["patients", "active"],
    queryFn: () => apiGetPatients({ limit: 500, is_active: true })
  });
  
  // Fetch procedures
  const { data: proceduresData } = useQuery({
    queryKey: ["procedures", "active"],
    queryFn: () => apiGetProcedures({ limit: 500, is_active: true })
  });
  
  const patients = patientsData?.data || [];
  const procedures = proceduresData?.data || [];
  
  // Get selected patient
  const selectedPatient = patients.find(p => String(p.id) === invoice.patientId);
  
  // Calculate totals when items, discount, or tax change
  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    let discountAmount = 0;
    if (invoice.discountType === "percent") {
      discountAmount = subtotal * (invoice.discountValue / 100);
    } else if (invoice.discountType === "fixed") {
      discountAmount = invoice.discountValue;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (invoice.taxPercent / 100);
    const total = afterDiscount + taxAmount;
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount: total
    }));
  }, [invoice.items, invoice.discountType, invoice.discountValue, invoice.taxPercent]);
  
  // Generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${year}${month}-${random}`;
  };
  
  const handleCreateInvoice = async () => {
    if (!invoice.patientId) {
      toast.error("Please select a patient");
      return;
    }
    
    if (invoice.items.length === 0) {
      toast.error("Please add at least one service");
      return;
    }
    
    setSaving(true);
    try {
      const invoiceData = {
        ...invoice,
        invoiceNumber: invoice.invoiceNumber || generateInvoiceNumber(),
        createdBy: user?.id,
        clinicId: user?.clinic_id
      };
      
      await apiCreateInvoice(invoiceData);
      toast.success("Invoice created successfully!");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      
      // Reset form
      setInvoice(EMPTY_INVOICE);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to create invoice");
    } finally {
      setSaving(false);
    }
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
              Create Invoice
            </h1>
            <p style={{ fontSize: 13, color: C.muted }}>
              Generate a new invoice for patient services
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" onClick={() => window.history.back()}>
              <X size={14} /> Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateInvoice} loading={saving}>
              <ReceiptText size={14} /> Create Invoice
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 4,
          borderBottom: `2px solid ${C.border}`,
          marginBottom: 24
        }}>
          {[
            { id: "edit", label: "Edit Invoice", icon: FileText },
            { id: "preview", label: "Preview", icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === tab.id ? C.teal : C.muted,
                borderBottom: activeTab === tab.id ? `2px solid ${C.teal}` : "2px solid transparent",
                transition: "all 0.15s"
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {activeTab === "edit" ? (
            <>
              {/* Left Column - Form */}
              <div>
                <div style={{
                  background: C.bg,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: 24,
                  marginBottom: 24
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                    Invoice Information
                  </h3>
                  
                  <Field label="Patient" required>
                    <PatientSelector
                      patients={patients}
                      value={invoice.patientId}
                      onSelect={id => setInvoice(prev => ({ ...prev, patientId: id }))}
                    />
                  </Field>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Issue Date" required>
                      <input
                        type="date"
                        value={invoice.issueDate}
                        onChange={e => setInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
                        style={InputStyle}
                      />
                    </Field>
                    
                    <Field label="Due Date" required>
                      <input
                        type="date"
                        value={invoice.dueDate}
                        onChange={e => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                        style={InputStyle}
                      />
                    </Field>
                  </div>
                  
                  <Field label="Invoice Template">
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {INVOICE_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setInvoice(prev => ({ ...prev, template: template.id }))}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: `1.5px solid ${invoice.template === template.id ? C.teal : C.border}`,
                            background: invoice.template === template.id ? C.tealBg : C.bg,
                            color: invoice.template === template.id ? C.tealText : C.muted,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                            transition: "all 0.15s"
                          }}
                        >
                          <template.icon size={14} />
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                
                <div style={{
                  background: C.bg,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: 24
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                    Invoice Items
                  </h3>
                  
                  <InvoiceItemsTable
                    items={invoice.items}
                    onUpdate={items => setInvoice(prev => ({ ...prev, items }))}
                    procedures={procedures}
                  />
                </div>
              </div>
              
              {/* Right Column - Summary & Calculations */}
              <div>
                <div style={{
                  background: C.bg,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: 24,
                  marginBottom: 24
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                    Discount & Tax
                  </h3>
                  
                  <Field label="Discount Type">
                    <select
                      value={invoice.discountType}
                      onChange={e => setInvoice(prev => ({ ...prev, discountType: e.target.value as any, discountValue: 0 }))}
                      style={InputStyle}
                    >
                      {DISCOUNT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </Field>
                  
                  {invoice.discountType !== "none" && (
                    <Field label={invoice.discountType === "percent" ? "Discount Percentage" : "Discount Amount"}>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          step={invoice.discountType === "percent" ? "0.1" : "0.01"}
                          value={invoice.discountValue}
                          onChange={e => setInvoice(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                          style={InputStyle}
                        />
                        {invoice.discountType === "percent" && (
                          <Percent size={14} style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: C.muted
                          }} />
                        )}
                      </div>
                    </Field>
                  )}
                  
                  <Field label="Tax Rate">
                    <select
                      value={invoice.taxPercent}
                      onChange={e => setInvoice(prev => ({ ...prev, taxPercent: parseFloat(e.target.value) }))}
                      style={InputStyle}
                    >
                      {TAX_TYPES.map(tax => (
                        <option key={tax.value} value={tax.value}>{tax.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                
                <div style={{
                  background: `linear-gradient(135deg, ${C.tealBg}, white)`,
                  borderRadius: 16,
                  border: `1px solid ${C.tealBorder}`,
                  padding: 24
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                    Summary
                  </h3>
                  
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: C.muted }}>Subtotal:</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {formatCurrency(invoice.subtotal)}
                      </span>
                    </div>
                    
                    {invoice.discountAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: C.muted }}>Discount:</span>
                        <span style={{ fontSize: 14, color: C.red }}>
                          -{formatCurrency(invoice.discountAmount)}
                        </span>
                      </div>
                    )}
                    
                    {invoice.taxAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: C.muted }}>Tax ({invoice.taxPercent}%):</span>
                        <span style={{ fontSize: 14, color: C.text }}>
                          {formatCurrency(invoice.taxAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    borderTop: `2px solid ${C.tealBorder}`,
                    paddingTop: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Total Amount:</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: C.teal }}>
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginTop: 24 }}>
                  <Field label="Notes (optional)">
                    <textarea
                      value={invoice.notes}
                      onChange={e => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      placeholder="Any additional notes..."
                      style={{
                        ...InputStyle,
                        height: "auto",
                        padding: "8px 12px",
                        resize: "vertical",
                        lineHeight: 1.5
                      }}
                    />
                  </Field>
                  
                  <Field label="Terms & Conditions">
                    <textarea
                      value={invoice.terms}
                      onChange={e => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                      rows={2}
                      placeholder="Payment terms..."
                      style={{
                        ...InputStyle,
                        height: "auto",
                        padding: "8px 12px",
                        resize: "vertical",
                        lineHeight: 1.5
                      }}
                    />
                  </Field>
                </div>
              </div>
            </>
          ) : (
            // Preview Mode - Full Width
            <div style={{ gridColumn: "span 2" }}>
              <InvoicePreview
                invoice={invoice}
                clinic={user?.clinic}
                patient={selectedPatient}
              />
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <Button variant="secondary" onClick={() => setActiveTab("edit")}>
                  <Edit size={14} /> Back to Edit
                </Button>
                <Button variant="primary" onClick={handleCreateInvoice} loading={saving}>
                  <Printer size={14} /> Create & Print
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}