// ══════════════════════════════════════════════════════════════════════════════
// AUDIT TRAIL PAGE - COMPLETE FIXED VERSION
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Shield, User, FileText, Search, X, Calendar, Download,
    Filter, Eye, Edit, Trash2, Plus, Clock, Database, AlertCircle
} from "lucide-react";
import { apiGetAuditLogs, apiExportAuditLogs, type AuditEntry } from "@/api/audit";
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

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.audit-r:hover{background:${C.bgMuted}!important}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const ACTION_CFG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
    create: { icon: Plus, color: C.tealText, bg: C.tealBg, border: C.tealBorder, label: "Created" },
    update: { icon: Edit, color: C.amberText, bg: C.amberBg, border: C.amberBorder, label: "Updated" },
    delete: { icon: Trash2, color: C.redText, bg: C.redBg, border: C.redBorder, label: "Deleted" },
    view: { icon: Eye, color: C.blueText, bg: C.blueBg, border: C.blueBorder, label: "Viewed" },
    login: { icon: User, color: C.purpleText, bg: C.purpleBg, border: C.purpleBorder, label: "Login" },
    logout: { icon: User, color: C.gray, bg: C.grayBg, border: C.border, label: "Logout" },
    export: { icon: Download, color: C.blueText, bg: C.blueBg, border: C.blueBorder, label: "Exported" },
    backup: { icon: Database, color: C.tealText, bg: C.tealBg, border: C.tealBorder, label: "Backup" },
    restore: { icon: Database, color: C.tealText, bg: C.tealBg, border: C.tealBorder, label: "Restored" },
    clear: { icon: Trash2, color: C.redText, bg: C.redBg, border: C.redBorder, label: "Cleared" },
};

const RESOURCES = [
    "Patient", "Appointment", "Invoice", "Prescription", "User",
    "Staff", "Inventory", "Lab Order", "Consent Form", "Referral",
    "Backup", "Settings", "Clinic", "Payment", "Report", "Audit"
];

// ── Helper functions ─────────────────────────────────────────────────────────
const formatDateForComparison = (date: string) => {
    return new Date(date).setHours(0, 0, 0, 0);
};

const isDateInRange = (date: string, from: string, to: string) => {
    const logDate = new Date(date).getTime();
    const fromDate = from ? new Date(from).getTime() : null;
    const toDate = to ? new Date(to + "T23:59:59").getTime() : null;

    if (fromDate && logDate < fromDate) return false;
    if (toDate && logDate > toDate) return false;
    return true;
};

// ── Shared components ─────────────────────────────────────────────────────────
function Avi({ name, size = 28 }: { name: string; size?: number }) {
    const gradients = [
        "linear-gradient(135deg,#0d9e75,#0a7d5d)",
        "linear-gradient(135deg,#3b82f6,#1d4ed8)",
        "linear-gradient(135deg,#8b5cf6,#5b21b6)",
        "linear-gradient(135deg,#f59e0b,#92400e)"
    ];

    const initials = useMemo(() => {
        return (name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    }, [name]);

    const gradientIndex = useMemo(() => {
        return (name?.charCodeAt(0) ?? 0) % gradients.length;
    }, [name]);

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: gradients[gradientIndex],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * .35,
            fontWeight: 700,
            color: "white",
            flexShrink: 0
        }}>
            {initials}
        </div>
    );
}

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

function KPI({ label, value, icon: Icon, color, sub, onClick, active }: {
    label: string;
    value: any;
    icon: any;
    color: string;
    sub?: string;
    onClick?: () => void;
    active?: boolean;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                background: active ? color + '08' : C.bg,
                border: `1px solid ${active ? color : C.border}`,
                borderRadius: 12,
                padding: "15px 16px",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.2s"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <span style={{ fontSize: 11, color: active ? color : C.muted, fontWeight: 600 }}>{label}</span>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: active ? color + '20' : color + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <Icon size={13} color={active ? color : color} strokeWidth={1.8} />
                </div>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>
                {value}
            </p>
            {sub && <p style={{ fontSize: 11, color: active ? color : C.faint, marginTop: 4 }}>{sub}</p>}
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

export function AuditTrailPage() {
    const user = useAuthStore(s => s.user);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [resourceFilter, setResourceFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [expandedAudit, setExpandedAudit] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["audit-trail", actionFilter, resourceFilter, userFilter, dateFrom, dateTo],
        queryFn: () => apiGetAuditLogs({
            action: actionFilter !== "all" ? actionFilter : undefined,
            tableName: resourceFilter !== "all" ? resourceFilter : undefined,
            userId: userFilter !== "all" ? parseInt(userFilter) : undefined,
            from: dateFrom || undefined,
            to: dateTo || undefined,
            search: search || undefined
        }),
        staleTime: 30000
    });

    const audits: AuditEntry[] = data?.data ?? [];

    // Handle error toast - using useEffect to prevent state update during render
    useEffect(() => {
        if (error) {
            toast.error("Failed to load audit trail");
        }
    }, [error]);

    // Memoize filtered data - client-side filtering as backup
    const filtered = useMemo(() => {
        if (!audits.length) return [];

        return audits.filter(a => {
            // Search filter (client-side fallback)
            if (search) {
                const searchLower = search.toLowerCase();
                const descriptionMatch = a.description?.toLowerCase().includes(searchLower);
                const resourceMatch = a.table_name?.toLowerCase().includes(searchLower);
                const userMatch = a.user_name?.toLowerCase().includes(searchLower);
                if (!descriptionMatch && !resourceMatch && !userMatch) return false;
            }

            // Date filter (client-side fallback)
            if (dateFrom || dateTo) {
                if (!isDateInRange(a.created_at, dateFrom, dateTo)) return false;
            }

            return true;
        });
    }, [audits, search, dateFrom, dateTo]);

    // Memoize unique users
    const uniqueUsers = useMemo(() => {
        return [...new Set(audits.map(a => a.user_name))].filter(Boolean);
    }, [audits]);

    // Memoize unique resources
    const uniqueResources = useMemo(() => {
        return [...new Set(audits.map(a => a.table_name))].filter(Boolean);
    }, [audits]);

    // Memoize KPIs
    const kpis = useMemo(() => {
        const today = new Date().toDateString();
        const todayCount = audits.filter(a => new Date(a.created_at).toDateString() === today).length;
        const resourceCount = uniqueResources.length;

        return {
            total: audits.length,
            today: todayCount,
            users: uniqueUsers.length,
            resources: resourceCount
        };
    }, [audits, uniqueResources.length, uniqueUsers.length]);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const blob = await apiExportAuditLogs({
                action: actionFilter !== "all" ? actionFilter : undefined,
                tableName: resourceFilter !== "all" ? resourceFilter : undefined,
                userId: userFilter !== "all" ? parseInt(userFilter) : undefined,
                from: dateFrom || undefined,
                to: dateTo || undefined,
                search: search || undefined
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Audit trail exported");
        } catch (err) {
            toast.error("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handleClearFilters = () => {
        setDateFrom("");
        setDateTo("");
        setSearch("");
        setUserFilter("all");
        setActionFilter("all");
        setResourceFilter("all");
    };

    const handleActionFilterClick = (action: string) => {
        setActionFilter(prev => prev === action ? "all" : action);
    };

    const handleResourceFilterClick = (resource: string) => {
        setResourceFilter(prev => prev === resource ? "all" : resource);
    };

    const handleUserFilterClick = (userName: string) => {
        setUserFilter(prev => prev === userName ? "all" : userName);
    };

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

    const toggleExpand = (id: number) => {
        setExpandedAudit(prev => prev === id ? null : id);
    };

    return (
        <>
            <style>{GS}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Audit Trail</h1>
                        <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                            {kpis.total} activities tracked · {kpis.users} active users
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
                            disabled={isExporting || filtered.length === 0}
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
                                cursor: isExporting || filtered.length === 0 ? "not-allowed" : "pointer",
                                opacity: isExporting || filtered.length === 0 ? 0.5 : 1,
                                fontFamily: "inherit"
                            }}
                        >
                            <Download size={13} />
                            {isExporting ? "Exporting..." : "Export"}
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                    <KPI
                        label="Total Activities"
                        value={kpis.total}
                        icon={Shield}
                        color={C.teal}
                        sub="All tracked actions"
                    />
                    <KPI
                        label="Today"
                        value={kpis.today}
                        icon={Calendar}
                        color={C.blue}
                        sub="Actions today"
                    />
                    <KPI
                        label="Active Users"
                        value={kpis.users}
                        icon={User}
                        color={C.purple}
                        sub="Contributing users"
                    />
                    <KPI
                        label="Resources"
                        value={kpis.resources}
                        icon={FileText}
                        color={C.amber}
                        sub="Different types"
                    />
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div style={{
                        background: C.bg,
                        border: `1px solid ${C.tealBorder}`,
                        borderRadius: 12,
                        padding: "16px 18px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
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
                        <F label="User">
                            <select
                                value={userFilter}
                                onChange={e => setUserFilter(e.target.value)}
                                className="inp"
                                style={{ ...IS, cursor: "pointer" }}
                            >
                                <option value="all">All Users</option>
                                {uniqueUsers.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </F>
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                            <button
                                onClick={handleClearFilters}
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

                {/* Search and filter chips */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <SearchB
                        value={search}
                        onChange={setSearch}
                        placeholder="Search description, resource or user…"
                        width={300}
                    />

                    {/* Action filters */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button
                            onClick={() => setActionFilter("all")}
                            style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                border: `1px solid ${actionFilter === "all" ? C.tealBorder : C.border}`,
                                background: actionFilter === "all" ? C.tealBg : C.bg,
                                color: actionFilter === "all" ? C.tealText : C.muted,
                                cursor: "pointer",
                                fontFamily: "inherit"
                            }}
                        >
                            All Actions
                        </button>
                        {Object.entries(ACTION_CFG).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => handleActionFilterClick(key)}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 8,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    border: `1px solid ${actionFilter === key ? cfg.border : C.border}`,
                                    background: actionFilter === key ? cfg.bg : C.bg,
                                    color: actionFilter === key ? cfg.color : C.muted,
                                    cursor: "pointer",
                                    fontFamily: "inherit"
                                }}
                            >
                                {cfg.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ width: 1, height: 20, background: C.border }} />

                    {/* Resource filters */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button
                            onClick={() => setResourceFilter("all")}
                            style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                border: `1px solid ${resourceFilter === "all" ? C.purpleBorder : C.border}`,
                                background: resourceFilter === "all" ? C.purpleBg : C.bg,
                                color: resourceFilter === "all" ? C.purpleText : C.muted,
                                cursor: "pointer",
                                fontFamily: "inherit"
                            }}
                        >
                            All Resources
                        </button>
                        {RESOURCES.slice(0, 8).map(r => (
                            <button
                                key={r}
                                onClick={() => handleResourceFilterClick(r)}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 8,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    border: `1px solid ${resourceFilter === r ? C.purpleBorder : C.border}`,
                                    background: resourceFilter === r ? C.purpleBg : C.bg,
                                    color: resourceFilter === r ? C.purpleText : C.muted,
                                    cursor: "pointer",
                                    fontFamily: "inherit"
                                }}
                            >
                                {r}
                            </button>
                        ))}
                        {RESOURCES.length > 8 && (
                            <span style={{ fontSize: 11, color: C.faint, padding: "4px 5px" }}>
                                +{RESOURCES.length - 8} more
                            </span>
                        )}
                    </div>
                </div>

                {/* Audit list */}
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                    {isLoading && <TLoad />}
                    {!isLoading && filtered.length === 0 && (
                        <TEmpty
                            icon={Shield}
                            text={audits.length === 0 ? "No audit entries found" : "No entries match your filters"}
                        />
                    )}
                    {!isLoading && filtered.map((audit: AuditEntry, i: number) => {
                        const cfg = ACTION_CFG[audit.action] ?? ACTION_CFG.view;
                        const Icon = cfg.icon;
                        const expanded = expandedAudit === audit.id;
                        const hasChanges = audit.old_values || audit.new_values;

                        return (
                            <div
                                key={audit.id}
                                className="audit-r"
                                style={{
                                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                                    transition: "background .1s"
                                }}
                            >
                                <div
                                    onClick={() => toggleExpand(audit.id)}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "50px 140px 110px 120px 2fr 1fr",
                                        padding: "11px 18px",
                                        alignItems: "center",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Avi name={audit.user_name ?? "?"} size={32} />
                                    <span style={{ fontSize: 11, color: C.faint, fontFamily: "monospace" }}>
                                        {formatTime(audit.created_at)}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <Icon size={11} color={cfg.color} />
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
                                        {audit.table_name}
                                    </span>
                                    <p style={{
                                        fontSize: 12,
                                        color: C.text,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {audit.description || `${audit.action} on ${audit.table_name}`}
                                        {audit.record_id && (
                                            <span style={{ marginLeft: 4, color: C.blue, fontSize: 10 }}>
                                                ID: {audit.record_id}
                                            </span>
                                        )}
                                        {hasChanges && (
                                            <span style={{ marginLeft: 8, color: C.amber, fontSize: 10 }}>
                                                (modified)
                                            </span>
                                        )}
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>
                                            {audit.user_name || 'System'}
                                        </span>
                                        {audit.ip_address && (
                                            <span style={{ fontSize: 10, color: C.faint, fontFamily: "monospace" }}>
                                                {audit.ip_address}
                                            </span>
                                        )}
                                        {hasChanges && <AlertCircle size={11} color={C.faint} />}
                                    </div>
                                </div>

                                {expanded && hasChanges && (
                                    <div style={{
                                        padding: "12px 18px",
                                        background: C.bgMuted,
                                        borderTop: `1px solid ${C.border}`
                                    }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
                                            DETAILS
                                        </p>
                                        <div style={{
                                            background: C.bg,
                                            border: `1px solid ${C.border}`,
                                            borderRadius: 6,
                                            padding: "10px 12px"
                                        }}>
                                            <pre style={{
                                                fontSize: 11,
                                                color: C.text,
                                                fontFamily: "monospace",
                                                lineHeight: 1.5,
                                                margin: 0,
                                                whiteSpace: "pre-wrap"
                                            }}>
                                                {JSON.stringify({
                                                    old: audit.old_values,
                                                    new: audit.new_values
                                                }, null, 2)}
                                            </pre>
                                        </div>
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