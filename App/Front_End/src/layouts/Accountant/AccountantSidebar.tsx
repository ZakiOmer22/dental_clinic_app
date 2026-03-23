// src/layouts/Accountant/AccountantSidebar.tsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, ReceiptText, BarChart3, ChevronLeft,
  FileText, CreditCard, TrendingUp, DollarSign, Shield,
  FileCheck, CheckCircle, Package, Database, Settings,
  AlertCircle, BookOpen, Undo2, Calculator, FilePlus,
  Eye, Wallet, Landmark, PieChart, FileSpreadsheet,
  Printer, Download, RefreshCw, Search, Filter
} from "lucide-react";
import { useUIStore, useAuthStore } from "@/app/store";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Dental Clinic Portal";

// ACCOUNTANT ROUTES
const ACCOUNTANT_NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/accountant/reports", label: "Financial Reports", icon: BarChart3 },
      { path: "/accountant/invoices", label: "Invoices", icon: ReceiptText },
    ],
  },
  {
    label: "Billing",
    items: [
      { path: "/accountant/invoices/create", label: "Create Invoice", icon: FilePlus },
      { path: "/accountant/invoices/list", label: "All Invoices", icon: FileText },
      { path: "/accountant/invoices/unpaid", label: "Unpaid Invoices", icon: AlertCircle },
      { path: "/accountant/payments", label: "Record Payment", icon: CreditCard },
      { path: "/accountant/refunds", label: "Refunds", icon: Undo2 },
    ],
  },
  {
    label: "Insurance",
    items: [
      { path: "/accountant/insurance/claims", label: "Insurance Claims", icon: Shield },
      { path: "/accountant/insurance/policies", label: "Policies", icon: FileCheck },
      { path: "/accountant/insurance/verification", label: "Verify Coverage", icon: CheckCircle },
    ],
  },
  {
    label: "Financial Management",
    items: [
      { path: "/accountant/expenses", label: "Expenses", icon: DollarSign },
      { path: "/accountant/revenue", label: "Revenue Reports", icon: TrendingUp },
      { path: "/accountant/patient-balance", label: "Patient Balances", icon: Users },
      { path: "/accountant/tax-reports", label: "Tax Reports", icon: Calculator },
    ],
  },
  {
    label: "Administration",
    items: [
      { path: "/accountant/procedures", label: "Service Prices", icon: Package },
      { path: "/accountant/inventory/valuation", label: "Inventory Value", icon: Database },
      { path: "/accountant/audit-logs", label: "Audit Trail", icon: Shield },
      { path: "/accountant/financial-settings", label: "Financial Settings", icon: Settings },
    ],
  },
  {
    label: "Support",
    items: [
      { path: "/accountant/support/knowledge", label: "Knowledge Base", icon: BookOpen },
      { path: "/accountant/support/feedback", label: "Feedback", icon: AlertCircle },
    ],
  },
];

export default function AccountantSidebar() {
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
      {/* Logo */}
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
            }}>
              {APP_NAME}
            </p>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>
              Accountant Portal
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
        {ACCOUNTANT_NAV_SECTIONS.map((section) => (
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

      {/* Footer */}
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