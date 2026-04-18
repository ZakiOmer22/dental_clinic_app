// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM LOGS PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText, Filter, Download, Trash2, AlertCircle,
    Info, AlertTriangle, XCircle, CheckCircle2, Code,
    Search, X
} from "lucide-react";
import { apiGetLogs, apiClearLogs, apiExportLogs, type LogEntry } from "@/api/log";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

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

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.log-r:hover{background:${C.bgMuted}!important}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const SEVERITY_CFG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
    error: { icon: XCircle, color: C.redText, bg: C.redBg, border: C.redBorder, label: "Error" },
    warning: { icon: AlertTriangle, color: C.amberText, bg: C.amberBg, border: C.amberBorder, label: "Warning" },
    info: { icon: Info, color: C.blueText, bg: C.blueBg, border: C.blueBorder, label: "Info" },
    debug: { icon: Code, color: C.gray, bg: C.grayBg, border: C.border, label: "Debug" },
    success: { icon: CheckCircle2, color: C.tealText, bg: C.tealBg, border: C.tealBorder, label: "Success" },
};

const MODULES = ["Authentication", "Database", "API", "Billing", "Appointments", "Patients", "Inventory", "Email", "Backup", "System"];

// ── Shared components ─────────────────────────────────────────────────────────
function F({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                {label}
            </label>
            {children}
        </div>
    );
}

function TEmpty({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div style={{ padding: "48px 18px", textAlign: "center" }}>
            <Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} />
            <p style={{ fontSize: 13, color: C.faint }}>{text}</p>
        </div>
    );
}

function TLoad() {
    return (
        <div style={{ padding: "40px 18px", textAlign: "center" }}>
            <div style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${C.border}`,
                borderTopColor: C.teal,
                animation: "spin .7s linear infinite",
                margin: "0 auto 8px"
            }} />
            <p style={{ fontSize: 13, color: C.faint }}>Loading…</p>
        </div>
    );
}

function KPI({ label, value, icon: Icon, color, sub, onClick }: {
    label: string;
    value: any;
    icon: any;
    color: string;
    sub?: string;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "15px 16px",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.2s"
            }}
        >
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
            {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}
        </div>
    );
}

function SearchB({ value, onChange, placeholder, width = 280 }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    width?: number
}) {
    return (
        <div style={{ position: "relative", width }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="inp"
                style={{ ...IS, paddingLeft: 30, height: 34 }}
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.faint,
                        display: "flex"
                    }}
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
}

// Helper function to format date for comparison
const formatDateForComparison = (date: string) => {
    return new Date(date).setHours(0, 0, 0, 0);
};

// Helper function to check if a date is within range
const isDateInRange = (date: string, from: string, to: string) => {
    const logDate = new Date(date).getTime();
    const fromDate = from ? new Date(from).getTime() : null;
    const toDate = to ? new Date(to + "T23:59:59").getTime() : null;

    if (fromDate && logDate < fromDate) return false;
    if (toDate && logDate > toDate) return false;
    return true;
};

export function SystemLogsPage() {
    const qc = useQueryClient();
    const user = useAuthStore(s => s.user);

    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [moduleFilter, setModuleFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ["system-logs", severityFilter, moduleFilter],
        queryFn: () => apiGetLogs({
            severity: severityFilter !== "all" ? severityFilter : undefined,
            module: moduleFilter !== "all" ? moduleFilter : undefined
        }),
        staleTime: 30000 // 30 seconds
    });

    const logs: LogEntry[] = data?.data ?? [];

    // Show error toast if query fails
    if (error) {
        toast.error("Failed to load logs");
    }

    const filtered = useMemo(() => {
        return logs.filter(log => {
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                const messageMatch = log.message?.toLowerCase().includes(searchLower);
                const moduleMatch = log.module?.toLowerCase().includes(searchLower);
                if (!messageMatch && !moduleMatch) return false;
            }

            // Date filter
            if (dateFrom || dateTo) {
                if (!isDateInRange(log.timestamp, dateFrom, dateTo)) return false;
            }

            return true;
        });
    }, [logs, search, dateFrom, dateTo]);

    const clearMut = useMutation({
        mutationFn: apiClearLogs,
        onSuccess: () => {
            toast.success("Logs cleared");
            qc.invalidateQueries({ queryKey: ["system-logs"] });
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to clear logs");
        }
    });

    const exportMut = useMutation({
        mutationFn: apiExportLogs,
        onSuccess: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Logs exported");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to export logs");
        }
    });

    const formatTime = (ts: string) => {
        try {
            const d = new Date(ts);
            return d.toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        } catch {
            return ts;
        }
    };

    const handleClearLogs = () => {
        if (confirm("Clear all logs? This cannot be undone.")) {
            clearMut.mutate();
        }
    };

    const handleExport = () => {
        exportMut.mutate({
            severity: severityFilter !== "all" ? severityFilter : undefined,
            module: moduleFilter !== "all" ? moduleFilter : undefined,
            start_date: dateFrom || undefined,
            end_date: dateTo || undefined
        });
    };

    const handleSeverityClick = (sev: string) => {
        setSeverityFilter(severityFilter === sev ? "all" : sev);
    };

    return (
        <>
            <style>{GS}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>System Logs</h1>
                        <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                            {logs.length} log entries · {logs.filter(l => l.severity === "error").length} errors
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "0 14px",
                                height: 34,
                                border: `1px solid ${showFilters ? C.tealBorder : C.border}`,
                                borderRadius: 9,
                                background: showFilters ? C.tealBg : C.bg,
                                fontSize: 12,
                                fontWeight: 500,
                                color: showFilters ? C.tealText : C.muted,
                                cursor: "pointer",
                                fontFamily: "inherit"
                            }}
                        >
                            <Filter size={13} />
                            Filters
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exportMut.isPending || filtered.length === 0}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "0 14px",
                                height: 34,
                                border: `1px solid ${C.border}`,
                                borderRadius: 9,
                                background: C.bg,
                                fontSize: 12,
                                fontWeight: 500,
                                color: C.muted,
                                cursor: exportMut.isPending || filtered.length === 0 ? "not-allowed" : "pointer",
                                opacity: exportMut.isPending || filtered.length === 0 ? 0.5 : 1,
                                fontFamily: "inherit"
                            }}
                        >
                            <Download size={13} />
                            {exportMut.isPending ? "Exporting..." : "Export"}
                        </button>
                        <button
                            onClick={handleClearLogs}
                            disabled={clearMut.isPending}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "0 14px",
                                height: 34,
                                borderRadius: 9,
                                border: `1px solid ${C.redBorder}`,
                                background: C.redBg,
                                fontSize: 12,
                                fontWeight: 500,
                                color: C.redText,
                                cursor: clearMut.isPending ? "not-allowed" : "pointer",
                                opacity: clearMut.isPending ? 0.5 : 1,
                                fontFamily: "inherit"
                            }}
                        >
                            <Trash2 size={13} />
                            {clearMut.isPending ? "Clearing..." : "Clear Logs"}
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                    {Object.entries(SEVERITY_CFG).map(([sev, cfg]) => {
                        const Icon = cfg.icon;
                        const count = logs.filter(l => l.severity === sev).length;
                        const isActive = severityFilter === sev;

                        return (
                            <KPI
                                key={sev}
                                label={cfg.label}
                                value={count}
                                icon={Icon}
                                color={cfg.color}
                                sub={isActive ? "Filter active" : "Click to filter"}
                                onClick={() => handleSeverityClick(sev)}
                            />
                        );
                    })}
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div style={{
                        background: C.bg,
                        border: `1px solid ${C.tealBorder}`,
                        borderRadius: 12,
                        padding: "16px 18px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 12,
                        animation: "fadeUp .2s ease both"
                    }}>
                        <F label="Date from">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="inp"
                                style={IS}
                            />
                        </F>
                        <F label="Date to">
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="inp"
                                style={IS}
                            />
                        </F>
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                            <button
                                onClick={() => {
                                    setDateFrom("");
                                    setDateTo("");
                                    setSearch("");
                                    setSeverityFilter("all");
                                    setModuleFilter("all");
                                }}
                                style={{
                                    height: 38,
                                    padding: "0 16px",
                                    borderRadius: 9,
                                    border: `1px solid ${C.border}`,
                                    background: C.bgMuted,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: C.muted,
                                    cursor: "pointer",
                                    fontFamily: "inherit"
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Module filters */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <SearchB
                        value={search}
                        onChange={setSearch}
                        placeholder="Search message or module…"
                        width={260}
                    />
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button
                            key="all"
                            onClick={() => setModuleFilter("all")}
                            style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                border: `1px solid ${moduleFilter === "all" ? C.tealBorder : C.border}`,
                                background: moduleFilter === "all" ? C.tealBg : C.bg,
                                color: moduleFilter === "all" ? C.tealText : C.muted,
                                cursor: "pointer",
                                fontFamily: "inherit"
                            }}
                        >
                            All Modules
                        </button>
                        {MODULES.map(m => (
                            <button
                                key={m}
                                onClick={() => setModuleFilter(m)}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 8,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    border: `1px solid ${moduleFilter === m ? C.tealBorder : C.border}`,
                                    background: moduleFilter === m ? C.tealBg : C.bg,
                                    color: moduleFilter === m ? C.tealText : C.muted,
                                    cursor: "pointer",
                                    fontFamily: "inherit"
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logs list */}
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                    {isLoading && <TLoad />}
                    {!isLoading && filtered.length === 0 && (
                        <TEmpty icon={FileText} text={logs.length === 0 ? "No logs available" : "No logs match your filters"} />
                    )}
                    {!isLoading && filtered.map((log: LogEntry, i: number) => {
                        const cfg = SEVERITY_CFG[log.severity] ?? SEVERITY_CFG.info;
                        const Icon = cfg.icon;
                        const expanded = expandedLog === log.id;

                        return (
                            <div
                                key={log.id}
                                className="log-r"
                                style={{
                                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                                    transition: "background .1s"
                                }}
                            >
                                <div
                                    onClick={() => setExpandedLog(expanded ? null : log.id)}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "140px 110px 120px 1fr 110px",
                                        padding: "11px 18px",
                                        alignItems: "center",
                                        cursor: "pointer"
                                    }}
                                >
                                    <span style={{ fontSize: 11, color: C.faint, fontFamily: "monospace" }}>
                                        {formatTime(log.timestamp)}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <Icon size={12} color={cfg.color} />
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "2px 7px",
                                            borderRadius: 100,
                                            background: cfg.bg,
                                            color: cfg.color,
                                            border: `1px solid ${cfg.border}`
                                        }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding: "2px 7px",
                                        borderRadius: 100,
                                        background: C.purpleBg,
                                        color: C.purpleText,
                                        border: `1px solid ${C.purpleBorder}`,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>
                                        {log.module ?? "System"}
                                    </span>
                                    <p style={{
                                        fontSize: 12,
                                        color: C.text,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {log.message}
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                                        <span style={{ fontSize: 10, color: C.faint }}>
                                            User: {log.user_name ?? "System"}
                                        </span>
                                        {log.stack_trace && <AlertCircle size={11} color={C.faint} />}
                                    </div>
                                </div>
                                {expanded && log.stack_trace && (
                                    <div style={{
                                        padding: "12px 18px",
                                        background: C.bgMuted,
                                        borderTop: `1px solid ${C.border}`
                                    }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
                                            STACK TRACE
                                        </p>
                                        <pre style={{
                                            fontSize: 10,
                                            color: C.text,
                                            fontFamily: "monospace",
                                            lineHeight: 1.5,
                                            overflow: "auto",
                                            background: C.bg,
                                            padding: "8px 10px",
                                            borderRadius: 6,
                                            border: `1px solid ${C.border}`,
                                            margin: 0
                                        }}>
                                            {log.stack_trace}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}