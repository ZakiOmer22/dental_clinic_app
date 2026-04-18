// src/pages/accountant/AccountantAuditLogsPage.jsx
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Filter, X, RefreshCw, Download, Calendar,
  Activity, User, FileText, DollarSign, Settings, Shield,
  LogIn, LogOut, Edit, Trash2, Plus, Eye, AlertCircle,
  CheckCircle, XCircle, Clock, Server, Database, CreditCard,
  Users, Package, TrendingUp, TrendingDown, Printer, Upload,
  ChevronLeft, ChevronRight, ChevronDown, MoreVertical,
  Filter as FilterIcon, Calendar as CalendarIcon, Download as DownloadIcon
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import { apiGetAuditLogs, apiExportAuditLogs } from "@/api/audit";
import { useAuthStore } from "@/app/store";
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
  indigo: "#6366f1", indigoBg: "#eef2ff", indigoText: "#4338ca",
  rose: "#f43f5e", roseBg: "#fff1f2", roseText: "#e11d48"
};

const ACTION_TYPES = [
  { value: "all", label: "All Actions", icon: Activity, color: C.gray },
  { value: "create", label: "Create", icon: Plus, color: C.green },
  { value: "update", label: "Update", icon: Edit, color: C.blue },
  { value: "delete", label: "Delete", icon: Trash2, color: C.red },
  { value: "view", label: "View", icon: Eye, color: C.purple },
  { value: "login", label: "Login", icon: LogIn, color: C.teal },
  { value: "logout", label: "Logout", icon: LogOut, color: C.amber },
  { value: "export", label: "Export", icon: Download, color: C.indigo },
  { value: "print", label: "Print", icon: Printer, color: C.purple }
];

const MODULE_TYPES = [
  { value: "all", label: "All Modules", icon: Activity, color: C.gray },
  { value: "inventory", label: "Inventory", icon: Package, color: C.teal },
  { value: "patients", label: "Patients", icon: Users, color: C.blue },
  { value: "appointments", label: "Appointments", icon: Calendar, color: C.purple },
  { value: "billing", label: "Billing", icon: DollarSign, color: C.green },
  { value: "procedures", label: "Procedures", icon: Activity, color: C.amber },
  { value: "users", label: "Users", icon: Users, color: C.indigo },
  { value: "settings", label: "Settings", icon: Settings, color: C.gray },
  { value: "reports", label: "Reports", icon: FileText, color: C.rose }
];

// Helper function to get action styling
const getActionStyle = (action) => {
  const styles = {
    create: { bg: C.greenBg, color: C.greenText, icon: Plus },
    update: { bg: C.blueBg, color: C.blueText, icon: Edit },
    delete: { bg: C.redBg, color: C.redText, icon: Trash2 },
    view: { bg: C.purpleBg, color: C.purpleText, icon: Eye },
    login: { bg: C.tealBg, color: C.tealText, icon: LogIn },
    logout: { bg: C.amberBg, color: C.amberText, icon: LogOut },
    export: { bg: C.indigoBg, color: C.indigoText, icon: Download },
    print: { bg: C.purpleBg, color: C.purpleText, icon: Printer }
  };
  return styles[action] || { bg: C.grayBg, color: C.muted, icon: Activity };
};

// Helper function to get module styling
const getModuleStyle = (module) => {
  const styles = {
    inventory: { bg: C.tealBg, color: C.tealText },
    patients: { bg: C.blueBg, color: C.blueText },
    appointments: { bg: C.purpleBg, color: C.purpleText },
    billing: { bg: C.greenBg, color: C.greenText },
    procedures: { bg: C.amberBg, color: C.amberText },
    users: { bg: C.indigoBg, color: C.indigoText },
    settings: { bg: C.grayBg, color: C.gray },
    reports: { bg: C.roseBg, color: C.roseText }
  };
  return styles[module] || { bg: C.grayBg, color: C.muted };
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { user } = useAuthStore();

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      ...(search && { search }),
      ...(actionFilter !== "all" && { action: actionFilter }),
      ...(moduleFilter !== "all" && { module: moduleFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(dateRange.start && { start_date: dateRange.start }),
      ...(dateRange.end && { end_date: dateRange.end }),
      sort_by: "timestamp",
      sort_order: "desc"
    };
    return params;
  }, [currentPage, itemsPerPage, search, actionFilter, moduleFilter, statusFilter, dateRange]);

  // Fetch audit logs from API
  const { data: logsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit_logs", queryParams],
    queryFn: () => apiGetAuditLogs(queryParams),
    keepPreviousData: true
  });

  const auditLogs = logsData?.data || [];
  const pagination = logsData?.pagination || { total: 0, page: 1, pages: 1 };

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => apiExportAuditLogs(queryParams),
    onSuccess: (response) => {
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${formatDate(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Audit logs exported successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Failed to export logs");
    }
  });

  // Statistics - calculated from API data
  const stats = useMemo(() => {
    const logs = auditLogs;
    const totalLogs = logs.length;
    const uniqueUsers = new Set(logs.map(l => l.user_id)).size;
    const successCount = logs.filter(l => l.status === "success").length;
    const failedCount = logs.filter(l => l.status === "failed").length;
    const warningCount = logs.filter(l => l.status === "warning").length;
    
    const actionsByType = {};
    ACTION_TYPES.forEach(action => {
      if (action.value !== "all") {
        actionsByType[action.value] = logs.filter(l => l.action === action.value).length;
      }
    });
    
    const modulesByType = {};
    MODULE_TYPES.forEach(module => {
      if (module.value !== "all") {
        modulesByType[module.value] = logs.filter(l => l.module === module.value).length;
      }
    });
    
    return { totalLogs, uniqueUsers, successCount, failedCount, warningCount, actionsByType, modulesByType };
  }, [auditLogs]);

  const InputStyle = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1.5px solid ${C.border}`, borderRadius: 9,
    background: C.bg, fontSize: 13, color: C.text,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box"
  };

  function Field({ label, children }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
          {label}
        </label>
        {children}
      </div>
    );
  }

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Audit logs refreshed");
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setModuleFilter("all");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
    toast.success("Filters cleared");
  };

  const activeFiltersCount = [
    search && "search",
    actionFilter !== "all",
    moduleFilter !== "all",
    statusFilter !== "all",
    dateRange.start || dateRange.end
  ].filter(Boolean).length;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .log-row:hover{background:${C.indigoBg}!important;transform:translateX(2px);transition:all 0.15s}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={24} color={C.teal} /> Audit Logs
            </h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              Track and monitor all system activities and user actions
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRefresh} disabled={isFetching} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: isFetching ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, opacity: isFetching ? 0.6 : 1 }}>
              <RefreshCw size={13} className={isFetching ? "spin" : ""} /> Refresh
            </button>
            <button onClick={handleExport} disabled={exportMutation.isPending} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.indigo, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: exportMutation.isPending ? "not-allowed" : "pointer", opacity: exportMutation.isPending ? 0.6 : 1 }}>
              <Download size={15} /> {exportMutation.isPending ? "Exporting..." : "Export Logs"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "Total Events", value: pagination.total || stats.totalLogs, icon: Activity, color: C.blue, bg: C.blueBg, sub: "All time" },
            { label: "Unique Users", value: stats.uniqueUsers, icon: Users, color: C.teal, bg: C.tealBg, sub: "Active participants" },
            { label: "Successful", value: stats.successCount, icon: CheckCircle, color: C.green, bg: C.greenBg, sub: "Completed actions" },
            { label: "Failed", value: stats.failedCount, icon: XCircle, color: C.red, bg: C.redBg, sub: "Error events" },
            { label: "Warnings", value: stats.warningCount, icon: AlertCircle, color: C.amber, bg: C.amberBg, sub: "Needs attention" }
          ].map(k => (
            <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
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

        {/* Search & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search by user, record, IP, or details..." className="inp" style={{ ...InputStyle, paddingLeft: 36, height: 42, fontSize: 14 }} />
            {search && <button onClick={() => { setSearch(""); setCurrentPage(1); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}><X size={14} color={C.faint} /></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 42, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
            <FilterIcon size={13} /> Filters {activeFiltersCount > 0 && <span style={{ background: C.purple, color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{activeFiltersCount}</span>}
          </button>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} style={{ padding: "0 14px", height: 42, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.red, cursor: "pointer" }}>
              Clear All
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ background: C.bg, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, animation: "fadeUp .2s ease" }}>
            <Field label="Action Type">
              <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                {ACTION_TYPES.map(action => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Module">
              <select value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setCurrentPage(1); }} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                {MODULE_TYPES.map(module => (
                  <option key={module.value} value={module.value}>{module.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
              </select>
            </Field>
            <Field label="Date Range">
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" value={dateRange.start} onChange={e => { setDateRange({ ...dateRange, start: e.target.value }); setCurrentPage(1); }} style={{ ...InputStyle, flex: 1 }} placeholder="Start" />
                <input type="date" value={dateRange.end} onChange={e => { setDateRange({ ...dateRange, end: e.target.value }); setCurrentPage(1); }} style={{ ...InputStyle, flex: 1 }} placeholder="End" />
              </div>
            </Field>
          </div>
        )}

        {/* Action/Module Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Actions by Type */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 }}>Actions by Type</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {ACTION_TYPES.filter(a => a.value !== "all").map(action => {
                const count = stats.actionsByType[action.value] || 0;
                if (count === 0) return null;
                const style = getActionStyle(action.value);
                const Icon = style.icon;
                return (
                  <div key={action.value} style={{ display: "flex", alignItems: "center", gap: 6, background: style.bg, padding: "4px 10px", borderRadius: 20 }}>
                    <Icon size={12} color={style.color} />
                    <span style={{ fontSize: 11, color: style.color }}>{action.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: style.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modules by Type */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 }}>Modules by Activity</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {MODULE_TYPES.filter(m => m.value !== "all").map(module => {
                const count = stats.modulesByType[module.value] || 0;
                if (count === 0) return null;
                const style = getModuleStyle(module.value);
                const Icon = module.icon;
                return (
                  <div key={module.value} style={{ display: "flex", alignItems: "center", gap: 6, background: style.bg, padding: "4px 10px", borderRadius: 20 }}>
                    <Icon size={12} color={style.color} />
                    <span style={{ fontSize: 11, color: style.color }}>{module.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: style.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(160px, 1fr) minmax(120px, 0.8fr) minmax(90px, 0.7fr) minmax(100px, 0.8fr) minmax(200px, 1.5fr) minmax(100px, 0.7fr) minmax(50px, 0.5fr)",
            padding: "12px 16px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`,
            gap: "8px"
          }}>
            {["Timestamp", "User", "Action", "Module", "Record / Details", "IP Address", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: C.faint }}>Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Shield size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: C.faint }}>No audit logs found</p>
            </div>
          ) : (
            auditLogs.map((log, i) => {
              const actionStyle = getActionStyle(log.action);
              const ActionIcon = actionStyle.icon;
              const moduleStyle = getModuleStyle(log.module);
              
              return (
                <div
                  key={log.id}
                  className="log-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(160px, 1fr) minmax(120px, 0.8fr) minmax(90px, 0.7fr) minmax(100px, 0.8fr) minmax(200px, 1.5fr) minmax(100px, 0.7fr) minmax(50px, 0.5fr)",
                    padding: "14px 16px",
                    borderBottom: i < auditLogs.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    transition: "all .1s",
                    cursor: "pointer",
                    gap: "8px",
                    background: log.status === "failed" ? C.redBg : log.status === "warning" ? C.amberBg : "transparent"
                  }}
                  onClick={() => setSelectedLog(log)}
                >
                  <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{formatDateTime(log.timestamp)}</span>
                  
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{log.user_name || log.user?.name || "Unknown"}</p>
                    <p style={{ fontSize: 10, color: C.faint }}>{log.role || "User"}</p>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <ActionIcon size={12} color={actionStyle.color} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: actionStyle.color }}>{log.action?.toUpperCase()}</span>
                  </div>
                  
                  <div>
                    <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 10, background: moduleStyle.bg, color: moduleStyle.color }}>
                      {log.module}
                    </span>
                  </div>
                  
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{log.record_name || "—"}</p>
                    <p style={{ fontSize: 10, color: C.faint }}>{log.details?.substring(0, 50)}...</p>
                  </div>
                  
                  <span style={{ fontSize: 11, color: C.faint, fontFamily: "monospace" }}>{log.ip_address || log.ip}</span>
                  
                  <div>
                    {log.status === "success" && <CheckCircle size={14} color={C.green} />}
                    {log.status === "failed" && <XCircle size={14} color={C.red} />}
                    {log.status === "warning" && <AlertCircle size={14} color={C.amber} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
            <span style={{ fontSize: 12, color: C.muted }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} entries
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                else pageNum = currentPage - 2 + i;
                
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} style={{ padding: "6px 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: currentPage === pageNum ? C.teal : C.bg, color: currentPage === pageNum ? "white" : C.text, cursor: "pointer" }}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages} style={{ padding: "6px 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, cursor: currentPage === pagination.pages ? "not-allowed" : "pointer", opacity: currentPage === pagination.pages ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Details Modal */}
      {selectedLog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setSelectedLog(null)}>
          <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Audit Log Details</h3>
              <button onClick={() => setSelectedLog(null)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Event ID</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>#{selectedLog.id}</p>
                  </div>
                  <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Timestamp</p>
                    <p style={{ fontSize: 13, fontFamily: "monospace" }}>{formatDateTime(selectedLog.timestamp)}</p>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>User</p>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{selectedLog.user_name || selectedLog.user?.name || "Unknown"}</p>
                    <p style={{ fontSize: 11, color: C.faint }}>{selectedLog.user_email || selectedLog.user?.email}</p>
                    <p style={{ fontSize: 11, color: C.faint }}>Role: {selectedLog.role || "User"}</p>
                  </div>
                  <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>IP Address</p>
                    <p style={{ fontSize: 13, fontFamily: "monospace" }}>{selectedLog.ip_address || selectedLog.ip}</p>
                    <p style={{ fontSize: 11, color: C.faint }}>Status: <span style={{ color: selectedLog.status === "success" ? C.green : selectedLog.status === "failed" ? C.red : C.amber }}>{selectedLog.status}</span></p>
                  </div>
                </div>
                
                <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                  <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Action & Module</p>
                  <p style={{ fontSize: 13 }}><strong>{selectedLog.action?.toUpperCase()}</strong> on <strong>{selectedLog.module}</strong></p>
                </div>
                
                <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                  <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Record</p>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{selectedLog.record_name || "—"}</p>
                  {selectedLog.record_id && <p style={{ fontSize: 11, color: C.faint }}>ID: {selectedLog.record_id}</p>}
                </div>
                
                <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                  <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Details</p>
                  <p style={{ fontSize: 13 }}>{selectedLog.details}</p>
                </div>
                
                {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                  <div style={{ padding: "8px 12px", background: C.bgMuted, borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Changes</p>
                    <div style={{ display: "grid", gap: 6 }}>
                      {Object.entries(selectedLog.changes).map(([key, value]) => (
                        <div key={key} style={{ fontSize: 12, display: "flex", gap: 8 }}>
                          <span style={{ fontWeight: 600, color: C.text }}>{key}:</span>
                          <span style={{ color: C.muted }}>{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}