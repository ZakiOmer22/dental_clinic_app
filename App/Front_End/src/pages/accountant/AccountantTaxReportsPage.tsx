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
  ArrowUp, ArrowDown, Minus, Phone, Mail, MapPin, Calculator,
  ReceiptText, FileSpreadsheet, Building, Banknote, Landmark as LandmarkIcon
} from "lucide-react";
import { apiGetInvoices } from "@/api/billing";
import { apiGetExpenses } from "@/api/expenses";
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

const TAX_RATES = [
  { value: 0, label: "No Tax", rate: 0 },
  { value: 5, label: "5% VAT", rate: 5 },
  { value: 8, label: "8% Sales Tax", rate: 8 },
  { value: 10, label: "10% VAT", rate: 10 },
  { value: 15, label: "15% VAT", rate: 15 },
  { value: 18, label: "18% VAT", rate: 18 }
];

// Helper to safely parse numbers
const safeParseNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

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

// ─── Tax Summary Card ─────────────────────────────────────────────────────────
function TaxSummaryCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", transition: "all 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{title}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{value}</p>
      <p style={{ fontSize: 10, color: C.faint }}>{subtitle}</p>
    </div>
  );
}

// ─── Tax Period Selector ──────────────────────────────────────────────────────
function TaxPeriodSelector({ period, setPeriod, year, setYear, quarter, setQuarter, month, setMonth }: any) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  const quarters = [
    { value: 1, label: "Q1 (Jan-Mar)" },
    { value: 2, label: "Q2 (Apr-Jun)" },
    { value: 3, label: "Q3 (Jul-Sep)" },
    { value: 4, label: "Q4 (Oct-Dec)" }
  ];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Period Type</label>
        <div style={{ display: "flex", gap: 4, background: C.bgMuted, borderRadius: 8, padding: 2 }}>
          {[
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "annual", label: "Annual" }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
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
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Year</label>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{
          height: 36,
          padding: "0 12px",
          border: `1.5px solid ${C.border}`,
          borderRadius: 8,
          fontSize: 13,
          background: C.bg,
          cursor: "pointer"
        }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {period === "quarterly" && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Quarter</label>
          <select value={quarter} onChange={e => setQuarter(parseInt(e.target.value))} style={{
            height: 36,
            padding: "0 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: C.bg,
            cursor: "pointer"
          }}>
            {quarters.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
          </select>
        </div>
      )}

      {period === "monthly" && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Month</label>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{
            height: 36,
            padding: "0 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: C.bg,
            cursor: "pointer"
          }}>
            {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantTaxReportsPage() {
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedTaxRate, setSelectedTaxRate] = useState<number | "all">("all");

  // Fetch invoices
  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({})
  });

  // Fetch expenses
  const { data: expensesData } = useQuery({
    queryKey: ["expenses", "all"],
    queryFn: () => apiGetExpenses({})
  });

  const invoices = invoicesData?.data || [];
  const expenses = expensesData?.data || [];

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    let startDate: Date;
    let endDate: Date;
    
    if (period === "monthly") {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else if (period === "quarterly") {
      const startMonth = (quarter - 1) * 3;
      startDate = new Date(year, startMonth, 1);
      endDate = new Date(year, startMonth + 3, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }
    
    return { startDate, endDate };
  }, [period, year, quarter, month]);

  // Calculate tax data
  const taxData = useMemo(() => {
    // Filter invoices by date range
    const filteredInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate >= dateRange.startDate && invDate <= dateRange.endDate;
    });

    // Calculate totals by tax rate
    const taxBreakdown: Record<number, { subtotal: number; taxAmount: number; count: number }> = {};
    
    TAX_RATES.forEach(rate => {
      taxBreakdown[rate.value] = { subtotal: 0, taxAmount: 0, count: 0 };
    });

    let totalRevenue = 0;
    let totalTaxCollected = 0;
    let totalTaxableRevenue = 0;

    filteredInvoices.forEach(inv => {
      const taxRate = safeParseNumber(inv.tax_percent);
      const subtotal = safeParseNumber(inv.subtotal);
      const taxAmount = safeParseNumber(inv.tax_amount);
      const totalAmount = safeParseNumber(inv.total_amount);
      
      if (taxBreakdown[taxRate]) {
        taxBreakdown[taxRate].subtotal += subtotal;
        taxBreakdown[taxRate].taxAmount += taxAmount;
        taxBreakdown[taxRate].count += 1;
      }
      
      totalRevenue += totalAmount;
      totalTaxCollected += taxAmount;
      totalTaxableRevenue += subtotal;
    });

    // Calculate tax liability by rate
    const taxLiability = TAX_RATES.map(rate => ({
      rate: rate.value,
      label: rate.label,
      taxableAmount: taxBreakdown[rate.value].subtotal,
      taxAmount: taxBreakdown[rate.value].taxAmount,
      invoiceCount: taxBreakdown[rate.value].count
    })).filter(t => t.taxableAmount > 0 || t.taxAmount > 0);

    // Calculate expenses (tax deductible)
    const filteredExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate >= dateRange.startDate && expDate <= dateRange.endDate;
    });

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + safeParseNumber(exp.amount), 0);
    
    // Estimated tax liability (assuming 30% corporate tax rate on profit)
    const estimatedTaxRate = 0.30;
    const profit = totalRevenue - totalExpenses;
    const estimatedTaxLiability = profit > 0 ? profit * estimatedTaxRate : 0;

    return {
      totalRevenue,
      totalTaxCollected,
      totalTaxableRevenue,
      totalExpenses,
      profit,
      estimatedTaxLiability,
      effectiveTaxRate: totalRevenue > 0 ? (totalTaxCollected / totalRevenue) * 100 : 0,
      taxBreakdown: taxLiability,
      invoiceCount: filteredInvoices.length,
      expenseCount: filteredExpenses.length
    };
  }, [invoices, expenses, dateRange]);

  // Filter tax breakdown by selected rate
  const filteredTaxBreakdown = useMemo(() => {
    if (selectedTaxRate === "all") return taxData.taxBreakdown;
    return taxData.taxBreakdown.filter(t => t.rate === selectedTaxRate);
  }, [taxData.taxBreakdown, selectedTaxRate]);

  const handleExport = () => {
    toast.success("Export feature coming soon");
  };

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = period === "monthly" 
    ? new Date(year, month - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })
    : period === "quarterly"
    ? `Q${quarter} ${year}`
    : `Year ${year}`;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }} className="no-print">
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={24} color={C.purple} /> Tax Reports
            </h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              Calculate and analyze tax liabilities, VAT, and sales tax
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => refetch()} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={handlePrint} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Printer size={13} /> Print
            </button>
            <button onClick={handleExport} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }} className="no-print">
          <TaxPeriodSelector
            period={period}
            setPeriod={setPeriod}
            year={year}
            setYear={setYear}
            quarter={quarter}
            setQuarter={setQuarter}
            month={month}
            setMonth={setMonth}
          />
        </div>

        {/* Report Header (for print) */}
        <div id="print-area">
          <div style={{ textAlign: "center", marginBottom: 24, padding: 20, background: C.bgMuted, borderRadius: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Tax Report</h2>
            <p style={{ fontSize: 13, color: C.muted }}>Period: {periodLabel}</p>
            <p style={{ fontSize: 11, color: C.faint }}>Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {/* Main Tax Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <TaxSummaryCard
              title="Total Revenue"
              value={formatCurrency(taxData.totalRevenue)}
              subtitle={`${taxData.invoiceCount} invoices`}
              icon={DollarSign}
              color={C.green}
              bg={C.greenBg}
            />
            <TaxSummaryCard
              title="Tax Collected"
              value={formatCurrency(taxData.totalTaxCollected)}
              subtitle={`${taxData.effectiveTaxRate.toFixed(1)}% effective rate`}
              icon={Percent}
              color={C.purple}
              bg={C.purpleBg}
            />
            <TaxSummaryCard
              title="Taxable Revenue"
              value={formatCurrency(taxData.totalTaxableRevenue)}
              subtitle="Revenue subject to tax"
              icon={Receipt}
              color={C.blue}
              bg={C.blueBg}
            />
            <TaxSummaryCard
              title="Est. Tax Liability"
              value={formatCurrency(taxData.estimatedTaxLiability)}
              subtitle="Based on 30% corporate rate"
              icon={LandmarkIcon}
              color={C.amber}
              bg={C.amberBg}
            />
          </div>

          {/* Tax Breakdown by Rate */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.bgMuted }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Tax Breakdown by Rate</p>
                <div className="no-print">
                  <select 
                    value={selectedTaxRate} 
                    onChange={e => setSelectedTaxRate(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                    style={{
                      height: 32,
                      padding: "0 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12,
                      background: C.bg,
                      cursor: "pointer"
                    }}
                  >
                    <option value="all">All Tax Rates</option>
                    {TAX_RATES.filter(r => r.rate > 0).map(rate => (
                      <option key={rate.value} value={rate.value}>{rate.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Tax Rate</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Taxable Amount</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Tax Amount</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.faint }}>Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTaxBreakdown.map((item, idx) => (
                    <tr key={item.rate} style={{ borderBottom: idx < filteredTaxBreakdown.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, color: C.purple }}>{item.label}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "right", color: C.text }}>{formatCurrency(item.taxableAmount)}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "right", color: C.teal }}>{formatCurrency(item.taxAmount)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, color: C.muted }}>{item.invoiceCount}</td>
                    </tr>
                  ))}
                  {filteredTaxBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: C.faint }}>No tax data available for this period</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${C.border}`, background: C.bgMuted }}>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: C.text }}>Total</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "right", fontWeight: 700, color: C.text }}>{formatCurrency(taxData.totalTaxableRevenue)}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "right", fontWeight: 700, color: C.teal }}>{formatCurrency(taxData.totalTaxCollected)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: C.text }}>{taxData.invoiceCount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Profit & Loss Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.bgMuted }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Income Statement Summary</p>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Total Revenue</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.greenText }}>{formatCurrency(taxData.totalRevenue)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Total Expenses</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.redText }}>{formatCurrency(taxData.totalExpenses)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Net Profit</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: taxData.profit > 0 ? C.greenText : C.redText }}>
                      {formatCurrency(taxData.profit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.bgMuted }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Tax Summary</p>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Total Tax Collected</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.purple }}>{formatCurrency(taxData.totalTaxCollected)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Estimated Tax Liability</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>{formatCurrency(taxData.estimatedTaxLiability)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Net After Tax</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      {formatCurrency(taxData.profit - taxData.estimatedTaxLiability)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Taxable Transactions */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.bgMuted }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Recent Taxable Transactions</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Invoice #</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Patient</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.faint }}>Date</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Subtotal</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.faint }}>Tax Rate</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Tax Amount</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: C.faint }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices
                    .filter(inv => {
                      const invDate = new Date(inv.created_at);
                      return invDate >= dateRange.startDate && invDate <= dateRange.endDate && safeParseNumber(inv.tax_amount) > 0;
                    })
                    .slice(0, 10)
                    .map((inv, idx) => (
                      <tr key={inv.id} style={{ borderBottom: idx < 9 ? `1px solid ${C.border}` : "none" }}>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: C.purple }}>{inv.invoice_number}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.text }}>{inv.patient_name}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.muted }}>{formatDate(inv.created_at)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "right", color: C.text }}>{formatCurrency(safeParseNumber(inv.subtotal))}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "center", color: C.purple, fontWeight: 600 }}>{safeParseNumber(inv.tax_percent)}%</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "right", color: C.teal }}>{formatCurrency(safeParseNumber(inv.tax_amount))}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "right", fontWeight: 600, color: C.text }}>{formatCurrency(safeParseNumber(inv.total_amount))}</td>
                      </tr>
                    ))}
                  {invoices.filter(inv => {
                    const invDate = new Date(inv.created_at);
                    return invDate >= dateRange.startDate && invDate <= dateRange.endDate && safeParseNumber(inv.tax_amount) > 0;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: C.faint }}>No taxable transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div style={{ padding: "12px 20px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }} className="no-print">
          <span style={{ color: C.muted }}>Period: {periodLabel}</span>
          <div style={{ display: "flex", gap: 24 }}>
            <span>Total Tax Collected: <strong style={{ color: C.purple }}>{formatCurrency(taxData.totalTaxCollected)}</strong></span>
            <span>Effective Tax Rate: <strong style={{ color: C.teal }}>{taxData.effectiveTaxRate.toFixed(1)}%</strong></span>
          </div>
        </div>
      </div>
    </>
  );
}