import { Outlet } from "react-router-dom";
import AssistantSidebar from "./AssistanceSidebar";
import AssistantTopbar from "./AssistanceTopbar";
import { useUIStore } from "@/app/store";
import { AIAssistant } from "@/ai/AIAssistant";

export default function AssistantLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#f0f2f1",
      overflow: "hidden"
    }}>
      <AIAssistant />
      <AssistantSidebar />
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
        <AssistantTopbar />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <Outlet />

          {/* Elegant Footer */}
          <div style={{
            marginTop: 48,
            padding: "24px 0 16px",
            borderTop: "1px solid rgba(13, 158, 117, 0.15)",
            position: "relative",
          }}>
            {/* Decorative line */}
            <div style={{
              position: "absolute",
              top: -1,
              left: "10%",
              width: "80%",
              height: 2,
              background: "linear-gradient(90deg, transparent, #0d9e75, #0a7d5d, #0d9e75, transparent)",
              borderRadius: "50%",
            }} />

            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(13, 158, 117, 0.05)",
                padding: "8px 20px",
                borderRadius: 100,
                backdropFilter: "blur(4px)",
              }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 500,
                  background: "linear-gradient(135deg, #0d9e75, #0a7d5d)",
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
                  background: "linear-gradient(135deg, #0d9e75, #0a7d5d, #065f46)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  letterSpacing: "1px",
                }}>
                  eALIF Team Solutions
                </span>
                <span style={{
                  fontSize: 11,
                  color: "#0d9e75",
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
                Empowering Dental Professionals • Precision • Care • Excellence
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}