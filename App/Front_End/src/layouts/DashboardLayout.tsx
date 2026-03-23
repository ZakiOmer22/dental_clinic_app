import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUIStore } from "@/app/store";

export default function DashboardLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f2f1", overflow: "hidden" }}>
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
        </main>
      </div>
    </div>
  );
}