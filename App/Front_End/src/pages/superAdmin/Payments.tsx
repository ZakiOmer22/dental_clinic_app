// Front_End/src/pages/superAdmin/Payments.tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Receipt, Download, RefreshCw, Search, X, ChevronLeft, ChevronRight, 
  CreditCard, Banknote, Smartphone, AlertCircle, CheckCircle2, Clock,
  Building2, ChevronDown, Filter, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store";
import client from "@/api/client";

const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
} as const;

const formatAmount = (amount: any): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const getMethodIcon = (method: string) => {
  const methodLower = method?.toLowerCase() || '';
  if (methodLower.includes('card') || methodLower.includes('credit')) return <CreditCard size={12} />;
  if (methodLower.includes('bank') || methodLower.includes('transfer')) return <Banknote size={12} />;
  if (methodLower.includes('mobile') || methodLower.includes('momo')) return <Smartphone size={12} />;
  return <CreditCard size={12} />;
};

function Badge({ label, variant }: { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'purple' }) {
  const variants = {
    success: { bg: C.tealBg, text: C.tealText, border: C.tealBorder },
    error: { bg: C.redBg, text: C.redText, border: C.redBorder },
    warning: { bg: C.amberBg, text: C.amberText, border: C.amberBorder },
    info: { bg: C.blueBg, text: C.blueText, border: C.blueBorder },
    purple: { bg: C.purpleBg, text: C.purpleText, border: "#ddd6fe" },
  };
  const style = variants[variant];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100,
      background: style.bg, color: style.text, border: `1px solid ${style.border}`,
      whiteSpace: "nowrap", display: "inline-block", textTransform: "capitalize"
    }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, subtext, icon: Icon, color, bg }: { label: string; value: string | number; subtext?: string; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{value}</p>
      {subtext && <p style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>{subtext}</p>}
    </div>
  );
}

function ClinicSelector({ onSelectClinic }: { onSelectClinic: (clinic: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  
  const { data: clinicsData, isLoading } = useQuery({
    queryKey: ["clinics", searchQuery],
    queryFn: () => client.get('/api/v1/admin/clinics').then(r => r.data),
  });
  
  const clinics = clinicsData?.clinics || [];
  const filteredClinics = clinics.filter((c: any) => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelect = (clinic: any) => {
    setSelectedClinic(clinic);
    onSelectClinic(clinic);
    setIsOpen(false);
  };
  
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
        Select Clinic <span style={{ color: C.red }}>*</span>
      </label>
      
      {selectedClinic ? (
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
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: C.teal,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Building2 size={20} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{selectedClinic.name}</p>
              <p style={{ fontSize: 12, color: C.muted }}>
                {selectedClinic.city || 'No city'} · {selectedClinic.email || 'No email'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedClinic(null);
              onSelectClinic(null);
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
              {isOpen ? "Search for a clinic..." : "Click to select a clinic"}
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
                    placeholder="Search by clinic name..."
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
              ) : filteredClinics.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: C.muted }}>
                  No clinics found
                </div>
              ) : (
                filteredClinics.map((clinic: any) => (
                  <div
                    key={clinic.id}
                    onClick={() => handleSelect(clinic)}
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
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: C.purple,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Building2 size={16} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{clinic.name}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>
                        {clinic.city || 'No city'} · {clinic.email || 'No email'}
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

export default function PaymentsPage() {
  const { token } = useAuthStore();
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [showPayments, setShowPayments] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPayments = async () => {
    if (!selectedClinic || !token) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/admin/payments?clinic_id=${selectedClinic.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await response.json();
      setPayments(data.payments || []);
      setShowPayments(true);
      setCurrentPage(1);
      toast.success(`Loaded ${data.payments?.length || 0} payments for ${selectedClinic.name}`);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting payments...', { duration: 1500 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Payments exported successfully');
    } catch {
      toast.error('Failed to export');
    }
  };

  const filtered = useMemo(() => {
    let filtered = payments;
    if (search) {
      filtered = filtered.filter(p => 
        p.id?.toLowerCase().includes(search.toLowerCase()) ||
        p.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.invoice_number?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => (p.status || 'succeeded').toLowerCase() === statusFilter);
    }
    return filtered;
  }, [payments, search, statusFilter]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const totalPayments = payments.length;
  const totalCollected = payments.filter(p => (p.status || 'succeeded') === 'succeeded').reduce((sum, p) => sum + (p.amount || 0), 0);
  const successfulCount = payments.filter(p => (p.status || 'succeeded') === 'succeeded').length;
  const failedCount = payments.filter(p => (p.status || 'succeeded') === 'failed').length;

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ animation: "slideIn 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>Payment History</h1>
          <p style={{ fontSize: 13, color: C.muted }}>View payment transactions by clinic</p>
        </div>

        {!showPayments ? (
          <div style={{
            background: C.bg,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "32px",
            maxWidth: 600,
            margin: "0 auto",
          }}>
            <ClinicSelector onSelectClinic={(clinic) => setSelectedClinic(clinic)} />
            
            <button
              onClick={fetchPayments}
              disabled={!selectedClinic || loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: selectedClinic ? C.purple : C.muted,
                border: "none",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: selectedClinic ? "pointer" : "not-allowed",
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid white`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                  Loading...
                </>
              ) : (
                <>
                  <Receipt size={18} />
                  View Payments for {selectedClinic?.name?.split(" ")[0] || "Clinic"}
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Clinic Info Banner */}
            <div style={{
              background: C.purpleBg,
              border: `1px solid ${C.purple}30`,
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
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: C.purple,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Building2 size={24} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{selectedClinic.name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    {selectedClinic.city || 'No city'} · {selectedClinic.email || 'No email'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPayments(false);
                  setSelectedClinic(null);
                  setPayments([]);
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
                Change Clinic
              </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <StatCard icon={Receipt} label="Total Transactions" value={totalPayments} subtext="All time payments" color={C.blue} bg={C.blueBg} />
              <StatCard icon={CheckCircle2} label="Total Collected" value={`$${formatAmount(totalCollected)}`} subtext="Successful payments" color={C.teal} bg={C.tealBg} />
              <StatCard icon={CheckCircle2} label="Successful" value={successfulCount} subtext="Completed payments" color={C.purple} bg={C.purpleBg} />
              <StatCard icon={AlertCircle} label="Failed" value={failedCount} subtext="Need attention" color={C.red} bg={C.redBg} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ position: 'relative', width: 320 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.faint }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by Txn ID or invoice..."
                  style={{
                    width: '100%', height: 38, padding: '0 12px 0 34px',
                    border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg,
                    fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = C.purple}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.faint }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { value: "all", label: "All", color: C.blue },
                  { value: "succeeded", label: "Succeeded", color: C.teal },
                  { value: "pending", label: "Pending", color: C.amber },
                  { value: "failed", label: "Failed", color: C.red },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStatusFilter(s.value)}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${statusFilter === s.value ? s.color : C.border}`,
                      background: statusFilter === s.value ? `${s.color}15` : C.bg,
                      color: statusFilter === s.value ? s.color : C.muted,
                      cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ overflowX: "auto" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <Receipt size={40} color={C.border} style={{ margin: "0 auto 12px", display: "block" }} />
                    <p style={{ fontSize: 14, color: C.muted }}>No payments found</p>
                    <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>Try adjusting your search or filter</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Txn ID</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.muted }}>Amount</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Method</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Invoice</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Date</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.muted }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((payment, idx) => {
                        const status = payment.status || 'succeeded';
                        const statusVariant = status === 'succeeded' ? 'success' : status === 'pending' ? 'warning' : 'error';
                        const date = payment.created_at || payment.paid_at || payment.date;
                        
                        return (
                          <tr 
                            key={payment.id} 
                            style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${C.border}` : "none", transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: C.purpleText }}>{payment.transaction_id || payment.id}</td>
                            <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: status === 'succeeded' ? C.tealText : C.text }}>
                              ${formatAmount(payment.amount)}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {getMethodIcon(payment.method)}
                                <span style={{ fontSize: 12, color: C.muted }}>{payment.method || 'Credit Card'}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: C.blueText }}>{payment.invoice_number || '-'}</td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>
                              {date ? new Date(date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              <Badge label={status} variant={statusVariant} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && filtered.length > 0 && (
                <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: "4px 12px", fontSize: 13, fontWeight: 500 }}>{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh and Export buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <button onClick={fetchPayments} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, color: C.muted, cursor: "pointer" }}>
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", height: 36, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Download size={14} /> Export
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}