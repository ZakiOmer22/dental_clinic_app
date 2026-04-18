import { useState } from "react";
import {
  Building2, Users, DollarSign, Activity, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  BarChart3, Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper, PageHeader, StatCard, Card, Badge, SectionTitle, SA } from "@/pages/superAdmin/shared";

// ─── Mock Data ────────────────────────────────────────────────────────
const STATS = [
  { icon: <Building2 size={20} />, label: "Total Clinics", value: "142", trend: "+12 this month", positive: true, color: SA.accent, bg: SA.accentLight },
  { icon: <Users size={20} />, label: "Active Users", value: "1,284", trend: "+8.3%", positive: true, color: SA.info, bg: SA.infoBg },
  { icon: <DollarSign size={20} />, label: "Monthly Revenue", value: "$48,600", trend: "+15.2%", positive: true, color: SA.success, bg: SA.successBg },
  { icon: <Activity size={20} />, label: "Avg. Uptime", value: "99.7%", trend: "Last 30 days", positive: true, color: SA.warning, bg: SA.warningBg },
];

const RECENT_CLINICS = [
  { id: 1, name: "Bright Smile Clinic", city: "Mogadishu", plan: "Pro", status: "active", users: 8, joined: "Apr 14" },
  { id: 2, name: "Al-Noor Dental", city: "Hargeisa", plan: "Starter", status: "active", users: 3, joined: "Apr 13" },
  { id: 3, name: "PerfectTeeth Center", city: "Bosaso", plan: "Enterprise", status: "active", users: 22, joined: "Apr 11" },
  { id: 4, name: "DentaCare Plus", city: "Kismayo", plan: "Pro", status: "pending", users: 0, joined: "Apr 10" },
  { id: 5, name: "WhiteArc Dental", city: "Garowe", plan: "Pro", status: "active", users: 11, joined: "Apr 9" },
];

const ACTIVITY = [
  { id: 1, type: "clinic_joined", text: "Bright Smile Clinic signed up (Pro Plan)", time: "2h ago", icon: <Building2 size={14} />, color: SA.accent },
  { id: 2, type: "payment", text: "Invoice #INV-1042 paid · $299", time: "5h ago", icon: <DollarSign size={14} />, color: SA.success },
  { id: 3, type: "alert", text: "Al-Noor Dental storage at 92%", time: "8h ago", icon: <AlertTriangle size={14} />, color: SA.warning },
  { id: 4, type: "approval", text: "DentaCare Plus pending approval", time: "12h ago", icon: <Clock size={14} />, color: SA.info },
  { id: 5, type: "user", text: "New super-admin account created: Aisha Omar", time: "1d ago", icon: <Users size={14} />, color: SA.accent },
  { id: 6, type: "payment", text: "Invoice #INV-1041 paid · $599", time: "2d ago", icon: <DollarSign size={14} />, color: SA.success },
];

const PLAN_DIST = [
  { plan: "Starter", count: 42, pct: 30, color: SA.info },
  { plan: "Pro", count: 71, pct: 50, color: SA.accent },
  { plan: "Enterprise", count: 29, pct: 20, color: SA.success },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const planVariant = (p: string) =>
    p === "Enterprise" ? "success" : p === "Pro" ? "purple" : "info";

  const statusVariant = (s: string) =>
    s === "active" ? "success" : s === "pending" ? "warning" : "neutral";

  return (
    <PageWrapper>
      <PageHeader
        breadcrumb="Super Admin · Platform"
        title="Platform Overview"
        subtitle="Monitor all clinics, revenue, and system health from one place"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/admin/pending")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 10, fontSize: 13,
                background: SA.warningBg, color: SA.warning, border: `1.5px solid #fde68a`,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
              }}
            >
              <Clock size={14} />3 Pending
            </button>
            <button
              onClick={() => navigate("/admin/clinics")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 10, fontSize: 13,
                background: SA.accent, color: "white", border: "none",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
              }}
            >
              <Building2 size={14} />All Clinics
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28 }}>
        {STATS.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>
        {/* Recent Clinics */}
        <Card>
          <SectionTitle
            title="Recently Joined Clinics"
            action={
              <button onClick={() => navigate("/admin/clinics")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: SA.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                View all <ArrowRight size={12} />
              </button>
            }
          />
          <div style={{ padding: "8px 0" }}>
            {RECENT_CLINICS.map((c) => (
              <div key={c.id} className="sa-row-hover" style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 60px 60px", alignItems: "center", padding: "12px 20px", cursor: "pointer" }} onClick={() => navigate(`/admin/clinics/${c.id}`)}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary, margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: SA.textSecondary, margin: "2px 0 0" }}>{c.city}</p>
                </div>
                <Badge label={c.plan} variant={planVariant(c.plan)} />
                <Badge label={c.status} variant={statusVariant(c.status)} />
                <span style={{ fontSize: 12, color: SA.textSecondary }}>{c.users} users</span>
                <span style={{ fontSize: 12, color: SA.textMuted }}>{c.joined}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <SectionTitle title="Plan Distribution" />
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)", width: 140, height: 140 }}>
                  {(() => {
                    let offset = 0;
                    const r = 55;
                    const circ = 2 * Math.PI * r;
                    return PLAN_DIST.map((p) => {
                      const dash = (p.pct / 100) * circ;
                      const gap = circ - dash;
                      const el = (
                        <circle key={p.plan} cx={70} cy={70} r={r}
                          fill="none" stroke={p.color} strokeWidth={18}
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-offset * circ / 100}
                          style={{ transition: "all 0.5s ease" }}
                        />
                      );
                      offset += p.pct;
                      return el;
                    });
                  })()}
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: SA.textPrimary, margin: 0 }}>142</p>
                  <p style={{ fontSize: 11, color: SA.textMuted }}>Clinics</p>
                </div>
              </div>
            </div>
            {PLAN_DIST.map((p) => (
              <div key={p.plan} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${SA.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: 13, color: SA.textPrimary }}>{p.plan}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 80, height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ width: `${p.pct}%`, height: "100%", background: p.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: SA.textSecondary, minWidth: 30, textAlign: "right" }}>{p.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Feed + Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <SectionTitle title="Recent Activity" />
          <div style={{ padding: "8px 0" }}>
            {ACTIVITY.map((a) => (
              <div key={a.id} className="sa-row-hover" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 20px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: SA.textPrimary, margin: 0, lineHeight: 1.4 }}>{a.text}</p>
                  <p style={{ fontSize: 11, color: SA.textMuted, marginTop: 2 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Health + Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionTitle title="System Health" />
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "API Response Time", value: "142ms", status: "good" },
                { label: "DB Connections", value: "87 / 200", status: "good" },
                { label: "Storage Used", value: "61%", status: "warning" },
                { label: "Failed Jobs (24h)", value: "2", status: "good" },
              ].map((h) => (
                <div key={h.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {h.status === "good"
                      ? <CheckCircle2 size={14} color={SA.success} />
                      : <AlertTriangle size={14} color={SA.warning} />}
                    <span style={{ fontSize: 13, color: SA.textPrimary }}>{h.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: h.status === "good" ? SA.textPrimary : SA.warning }}>{h.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Quick Actions" />
            <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Approve Clinics", icon: <CheckCircle2 size={14} />, path: "/admin/pending", color: SA.success },
                { label: "View Reports", icon: <BarChart3 size={14} />, path: "/admin/reports/revenue", color: SA.info },
                { label: "Manage Users", icon: <Users size={14} />, path: "/admin/users", color: SA.accent },
                { label: "Audit Log", icon: <Shield size={14} />, path: "/admin/audit", color: SA.warning },
              ].map((q) => (
                <button key={q.label} onClick={() => navigate(q.path)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                  background: SA.bg, border: `1px solid ${SA.border}`, borderRadius: 10,
                  fontSize: 12, fontWeight: 500, color: SA.textPrimary,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  <span style={{ color: q.color }}>{q.icon}</span>{q.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}