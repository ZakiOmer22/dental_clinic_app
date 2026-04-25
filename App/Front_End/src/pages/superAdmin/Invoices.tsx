// ─── Invoices.tsx ──────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { Receipt, Send, Eye, Search, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store";

const C = {
  border: "#e5eae8",
  bg: "#ffffff",
  bgPage: "#f0f2f1",
  bgMuted: "#f7f9f8",
  text: "#111816",
  muted: "#7a918b",
  faint: "#a0b4ae",
  teal: "#0d9e75",
  tealBg: "#e8f7f2",
  tealText: "#0a7d5d",
  tealBorder: "#c3e8dc",
  red: "#e53e3e",
  redBg: "#fff5f5",
  redText: "#c53030",
  redBorder: "#fed7d7",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1d4ed8",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  purpleText: "#5b21b6",
  orange: "#f59e0b",
  orangeBg: "#fffbeb",
  orangeText: "#92400e",
  orangeBorder: "#fde68a",
};

const formatAmount = (amount: any): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const apiFetch = async (endpoint: string, token: string, options?: RequestInit) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/v1/admin${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error();
  return res.json();
};

function Badge({ label, variant }: { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'purple' }) {
  const variants = {
    success: { bg: C.tealBg, text: C.tealText, border: C.tealBorder },
    error: { bg: C.redBg, text: C.redText, border: C.redBorder },
    warning: { bg: C.orangeBg, text: C.orangeText, border: C.orangeBorder },
    info: { bg: C.blueBg, text: C.blueText, border: "#bfdbfe" },
    purple: { bg: C.purpleBg, text: C.purpleText, border: "#ddd6fe" },
  };
  const style = variants[variant];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100,
      background: style.bg, color: style.text, border: `1px solid ${style.border}`,
      whiteSpace: "nowrap", display: "inline-block",
    }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, subtext, icon: Icon, color, bg }: { 
  label: string; 
  value: string | number; 
  subtext?: string; 
  icon: React.ElementType; 
  color: string; 
  bg: string;
}) {
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

export function InvoicesPage() {
  const { token } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token) return;
      try {
        const data = await apiFetch('/invoices', token);
        setInvoices(data.invoices || []);
      } catch (err) {
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [token]);

  const handleSendReminder = async (inv: any) => {
    toast.success(`Reminder sent for ${inv.invoice_number}`);
  };

  const handlePrintInvoice = (inv: any) => {
    const amount = formatAmount(inv.amount_paid || inv.amount);
    const logoUrl = `${window.location.origin}/icon.png`;
    const win = window.open('', '_blank');
    
    win?.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${inv.invoice_number}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box;}
          body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f1;padding:40px;}
          .invoice{max-width:900px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.08);}
          .invoice-header{background:linear-gradient(135deg,#0d9e75 0%,#0a7d5d 100%);padding:35px 40px;}
          .header-content{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;}
          .logo-section{display:flex;align-items:center;gap:12px;}
          .logo{width:60px;height:60px;background:white;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:8px;}
          .logo img{width:100%;height:100%;object-fit:contain;}
          .company-info .brand{font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.7);margin-bottom:4px;text-transform:uppercase;}
          .company-info h1{color:white;font-size:22px;margin-bottom:2px;}
          .company-info p{color:rgba(255,255,255,0.85);font-size:12px;}
          .invoice-title{text-align:right;}
          .invoice-title h2{color:white;font-size:32px;font-weight:600;margin-bottom:8px;}
          .invoice-title p{color:rgba(255,255,255,0.85);font-size:13px;}
          .invoice-content{padding:40px;}
          .details-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #e5eae8;}
          .bill-to h3,.invoice-details h3{font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;}
          .bill-to p{color:#0f172a;font-size:14px;margin-bottom:4px;}
          .detail-row{display:flex;justify-content:space-between;margin-bottom:10px;}
          .detail-row .label{color:#64748b;font-size:13px;}
          .detail-row .value{color:#0f172a;font-weight:500;font-size:13px;}
          .invoice-table{width:100%;border-collapse:collapse;margin-bottom:30px;}
          .invoice-table th{text-align:left;padding:12px 0;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;border-bottom:1px solid #e5eae8;}
          .invoice-table td{padding:16px 0;border-bottom:1px solid #e5eae8;color:#0f172a;font-size:14px;}
          .invoice-table td:last-child,.invoice-table th:last-child{text-align:right;}
          .totals{display:flex;justify-content:flex-end;margin-bottom:30px;}
          .totals-box{width:300px;}
          .totals-row{display:flex;justify-content:space-between;padding:8px 0;}
          .totals-row.total{border-top:2px solid #e5eae8;margin-top:8px;padding-top:16px;font-size:18px;font-weight:700;}
          .totals-row.total .value{color:#0d9e75;font-size:22px;}
          .payment-info{background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:30px;border:1px solid #e5eae8;}
          .payment-info h4{font-size:12px;font-weight:600;color:#0f172a;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;}
          .payment-methods{display:flex;gap:20px;flex-wrap:wrap;}
          .payment-badge{display:flex;align-items:center;gap:8px;font-size:12px;color:#475569;}
          .invoice-footer{background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5eae8;}
          .invoice-footer .thankyou{color:#0d9e75;font-weight:600;font-size:14px;margin-bottom:8px;}
          .invoice-footer p{color:#7a918b;font-size:11px;margin-bottom:4px;}
          @media print{body{background:white;padding:0;margin:0;}.invoice{box-shadow:none;border-radius:0;}.invoice-header{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none;}@page{size:A4;margin:0;}}
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="invoice-header">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo"><img src="${logoUrl}" alt="eALIF Team" /></div>
                <div class="company-info">
                  <div class="brand">eALIF TEAM</div>
                  <h1>Daryeel App — Multi-Clinic Dental SaaS Platform</h1>
                  <p>Complete Practice Management Solution</p>
                </div>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>${inv.invoice_number}</p>
              </div>
            </div>
          </div>
          <div class="invoice-content">
            <div class="details-grid">
              <div class="bill-to">
                <h3>Bill To</h3>
                <p><strong>${inv.clinic_name || 'N/A'}</strong></p>
              </div>
              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <div class="detail-row"><span class="label">Invoice Date:</span><span class="value">${new Date(inv.created_at).toLocaleDateString()}</span></div>
                <div class="detail-row"><span class="label">Due Date:</span><span class="value">${new Date(new Date(inv.created_at).getTime() + 30*86400000).toLocaleDateString()}</span></div>
                <div class="detail-row"><span class="label">Status:</span><span class="value" style="color:#0d9e75;">${inv.status || 'Paid'}</span></div>
              </div>
            </div>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${inv.plan || inv.plan_name} Plan - Monthly Subscription</td>
                  <td>1</td>
                  <td style="text-align:right">$${amount}</td>
                  <td style="text-align:right">$${amount}</td>
                </tr>
              </tbody>
            </table>
            <div class="totals">
              <div class="totals-box">
                <div class="totals-row"><span>Subtotal</span><span>$${amount}</span></div>
                <div class="totals-row"><span>Tax (0%)</span><span>$0.00</span></div>
                <div class="totals-row total"><span>Total</span><span class="value">$${amount}</span></div>
              </div>
            </div>
            <div class="payment-info">
              <h4>Accepted Payment Methods</h4>
              <div class="payment-methods">
                <div class="payment-badge">● Credit / Debit Card</div>
                <div class="payment-badge">● Bank Transfer</div>
                <div class="payment-badge">● Mobile Money</div>
              </div>
            </div>
          </div>
          <div class="invoice-footer">
            <div class="thankyou">Thank you for choosing eALIF Team Suite</div>
            <p>Daryeel App — Multi-Clinic Dental SaaS Platform — Secure Practice Management</p>
            <p>© ${new Date().getFullYear()} eALIF Team. All rights reserved.</p>
          </div>
        </div>
        <div style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 24px; background:#0d9e75; color:white; border:none; border-radius:8px; cursor:pointer; margin-right:10px;">Print Invoice</button>
          <button onclick="window.close()" style="padding:10px 24px; background:#f0f2f1; color:#475569; border:1px solid #e5eae8; border-radius:8px; cursor:pointer;">Close</button>
        </div>
      </body>
      </html>
    `);
    win?.document.close();
  };

  const filtered = useMemo(() => {
    let filtered = invoices;
    if (search) {
      filtered = filtered.filter(i => 
        i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        i.clinic_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(i => (i.status || 'paid').toLowerCase() === statusFilter);
    }
    return filtered;
  }, [invoices, search, statusFilter]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter(i => (i.status || 'paid') === 'paid').reduce((sum, i) => sum + (i.amount_paid || i.amount || 0), 0);
  const totalOpen = invoices.filter(i => (i.status || 'paid') === 'open').reduce((sum, i) => sum + (i.amount_paid || i.amount || 0), 0);
  const overdueCount = invoices.filter(i => (i.status || 'paid') === 'overdue').length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.teal, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>Invoices</h1>
          <p style={{ fontSize: 13, color: C.muted }}>All invoices issued to clinics on the platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Receipt} label="Total Invoices" value={totalInvoices} subtext="All time invoices" color={C.blue} bg={C.blueBg} />
        <StatCard icon={CheckCircle2} label="Paid This Month" value={`$${formatAmount(totalPaid)}`} subtext="100% collected" color={C.teal} bg={C.tealBg} />
        <StatCard icon={Clock} label="Open Invoices" value={`$${formatAmount(totalOpen)}`} subtext="Awaiting payment" color={C.orange} bg={C.orangeBg} />
        <StatCard icon={AlertCircle} label="Overdue" value={overdueCount} subtext="Need attention" color={C.red} bg={C.redBg} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.faint }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by invoice # or clinic..."
            style={{
              width: '100%', height: 38, padding: '0 12px 0 34px',
              border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg,
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={e => e.currentTarget.style.borderColor = C.teal}
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
            { value: "paid", label: "Paid", color: C.teal },
            { value: "open", label: "Open", color: C.orange },
            { value: "overdue", label: "Overdue", color: C.red },
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
              <p style={{ fontSize: 14, color: C.muted }}>No invoices found</p>
              <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>Try adjusting your search or filter</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Invoice #</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Clinic</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Plan</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.muted }}>Amount</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Issued</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Due Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.muted }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.muted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((inv, idx) => {
                  const status = inv.status || 'paid';
                  const statusVariant = status === 'paid' ? 'success' : status === 'open' ? 'warning' : 'error';
                  const planVariant = inv.plan === 'Enterprise' ? 'purple' : inv.plan === 'Pro' ? 'success' : 'info';
                  const isDelinquent = status === 'overdue';
                  
                  return (
                    <tr 
                      key={inv.id} 
                      style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${C.border}` : "none", transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, fontFamily: "monospace", color: C.teal }}>{inv.invoice_number}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{inv.clinic_name || '-'}</td>
                      <td style={{ padding: "12px 16px" }}><Badge label={inv.plan || 'N/A'} variant={planVariant as any} /></td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>${formatAmount(inv.amount_paid || inv.amount)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: isDelinquent ? C.red : C.muted, fontWeight: isDelinquent ? 600 : 400 }}>
                        {new Date(new Date(inv.created_at).getTime() + 30*86400000).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}><Badge label={status} variant={statusVariant} /></td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={() => handlePrintInvoice(inv)} style={{ background: C.bgMuted, border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: C.teal, transition: 'all 0.2s' }} title="Print Invoice">
                            <Eye size={14} />
                          </button>
                          {status !== 'paid' && (
                            <button onClick={() => handleSendReminder(inv)} style={{ background: C.bgMuted, border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: C.orange, transition: 'all 0.2s' }} title="Send Reminder">
                              <Send size={14} />
                            </button>
                          )}
                        </div>
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
    </div>
  );
}