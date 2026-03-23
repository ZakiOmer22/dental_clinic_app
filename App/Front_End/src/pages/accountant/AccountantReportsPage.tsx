import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Download, Printer, Calendar, TrendingUp, TrendingDown,
  DollarSign, CreditCard, Receipt, Users, Activity, PieChart,
  BarChart3, LineChart, FileText, ChevronDown, ChevronRight,
  Filter, Search, X, Eye, AlertCircle, CheckCircle2,
  Clock, Wallet, Building2, Percent, CalendarDays,
  DownloadCloud, Share2, RefreshCw, Shield
} from "lucide-react";
import { apiGetReports, apiGetRevenue, apiGetExpenses } from "@/api/reports";
import { apiGetInvoices } from "@/api/invoices";
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
  gray: "#6b7f75",
  grayBg: "#f4f7f5",
};

const REPORT_TYPES = [
  { value: "revenue", label: "Revenue Report", icon: TrendingUp, color: C.teal },
  { value: "expenses", label: "Expense Report", icon: TrendingDown, color: C.red },
  { value: "profit", label: "Profit & Loss", icon: BarChart3, color: C.blue },
  { value: "invoices", label: "Invoices Report", icon: Receipt, color: C.purple },
  { value: "appointments", label: "Appointments Report", icon: Calendar, color: C.amber },
  { value: "procedures", label: "Procedures Report", icon: Activity, color: C.blue },
];

const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

// ─── Components ────────────────────────────────────────────────────────────────
function StatCard({ title, value, change, icon: Icon, color, subtitle }: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  const isPositive = change && change > 0;
  
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "16px",
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={20} color={color} />
        </div>
        {change !== undefined && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 20,
            background: isPositive ? C.tealBg : C.redBg,
          }}>
            {isPositive ? <TrendingUp size={12} color={C.teal} /> : <TrendingDown size={12} color={C.red} />}
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: isPositive ? C.tealText : C.redText,
            }}>
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{value}</p>
      {subtitle && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, children, onDownload }: {
  title: string;
  children: React.ReactNode;
  onDownload?: () => void;
}) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</h3>
        {onDownload && (
          <button
            onClick={onDownload}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Download size={12} color={C.muted} />
            <span style={{ fontSize: 11, color: C.muted }}>Export</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function RevenueChart() {
  const data = [65, 78, 82, 91, 88, 95, 102, 98, 105, 112, 118, 125];
  const max = Math.max(...data);
  
  return (
    <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 8 }}>
      {data.map((value, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%",
            height: `${(value / max) * 160}px`,
            background: C.teal,
            borderRadius: 4,
            transition: "height 0.3s",
          }} />
          <span style={{ fontSize: 9, color: C.muted }}>{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
        </div>
      ))}
    </div>
  );
}

function ExpensePieChart() {
  const categories = [
    { name: "Salaries", value: 45, color: C.blue },
    { name: "Equipment", value: 20, color: C.purple },
    { name: "Supplies", value: 15, color: C.teal },
    { name: "Rent", value: 12, color: C.amber },
    { name: "Marketing", value: 8, color: C.red },
  ];
  
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {categories.reduce((acc, cat, i) => {
            const startAngle = acc.offset;
            const angle = (cat.value / 100) * 360;
            const endAngle = startAngle + angle;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 70 + 60 * Math.cos(startRad);
            const y1 = 70 + 60 * Math.sin(startRad);
            const x2 = 70 + 60 * Math.cos(endRad);
            const y2 = 70 + 60 * Math.sin(endRad);
            const largeArc = angle > 180 ? 1 : 0;
            
            const pathData = `M 70 70 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`;
            acc.paths.push({ path: pathData, color: cat.color });
            acc.offset = endAngle;
            return acc;
          }, { paths: [] as { path: string; color: string }[], offset: 0 }).paths.map((path, i) => (
            <path key={i} d={path.path} fill={path.color} stroke="white" strokeWidth="2" />
          ))}
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        {categories.map(cat => (
          <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: cat.color }} />
            <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{cat.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{cat.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionTable({ transactions }: { transactions: any[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 11, fontWeight: 600, color: C.muted }}>Date</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 11, fontWeight: 600, color: C.muted }}>Patient</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 11, fontWeight: 600, color: C.muted }}>Description</th>
            <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 11, fontWeight: 600, color: C.muted }}>Amount</th>
            <th style={{ textAlign: "center", padding: "12px 8px", fontSize: 11, fontWeight: 600, color: C.muted }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: "12px 8px", fontSize: 12, color: C.text }}>{tx.date}</td>
              <td style={{ padding: "12px 8px", fontSize: 12, color: C.text }}>{tx.patient}</td>
              <td style={{ padding: "12px 8px", fontSize: 12, color: C.muted }}>{tx.description}</td>
              <td style={{ padding: "12px 8px", fontSize: 12, fontWeight: 600, textAlign: "right", color: tx.amount > 0 ? C.teal : C.red }}>
                ${Math.abs(tx.amount).toLocaleString()}
              </td>
              <td style={{ padding: "12px 8px", textAlign: "center" }}>
                <span style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: tx.status === "paid" ? C.tealBg : tx.status === "pending" ? C.amberBg : C.redBg,
                  color: tx.status === "paid" ? C.tealText : tx.status === "pending" ? C.amberText : C.redText,
                }}>
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AccountantReportsPage() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState("revenue");
  const [dateRange, setDateRange] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data for demonstration
  const stats = {
    revenue: 125890,
    revenueChange: 12.5,
    expenses: 78450,
    expensesChange: 5.2,
    profit: 47440,
    profitChange: 18.3,
    invoices: 342,
    invoicesChange: 8.7,
  };
  
  const recentTransactions = [
    { date: "2024-03-21", patient: "John Doe", description: "Dental Cleaning", amount: 150, status: "paid" },
    { date: "2024-03-21", patient: "Jane Smith", description: "Root Canal", amount: 850, status: "paid" },
    { date: "2024-03-20", patient: "Bob Johnson", description: "X-Ray", amount: 120, status: "pending" },
    { date: "2024-03-20", patient: "Alice Brown", description: "Crown", amount: 1200, status: "paid" },
    { date: "2024-03-19", patient: "Charlie Wilson", description: "Consultation", amount: 80, status: "cancelled" },
  ];
  
  const handleDownloadReport = () => {
    toast.success(`Downloading ${REPORT_TYPES.find(r => r.value === selectedReport)?.label}`);
  };
  
  const handlePrintReport = () => {
    window.print();
  };
  
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Reports refreshed");
    }, 1000);
  };
  
  const getDateRangeDisplay = () => {
    const range = DATE_RANGES.find(r => r.value === dateRange);
    if (dateRange === "custom" && customStartDate && customEndDate) {
      return `${customStartDate} - ${customEndDate}`;
    }
    return range?.label || "This Month";
  };
  
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          .no-print { display: none; }
          body { background: white; }
          .print-friendly { background: white; margin: 0; padding: 0; }
        }
      `}</style>
      
      <div style={{ animation: "slideIn 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate("/accountant")}
            className="no-print"
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
                Financial Reports
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                View and export financial reports and analytics
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }} className="no-print">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RefreshCw size={14} className={isLoading ? "spin" : ""} />
                Refresh
              </button>
              <button
                onClick={handlePrintReport}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={handleDownloadReport}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: C.teal,
                  border: "none",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <DownloadCloud size={14} />
                Export Report
              </button>
            </div>
          </div>
        </div>
        
        {/* Report Type Selector */}
        <div style={{
          background: C.bg,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: "12px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }} className="no-print">
          {REPORT_TYPES.map(report => {
            const Icon = report.icon;
            return (
              <button
                key={report.value}
                onClick={() => setSelectedReport(report.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: selectedReport === report.value ? report.color : "transparent",
                  color: selectedReport === report.value ? "white" : C.muted,
                  border: selectedReport === report.value ? "none" : `1px solid ${C.border}`,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: selectedReport === report.value ? 600 : 400,
                }}
              >
                <Icon size={14} />
                {report.label}
              </button>
            );
          })}
        </div>
        
        {/* Date Range Selector */}
        <div style={{
          background: C.bg,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: "16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }} className="no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Calendar size={16} color={C.muted} />
            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>Date Range:</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DATE_RANGES.map(range => (
                <button
                  key={range.value}
                  onClick={() => {
                    setDateRange(range.value);
                    if (range.value !== "custom") {
                      setShowDatePicker(false);
                    }
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: dateRange === range.value ? C.tealBg : "transparent",
                    border: `1px solid ${dateRange === range.value ? C.tealBorder : C.border}`,
                    color: dateRange === range.value ? C.tealText : C.muted,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          {dateRange === "custom" && (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: "6px 10px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <span style={{ color: C.muted }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: "6px 10px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
            </div>
          )}
          
          <div style={{ fontSize: 12, color: C.faint }}>
            Showing data for: {getDateRangeDisplay()}
          </div>
        </div>
        
        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            change={stats.revenueChange}
            icon={TrendingUp}
            color={C.teal}
            subtitle="All income sources"
          />
          <StatCard
            title="Total Expenses"
            value={`$${stats.expenses.toLocaleString()}`}
            change={stats.expensesChange}
            icon={TrendingDown}
            color={C.red}
            subtitle="Operating costs"
          />
          <StatCard
            title="Net Profit"
            value={`$${stats.profit.toLocaleString()}`}
            change={stats.profitChange}
            icon={BarChart3}
            color={C.blue}
            subtitle="Revenue - Expenses"
          />
          <StatCard
            title="Total Invoices"
            value={stats.invoices.toLocaleString()}
            change={stats.invoicesChange}
            icon={Receipt}
            color={C.purple}
            subtitle="Generated this period"
          />
        </div>
        
        {/* Charts Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}>
          <ChartCard title="Revenue Trend" onDownload={handleDownloadReport}>
            <RevenueChart />
          </ChartCard>
          <ChartCard title="Expense Breakdown" onDownload={handleDownloadReport}>
            <ExpensePieChart />
          </ChartCard>
        </div>
        
        {/* Transactions Table */}
        <div style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "20px",
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Recent Transactions</h3>
            <button
              onClick={handleDownloadReport}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.bg,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Download size={12} color={C.muted} />
              <span style={{ fontSize: 11, color: C.muted }}>Export</span>
            </button>
          </div>
          <TransactionTable transactions={recentTransactions} />
        </div>
        
        {/* Additional Reports Section */}
        <div style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "20px",
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>
            Available Reports
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {[
              { name: "Yearly Financial Summary", icon: FileText, desc: "Annual revenue and expense breakdown" },
              { name: "Tax Report", icon: Receipt, desc: "Quarterly tax preparation report" },
              { name: "Insurance Claims Report", icon: Shield, desc: "Insurance claims and payments" },
              { name: "Provider Performance", icon: Users, desc: "Revenue by dentist/procedure" },
              { name: "Aging Report", icon: Clock, desc: "Outstanding invoices by age" },
              { name: "Budget vs Actual", icon: BarChart3, desc: "Budget comparison analysis" },
            ].map((report, i) => {
              const Icon = report.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px",
                    background: C.bgMuted,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onClick={() => toast.info(`${report.name} report coming soon`)}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${C.teal}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Icon size={16} color={C.teal} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{report.name}</p>
                    <p style={{ fontSize: 10, color: C.muted }}>{report.desc}</p>
                  </div>
                  <ChevronRight size={14} color={C.faint} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}