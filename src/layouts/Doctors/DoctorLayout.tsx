import { Outlet } from "react-router-dom";
import Sidebar from "./DoctorSidebar";
import Topbar from "./DoctorTopbar";
import { useUIStore } from "@/app/store";
import { AIAssistant } from "@/ai/AIAssistant";

export default function DashboardLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f2f1", overflow: "hidden" }}>
      <AIAssistant />
      <Sidebar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          marginLeft: sidebarOpen ? 256 : 68,
          transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <Topbar />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <Outlet />

          {/* Elegant Footer */}
          <div style={{
            marginTop: 48,
            padding: "24px 0 16px",
            borderTop: "1px solid rgba(59, 130, 246, 0.15)",
            position: "relative",
          }}>
            {/* Decorative line */}
            <div style={{
              position: "absolute",
              top: -1,
              left: "10%",
              width: "80%",
              height: 2,
              background: "linear-gradient(90deg, transparent, #3b82f6, #1d4ed8, #3b82f6, transparent)",
              borderRadius: "50%",
            }} />

            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(59, 130, 246, 0.05)",
                padding: "8px 20px",
                borderRadius: 100,
                backdropFilter: "blur(4px)",
              }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 500,
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  letterSpacing: "0.5px",
                }}>
                  Powered by
                </span>
                <span style={{
                  fontSize: 15,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8, #1e3a8a)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  letterSpacing: "1px",
                }}>
                  eALIF Team Solutions
                </span>
                <span style={{
                  fontSize: 11,
                  color: "#3b82f6",
                  opacity: 0.7,
                }}>
                  © {new Date().getFullYear()}
                </span>
              </div>
              <p style={{
                fontSize: 11,
                color: "#94a3b8",
                marginTop: 12,
                letterSpacing: "0.3px",
              }}>
                Advanced Clinical Solutions • Innovation • Trust • Quality Care
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}