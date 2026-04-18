// src/layouts/SuperAdminSidebar.tsx
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard, Building2, CreditCard, ChevronLeft,
    Settings, Shield, Database, HardDrive, Activity,
    Users, BarChart3, Globe, Server, Key, Lock,
    Clock,
    Receipt,
    DollarSign,
    TrendingUp,
    MessageSquare,
    LifeBuoy,
    FileText
} from "lucide-react";
import { useUIStore, useAuthStore } from "@/app/store";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Dental Clinic Portal";

interface NavItem {
    path: string;
    label: string;
    icon: any;
    badge?: React.ReactNode;
}

interface NavSection {
    label: string;
    items: NavItem[];
}

// SUPER ADMIN ONLY - Platform level navigation
const SUPER_ADMIN_NAV: NavSection[] = [
    {
        label: "Dashboard",
        items: [
            { path: "/admin/platform", label: "Overview", icon: LayoutDashboard },
        ],
    },
    {
        label: "Clinics",
        items: [
            { path: "/admin/clinics", label: "All Clinics", icon: Building2 },
            { path: "/admin/pending", label: "Pending Approval", icon: Clock },
        ],
    },
    {
        label: "Billing",
        items: [
            { path: "/settings/billing", label: "Plans & Pricing", icon: CreditCard },
            { path: "/admin/invoices", label: "Invoices", icon: Receipt },
            { path: "/admin/payments", label: "Payments", icon: DollarSign },
        ],
    },
    {
        label: "Reports",
        items: [
            { path: "/admin/reports/revenue", label: "Revenue Report", icon: TrendingUp },
            { path: "/admin/reports/usage", label: "Clinic Usage", icon: BarChart3 },
            { path: "/admin/reports/growth", label: "Growth Analytics", icon: TrendingUp },
        ],
    },
    {
        label: "Management",
        items: [
            { path: "/admin/users", label: "Staff Accounts", icon: Users },
            { path: "/admin/requests", label: "Feature Requests", icon: MessageSquare },
            { path: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
        ],
    },
    {
        label: "Settings",
        items: [
            { path: "/admin/settings", label: "Platform Settings", icon: Settings },
            { path: "/admin/audit", label: "Activity Log", icon: FileText },
        ],
    },
];

export default function SuperAdminSidebar() {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const user = useAuthStore((s) => s.user);
 
    return (
        <aside
            style={{
                width: sidebarOpen ? 256 : 68,
                transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
                position: "fixed", left: 0, top: 0, height: "100%",
                background: "#0a0f0c",
                zIndex: 40,
                display: "flex", flexDirection: "column",
                overflow: "hidden",
                borderRight: "1px solid rgba(255,255,255,0.05)",
            }}
        >
            {/* ── Logo ─────────────────────────────────────────── */}
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: sidebarOpen ? "16px 14px" : "16px 0",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
                minHeight: 60,
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 9,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <img src="/icon.png" alt="Logo" style={{ width: 40, height: 40 }} />
                </div>
                {sidebarOpen && (
                    <div style={{ minWidth: 0 }}>
                        <p style={{
                            fontWeight: 700, fontSize: 13, color: "white",
                            letterSpacing: "-.01em", lineHeight: 1.25,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            margin: 0,
                        }}>
                            {APP_NAME}
                        </p>
                        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.3, margin: 0 }}>
                            SUPER ADMIN
                        </p>
                    </div>
                )}
            </div>
 
            {/* ── Navigation ───────────────────────────────────── */}
            <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
                {SUPER_ADMIN_NAV.map((section) => (
                    <div key={section.label}>
                        {sidebarOpen ? (
                            <p style={{
                                fontSize: 9.5, fontWeight: 700,
                                letterSpacing: "0.12em", textTransform: "uppercase",
                                color: "rgba(255,255,255,0.2)",
                                padding: "12px 16px 3px",
                                margin: 0,
                            }}>
                                {section.label}
                            </p>
                        ) : (
                            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "6px 12px" }} />
                        )}
 
                        {section.items.map(({ path, label, icon: Icon, badge }) => (
                            <NavLink
                                key={path}
                                to={path}
                                end={path === "/admin/platform"}
                                style={({ isActive }) => ({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: sidebarOpen ? 9 : 0,
                                    justifyContent: sidebarOpen ? "flex-start" : "center",
                                    padding: sidebarOpen ? "7px 10px 7px 12px" : "8px 0",
                                    margin: sidebarOpen ? "1px 8px" : "1px 6px",
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)",
                                    background: isActive ? "rgba(139, 92, 246, 0.18)" : "transparent",
                                    borderLeft: isActive && sidebarOpen ? "2px solid #8b5cf6" : "2px solid transparent",
                                    textDecoration: "none",
                                    transition: "background 0.12s, color 0.12s",
                                    position: "relative",
                                })}
                                onMouseEnter={(e) => {
                                    const el = e.currentTarget;
                                    if (!el.getAttribute("aria-current")) {
                                        el.style.background = "rgba(255,255,255,0.07)";
                                        el.style.color = "rgba(255,255,255,0.85)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const el = e.currentTarget;
                                    if (!el.getAttribute("aria-current")) {
                                        el.style.background = "transparent";
                                        el.style.color = "rgba(255,255,255,0.45)";
                                    }
                                }}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            size={15}
                                            strokeWidth={isActive ? 2.2 : 1.8}
                                            style={{ flexShrink: 0, color: isActive ? "#8b5cf6" : "inherit" }}
                                        />
                                        {sidebarOpen && (
                                            <span style={{
                                                whiteSpace: "nowrap", overflow: "hidden",
                                                textOverflow: "ellipsis", flex: 1,
                                            }}>
                                                {label}
                                            </span>
                                        )}
                                        {/* Badge (e.g. "3" for pending) */}
                                        {sidebarOpen && badge && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 700,
                                                background: "#8b5cf6", color: "white",
                                                borderRadius: 100, padding: "1px 6px",
                                                flexShrink: 0,
                                            }}>
                                                {badge}
                                            </span>
                                        )}
                                        {!sidebarOpen && isActive && (
                                            <span style={{
                                                position: "absolute", right: 4, top: "50%",
                                                transform: "translateY(-50%)",
                                                width: 4, height: 4, borderRadius: "50%",
                                                background: "#8b5cf6",
                                            }} />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>
 
            {/* ── User identity strip ───────────────────────────── */}
            {sidebarOpen && user && (
                <div style={{
                    padding: "10px 14px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", gap: 10,
                    flexShrink: 0,
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "rgba(139,92,246,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#8b5cf6", flexShrink: 0,
                    }}>
                        {user.fullName?.[0] ?? "S"}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user.fullName}
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Super Admin</p>
                    </div>
                </div>
            )}
 
            {/* ── Footer: Powered by + Collapse ────────────────── */}
            <div style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                padding: "8px 8px 10px",
                flexShrink: 0,
            }}>
                {sidebarOpen && (
                    <p style={{
                        textAlign: "center", fontSize: 12,
                        color: "rgba(255,255,255,0.18)",
                        marginBottom: 6, letterSpacing: "0.03em",
                        margin: "0 0 6px",
                    }}>
                        Powered by{" "}
                        <span style={{ color: "#FEFEFE", fontWeight: 700 }}>eALIF Team</span>
                    </p>
                )}
                <button
                    onClick={toggleSidebar}
                    title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    style={{
                        width: "100%",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6,
                        padding: "6px 8px", borderRadius: 7,
                        background: "none", border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 11.5, fontFamily: "inherit",
                        transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                    }}
                >
                    <ChevronLeft
                        size={13}
                        style={{
                            transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
                            flexShrink: 0,
                        }}
                    />
                    {sidebarOpen && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}