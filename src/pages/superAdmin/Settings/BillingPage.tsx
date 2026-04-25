import { useState, useEffect, useMemo } from "react";
import {
  CreditCard, CheckCircle2, DollarSign, Users, TrendingUp,
  Search, Printer, XCircle, ChevronLeft, ChevronRight,
  Calendar, AlertCircle, Building2, Clock, Shield,
  FileText, CreditCard as CardIcon, Wallet, Eye,
  Download, RefreshCw, Star, AlertTriangle as AlertIcon,
  Smartphone
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/app/store";

// Design tokens
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
  red: "#e53e3e",
  redBg: "#fff5f5",
  redText: "#c53030",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1d4ed8",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  purpleText: "#5b21b6",
  orange: "#f59e0b",
  orangeBg: "#fffbeb",
  orangeText: "#92400e",
};

const FALLBACK_PLANS = [
  { id: 1, name: "Starter", price: 49, clinicLimit: 1, color: C.blue, bg: C.blueBg, features: ["1 clinic", "3 staff/clinic", "100 appts/month", "1GB storage"] },
  { id: 2, name: "Pro", price: 299, clinicLimit: 5, color: C.teal, bg: C.tealBg, features: ["5 clinics", "10 staff/clinic", "500 appts/month", "10GB storage", "Priority support"], popular: true },
  { id: 3, name: "Enterprise", price: 999, clinicLimit: 999, color: C.purple, bg: C.purpleBg, features: ["Unlimited clinics", "Unlimited staff", "Unlimited appts", "100GB storage", "24/7 support", "API access"] },
];

const PAYMENT_METHODS = [
  { id: "card", name: "Credit Card", icon: CardIcon, fields: ["cardNumber", "expiry", "cvv"] },
  { id: "bank", name: "Bank Transfer", icon: Wallet, fields: ["accountNumber", "routingNumber"] },
  { id: "mobile", name: "Mobile Money", icon: Smartphone, fields: ["phoneNumber"] }
];

function Badge({ label, color }: { label: string; color: "green" | "red" | "blue" | "gray" | "purple" | "orange" }) {
  const colors = {
    green: { bg: C.tealBg, text: C.tealText },
    red: { bg: C.redBg, text: C.redText },
    blue: { bg: C.blueBg, text: C.blueText },
    purple: { bg: C.purpleBg, text: C.purpleText },
    orange: { bg: C.orangeBg, text: C.orangeText },
    gray: { bg: C.bgMuted, text: C.muted },
  };
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: colors[color].bg, color: colors[color].text }}>{label}</span>;
}

function StatCard({ label, value, subtext, icon: Icon, color, bg }: any) {
  return (
    <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 4 }}>{value}</p>
      {subtext && <p style={{ fontSize: 11, color: C.faint }}>{subtext}</p>}
    </div>
  );
}

const formatAmount = (amount: any): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const apiFetch = async (endpoint: string, token: string, options?: RequestInit) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const res = await fetch(`${baseUrl}/api/v1/admin${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
    
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 2000));
      return apiFetch(endpoint, token, options);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`API Error ${endpoint}:`, err);
    return null;
  }
};

export default function AdminBillingPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) return;
      try {
        const [plansData, subsData, mySubData] = await Promise.all([
          apiFetch('/plans', token),
          apiFetch('/subscriptions', token),
          apiFetch('/my-subscription', token)
        ]);

        setPlans(plansData?.plans?.length ? plansData.plans : FALLBACK_PLANS);
        
        const subs = (subsData?.subscriptions || []).map((s: any) => ({
          ...s,
          amount: parseFloat(String(s.amount || '0'))
        }));
        setSubscriptions(subs);
        setCurrentPlan(mySubData?.subscription || subs.find((s: any) => s.status === 'active') || null);
      } catch (err) {
        console.error('Failed to fetch:', err);
        setPlans(FALLBACK_PLANS);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [token]);

  const handleSubscribe = async (planId: number) => {
    setActionLoading(true);
    try {
      const plan = plans.find(p => p.id === planId) || FALLBACK_PLANS.find(p => p.id === planId);
      await apiFetch('/subscriptions/subscribe', token!, { method: 'POST', body: JSON.stringify({ plan_id: planId }) });
      toast.success(`Subscribed to ${plan?.name}!`);
      const [mySubData, subsData] = await Promise.all([
        apiFetch('/my-subscription', token!),
        apiFetch('/subscriptions', token!)
      ]);
      setCurrentPlan(mySubData?.subscription || null);
      setSubscriptions(subsData?.subscriptions || []);
      setShowUpgradeModal(false);
    } catch (err) {
      toast.error('Failed to subscribe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = (plan: any) => {
    setSelectedPlanForUpgrade(plan);
    setShowUpgradeModal(true);
  };

  const handleCancel = async (subId: number) => {
    if (!confirm('Cancel your subscription?')) return;
    setActionLoading(true);
    try {
      await apiFetch(`/subscriptions/${subId}/cancel`, token!, { method: 'POST' });
      toast.success('Subscription cancelled');
      setCurrentPlan(null);
      const data = await apiFetch('/subscriptions', token!);
      setSubscriptions(data?.subscriptions || []);
    } catch {
      toast.error('Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintInvoice = (sub: any) => {
    const amount = formatAmount(sub.amount);
    const invoiceNumber = `INV-${sub.id || Math.floor(Math.random() * 10000)}-${Date.now()}`;
    const logoUrl = `${window.location.origin}/icon.png`;
    const win = window.open('', '_blank');
    
    win?.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice | ${sub.clinic_name || 'Dental Clinic'}</title>
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
          .print-actions{text-align:center;margin-top:20px;padding:20px;}
          .print-btn,.close-btn{padding:12px 32px;font-size:14px;font-weight:600;border:none;border-radius:10px;cursor:pointer;margin:0 8px;}
          .print-btn{background:#0d9e75;color:white;}
          .close-btn{background:#f0f2f1;color:#475569;border:1px solid #e5eae8;}
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
                <p>${invoiceNumber}</p>
              </div>
            </div>
          </div>
          <div class="invoice-content">
            <div class="details-grid">
              <div class="bill-to">
                <h3>Bill To</h3>
                <p><strong>${sub.clinic_name || user?.fullName || 'N/A'}</strong></p>
                ${user?.email ? `<p>${user.email}</p>` : ''}
              </div>
              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <div class="detail-row"><span class="label">Invoice Date:</span><span class="value">${new Date().toLocaleDateString()}</span></div>
                <div class="detail-row"><span class="label">Due Date:</span><span class="value">${new Date(Date.now() + 30*86400000).toLocaleDateString()}</span></div>
                <div class="detail-row"><span class="label">Status:</span><span class="value" style="color:#0d9e75;">Paid</span></div>
              </div>
            </div>
            <table class="invoice-table">
              <thead><tr><th>Description</th><th>Quantity</th><th>Amount</th></tr></thead>
              <tbody><tr><td>${sub.plan_name} Plan - Monthly Subscription</td><td>1</td><td>$${amount}</td><td>$${amount}</td></tr></tbody>
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
        <div class="print-actions no-print">
          <button class="print-btn" onclick="window.print()">Print Invoice</button>
          <button class="close-btn" onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `);
    win?.document.close();
  };

  const getDaysRemaining = () => {
    if (!currentPlan?.renewal_date) return 15;
    const renewal = new Date(currentPlan.renewal_date);
    const diff = Math.ceil((renewal.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const filtered = useMemo(() => {
    let filtered = [...subscriptions];
    if (searchTerm) filtered = filtered.filter(s => s.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== "all") filtered = filtered.filter(s => s.status === statusFilter);
    if (planFilter !== "all") filtered = filtered.filter(s => s.plan_name?.toLowerCase() === planFilter.toLowerCase());
    return filtered;
  }, [subscriptions, searchTerm, statusFilter, planFilter]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const totalMRR = subscriptions.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const avgValue = activeCount ? Math.round(totalMRR / activeCount) : 0;
  const overdueCount = subscriptions.filter(s => s.status === 'overdue' || s.status === 'past_due').length;
  const daysRemaining = getDaysRemaining();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.teal, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>Plans & Billing</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Manage subscriptions and view invoices</p>
        </div>
        <button 
          onClick={() => navigate('/admin/billing/history')} 
          style={{ padding: "8px 20px", background: C.bgMuted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FileText size={14} /> View Billing History
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Monthly Revenue" value={`$${totalMRR.toLocaleString()}`} subtext={`${activeCount} active`} icon={DollarSign} color={C.teal} bg={C.tealBg} />
        <StatCard label="Active Subscriptions" value={activeCount} subtext="Paying clinics" icon={Users} color={C.blue} bg={C.blueBg} />
        <StatCard label="Avg Plan Value" value={`$${avgValue}`} subtext="per clinic" icon={TrendingUp} color={C.purple} bg={C.purpleBg} />
        <StatCard label="Clinics Used" value={`${subscriptions.length} / ${currentPlan?.clinic_limit || currentPlan?.planDetails?.clinicLimit || 1}`} subtext="of your plan limit" icon={Building2} color={C.orange} bg={C.orangeBg} />
      </div>

      {/* Current Plan Banner */}
      {currentPlan && (
        <div style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: C.tealBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={24} color={C.teal} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Badge label="ACTIVE PLAN" color="green" />
                  <span style={{ fontSize: 11, color: C.muted }}>•</span>
                  <span style={{ fontSize: 11, color: C.muted }}>Renews in {daysRemaining} days</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{currentPlan.plan_name || currentPlan.name} Plan</h2>
                <p style={{ fontSize: 13, color: C.muted }}>${currentPlan.price_monthly || currentPlan.price || currentPlan.amount}/month • Up to {currentPlan.clinic_limit || currentPlan.planDetails?.clinicLimit || 1} clinics</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleCancel(currentPlan.id)} disabled={actionLoading} style={{ padding: "8px 20px", background: C.redBg, color: C.redText, border: `1px solid ${C.redBorder}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Cancel Plan</button>
              <button onClick={() => setShowUpgradeModal(true)} style={{ padding: "8px 20px", background: C.teal, color: "white", border: "none", borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Upgrade Plan</button>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.muted }}>Subscription Period</span>
              <span style={{ fontSize: 11, color: C.muted }}>{daysRemaining} days remaining</span>
            </div>
            <div style={{ height: 6, background: C.bgMuted, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(30 - daysRemaining) / 30 * 100}%`, height: "100%", background: C.teal, borderRadius: 3 }} />
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Available Plans</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {plans.map((plan: any) => {
            const isCurrent = currentPlan?.plan_name === plan.name || currentPlan?.name === plan.name;
            const features = Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : []);
            const clinicLimit = plan.clinic_limit || plan.clinicLimit;
            return (
              <div key={plan.id} style={{ background: C.bg, borderRadius: 14, border: `2px solid ${plan.popular ? C.teal : C.border}`, overflow: 'hidden', position: 'relative' }}>
                {plan.popular && <div style={{ background: C.teal, padding: '4px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'white' }}>⭐ MOST POPULAR</div>}
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>${plan.price}</span>
                    <span style={{ fontSize: 13, color: C.muted }}>/month</span>
                    <p style={{ fontSize: 11, color: plan.popular ? C.teal : C.muted, marginTop: 4 }}>Up to {clinicLimit || 1} clinics</p>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    {(features || []).slice(0, 5).map((f: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <CheckCircle2 size={12} color={plan.popular ? C.teal : C.blue} />
                        <span style={{ fontSize: 12, color: C.muted }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => isCurrent ? null : handleUpgrade(plan)} disabled={isCurrent || actionLoading} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: isCurrent ? C.bgMuted : C.teal, color: isCurrent ? C.muted : 'white', fontWeight: 600, fontSize: 13, cursor: isCurrent ? 'default' : 'pointer' }}>
                    {isCurrent ? 'Current Plan' : actionLoading ? 'Processing...' : 'Upgrade'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>All Subscriptions</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", background: C.bgMuted, borderRadius: 8 }}>
              <Search size={14} color={C.muted} />
              <input type="text" placeholder="Search clinic..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: "none", border: "none", outline: "none", fontSize: 12, width: 150 }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12 }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="canceled">Canceled</option>
            </select>
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12 }}>
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Clinic</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Plan</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted }}>Status</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.muted }}>Amount</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.muted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((sub, idx) => {
                const statusColor = sub.status === 'active' ? 'green' : sub.status === 'trialing' ? 'orange' : 'red';
                const planColor = sub.plan_name === 'Enterprise' ? 'purple' : sub.plan_name === 'Pro' ? 'green' : 'blue';
                return (
                  <tr key={sub.id} style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{sub.clinic_name}</td>
                    <td style={{ padding: "12px 16px" }}><Badge label={sub.plan_name} color={planColor as any} /></td>
                    <td style={{ padding: "12px 16px" }}><Badge label={sub.status} color={statusColor as any} /></td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>${formatAmount(sub.amount)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button onClick={() => handlePrintInvoice(sub)} style={{ background: C.bgMuted, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }} title="Print Invoice">
                          <Printer size={12} color={C.muted} />
                        </button>
                        <button onClick={() => handleCancel(sub.id)} disabled={actionLoading} style={{ background: C.bgMuted, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }} title="Cancel">
                          <XCircle size={12} color={C.red} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.muted }}>{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer' }}><ChevronLeft size={12} /></button>
              <span style={{ padding: "4px 10px", fontSize: 12 }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer' }}><ChevronRight size={12} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlanForUpgrade && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={() => setShowUpgradeModal(false)}>
          <div style={{ background: C.bg, borderRadius: 20, maxWidth: 500, width: "90%", padding: 28, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: C.tealBg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CreditCard size={26} color={C.teal} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Upgrade to {selectedPlanForUpgrade.name}</h2>
              <p style={{ fontSize: 13, color: C.muted }}>${selectedPlanForUpgrade.price}/month • Up to {selectedPlanForUpgrade.clinic_limit || selectedPlanForUpgrade.clinicLimit} clinics</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>PAYMENT METHOD</p>
              <div style={{ display: "flex", gap: 12 }}>
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 10, border: paymentMethod === method.id ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                      background: paymentMethod === method.id ? C.tealBg : C.bg, cursor: "pointer"
                    }}
                  >
                    <method.icon size={20} color={paymentMethod === method.id ? C.teal : C.muted} style={{ margin: "0 auto 4px", display: "block" }} />
                    <span style={{ fontSize: 11, color: paymentMethod === method.id ? C.teal : C.muted }}>{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "card" && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>CARD DETAILS</p>
                <input type="text" placeholder="Card Number" style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 10, fontSize: 13 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" placeholder="MM/YY" style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13 }} />
                  <input type="text" placeholder="CVC" style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13 }} />
                </div>
              </div>
            )}

            <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Plan Price</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>${selectedPlanForUpgrade.price}/month</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Tax (0%)</span>
                <span style={{ fontSize: 12 }}>$0</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>${selectedPlanForUpgrade.price}</span>
              </div>
            </div>

            <button onClick={() => handleSubscribe(selectedPlanForUpgrade.id)} disabled={actionLoading} style={{ width: "100%", padding: "12px", background: C.teal, color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
              {actionLoading ? "Processing..." : `Confirm Upgrade to ${selectedPlanForUpgrade.name}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}