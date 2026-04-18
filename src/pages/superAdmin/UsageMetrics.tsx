import { useState } from "react";
import { HardDrive, Activity, Calendar, Users, Download, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { PageWrapper, PageHeader, Card, Badge, Btn, StatCard, SectionTitle, TableHead, SA } from "./shared";

const USAGE_DATA = [
  { id: 1, clinic: "DentaFlow Clinic", plan: "Enterprise", users: 35, maxUsers: 999, appointments: 2100, storage: 28.1, maxStorage: 100, apiCalls: 42000, lastActive: "2h ago", status: "healthy" },
  { id: 2, clinic: "PerfectTeeth Center", plan: "Enterprise", users: 22, maxUsers: 999, appointments: 1240, storage: 18.6, maxStorage: 100, apiCalls: 28000, lastActive: "1h ago", status: "healthy" },
  { id: 3, clinic: "SmilePro Clinic", plan: "Enterprise", users: 18, maxUsers: 999, appointments: 890, storage: 12.4, maxStorage: 100, apiCalls: 19000, lastActive: "4h ago", status: "healthy" },
  { id: 4, clinic: "Bright Smile Clinic", plan: "Pro", users: 8, maxUsers: 10, appointments: 320, storage: 2.1, maxStorage: 10, apiCalls: 6200, lastActive: "30m ago", status: "healthy" },
  { id: 5, clinic: "WhiteArc Dental", plan: "Pro", users: 11, maxUsers: 10, appointments: 512, storage: 4.2, maxStorage: 10, apiCalls: 9800, lastActive: "5h ago", status: "warning" },
  { id: 6, clinic: "Al-Noor Dental", plan: "Starter", users: 3, maxUsers: 3, appointments: 98, storage: 0.4, maxStorage: 1, apiCalls: 1200, lastActive: "3h ago", status: "warning" },
  { id: 7, clinic: "Sunrise Dental", plan: "Starter", users: 2, maxUsers: 3, appointments: 44, storage: 0.2, maxStorage: 1, apiCalls: 480, lastActive: "14d ago", status: "inactive" },
];

function UsageBar({ value, max, warn = 80 }: { value: number; max: number; warn?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= warn ? (pct >= 100 ? SA.error : SA.warning) : SA.success;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: SA.bg, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function UsageMetricsPage() {
  const [sortBy, setSortBy] = useState<"storage" | "appointments" | "users">("storage");

  const sorted = [...USAGE_DATA].sort((a, b) => {
    if (sortBy === "storage") return (b.storage / b.maxStorage) - (a.storage / a.maxStorage);
    if (sortBy === "appointments") return b.appointments - a.appointments;
    return b.users - a.users;
  });

  const warnings = USAGE_DATA.filter((c) => c.status === "warning" || c.users > c.maxUsers).length;
  const totalStorage = USAGE_DATA.reduce((s, c) => s + c.storage, 0);
  const totalApiCalls = USAGE_DATA.reduce((s, c) => s + c.apiCalls, 0);

  return (
    <PageWrapper>
      <PageHeader
        breadcrumb="Super Admin · Reports"
        title="Clinic Usage Metrics"
        subtitle="Monitor storage, appointments, and API usage per clinic"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            {warnings > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: SA.warningBg, border: `1px solid #fde68a`, borderRadius: 10 }}>
                <AlertTriangle size={14} color={SA.warning} />
                <span style={{ fontSize: 13, fontWeight: 600, color: SA.warning }}>{warnings} at limit</span>
              </div>
            )}
            <Btn label="Export" variant="secondary" icon={<Download size={14} />} onClick={() => toast("Exporting...")} />
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<HardDrive size={18} />} label="Total Storage Used" value={`${totalStorage.toFixed(1)} GB`} color={SA.accent} bg={SA.accentLight} />
        <StatCard icon={<Calendar size={18} />} label="Total Appointments (all)" value={USAGE_DATA.reduce((s, c) => s + c.appointments, 0).toLocaleString()} trend="+18%" positive={true} color={SA.info} bg={SA.infoBg} />
        <StatCard icon={<Activity size={18} />} label="Total API Calls (mo)" value={`${(totalApiCalls / 1000).toFixed(0)}K`} color={SA.success} bg={SA.successBg} />
        <StatCard icon={<Users size={18} />} label="Total Active Staff" value={USAGE_DATA.reduce((s, c) => s + c.users, 0)} color={SA.warning} bg={SA.warningBg} />
      </div>

      {/* Warnings */}
      {USAGE_DATA.filter(c => c.users > c.maxUsers || c.storage / c.maxStorage > 0.9).map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: SA.warningBg, border: `1px solid #fde68a`, borderRadius: 12, marginBottom: 12, fontSize: 13 }}>
          <AlertTriangle size={16} color={SA.warning} />
          <span style={{ color: "#92400e" }}>
            <strong>{c.clinic}</strong> has exceeded plan limits —
            {c.users > c.maxUsers ? ` ${c.users}/${c.maxUsers} users (over limit)` : ""}
            {c.storage / c.maxStorage > 0.9 ? ` ${c.storage}/${c.maxStorage} GB storage (${Math.round((c.storage / c.maxStorage) * 100)}%)` : ""}
          </span>
          <Btn label="Contact Clinic" variant="secondary" size="sm" style={{ marginLeft: "auto" } as any} onClick={() => toast(`Contacting ${c.clinic}`)} />
        </div>
      ))}

      <Card>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${SA.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: SA.textSecondary, marginRight: 4 }}>Sort by:</span>
          {(["storage", "appointments", "users"] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: "6px 12px", borderRadius: 8,
              border: `1px solid ${sortBy === s ? SA.accent : SA.border}`,
              background: sortBy === s ? SA.accentLight : "white",
              color: sortBy === s ? SA.accent : SA.textSecondary,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              fontWeight: sortBy === s ? 600 : 400, textTransform: "capitalize",
            }}>{s}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 180px 180px 180px 80px 90px", padding: "10px 20px", background: SA.bg, borderBottom: `1px solid ${SA.border}` }}>
          {["Clinic", "Plan", "Status", "Storage", "Users / Limit", "Appointments", "API Calls", "Last Active"].map((h) => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: SA.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>

        {sorted.map((c) => (
          <div key={c.id} className="sa-row-hover" style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 180px 180px 180px 80px 90px", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${SA.border}`, gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{c.clinic}</span>
            <Badge label={c.plan} variant={c.plan === "Enterprise" ? "success" : c.plan === "Pro" ? "purple" : "info"} />
            <Badge label={c.status} variant={c.status === "healthy" ? "success" : c.status === "warning" ? "warning" : "neutral"} />
            <div>
              <div style={{ fontSize: 11, color: SA.textSecondary, marginBottom: 4 }}>{c.storage.toFixed(1)} / {c.maxStorage} GB</div>
              <UsageBar value={c.storage} max={c.maxStorage} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: SA.textSecondary, marginBottom: 4 }}>{c.users} / {c.maxUsers === 999 ? "∞" : c.maxUsers}</div>
              <UsageBar value={c.users} max={c.maxUsers === 999 ? c.users : c.maxUsers} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: SA.textSecondary, marginBottom: 4 }}>{c.appointments.toLocaleString()} total</div>
              <div style={{ height: 6, background: SA.bg, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min((c.appointments / 2100) * 100, 100)}%`, height: "100%", background: SA.info, borderRadius: 3 }} />
              </div>
            </div>
            <span style={{ fontSize: 12, color: SA.textSecondary }}>{(c.apiCalls / 1000).toFixed(0)}K</span>
            <span style={{ fontSize: 12, color: c.status === "inactive" ? SA.error : SA.textMuted }}>{c.lastActive}</span>
          </div>
        ))}
      </Card>
    </PageWrapper>
  );
}