// ══════════════════════════════════════════════════════════════════════════════
// src/pages/ReportsPage.tsx
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, CalendarDays, ReceiptText, Stethoscope, Download,
  TrendingUp, TrendingDown, PieChart, Activity, Clock,
  FileText, AlertTriangle, CheckCircle, XCircle, DollarSign,
  Package, FlaskConical, UserCheck, Award, BarChart3,
  Filter, ChevronDown, Printer, Share2, Mail
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart as RePieChart, Pie, Cell,
  LineChart, Line, Area, AreaChart, Legend
} from "recharts";
import { apiGetRevenueReport, apiGetDailySchedule, apiGetRecallsDue, apiGetExpenses } from "@/api/reports";
import { apiGetPatients } from "@/api/patients";
import { apiGetInvoices } from "@/api/billing";
import { apiGetTreatments } from "@/api/treatments";
import { apiGetAppointments } from "@/api/appointments";
import { apiGetInventory, apiGetLowStock } from "@/api/inventory";
import { apiGetLabOrders } from "@/api/labOrders";
import { formatCurrency } from "@/utils";
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8",
  bg: "#fff",
  bgMuted: "#f7f9f8",
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
  purpleBorder: "#ddd6fe",
  gray: "#6b7f75",
  grayBg: "#f4f7f5"
};

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.report-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.05)}`;

// ── Chart Colors ─────────────────────────────────────────────────────────────
const CHART_COLORS = {
  primary: C.teal,
  secondary: C.blue,
  tertiary: C.purple,
  warning: C.amber,
  danger: C.red,
  success: C.teal,
  info: C.blue,
  gray: C.gray
};

const PIE_COLORS = [C.teal, C.blue, C.purple, C.amber, C.red, "#14b8a6", "#6366f1", "#ec4899"];

// ── Types ────────────────────────────────────────────────────────────────────
interface DateRange {
  start: string;
  end: string;
}

interface ReportData {
  revenue: any[];
  expenses: any[];
  patients: any[];
  appointments: any[];
  treatments: any[];
  inventory: any[];
  labOrders: any[];
}

// ── Helper Components ────────────────────────────────────────────────────────
function KPI({ label, value, icon: Icon, color, trend, trendValue, sub }: {
  label: string;
  value: any;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  sub?: string;
}) {
  return (
    <div className="report-card" style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "15px 16px",
      transition: "all .2s"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={13} color={color} strokeWidth={1.8} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>
        {value}
      </p>
      {(trend || sub) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          {trend && (
            <span style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontSize: 10,
              fontWeight: 600,
              color: trend === 'up' ? C.redText : trend === 'down' ? C.tealText : C.muted
            }}>
              {trend === 'up' && <TrendingUp size={10} />}
              {trend === 'down' && <TrendingDown size={10} />}
              {trendValue}
            </span>
          )}
          {sub && <span style={{ fontSize: 11, color: C.faint }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── PDF Export Function ──────────────────────────────────────────────────────
const generatePDF = (data: ReportData, dateRange: DateRange) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(13, 158, 117);
  doc.text("Clinic Performance Report", 20, 20);

  // Date range
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`, 20, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);

  // Summary Statistics
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 22);
  doc.text("Executive Summary", 20, 50);

  const summaryData = [
    ["Metric", "Value"],
    ["Total Revenue", formatCurrency(data.revenue.reduce((a, b) => a + (b.total_collected || 0), 0))],
    ["Total Expenses", formatCurrency(data.expenses.reduce((a, b) => a + (b.amount || 0), 0))],
    ["Net Income", formatCurrency(
      data.revenue.reduce((a, b) => a + (b.total_collected || 0), 0) -
      data.expenses.reduce((a, b) => a + (b.amount || 0), 0)
    )],
    ["Total Patients", data.patients.length],
    ["Total Appointments", data.appointments.length],
    ["Completion Rate", `${Math.round((data.appointments.filter((a: any) => a.status === 'completed').length / data.appointments.length) * 100)}%`],
    ["Treatments Performed", data.treatments.length]
  ];

  autoTable(doc, {
    startY: 55,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [13, 158, 117] },
    styles: { fontSize: 10 }
  });

  const revenueTable = [
    ["Month", "Revenue"],
    ...data.revenue.map((r: any) => [
      new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      formatCurrency(r.total_collected || 0)
    ])
  ];

  // Patient Demographics
  if (data.patients.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Patient Demographics", 20, 20);

    const genderCount = data.patients.reduce((acc: any, p: any) => {
      acc[p.gender] = (acc[p.gender] || 0) + 1;
      return acc;
    }, {});

    const ageGroups = data.patients.reduce((acc: any, p: any) => {
      if (!p.date_of_birth) return acc;
      const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
      const group = age < 18 ? '0-17' : age < 35 ? '18-34' : age < 50 ? '35-49' : age < 65 ? '50-64' : '65+';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    autoTable(doc, {
      startY: 25,
      body: [
        ["Gender Distribution", ...Object.entries(genderCount).map(([k, v]) => `${k}: ${v}`)],
        ["Age Distribution", ...Object.entries(ageGroups).map(([k, v]) => `${k}: ${v}`)]
      ],
      theme: 'plain',
      styles: { fontSize: 10 }
    });
  }

  // Inventory Alerts
  const lowStock = data.inventory.filter((i: any) => i.quantity_in_stock <= i.minimum_stock_level);
  if (lowStock.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Inventory Alerts", 20, 20);

    const inventoryTable = [
      ["Item", "Current Stock", "Minimum", "Status"],
      ...lowStock.map((i: any) => [i.name, `${i.quantity_in_stock} ${i.unit || ''}`, i.minimum_stock_level, "LOW STOCK"])
    ];

    autoTable(doc, {
      startY: 25,
      head: [inventoryTable[0]],
      body: inventoryTable.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [229, 62, 62] }
    });
  }

  // Lab Orders Status
  if (data.labOrders.length > 0) {
    const pendingLab = data.labOrders.filter((l: any) => l.status === 'pending').length;
    const inProgressLab = data.labOrders.filter((l: any) => l.status === 'in_progress').length;
    const completedLab = data.labOrders.filter((l: any) => l.status === 'received').length;
  }

  // Save PDF
  doc.save(`clinic-report-${new Date().toISOString().split('T')[0]}.pdf`);
  toast.success("PDF generated successfully");
};

// ── Excel Export Function ────────────────────────────────────────────────────
const generateExcel = (data: ReportData, dateRange: DateRange) => {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ["Clinic Performance Report"],
    [`Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ["Metric", "Value"],
    ["Total Revenue", data.revenue.reduce((a, b) => a + (b.total_collected || 0), 0)],
    ["Total Expenses", data.expenses.reduce((a, b) => a + (b.amount || 0), 0)],
    ["Net Income",
      data.revenue.reduce((a, b) => a + (b.total_collected || 0), 0) -
      data.expenses.reduce((a, b) => a + (b.amount || 0), 0)
    ],
    ["Total Patients", data.patients.length],
    ["Total Appointments", data.appointments.length],
    ["Completed Appointments", data.appointments.filter((a: any) => a.status === 'completed').length],
    ["Total Treatments", data.treatments.length],
    ["Total Invoices", data.revenue.length],
    ["Low Stock Items", data.inventory.filter((i: any) => i.quantity_in_stock <= i.minimum_stock_level).length],
    ["Pending Lab Orders", data.labOrders.filter((l: any) => l.status === 'pending').length]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Revenue Sheet
  const revenueSheet = XLSX.utils.json_to_sheet(data.revenue);
  XLSX.utils.book_append_sheet(wb, revenueSheet, "Revenue");

  // Expenses Sheet
  const expensesSheet = XLSX.utils.json_to_sheet(data.expenses);
  XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

  // Patients Sheet
  const patientsSheet = XLSX.utils.json_to_sheet(data.patients);
  XLSX.utils.book_append_sheet(wb, patientsSheet, "Patients");

  // Appointments Sheet
  const appointmentsSheet = XLSX.utils.json_to_sheet(data.appointments);
  XLSX.utils.book_append_sheet(wb, appointmentsSheet, "Appointments");

  // Inventory Sheet
  const inventorySheet = XLSX.utils.json_to_sheet(data.inventory);
  XLSX.utils.book_append_sheet(wb, inventorySheet, "Inventory");

  // Lab Orders Sheet
  const labOrdersSheet = XLSX.utils.json_to_sheet(data.labOrders);
  XLSX.utils.book_append_sheet(wb, labOrdersSheet, "Lab Orders");

  XLSX.writeFile(wb, `clinic-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  toast.success("Excel report generated successfully");
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Queries
  const { data: revenue } = useQuery({
    queryKey: ["report-revenue", dateRange],
    queryFn: () => apiGetRevenueReport({ startDate: dateRange.start, endDate: dateRange.end })
  });

  const { data: expenses } = useQuery({
    queryKey: ["report-expenses", dateRange],
    queryFn: () => apiGetExpenses({ startDate: dateRange.start, endDate: dateRange.end })
  });

  const { data: patientsRes } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: () => apiGetPatients({ limit: 1000 })
  });

  const { data: invoicesRes } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({ limit: 1000 })
  });

  const { data: treatmentsRes } = useQuery({
    queryKey: ["treatments"],
    queryFn: () => apiGetTreatments()
  });

  const { data: appointmentsRes } = useQuery({
    queryKey: ["appointments", dateRange],
    queryFn: () => apiGetAppointments({ startDate: dateRange.start, endDate: dateRange.end })
  });

  const { data: recalls = [] } = useQuery({
    queryKey: ["recalls"],
    queryFn: apiGetRecallsDue
  });

  const { data: inventoryRes } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => apiGetInventory({ limit: 1000 })
  });

  const { data: lowStock } = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: apiGetLowStock
  });

  const { data: labOrdersRes } = useQuery({
    queryKey: ["lab-orders", dateRange],
    queryFn: () => apiGetLabOrders({ startDate: dateRange.start, endDate: dateRange.end })
  });

  // Process data
  const revenueData: any[] = Array.isArray(revenue) ? revenue : (revenue as any)?.data ?? [];
  const expensesData: any[] = Array.isArray(expenses) ? expenses : (expenses as any)?.data ?? [];
  const invoices: any[] = invoicesRes?.data ?? [];
  const treatments: any[] = treatmentsRes?.data ?? [];
  const appointments: any[] = appointmentsRes?.data ?? [];
  const patients: any[] = patientsRes?.data ?? [];
  const inventory: any[] = inventoryRes?.data ?? [];
  const labOrders: any[] = labOrdersRes?.data ?? [];
  const recallList: any[] = Array.isArray(recalls) ? recalls : (recalls as any)?.data ?? [];
  const lowStockItems: any[] = lowStock ?? [];

  // Calculations
  const totalCollected = invoices.reduce((a, i) => a + parseFloat(i.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((a, i) => a + Math.max(0, parseFloat(i.total_amount || 0) - parseFloat(i.paid_amount || 0)), 0);
  const totalExpenses = expensesData.reduce((a, e) => a + parseFloat(e.amount || 0), 0);
  const netIncome = totalCollected - totalExpenses;

  const completedAppointments = appointments.filter((a: any) => a.status === 'completed').length;
  const cancelledAppointments = appointments.filter((a: any) => a.status === 'cancelled').length;
  const appointmentCompletionRate = appointments.length > 0 ? (completedAppointments / appointments.length) * 100 : 0;

  // Gender distribution
  const genderDistribution = patients.reduce((acc: any, p: any) => {
    acc[p.gender] = (acc[p.gender] || 0) + 1;
    return acc;
  }, {});

  // Age distribution
  const ageGroups = patients.reduce((acc: any, p: any) => {
    if (!p.date_of_birth) return acc;
    const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
    const group = age < 18 ? '0-17' : age < 35 ? '18-34' : age < 50 ? '35-49' : age < 65 ? '50-64' : '65+';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  // Top procedures
  const procedureCounts = treatments.reduce((acc: any, t: any) => {
    if (t.procedure_name) {
      acc[t.procedure_name] = (acc[t.procedure_name] || 0) + 1;
    }
    return acc;
  }, {});

  const topProcedures = Object.entries(procedureCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5);

  // Monthly revenue chart data
  const chartData = revenueData.map((r: any) => ({
    month: new Date(r.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    revenue: parseFloat(r.total_collected || 0),
    expenses: parseFloat(expensesData.find((e: any) => e.month === r.month)?.total_amount || 0),
    profit: parseFloat(r.total_collected || 0) - parseFloat(expensesData.find((e: any) => e.month === r.month)?.total_amount || 0)
  }));

  // Invoice status breakdown
  const statusBreakdown = [
    { name: "Paid", value: invoices.filter(i => i.status === "paid").length, color: C.teal },
    { name: "Partial", value: invoices.filter(i => i.status === "partial").length, color: C.amber },
    { name: "Unpaid", value: invoices.filter(i => i.status === "unpaid").length, color: C.red },
  ];

  // Appointment status breakdown
  const appointmentStatus = [
    { name: "Completed", value: completedAppointments, color: C.teal },
    { name: "Pending", value: appointments.filter((a: any) => a.status === "pending").length, color: C.amber },
    { name: "Cancelled", value: cancelledAppointments, color: C.red },
    { name: "No-show", value: appointments.filter((a: any) => a.status === "no_show").length, color: C.gray },
  ];

  // Inventory value by category
  const inventoryByCategory = inventory.reduce((acc: any, item: any) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (parseFloat(item.quantity_in_stock || 0) * parseFloat(item.unit_cost || 0));
    return acc;
  }, {});

  const inventoryChartData = Object.entries(inventoryByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // Handle export
  const handleExport = (format: 'pdf' | 'excel') => {
    const reportData: ReportData = {
      revenue: revenueData,
      expenses: expensesData,
      patients,
      appointments,
      treatments,
      inventory,
      labOrders
    };

    if (format === 'pdf') {
      generatePDF(reportData, dateRange);
    } else {
      generateExcel(reportData, dateRange);
    }
    setShowExportMenu(false);
  };

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Reports & Analytics</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              Comprehensive clinic performance data
            </p>
          </div>

          {/* Date Range and Export */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  ...IS,
                  width: 140,
                  height: 34,
                  fontSize: 11
                }}
              />
              <span style={{ color: C.faint }}>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  ...IS,
                  width: 140,
                  height: 34,
                  fontSize: 11
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 14px",
                  height: 34,
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.muted,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                <Download size={13} />
                Export
                <ChevronDown size={11} />
              </button>

              {showExportMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                  zIndex: 10,
                  minWidth: 140
                }}>
                  <button
                    onClick={() => handleExport('pdf')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      fontSize: 12,
                      color: C.text,
                      cursor: "pointer",
                      borderBottom: `1px solid ${C.border}`
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <FileText size={13} color={C.red} />
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      fontSize: 12,
                      color: C.text,
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <BarChart3 size={13} color={C.teal} />
                    Export as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
          {['overview', 'financial', 'clinical', 'operations', 'patients'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: "none",
                background: activeTab === tab ? C.tealBg : "transparent",
                color: activeTab === tab ? C.tealText : C.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Executive Summary KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <KPI
                label="Total Revenue"
                value={formatCurrency(totalCollected)}
                icon={DollarSign}
                color={C.teal}
                trend={netIncome > 0 ? 'up' : 'down'}
                trendValue={`${((totalCollected - totalExpenses) / totalCollected * 100).toFixed(1)}% margin`}
              />
              <KPI
                label="Net Income"
                value={formatCurrency(netIncome)}
                icon={TrendingUp}
                color={netIncome > 0 ? C.teal : C.red}
                sub="After expenses"
              />
              <KPI
                label="Patients"
                value={patients.length}
                icon={Users}
                color={C.blue}
                trend="up"
                trendValue="+12%"
                sub="Active patients"
              />
              <KPI
                label="Appointments"
                value={appointments.length}
                icon={CalendarDays}
                color={C.purple}
                trendValue={`${appointmentCompletionRate.toFixed(0)}% completed`}
              />
            </div>

            {/* Revenue vs Expenses Chart */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
              <SectionHeader
                title="Revenue vs Expenses"
                subtitle="Monthly financial performance"
              />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.faint }} />
                  <YAxis tick={{ fontSize: 12, fill: C.faint }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}` }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill={C.teal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill={C.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Key Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Inventory Health */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                <SectionHeader
                  title="Inventory Health"
                  subtitle={`${lowStockItems.length} items need attention`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Total Items</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{inventory.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Low Stock Items</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: lowStockItems.length > 0 ? C.redText : C.tealText }}>
                      {lowStockItems.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Total Value</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                      {formatCurrency(inventory.reduce((a, i) => a + (parseFloat(i.quantity_in_stock || 0) * parseFloat(i.unit_cost || 0)), 0))}
                    </span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                    <div style={{
                      height: "100%",
                      width: `${(inventory.length - lowStockItems.length) / inventory.length * 100}%`,
                      background: C.teal,
                      borderRadius: 2
                    }} />
                  </div>
                </div>
              </div>

              {/* Lab Orders Status */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                <SectionHeader
                  title="Lab Orders"
                  subtitle={`${labOrders.length} total orders`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Pending</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.amberText }}>
                      {labOrders.filter((l: any) => l.status === 'pending').length}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>In Progress</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.blueText }}>
                      {labOrders.filter((l: any) => l.status === 'in_progress').length}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Completed</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.tealText }}>
                      {labOrders.filter((l: any) => l.status === 'received').length}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Delayed</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.redText }}>
                      {labOrders.filter((l: any) => l.expected_date && new Date(l.expected_date) < new Date() && l.status !== 'received').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Financial KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <KPI label="Total Revenue" value={formatCurrency(totalCollected)} icon={DollarSign} color={C.teal} />
              <KPI label="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} color={C.red} />
              <KPI label="Net Income" value={formatCurrency(netIncome)} icon={TrendingUp} color={netIncome > 0 ? C.teal : C.red} />
              <KPI label="Outstanding" value={formatCurrency(totalOutstanding)} icon={Clock} color={C.amber} />
            </div>

            {/* Revenue Chart */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
              <SectionHeader title="Revenue Trend" />
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.faint }} />
                  <YAxis tick={{ fontSize: 12, fill: C.faint }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke={C.teal} fill={C.tealBg} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Invoice Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                <SectionHeader title="Invoice Status" />
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
                  {statusBreakdown.map(s => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color }} />
                      <span style={{ fontSize: 11, color: C.muted }}>{s.name}: {s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Procedures */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                <SectionHeader title="Top Procedures" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topProcedures.map((p: any, i: number) => (
                    <div key={p.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: C.text }}>{p.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.teal }}>{p.count}x</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                        {/* <div style={{
                          height: "100%",
                          width: `${(p.count / topProcedures[0].count) * 100}%`,
                          background: [C.teal, C.blue, C.purple, C.amber, C.red][i % 5],
                          borderRadius: 2
                        }} /> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Tab */}
        {activeTab === 'clinical' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Clinical KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <KPI label="Treatments" value={treatments.length} icon={Stethoscope} color={C.blue} />
              <KPI label="Lab Orders" value={labOrders.length} icon={FlaskConical} color={C.purple} />
              <KPI label="Completion Rate" value={`${appointmentCompletionRate.toFixed(0)}%`} icon={CheckCircle} color={C.teal} />
              <KPI label="Recalls Due" value={recallList.length} icon={AlertTriangle} color={recallList.length > 0 ? C.amber : C.teal} />
            </div>

            {/* Appointment Status */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
              <SectionHeader title="Appointment Status" />
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={appointmentStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.faint }} />
                  <YAxis tick={{ fontSize: 12, fill: C.faint }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {appointmentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recalls Due */}
            {recallList.length > 0 && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                <SectionHeader
                  title="Patients Due for Recall"
                  subtitle={`${recallList.length} patients need follow-up`}
                />
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {recallList.slice(0, 10).map((r: any) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: `1px solid ${C.border}`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Clock size={12} color={C.amber} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r.patient_name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: C.redText }}>
                        Due {new Date(r.next_due_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Operations KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <KPI label="Inventory Items" value={inventory.length} icon={Package} color={C.teal} />
              <KPI label="Low Stock Alerts" value={lowStockItems.length} icon={AlertTriangle} color={lowStockItems.length > 0 ? C.red : C.teal} />
              <KPI label="Inventory Value" value={formatCurrency(inventory.reduce((a, i) => a + (parseFloat(i.quantity_in_stock || 0) * parseFloat(i.unit_cost || 0)), 0))} icon={DollarSign} color={C.blue} />
              <KPI label="Categories" value={Object.keys(inventoryByCategory).length} icon={Filter} color={C.purple} />
            </div>

            {/* Inventory by Category */}
            {inventoryChartData.length > 0 && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                <SectionHeader title="Inventory Value by Category" />
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={inventoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {inventoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Low Stock Items */}
            {lowStockItems.length > 0 && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                <SectionHeader
                  title="Low Stock Alert"
                  subtitle="Items needing reorder"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lowStockItems.slice(0, 10).map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: C.redBg,
                        borderRadius: 8,
                        border: `1px solid ${C.redBorder}`
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.name}</p>
                        <p style={{ fontSize: 10, color: C.faint }}>SKU: {item.sku || 'N/A'}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: C.redText }}>{item.quantity_in_stock} {item.unit}</p>
                        <p style={{ fontSize: 10, color: C.faint }}>Min: {item.minimum_stock_level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Patient KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <KPI label="Total Patients" value={patients.length} icon={Users} color={C.teal} />
              <KPI label="Male" value={genderDistribution.Male || 0} icon={Users} color={C.blue} />
              <KPI label="Female" value={genderDistribution.Female || 0} icon={Users} color={C.purple} />
              <KPI label="Other" value={genderDistribution.Other || 0} icon={Users} color={C.amber} />
            </div>

            {/* Age Distribution */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
              <SectionHeader title="Patient Age Distribution" />
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(ageGroups).map(([age, count]) => ({ age, count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="age" tick={{ fontSize: 12, fill: C.faint }} />
                  <YAxis tick={{ fontSize: 12, fill: C.faint }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={C.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* New Patients Trend - Placeholder for now */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
              <SectionHeader
                title="New Patients"
                subtitle="Monthly new patient registrations"
              />
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint }}>
                <p>Monthly trend data coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Add missing IS style
const IS: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 9,
  background: C.bg,
  fontSize: 13,
  color: C.text,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box"
};