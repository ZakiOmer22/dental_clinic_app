import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  ReceiptText, BarChart3, ChevronLeft, Package,
  FlaskConical, FileText, Bell, Settings, UserCog,
  ClipboardList, Wallet, HelpCircle, Shield, Database,
  HardDrive, Terminal, LifeBuoy, Mail, MessageSquare,
  BookOpen, AlertCircle, CheckCircle, Download, Upload,
  Crown
} from "lucide-react";
import { useUIStore, useAuthStore } from "@/app/store";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Daryeel App";

function ToothIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="currentColor">
      <path d="M20 2C15 2 10 6 10 12c0 3 .8 5.5 2 7.5L14 42h12l2-22.5c1.2-2 2-4.5 2-7.5 0-6-5-10-10-10z" />
      <path d="M14 22h12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/appointments", label: "Appointments", icon: CalendarDays },
      { path: "/patients", label: "Patients", icon: Users },
      { path: "/treatments", label: "Treatments", icon: Stethoscope },
    ],
  },
  {
    label: "Finance",
    items: [
      { path: "/billing", label: "Billing", icon: ReceiptText },
      { path: "/expenses", label: "Expenses", icon: Wallet },
    ],
  },
  {
    label: "Clinical",
    items: [
      { path: "/prescriptions", label: "Prescriptions", icon: ClipboardList },
      { path: "/lab-orders", label: "Lab Orders", icon: FlaskConical },
      { path: "/consent-forms", label: "Consent Forms", icon: FileText },
      { path: "/referrals", label: "Referrals", icon: Users },
    ],
  },
  {
    label: "Operations",
    items: [
      { path: "/inventory", label: "Inventory", icon: Package },
      { path: "/notifications", label: "Notifications", icon: Bell },
      { path: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "System Management",
    items: [
      { path: "/system/backup", label: "Backup & Restore", icon: Database },
      { path: "/system/logs", label: "System Logs", icon: Terminal },
      { path: "/system/audit", label: "Audit Trail", icon: Shield },
      { path: "/system/storage", label: "Storage", icon: HardDrive },
      { path: "/system/monitoring", label: "Health Monitor", icon: Activity },
    ],
  },
  {
    label: "Support",
    items: [
      { path: "/support/tickets", label: "Support Tickets", icon: LifeBuoy },
      { path: "/support/knowledge", label: "Knowledge Base", icon: BookOpen },
      { path: "/support/chat", label: "Live Chat", icon: MessageSquare },
      { path: "/support/email", label: "Email Support", icon: Mail },
      { path: "/support/feedback", label: "Feedback", icon: AlertCircle },
    ],
  },
  {
    label: "Admin",
    items: [
      { path: "/staff", label: "Staff", icon: UserCog },
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/users", label: "Users", icon: Users },
    ],
  },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      style={{
        width: sidebarOpen ? 256 : 68,
        transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
        position: "fixed", left: 0, top: 0, height: "100%",
        background: "#111816",
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
          {/* <ToothIcon size={17} /> */}
          <img src="/icon.png" alt="Logo" style={{ width: 40, height: 40 }} />
        </div>
        {sidebarOpen && (
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontWeight: 700, fontSize: 13, color: "white",
              letterSpacing: "-.01em", lineHeight: 1.25,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {APP_NAME}
            </p>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>
              Clinic Management
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {sidebarOpen ? (
              <p style={{
                fontSize: 9.5, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                padding: "12px 16px 3px",
              }}>
                {section.label}
              </p>
            ) : (
              /* collapsed: thin separator line between sections */
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "6px 12px" }} />
            )}

            {section.items.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
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
                  background: isActive ? "rgba(13,158,117,0.18)" : "transparent",
                  borderLeft: isActive && sidebarOpen
                    ? "2px solid #0d9e75"
                    : "2px solid transparent",
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
                      style={{ flexShrink: 0, color: isActive ? "#0d9e75" : "inherit" }}
                    />
                    {sidebarOpen && (
                      <span style={{
                        whiteSpace: "nowrap", overflow: "hidden",
                        textOverflow: "ellipsis", flex: 1,
                      }}>
                        {label}
                      </span>
                    )}
                    {/* Active indicator dot when collapsed */}
                    {!sidebarOpen && isActive && (
                      <span style={{
                        position: "absolute", right: 4, top: "50%",
                        transform: "translateY(-50%)",
                        width: 4, height: 4, borderRadius: "50%",
                        background: "#0d9e75",
                      }} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer: Powered by + Collapse ────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 8px 10px",
        flexShrink: 0,
      }}>
        {sidebarOpen && (
          <p style={{
            textAlign: "center",
            fontSize: 12,
            color: "rgba(255,255,255,0.18)",
            marginBottom: 6,
            letterSpacing: "0.03em",
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

// Add missing Activity icon since it wasn't imported
function Activity({ size = 15, strokeWidth = 1.8, style }: { size?: number; strokeWidth?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}