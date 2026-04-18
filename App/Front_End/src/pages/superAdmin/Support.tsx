// Front_End/src/pages/superAdmin/SupportTickets.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy, Clock, MessageSquare, RefreshCw, Search } from "lucide-react";
import client from "@/api/client";
import toast from "react-hot-toast";

const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
};

function Badge({ label, variant }: { label: string; variant: string }) {
  const variants: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: C.tealBg, text: C.tealText, border: C.tealBorder },
    info: { bg: C.blueBg, text: C.blueText, border: C.blueBorder },
    warning: { bg: C.amberBg, text: C.amberText, border: C.amberBorder },
    error: { bg: C.redBg, text: C.redText, border: C.redBorder },
    neutral: { bg: C.bgMuted, text: C.muted, border: C.border },
    purple: { bg: C.purpleBg, text: C.purpleText, border: "#ddd6fe" },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: v.bg, color: v.text, border: `1px solid ${v.border}`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: 12, color: C.muted }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{value}</p>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={color} />
      </div>
    </div>
  );
}

export default function SupportTicketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "tickets"],
    queryFn: () => client.get('/api/v1/admin/tickets').then(r => r.data),
  });

  const tickets = data?.tickets || [];
  const filtered = tickets.filter((t: any) => {
    const matchesSearch = t.subject?.toLowerCase().includes(search.toLowerCase()) ||
                          t.clinic?.toLowerCase().includes(search.toLowerCase()) ||
                          t.id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t: any) => t.status === "open").length,
    inProgress: tickets.filter((t: any) => t.status === "in-progress").length,
    resolved: tickets.filter((t: any) => t.status === "resolved").length,
  };

  const STATUS_VARIANT: Record<string, string> = {
    open: "error", "in-progress": "warning", resolved: "success", closed: "neutral"
  };
  const PRIORITY_VARIANT: Record<string, string> = {
    urgent: "error", high: "warning", medium: "info", low: "neutral"
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .row-hover:hover { background: ${C.bgMuted} !important; }
        .inp:focus { border-color: ${C.purple} !important; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Support Tickets</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>Track and resolve clinic support requests</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {stats.open > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 20 }}>
                <LifeBuoy size={14} color={C.red} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.redText }}>{stats.open} open</span>
              </div>
            )}
            <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, color: C.muted, cursor: "pointer" }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <StatCard label="Total Tickets" value={stats.total} icon={LifeBuoy} color={C.purple} />
          <StatCard label="Open" value={stats.open} icon={Clock} color={C.red} />
          <StatCard label="In Progress" value={stats.inProgress} icon={MessageSquare} color={C.amber} />
          <StatCard label="Resolved" value={stats.resolved} icon={LifeBuoy} color={C.teal} />
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 280 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="inp"
                style={{ width: "100%", height: 34, padding: "0 12px 0 32px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 12, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              {["all", "open", "in-progress", "resolved", "closed"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, border: `1px solid ${statusFilter === s ? C.purple : C.border}`,
                    background: statusFilter === s ? C.purpleBg : "transparent", color: statusFilter === s ? C.purpleText : C.muted,
                    fontSize: 11, fontWeight: 500, cursor: "pointer", textTransform: "capitalize"
                  }}
                >
                  {s === "in-progress" ? "In Progress" : s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "100px 2fr 1fr 80px 70px 90px 100px", padding: "9px 20px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
            {["Ticket #", "Subject", "Clinic", "Category", "Priority", "Status", "Assigned"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.faint }}>Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <LifeBuoy size={36} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: C.faint }}>No tickets found</p>
            </div>
          ) : (
            filtered.map((ticket: any) => (
              <div key={ticket.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "100px 2fr 1fr 80px 70px 90px 100px", alignItems: "center", padding: "13px 20px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }} onClick={() => toast(`Opening ticket ${ticket.id}`)}>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: C.purpleText, fontWeight: 600 }}>{ticket.id}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{ticket.clinic}</span>
                <Badge label={ticket.category} variant="neutral" />
                <Badge label={ticket.priority} variant={PRIORITY_VARIANT[ticket.priority] || "neutral"} />
                <Badge label={ticket.status === "in-progress" ? "In Progress" : ticket.status} variant={STATUS_VARIANT[ticket.status] || "neutral"} />
                <span style={{ fontSize: 12, color: C.muted }}>{ticket.assigned || "Unassigned"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}