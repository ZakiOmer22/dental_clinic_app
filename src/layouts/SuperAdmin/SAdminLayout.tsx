import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "./SAdminSidebar";
import SuperAdminTopbar from "./SAdminTopbar";
import { useUIStore } from "@/app/store";
import { AIAssistant } from "@/ai/AIAssistant";

export default function SuperAdminLayout() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    return (
        <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f1", overflow: "hidden" }}>
            <AIAssistant />
            <SuperAdminSidebar />
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
                <SuperAdminTopbar />
                <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
                    <Outlet />

                    <div style={{
                        marginTop: 48,
                        padding: "24px 0 16px",
                        borderTop: "1px solid rgba(236, 72, 153, 0.15)",
                        position: "relative",
                    }}>
                        <div style={{
                            position: "absolute",
                            top: -1,
                            left: "10%",
                            width: "80%",
                            height: 2,
                            background: "linear-gradient(90deg, transparent, #ec4899, #db2777, #ec4899, transparent)",
                            borderRadius: "50%",
                        }} />

                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                backgroundColor: "rgba(236, 72, 153, 0.05)",
                                padding: "8px 20px",
                                borderRadius: 100,
                                backdropFilter: "blur(4px)",
                            }}>
                                <span style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    backgroundImage: "linear-gradient(135deg, #ec4899, #db2777)",
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
                                    backgroundImage: "linear-gradient(135deg, #ec4899, #db2777, #be185d)",
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    color: "transparent",
                                    letterSpacing: "1px",
                                }}>
                                    eALIF Team Solutions
                                </span>
                                <span style={{
                                    fontSize: 11,
                                    color: "#ec4899",
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
                                Enterprise Dental Management • Security • Scalability • Excellence
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}