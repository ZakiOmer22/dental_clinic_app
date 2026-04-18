// Front_End/src/pages/superAdmin/Payments.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Download, RefreshCw, Search } from "lucide-react";
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
} as const;

interface Payment {
  id: string;
  clinic: string;
  amount: string;
  method: string;
  date: string;
  invoice: string;
  status: string;
}

function Badge({ label, variant }: { label: string; variant: string }) {
  const variants: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: C.tealBg, text: C.tealText, border: C.tealBorder },
    error: { bg: C.redBg, text: C.redText, border: C.redBorder },
    neutral: { bg: C.bgMuted, text: C.muted, border: C.border },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: v.bg, color: v.text, border: `1px solid ${v.border}`, whiteSpace: "nowrap", textTransform: "capitalize" }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
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

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => client.get('/api/v1/admin/payments').then(r => r.data),
  });

  const payments: Payment[] = data?.payments || [];
  const filtered = payments.filter((p) => 
    p.clinic?.toLowerCase().includes(search.toLowerCase()) ||
    p.id?.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = payments.filter((p) => p.status === "succeeded").reduce((s, p) => s + (parseFloat(p.amount?.replace("$", "")) || 0), 0);
  const succeeded = payments.filter((p) => p.status === "succeeded").length;
  const failed = payments.filter((p) => p.status === "failed").length;

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
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Payment History</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>All payment transactions across the platform</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, color: C.muted, cursor: "pointer" }}>
              <RefreshCw size={12} /> Refresh
            </button>
            <button onClick={() => toast.success("Exporting payments...")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 34, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <StatCard label="Total Collected (Apr)" value={`$${totalCollected.toLocaleString()}`} icon={Receipt} color={C.teal} />
          <StatCard label="Successful Payments" value={succeeded} icon={Receipt} color={C.purple} />
          <StatCard label="Failed Payments" value={failed} icon={Receipt} color={C.red} />
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: "relative", width: 280 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by clinic, txn ID, or invoice…"
                className="inp"
                style={{ width: "100%", height: 34, padding: "0 12px 0 32px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 12, outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "120px 2fr 90px 180px 120px 90px", padding: "9px 20px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
            {["Txn ID", "Clinic", "Amount", "Method", "Invoice", "Status"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.faint }}>Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Receipt size={36} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: C.faint }}>No payments found</p>
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "120px 2fr 90px 180px 120px 90px", alignItems: "center", padding: "13px 20px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: C.muted }}>{p.id}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.text, margin: 0 }}>{p.clinic}</p>
                  <p style={{ fontSize: 11, color: C.faint, margin: "2px 0 0" }}>{p.date}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.amount}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{p.method}</span>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: C.purpleText }}>{p.invoice}</span>
                <Badge label={p.status} variant={p.status === "succeeded" ? "success" : "error"} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}