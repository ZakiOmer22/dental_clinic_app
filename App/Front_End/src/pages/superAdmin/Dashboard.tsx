import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, DollarSign, Activity, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  BarChart3, Shield, CreditCard, Calendar, Globe,
  Server, Database, Zap, Settings, Bell, ChevronRight,
  MoreHorizontal, Wallet, LayoutDashboard, Rocket,
} from "lucide-react";
import { useAuthStore } from "@/app/store";

// ─── Design tokens (matching the regular dashboard) ──────────────────────────
const C = {
  border:    "#e5eae8",
  bg:        "#ffffff",
  bgPage:    "#f0f2f1",
  bgMuted:   "#f7f9f8",
  text:      "#111816",
  muted:     "#7a918b",
  faint:     "#a0b4ae",
  teal:      "#0d9e75",
  tealBg:    "#e8f7f2",
  tealText:  "#0a7d5d",
  tealBorder:"#c3e8dc",
  amber:     "#f59e0b",
  amberBg:   "#fffbeb",
  amberText: "#92400e",
  amberBorder:"#fde68a",
  red:       "#e53e3e",
  redBg:     "#fff5f5",
  redText:   "#c53030",
  redBorder: "#fed7d7",
  blue:      "#3b82f6",
  blueBg:    "#eff6ff",
  blueText:  "#1d4ed8",
  blueBorder:"#bfdbfe",
  purple:    "#8b5cf6",
  purpleBg:  "#f5f3ff",
  purpleText:"#5b21b6",
};

// ─── Components matching the regular dashboard style ─────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function SectionHead({ title, sub, action, icon: Icon, iconColor }: {
  title: string; sub?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ElementType; iconColor?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: (iconColor ?? C.teal) + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={13} color={iconColor ?? C.teal} strokeWidth={2} />
          </div>
        )}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</p>
          {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{sub}</p>}
        </div>
      </div>
      {action && (
        <button onClick={action.onClick} style={{
          display: "flex", alignItems: "center", gap: 3,
          fontSize: 12, fontWeight: 600, color: C.teal,
          background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0,
        }}>
          {action.label} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: "green" | "amber" | "red" | "blue" | "gray" | "purple" }) {
  const map = {
    green:  { bg: C.tealBg,   text: C.tealText,   border: C.tealBorder },
    amber:  { bg: C.amberBg,  text: C.amberText,  border: C.amberBorder },
    red:    { bg: C.redBg,    text: C.redText,    border: C.redBorder },
    blue:   { bg: C.blueBg,   text: C.blueText,   border: C.blueBorder },
    gray:   { bg: C.bgMuted,  text: C.muted,      border: C.border },
    purple: { bg: C.purpleBg, text: C.purpleText, border: "#ddd6fe" },
  }[color];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
      background: map.bg, color: map.text, border: `1px solid ${map.border}`,
      whiteSpace: "nowrap", textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

function KpiCard({ label, value, trend, trendUp, icon: Icon, color, bg }: {
  label: string; value: string | number;
  trend?: string; trendUp?: boolean;
  icon: React.ElementType; color: string; bg?: string;
}) {
  return (
    <Card>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: bg ?? color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={14} color={color} strokeWidth={1.8} />
          </div>
        </div>
        <p style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11 }}>
            {trendUp ? <TrendingUp size={11} color={C.teal} /> : <TrendingDown size={11} color={C.red} />}
            <span style={{ color: trendUp ? C.tealText : C.redText }}>{trend}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function DonutChart({ segments, size = 80 }: {
  segments: { color: string; value: number; label: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const r = 28, cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = circumference * pct;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={10}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset * circumference / total + circumference * 0.25}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
          offset += seg.value;
          return el;
        })}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 13, fontWeight: 700, fill: C.text }}>
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 8, fill: C.faint }}>
          total
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: C.muted }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text, marginLeft: "auto", paddingLeft: 8 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// API fetch helper
const apiFetch = async (endpoint: string, token: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/v1/admin${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClinics: 0,
    activeClinics: 0,
    pendingClinics: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    trialClinics: 0,
  });
  const [recentClinics, setRecentClinics] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState({ revenue: 0, growth: 12.5, mrr: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const dashboardData = await apiFetch('/dashboard', token);
        setStats({
          totalClinics: dashboardData.totalClinics || 0,
          activeClinics: dashboardData.activeClinics || 0,
          pendingClinics: dashboardData.pendingApprovals || 0,
          totalPatients: dashboardData.totalPatients || 0,
          monthlyRevenue: dashboardData.monthlyRevenue || 0,
          activeSubscriptions: dashboardData.activeSubscriptions || 0,
          trialClinics: dashboardData.trialClinics || 0,
        });

        const clinicsData = await apiFetch('/clinics', token);
        setRecentClinics((clinicsData.clinics || []).slice(0, 5).map((c: any) => ({
          id: c.id,
          name: c.name,
          city: c.city || 'N/A',
          plan: c.plan_name || 'Basic',
          status: c.status || 'pending',
          joined: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })));

        const revenueData = await apiFetch('/revenue', token);
        setGrowthData({
          revenue: revenueData.total || 0,
          mrr: revenueData.mrr || 0,
          growth: revenueData.growth || 12.5,
        });

        try {
          const auditData = await apiFetch('/audit-logs?limit=6', token);
          setRecentActivity((auditData.logs || []).slice(0, 6).map((log: any) => ({
            id: log.id,
            text: `${log.action || 'Action'} performed`,
            time: new Date(log.created_at).toLocaleDateString(),
          })));
        } catch (err) {
          setRecentActivity([]);
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const planDistribution = [
    { plan: "Starter", count: 42, pct: 30, color: C.blue },
    { plan: "Pro", count: 71, pct: 50, color: C.teal },
    { plan: "Enterprise", count: 29, pct: 20, color: C.purple },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bgPage }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${C.border}`, borderTopColor: C.teal, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: C.muted }}>Loading platform data...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bgPage, padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-.02em", margin: 0 }}>Platform Overview</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 4 }}>Monitor all clinics, revenue, and system health</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => navigate("/admin/pending")} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10,
              fontSize: 12, fontWeight: 600, color: C.amberText, cursor: "pointer",
            }}>
              <Clock size={14} /> {stats.pendingClinics} Pending
            </button>
            <button onClick={() => navigate("/admin/clinics")} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
              background: C.teal, border: "none", borderRadius: 10,
              fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer",
            }}>
              <Building2 size={14} /> All Clinics
            </button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Clinics" value={stats.totalClinics} trend={`${stats.activeClinics} active`} trendUp icon={Building2} color={C.teal} bg={C.tealBg} />
        <KpiCard label="Total Patients" value={stats.totalPatients.toLocaleString()} trend="across network" trendUp icon={Users} color={C.blue} bg={C.blueBg} />
        <KpiCard label="Monthly Revenue" value={`$${stats.monthlyRevenue.toLocaleString()}`} trend={`+${growthData.growth}% vs last month`} trendUp icon={DollarSign} color={C.amber} bg={C.amberBg} />
        <KpiCard label="Active Subscriptions" value={stats.activeSubscriptions} trend={`${stats.trialClinics} on trial`} trendUp icon={Activity} color={C.purple} bg={C.purpleBg} />
      </div>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 24 }}>
        {/* Recent Clinics */}
        <Card>
          <SectionHead title="Recently Joined Clinics" icon={Building2} action={{ label: "View all", onClick: () => navigate("/admin/clinics") }} />
          <div>
            {recentClinics.map((c, i) => (
              <div key={c.id} onClick={() => navigate(`/admin/clinics/${c.id}`)} style={{
                display: "grid", gridTemplateColumns: "1fr 80px 80px 60px",
                padding: "12px 18px", borderBottom: i < recentClinics.length - 1 ? `1px solid ${C.border}` : "none",
                cursor: "pointer", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{c.city}</p>
                </div>
                <Badge label={c.plan} color={c.plan === "Enterprise" ? "purple" : c.plan === "Pro" ? "green" : "blue"} />
                <Badge label={c.status} color={c.status === "active" ? "green" : "amber"} />
                <span style={{ fontSize: 11, color: C.faint }}>{c.joined}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <SectionHead title="Plan Distribution" icon={Rocket} />
          <div style={{ padding: "20px" }}>
            <DonutChart size={80} segments={planDistribution.map(p => ({ color: p.color, value: p.count, label: p.plan }))} />
            <div style={{ marginTop: 16 }}>
              {planDistribution.map(p => (
                <div key={p.plan} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontSize: 12, color: C.text }}>{p.plan}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Revenue Card */}
        <Card>
          <SectionHead title="Revenue Overview" icon={TrendingUp} iconColor={C.teal} action={{ label: "View reports", onClick: () => navigate("/admin/reports") }} />
          <div style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: C.text }}>${growthData.revenue.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: C.tealText }}>↑ {growthData.growth}%</span>
            </div>
            <div style={{ height: 80, display: "flex", alignItems: "flex-end", gap: 8 }}>
              {[8200, 9400, 8700, 11200, 10500, growthData.mrr || 12480].map((val, i) => {
                const maxVal = Math.max(...[8200, 9400, 8700, 11200, 10500, growthData.mrr || 12480]);
                const isLast = i === 5;
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{
                      height: `${(val / maxVal) * 60}px`,
                      background: isLast ? C.teal : C.tealBorder,
                      borderRadius: "4px 4px 0 0", marginBottom: 6,
                    }} />
                    <span style={{ fontSize: 9, color: isLast ? C.teal : C.faint, fontWeight: isLast ? 700 : 400 }}>
                      {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"][i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <SectionHead title="Recent Activity" icon={Bell} iconColor={C.purple} />
          <div style={{ padding: "12px 18px" }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32 }}>
                <CheckCircle2 size={32} color={C.teal} style={{ margin: "0 auto 8px", display: "block" }} />
                <p style={{ fontSize: 13, color: C.faint }}>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: C.tealBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={12} color={C.teal} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.text}</p>
                    <p style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Row 4 - Quick Actions */}
      <Card>
        <SectionHead title="Quick Actions" icon={MoreHorizontal} iconColor={C.muted} />
        <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Approve Clinics", icon: CheckCircle2, path: "/admin/pending", color: C.teal },
            { label: "View Reports", icon: BarChart3, path: "/admin/reports/revenue", color: C.blue },
            { label: "Manage Staff", icon: Users, path: "/admin/users", color: C.purple },
            { label: "Audit Log", icon: Shield, path: "/admin/audit", color: C.amber },
            { label: "System Health", icon: Server, path: "/admin/health", color: C.red },
            { label: "Subscriptions", icon: CreditCard, path: "/admin/subscriptions", color: C.teal },
            { label: "Global Settings", icon: Settings, path: "/admin/settings", color: C.faint },
            { label: "Support Tickets", icon: Bell, path: "/admin/tickets", color: C.blue },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                background: action.color + "08", border: `1px solid ${action.color}20`, borderRadius: 10,
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = action.color + "15"; e.currentTarget.style.borderColor = action.color + "40"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = action.color + "08"; e.currentTarget.style.borderColor = action.color + "20"; }}
            >
              <action.icon size={14} color={action.color} />
              <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{action.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}