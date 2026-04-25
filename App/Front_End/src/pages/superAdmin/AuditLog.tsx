// Front_End/src/pages/superAdmin/AuditLog.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, RefreshCw, FileText } from "lucide-react";
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
  gray: "#6b7f75", grayBg: "#f4f7f5",
} as const;

interface AuditLog {
  id: string | number;
  actor: string;
  action: string;
  target: string;
  category: string;
  ip: string;
  time: string;
}

function Badge({ label, variant }: { label: string; variant: string }) {
  const variants: Record<string, { bg: string; text: string; border: string }> = {
    purple: { bg: C.purpleBg, text: C.purpleText, border: "#ddd6fe" },
    success: { bg: C.tealBg, text: C.tealText, border: C.tealBorder },
    info: { bg: C.blueBg, text: C.blueText, border: C.blueBorder },
    warning: { bg: C.amberBg, text: C.amberText, border: C.amberBorder },
    error: { bg: C.redBg, text: C.redText, border: C.redBorder },
    neutral: { bg: C.grayBg, text: C.gray, border: C.border },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: v.bg, color: v.text, border: `1px solid ${v.border}`, whiteSpace: "nowrap", textTransform: "capitalize" }}>
      {label}
    </span>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => client.get('/api/v1/admin/audit-logs').then(r => r.data),
  });

  const logs: AuditLog[] = data?.logs || [];
  const filtered = logs.filter((log) => {
    const matchesSearch = log.actor?.toLowerCase().includes(search.toLowerCase()) ||
                          log.action?.toLowerCase().includes(search.toLowerCase()) ||
                          log.target?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(logs.map((l) => l.category)))];

  const CAT_VARIANT: Record<string, string> = {
    clinic: "purple", billing: "success", user: "info",
    support: "warning", system: "neutral", platform: "purple"
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
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Activity Log</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>Complete history of all admin actions on the platform</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
              <RefreshCw size={12} /> Refresh
            </button>
            <button onClick={() => toast.success("Exporting audit log...")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 34, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 280 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search actions, actors, targets…"
                className="inp"
                style={{ width: "100%", height: 34, padding: "0 12px 0 32px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 12, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, border: `1px solid ${categoryFilter === cat ? C.purple : C.border}`,
                    background: categoryFilter === cat ? C.purpleBg : "transparent", color: categoryFilter === cat ? C.purpleText : C.muted,
                    fontSize: 11, fontWeight: 500, cursor: "pointer", textTransform: "capitalize"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "130px 180px 2fr 100px 130px", padding: "9px 20px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
            {["Timestamp", "Actor", "Action & Target", "Category", "IP Address"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.faint }}>Loading audit logs...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <FileText size={36} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: C.faint }}>No audit logs found</p>
            </div>
          ) : (
            filtered.map((log) => (
              <div key={log.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "130px 180px 2fr 100px 130px", alignItems: "center", padding: "13px 20px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <span style={{ fontSize: 11, color: C.muted }}>{log.time}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>
                    {log.actor?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{log.actor}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: C.purpleText }}>{log.action}</span>
                  <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>{log.target}</p>
                </div>
                <Badge label={log.category} variant={CAT_VARIANT[log.category] || "neutral"} />
                <span style={{ fontSize: 11, fontFamily: "monospace", color: C.faint }}>{log.ip}</span>
              </div>
            ))
          )}

          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.faint }}>
            {filtered.length} entries · Retained for 90 days
          </div>
        </div>
      </div>
    </>
  );
}