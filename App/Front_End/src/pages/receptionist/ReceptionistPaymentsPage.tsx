import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, CreditCard, DollarSign, Receipt, Calendar,
  Search, Filter, ChevronDown, X, Plus, Printer,
  Download, Eye, CheckCircle2, XCircle, AlertCircle,
  Clock, User, Phone, Mail, FileText, TrendingUp,
  PieChart, BarChart3, Wallet, Banknote, QrCode,
  Smartphone, Landmark, RefreshCw, Settings,
  Shield
} from "lucide-react";
import { apiGetPatients, apiGetPatientBalance } from "@/api/patients";
import { apiGetInvoices, apiCreatePayment } from "@/api/billing";
import toast from "react-hot-toast";

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
  green: "#10b981",
  greenBg: "#f0fdf4",
  greenText: "#065f46",
  greenBorder: "#bbf7d0",
  gray: "#6b7f75",
  grayBg: "#f4f7f5",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote, color: C.green },
  { value: "card", label: "Credit/Debit Card", icon: CreditCard, color: C.blue },
  { value: "mobile", label: "Mobile Money", icon: Smartphone, color: C.purple },
  { value: "bank", label: "Bank Transfer", icon: Landmark, color: C.amber },
  { value: "insurance", label: "Insurance", icon: Shield, color: C.teal },
  { value: "other", label: "Other", icon: Wallet, color: C.gray },
];

// ─── Components ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
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

function PatientSelector({ onSelectPatient }: { onSelectPatient: (patient: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["patients", searchQuery],
    queryFn: () => apiGetPatients({ search: searchQuery, limit: 20 }),
  });
  
  const patients = patientsData?.data || patientsData || [];
  
  const handleSelect = (patient: any) => {
    setSelectedPatient(patient);
    onSelectPatient(patient);
    setIsOpen(false);
  };
  
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
        Select Patient <span style={{ color: C.red }}>*</span>
      </label>
      
      {selectedPatient ? (
        <div style={{
          background: C.tealBg,
          border: `1px solid ${C.tealBorder}`,
          borderRadius: 12,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={selectedPatient.full_name} size={48} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{selectedPatient.full_name}</p>
              <p style={{ fontSize: 12, color: C.muted }}>
                {selectedPatient.patient_number || `PT-${selectedPatient.id}`} · {selectedPatient.phone || "No phone"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedPatient(null);
              onSelectPatient(null);
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.bg,
              fontSize: 12,
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
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "12px 16px",
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
            <ChevronDown size={16} color={C.muted} />
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
                  {searchQuery ? `No patients found matching "${searchQuery}"` : "No patients found"}
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
                        {patient.patient_number || `PT-${patient.id}`} · {patient.phone || "No phone"}
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

function PaymentModal({ patient, balance, onClose, onSuccess }: {
  patient: any;
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  
  const createPaymentMut = useMutation({
    mutationFn: (data: any) => apiCreatePayment(data),
    onSuccess: () => {
      toast.success(`Payment of $${amount} recorded successfully`);
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to process payment");
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (paymentAmount > balance) {
      toast.error(`Amount exceeds outstanding balance of $${balance}`);
      return;
    }
    
    createPaymentMut.mutate({
      patientId: patient.id,
      amount: paymentAmount,
      method,
      reference: reference || undefined,
      notes: notes || undefined,
      date: new Date().toISOString(),
    });
  };
  
  const selectedMethod = PAYMENT_METHODS.find(m => m.value === method);
  const IconComponent = selectedMethod?.icon || Banknote;
  
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: C.bg,
        borderRadius: 16,
        width: "100%",
        maxWidth: 500,
        maxHeight: "90vh",
        overflow: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            Process Payment
          </h3>
          <button
            onClick={onClose}
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
        
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{
              background: C.tealBg,
              borderRadius: 12,
              padding: "12px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Outstanding Balance</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.teal }}>${balance.toFixed(2)}</p>
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>
              Amount <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <DollarSign size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 32px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                }}
                autoFocus
              />
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>
              Payment Method <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {PAYMENT_METHODS.map(method => {
                const MethodIcon = method.icon;
                const isSelected = method.value === method;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setMethod(method.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? method.color : C.border}`,
                      background: isSelected ? `${method.color}10` : C.bg,
                      color: isSelected ? method.color : C.muted,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    <MethodIcon size={14} />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction ID, Check Number, etc."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this payment..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bg,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPaymentMut.isPending || !amount}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                background: C.teal,
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: createPaymentMut.isPending || !amount ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {createPaymentMut.isPending ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.5s linear infinite" }} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Process Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReceptionistPaymentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Fetch patient balance
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["patient-balance", selectedPatient?.id],
    queryFn: () => apiGetPatientBalance(selectedPatient.id),
    enabled: !!selectedPatient && showPayment,
  });
  
  // Fetch patient invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["patient-invoices", selectedPatient?.id],
    queryFn: () => apiGetInvoices({ patientId: selectedPatient.id, limit: 20 }),
    enabled: !!selectedPatient && showPayment,
  });
  
  const balance = balanceData?.balance || balanceData || 0;
  const invoices = invoicesData?.data || invoicesData || [];
  
  const handleViewPayment = () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }
    setShowPayment(true);
  };
  
  const handlePaymentSuccess = () => {
    refetchBalance();
    queryClient.invalidateQueries({ queryKey: ["patient-invoices", selectedPatient?.id] });
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return { bg: C.greenBg, text: C.greenText, label: "Paid" };
      case "pending": return { bg: C.amberBg, text: C.amberText, label: "Pending" };
      case "overdue": return { bg: C.redBg, text: C.redText, label: "Overdue" };
      default: return { bg: C.grayBg, text: C.gray, label: status };
    }
  };
  
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{ animation: "slideIn 0.3s ease-out" }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate("/receptionist")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 12,
              color: C.muted,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Payments
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Process patient payments and view payment history
              </p>
            </div>
          </div>
        </div>

        {!showPayment ? (
          <div style={{
            background: C.bg,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "32px",
            maxWidth: 600,
            margin: "0 auto",
          }}>
            <PatientSelector onSelectPatient={(patient) => setSelectedPatient(patient)} />
            
            <button
              onClick={handleViewPayment}
              disabled={!selectedPatient}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: selectedPatient ? C.teal : C.muted,
                border: "none",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: selectedPatient ? "pointer" : "not-allowed",
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <CreditCard size={18} />
              Process Payment for {selectedPatient?.full_name?.split(" ")[0] || "Patient"}
            </button>
          </div>
        ) : (
          <>
            {/* Patient Info Banner */}
            <div style={{
              background: C.tealBg,
              border: `1px solid ${C.tealBorder}`,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={selectedPatient.full_name} size={48} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{selectedPatient.full_name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    {selectedPatient.patient_number || `PT-${selectedPatient.id}`} · {selectedPatient.phone || "No phone"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: C.teal,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <DollarSign size={14} />
                  Process Payment
                </button>
                <button
                  onClick={() => {
                    setShowPayment(false);
                    setSelectedPatient(null);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    fontSize: 12,
                    cursor: "pointer",
                    color: C.muted,
                  }}
                >
                  Change Patient
                </button>
              </div>
            </div>
            
            {/* Balance Card */}
            <div style={{
              background: `linear-gradient(135deg, ${C.teal}, ${C.tealText})`,
              borderRadius: 16,
              padding: "24px",
              marginBottom: 24,
              color: "white",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 13, opacity: 0.9 }}>Outstanding Balance</p>
                <Wallet size={24} opacity={0.8} />
              </div>
              <p style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
                ${balanceLoading ? "..." : balance.toFixed(2)}
              </p>
              <p style={{ fontSize: 12, opacity: 0.8 }}>
                {balance === 0 ? "No outstanding payments" : `${invoices.filter(i => i.status !== "paid").length} unpaid invoice(s)`}
              </p>
            </div>
            
            {/* Invoices Section */}
            <div style={{
              background: C.bg,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              marginBottom: 24,
            }}>
              <div style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Receipt size={18} color={C.teal} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Recent Invoices</h3>
                </div>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Printer size={12} />
                  Print
                </button>
              </div>
              
              {invoicesLoading ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </div>
              ) : invoices.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <Receipt size={40} color={C.faint} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13, color: C.muted }}>No invoices found</p>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 100px 100px 100px 80px",
                    padding: "12px 16px",
                    background: C.bgMuted,
                    borderBottom: `1px solid ${C.border}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.muted,
                  }}>
                    <div>Invoice #</div>
                    <div>Date</div>
                    <div>Amount</div>
                    <div>Paid</div>
                    <div>Balance</div>
                    <div>Status</div>
                  </div>
                  {invoices.map((invoice: any) => {
                    const status = getStatusColor(invoice.status);
                    const balance = invoice.amount - (invoice.paid || 0);
                    return (
                      <div
                        key={invoice.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "80px 1fr 100px 100px 100px 80px",
                          padding: "12px 16px",
                          borderBottom: `1px solid ${C.border}`,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>INV-{invoice.id}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: C.muted }}>{formatDate(invoice.date)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>${invoice.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: C.green }}>${(invoice.paid || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: balance > 0 ? C.red : C.green }}>
                            ${balance.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 12,
                            background: status.bg,
                            color: status.text,
                          }}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Payment History Summary */}
            <div style={{
              background: C.bg,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <TrendingUp size={18} color={C.teal} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Payment Summary</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Total Payments</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                    ${invoices.reduce((sum, i) => sum + (i.paid || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Total Invoices</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                    ${invoices.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Outstanding</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: balance > 0 ? C.red : C.green }}>
                    ${balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Payment Modal */}
      {showModal && selectedPatient && (
        <PaymentModal
          patient={selectedPatient}
          balance={balance}
          onClose={() => setShowModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}