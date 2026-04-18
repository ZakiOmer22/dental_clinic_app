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
  ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { apiGetInvoices } from "@/api/billing";
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

function getMonthName(date: string) {
  if (!date) return "No Data";
  return new Date(date).toLocaleDateString('en', { month: 'short' });
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
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

// ─── Revenue Chart ────────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: { month: string; collected: number; outstanding: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint }}>
        No data available
      </div>
    );
  }
  
  const max = Math.max(...data.map(d => (d.collected || 0) + (d.outstanding || 0)), 1);
  
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200, padding: "20px 0" }}>
      {data.map((item, idx) => {
        const collected = item.collected || 0;
        const outstanding = item.outstanding || 0;
        const collectedHeight = (collected / max) * 160;
        const outstandingHeight = (outstanding / max) * 160;
        const isLast = idx === data.length - 1;
        
        return (
          <div key={item.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2, justifyContent: "flex-end" }}>
              <div style={{ 
                height: outstandingHeight || 0, 
                background: C.amberBg, 
                border: `1px solid ${C.amberBorder}`,
                borderRadius: "4px 4px 0 0",
                minHeight: outstandingHeight > 0 ? 4 : 0,
                transition: "height 0.3s ease"
              }} />
              <div style={{ 
                height: collectedHeight || 0, 
                background: isLast ? C.teal : C.tealBg,
                border: isLast ? "none" : `1px solid ${C.tealBorder}`,
                borderRadius: outstandingHeight > 0 ? "0" : "4px 4px 0 0",
                minHeight: collectedHeight > 0 ? 4 : 0,
                transition: "height 0.3s ease"
              }} />
            </div>
            <span style={{ fontSize: 10, color: isLast ? C.tealText : C.faint, fontWeight: isLast ? 600 : 400 }}>
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Payment Methods Donut ────────────────────────────────────────────────────
function PaymentMethodsChart({ data }: { data: { method: string; amount: number; color: string }[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint }}>
        No payment data available
      </div>
    );
  }
  
  const total = data.reduce((sum, d) => sum + (d.amount || 0), 0) || 1;
  const r = 35, cx = 40, cy = 40, circ = 2 * Math.PI * r;
  let offset = 0;
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={80} height={80}>
        {data.filter(d => d.amount > 0).map((d, i) => {
          const pct = (d.amount || 0) / total;
          const dash = circ * pct;
          const gap = circ - dash;
          const element = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={10}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-(offset * circ / total) + (circ * 0.25)}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
          offset += d.amount;
          return element;
        })}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fontWeight: 700, fill: C.text }}>
          {Math.round(total)}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.filter(d => d.amount > 0).map(d => (
          <div key={d.method} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: C.muted }}>{d.method.replace(/_/g, " ")}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text, marginLeft: "auto", paddingLeft: 12 }}>
              {formatCurrency(d.amount || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantRevenuePage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Fetch invoices
  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({})
  });

  const invoices = invoicesData?.data || [];

  // Process revenue data
  const revenueData = useMemo(() => {
    // Filter by date range
    const filteredInvoices = invoices.filter(inv => {
      const invDate = inv.created_at?.split('T')[0];
      return invDate >= dateRange.from && invDate <= dateRange.to;
    });

    // SAFELY parse numbers
    const totalBilled = filteredInvoices.reduce((sum, inv) => sum + safeParseNumber(inv.total_amount), 0);
    const totalCollected = filteredInvoices.reduce((sum, inv) => sum + safeParseNumber(inv.paid_amount), 0);
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // Group by month for chart
    const monthlyData: Record<string, { collected: number; outstanding: number }> = {};
    filteredInvoices.forEach(inv => {
      if (inv.created_at) {
        const month = getMonthName(inv.created_at);
        if (!monthlyData[month]) {
          monthlyData[month] = { collected: 0, outstanding: 0 };
        }
        monthlyData[month].collected += safeParseNumber(inv.paid_amount);
        monthlyData[month].outstanding += safeParseNumber(inv.total_amount) - safeParseNumber(inv.paid_amount);
      }
    });

    let chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      collected: data.collected,
      outstanding: data.outstanding
    })).slice(-6);

    if (chartData.length === 0) {
      chartData = [{ month: formatDate(new Date().toISOString()), collected: 0, outstanding: 0 }];
    }

    // Payment methods breakdown
    const paymentMethods: Record<string, { amount: number; color: string }> = {
      cash: { amount: 0, color: C.teal },
      card: { amount: 0, color: C.blue },
      mobile_money: { amount: 0, color: C.purple },
      bank_transfer: { amount: 0, color: C.green },
      insurance: { amount: 0, color: C.amber },
      cheque: { amount: 0, color: C.red },
      other: { amount: 0, color: C.gray }
    };

    filteredInvoices.forEach(inv => {
      if (safeParseNumber(inv.paid_amount) > 0 && inv.payment_method) {
        const method = inv.payment_method;
        if (paymentMethods[method]) {
          paymentMethods[method].amount += safeParseNumber(inv.paid_amount);
        }
      }
    });

    const methodsData = Object.entries(paymentMethods)
      .filter(([, data]) => data.amount > 0)
      .map(([method, data]) => ({ method, amount: data.amount, color: data.color }));

    // Period trends
    const now = new Date();
    let currentPeriodData = { total: 0, count: 0 };
    let previousPeriodData = { total: 0, count: 0 };

    if (period === "week") {
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      
      filteredInvoices.forEach(inv => {
        const invDate = new Date(inv.created_at);
        const paidAmount = safeParseNumber(inv.paid_amount);
        if (invDate >= currentStart) {
          currentPeriodData.total += paidAmount;
          currentPeriodData.count++;
        } else if (invDate >= previousStart) {
          previousPeriodData.total += paidAmount;
          previousPeriodData.count++;
        }
      });
    } else if (period === "month") {
      const currentStart = new Date(now);
      currentStart.setMonth(currentStart.getMonth() - 1);
      const previousStart = new Date(currentStart);
      previousStart.setMonth(previousStart.getMonth() - 1);
      
      filteredInvoices.forEach(inv => {
        const invDate = new Date(inv.created_at);
        const paidAmount = safeParseNumber(inv.paid_amount);
        if (invDate >= currentStart) {
          currentPeriodData.total += paidAmount;
          currentPeriodData.count++;
        } else if (invDate >= previousStart) {
          previousPeriodData.total += paidAmount;
          previousPeriodData.count++;
        }
      });
    } else {
      const currentStart = new Date(now);
      currentStart.setFullYear(currentStart.getFullYear() - 1);
      const previousStart = new Date(currentStart);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      
      filteredInvoices.forEach(inv => {
        const invDate = new Date(inv.created_at);
        const paidAmount = safeParseNumber(inv.paid_amount);
        if (invDate >= currentStart) {
          currentPeriodData.total += paidAmount;
          currentPeriodData.count++;
        } else if (invDate >= previousStart) {
          previousPeriodData.total += paidAmount;
          previousPeriodData.count++;
        }
      });
    }

    const trend = previousPeriodData.total > 0 
      ? ((currentPeriodData.total - previousPeriodData.total) / previousPeriodData.total) * 100 
      : 0;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate,
      chartData,
      paymentMethods: methodsData,
      currentPeriod: currentPeriodData,
      previousPeriod: previousPeriodData,
      trend,
      invoiceCount: filteredInvoices.length,
      paidCount: filteredInvoices.filter(inv => inv.status === "paid").length,
      partialCount: filteredInvoices.filter(inv => inv.status === "partial").length,
      unpaidCount: filteredInvoices.filter(inv => inv.status === "unpaid").length
    };
  }, [invoices, dateRange, period]);

  const handlePeriodChange = (newPeriod: "week" | "month" | "year") => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === "week") {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      setDateRange({
        from: from.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      });
    } else if (newPeriod === "month") {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 1);
      setDateRange({
        from: from.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      });
    } else {
      const from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      setDateRange({
        from: from.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleExport = () => {
    toast.success("Export feature coming soon");
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .stat-card:hover{transform:translateY(-2px);transition:all 0.2s ease}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={24} color={C.teal} /> Revenue Analytics
            </h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              Track revenue, collections, and financial performance
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", gap: 4, background: C.bgMuted, borderRadius: 8, padding: 2 }}>
              {[
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "year", label: "Year" }
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => handlePeriodChange(p.value as any)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    background: period === p.value ? C.teal : "transparent",
                    color: period === p.value ? "white" : C.muted,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={() => refetch()} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={handleExport} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Total Revenue", value: formatCurrency(revenueData.totalCollected), icon: DollarSign, color: C.teal, bg: C.tealBg, trend: revenueData.trend, sub: `${revenueData.paidCount} paid invoices` },
            { label: "Outstanding", value: formatCurrency(revenueData.totalOutstanding), icon: Clock, color: C.amber, bg: C.amberBg, trend: null, sub: `${revenueData.unpaidCount} unpaid` },
            { label: "Collection Rate", value: `${revenueData.collectionRate.toFixed(1)}%`, icon: Target, color: C.blue, bg: C.blueBg, trend: null, sub: `${revenueData.partialCount} partial` },
            { label: "Total Billed", value: formatCurrency(revenueData.totalBilled), icon: Receipt, color: C.purple, bg: C.purpleBg, trend: null, sub: `${revenueData.invoiceCount} invoices` }
          ].map(k => (
            <div key={k.label} className="stat-card" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{k.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <k.icon size={16} color={k.color} />
                </div>
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{k.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {k.trend !== null && (
                  <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: k.trend >= 0 ? C.green : C.red }}>
                    {k.trend >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(k.trend).toFixed(1)}%
                  </span>
                )}
                <span style={{ fontSize: 10, color: C.faint }}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trend Card */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Revenue Trend</p>
              <p style={{ fontSize: 11, color: C.muted }}>Comparison with previous {period}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: C.teal }} />
                <span style={{ fontSize: 10, color: C.muted }}>Current</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: C.amber }} />
                <span style={{ fontSize: 10, color: C.muted }}>Previous</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{formatCurrency(revenueData.currentPeriod.total)}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{revenueData.currentPeriod.count} transactions</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {revenueData.trend > 0 ? (
                <ArrowUp size={16} color={C.green} />
              ) : revenueData.trend < 0 ? (
                <ArrowDown size={16} color={C.red} />
              ) : (
                <Minus size={16} color={C.muted} />
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: revenueData.trend > 0 ? C.green : revenueData.trend < 0 ? C.red : C.muted }}>
                {Math.abs(revenueData.trend).toFixed(1)}%
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>vs previous {period}</span>
            </div>
          </div>
          <div style={{ marginTop: 16, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${Math.min((revenueData.currentPeriod.total / (revenueData.previousPeriod.total || 1)) * 100, 100)}%`,
              height: 4,
              background: revenueData.trend > 0 ? C.teal : C.red,
              borderRadius: 2
            }} />
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
          {/* Revenue Chart */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Revenue Overview</p>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: C.teal, display: "inline-block" }} />
                  <span style={{ fontSize: 10, color: C.muted }}>Collected</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: C.amberBg, border: `1px solid ${C.amberBorder}`, display: "inline-block" }} />
                  <span style={{ fontSize: 10, color: C.muted }}>Outstanding</span>
                </div>
              </div>
            </div>
            <RevenueChart data={revenueData.chartData} />
          </div>

          {/* Payment Methods */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 12 }}>Payment Methods</p>
            <PaymentMethodsChart data={revenueData.paymentMethods} />
          </div>
        </div>

        {/* Revenue Breakdown by Status */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 16 }}>Revenue Breakdown</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ textAlign: "center", padding: "12px", background: C.greenBg, borderRadius: 10 }}>
              <CheckCircle size={20} color={C.green} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 11, color: C.muted }}>Paid</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.greenText }}>{formatCurrency(revenueData.totalCollected)}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{revenueData.paidCount} invoices</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: C.amberBg, borderRadius: 10 }}>
              <Clock size={20} color={C.amber} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 11, color: C.muted }}>Partial</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.amberText }}>{formatCurrency(revenueData.totalBilled - revenueData.totalCollected - revenueData.totalOutstanding)}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{revenueData.partialCount} invoices</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: C.redBg, borderRadius: 10 }}>
              <AlertCircle size={20} color={C.red} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 11, color: C.muted }}>Unpaid</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.redText }}>{formatCurrency(revenueData.totalOutstanding)}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{revenueData.unpaidCount} invoices</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Recent Transactions</p>
            <button onClick={() => window.location.href = "/accountant/invoices/list"} style={{ fontSize: 11, color: C.teal, background: "none", border: "none", cursor: "pointer" }}>
              View All →
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Invoice #</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Patient</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Date</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Amount</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Paid</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Balance</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.faint }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 10).map((inv: any, idx: number) => {
                  const totalAmount = safeParseNumber(inv.total_amount);
                  const paidAmount = safeParseNumber(inv.paid_amount);
                  const balance = totalAmount - paidAmount;
                  return (
                    <tr key={inv.id} style={{ borderBottom: idx < 9 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: C.purple }}>{inv.invoice_number}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.text }}>{inv.patient_name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>{formatDate(inv.created_at)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, textAlign: "right", color: C.text }}>{formatCurrency(totalAmount)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, textAlign: "right", color: C.teal }}>{formatCurrency(paidAmount)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, textAlign: "right", color: balance > 0 ? C.redText : C.greenText }}>{formatCurrency(balance)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600,
                          background: inv.status === "paid" ? C.greenBg : inv.status === "partial" ? C.amberBg : inv.status === "void" ? C.grayBg : C.redBg,
                          color: inv.status === "paid" ? C.greenText : inv.status === "partial" ? C.amberText : inv.status === "void" ? C.gray : C.redText
                        }}>
                          {inv.status || "unpaid"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: C.faint }}>No transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Summary */}
        <div style={{ padding: "12px 20px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: C.muted }}>Period: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}</span>
          <div style={{ display: "flex", gap: 24 }}>
            <span>Collection Rate: <strong style={{ color: C.teal }}>{revenueData.collectionRate.toFixed(1)}%</strong></span>
            <span>Average Transaction: <strong>{formatCurrency(revenueData.invoiceCount ? revenueData.totalCollected / revenueData.invoiceCount : 0)}</strong></span>
          </div>
        </div>
      </div>
    </>
  );
}