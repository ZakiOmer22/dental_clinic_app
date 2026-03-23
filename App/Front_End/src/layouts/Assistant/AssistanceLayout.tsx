import { Outlet } from "react-router-dom";
import AssistantSidebar from "./AssistanceSidebar";
import AssistantTopbar from "./AssistanceTopbar";
import { useUIStore } from "@/app/store";

export default function AssistantLayout() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    return (
        <div style={{
            display: "flex",
            height: "100vh",
            background: "#f0f2f1",
            overflow: "hidden"
        }}>
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
                </main>
            </div>
        </div>
    );
}