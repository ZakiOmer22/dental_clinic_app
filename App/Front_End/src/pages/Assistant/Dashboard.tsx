import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, CalendarDays, ReceiptText, Package,
  AlertTriangle, ChevronRight, Clock, TrendingUp,
  TrendingDown, Activity, FlaskConical, Stethoscope,
  Wallet, Bell, ArrowUpRight, MoreHorizontal,
  CheckCircle2, XCircle, Timer,
} from "lucide-react";
import { apiGetTodayAppointments } from "@/api/appointments";
import { apiGetPatients } from "@/api/patients";
import { apiGetInvoices } from "@/api/billing";
import { apiGetLowStock } from "@/api/inventory";
import { formatCurrency } from "@/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────
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

// ─── Primitives ───────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function SectionHead({
  title, sub, action, icon: Icon, iconColor,
}: {
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
    red:    { bg: C.redBg,    text: C.redText,     border: C.redBorder },
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
      {label.replace(/_/g, " ")}
    </span>
  );
}

function Avi({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#0d9e75,#0a7d5d)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.37, fontWeight: 700, color: "white", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Skeleton({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: "linear-gradient(90deg,#edf1ef 25%,#f4f7f5 50%,#edf1ef 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

function statusColor(s: string): "green" | "amber" | "red" | "blue" | "gray" {
  const m: Record<string, "green" | "amber" | "red" | "blue" | "gray"> = {
    completed: "green", confirmed: "blue", in_progress: "green",
    scheduled: "gray", waiting: "amber", cancelled: "red", no_show: "red",
  };
  return m[s] ?? "gray";
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
const REVENUE_DATA = [
  { month: "Aug", val: 8200 },
  { month: "Sep", val: 9400 },
  { month: "Oct", val: 8700 },
  { month: "Nov", val: 11200 },
  { month: "Dec", val: 10500 },
  { month: "Jan", val: 12480 },
];

function RevenueChart() {
  const max = Math.max(...REVENUE_DATA.map((d) => d.val));
  return (
    <div style={{ padding: "16px 18px 12px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
        {REVENUE_DATA.map((d, i) => {
          const isLast = i === REVENUE_DATA.length - 1;
          const pct = (d.val / max) * 100;
          return (
            <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
              <div
                title={`$${d.val.toLocaleString()}`}
                style={{
                  width: "100%",
                  height: `${pct}%`,
                  minHeight: 6,
                  borderRadius: "4px 4px 0 0",
                  background: isLast ? C.teal : "#d4ede5",
                  border: isLast ? "none" : `1px solid ${C.tealBorder}`,
                  transition: "height .3s",
                  cursor: "default",
                }}
              />
            </div>
          );
        })}
      </div>
      {/* X labels */}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        {REVENUE_DATA.map((d, i) => (
          <div key={d.month} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 10, color: i === REVENUE_DATA.length - 1 ? C.teal : C.faint, fontWeight: i === REVENUE_DATA.length - 1 ? 700 : 400 }}>
              {d.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini donut chart ─────────────────────────────────────────────────────────
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
          const gap  = circumference - dash;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={10}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circumference / total + circumference * 0.25}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
          offset += seg.value;
          return el;
        })}
        {/* centre label */}
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

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const w = 64, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, trendUp, icon: Icon, color, spark }: {
  label: string; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean;
  icon: React.ElementType; color: string;
  spark?: number[];
}) {
  return (
    <Card>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {spark && <Sparkline data={spark} color={color} />}
            <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={14} color={color} strokeWidth={1.8} />
            </div>
          </div>
        </div>
        <p style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11 }}>
            {trendUp
              ? <TrendingUp size={11} color={C.teal} />
              : <TrendingDown size={11} color={C.red} />}
            <span style={{ color: trendUp ? C.tealText : C.redText }}>{trend}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Activity feed item ───────────────────────────────────────────────────────
function ActivityItem({ icon: Icon, iconBg, title, sub, time }: {
  icon: React.ElementType; iconBg: string;
  title: string; sub: string; time: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} color={C.teal} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{title}</p>
        <p style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{sub}</p>
      </div>
      <span style={{ fontSize: 10, color: C.faint, flexShrink: 0, marginTop: 2 }}>{time}</span>
    </div>
  );
}

// ─── Procedure progress bar ───────────────────────────────────────────────────
function ProcBar({ name, count, max, color }: { name: string; count: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.text }}>{name}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{count}</span>
      </div>
      <div style={{ height: 5, background: "#edf1ef", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AssistanceDashboardPage() {
  const navigate = useNavigate();

  const { data: todayAppts, isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: apiGetTodayAppointments,
  });
  const { data: patientsRes } = useQuery({
    queryKey: ["patients", "count"],
    queryFn: () => apiGetPatients({ limit: 1 }),
  });
  const { data: invoicesRes } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({ limit: 100 }),
  });
  const { data: lowStock = [] } = useQuery({
    queryKey: ["inventory", "low"],
    queryFn: apiGetLowStock,
  });

  const appts: any[]    = Array.isArray(todayAppts) ? todayAppts : (todayAppts as any)?.data ?? [];
  const totalPatients   = (patientsRes as any)?.total ?? 0;
  const invoices: any[] = (invoicesRes as any)?.data ?? [];
  const totalRevenue    = invoices.reduce((a: number, i: any) => a + parseFloat(i.paid_amount ?? 0), 0);
  const pendingInvoices = invoices.filter((i: any) => ["unpaid", "partial"].includes(i.status)).length;
  const lowStockArr     = lowStock as any[];

  const completed = appts.filter((a) => a.status === "completed").length;
  const cancelled = appts.filter((a) => a.status === "cancelled" || a.status === "no_show").length;

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <style>{`
        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .dash-section { animation: fadeUp .4s ease both; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Low stock banner ──────────────────────────────────────────── */}
        {lowStockArr.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", background: C.amberBg,
            border: `1px solid ${C.amberBorder}`, borderRadius: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color={C.amber} />
              <span style={{ fontSize: 13, fontWeight: 500, color: C.amberText }}>
                {lowStockArr.length} inventory item{lowStockArr.length > 1 ? "s" : ""} below minimum stock level
              </span>
            </div>
            <button onClick={() => navigate("/inventory")} style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 12, fontWeight: 600, color: C.amberText,
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            }}>
              View inventory <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* ── Page title ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{today}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "New Patient", color: C.teal, path: "/patients" },
              { label: "Book Appointment", color: C.blue, path: "/appointments" },
            ].map((btn) => (
              <button key={btn.path} onClick={() => navigate(btn.path)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 8,
                background: btn.color + "15", border: `1px solid ${btn.color}30`,
                color: btn.color, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              }}>
                <ArrowUpRight size={12} /> {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI row ───────────────────────────────────────────────────── */}
        <div className="dash-section" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <KpiCard
            label="Total Patients"
            value={totalPatients}
            icon={Users}
            color={C.blue}
            trend="All registered"
            trendUp
            spark={[42,48,44,51,55,58,62,totalPatients]}
          />
          <KpiCard
            label="Today's Appointments"
            value={appts.length}
            icon={CalendarDays}
            color={C.teal}
            sub={`${completed} completed · ${cancelled} cancelled`}
            trend={`${appts.length - completed - cancelled} remaining`}
            trendUp={appts.length > 8}
            spark={[6,9,8,11,10,12,appts.length]}
          />
          <KpiCard
            label="Revenue Collected"
            value={formatCurrency(totalRevenue)}
            icon={ReceiptText}
            color={C.teal}
            trend="↑ 18% vs last month"
            trendUp
            spark={[8200,9400,8700,11200,10500,totalRevenue || 12480]}
          />
          <KpiCard
            label="Pending Invoices"
            value={pendingInvoices}
            icon={Wallet}
            color={pendingInvoices > 0 ? C.amber : C.teal}
            sub={pendingInvoices > 0 ? "Awaiting payment" : "All invoices settled"}
            trend={pendingInvoices > 0 ? `${pendingInvoices} need attention` : "All clear"}
            trendUp={pendingInvoices === 0}
            spark={[3,5,4,7,6,pendingInvoices]}
          />
        </div>

        {/* ── Row 2: Schedule + Revenue chart + Appointment status ─────── */}
        <div className="dash-section" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>

          {/* Today's schedule */}
          <Card>
            <SectionHead
              title="Today's Schedule"
              sub={`${appts.length} appointments · ${today}`}
              icon={CalendarDays}
              action={{ label: "Full calendar", onClick: () => navigate("/appointments") }}
            />
            {loadingAppts ? (
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                {[1,2,3,4].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Skeleton w={38} h={11} />
                    <Skeleton w={30} h={30} />
                    <div style={{ flex: 1 }}><Skeleton w="55%" h={12} /><div style={{ marginTop: 5 }}><Skeleton w="40%" h={10} /></div></div>
                    <Skeleton w={72} h={22} />
                  </div>
                ))}
              </div>
            ) : appts.length === 0 ? (
              <div style={{ padding: "44px 18px", textAlign: "center" }}>
                <Clock size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
                <p style={{ fontSize: 13, color: C.faint }}>No appointments scheduled for today</p>
              </div>
            ) : (
              appts.map((row: any, i: number) => (
                <div
                  key={row.id ?? i}
                  onClick={() => navigate(`/patients/${row.patient_id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 18px",
                    borderBottom: i < appts.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer", transition: "background .1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.bgMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 11, color: C.faint, width: 40, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {new Date(row.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Avi name={row.patient_name ?? "?"} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{row.patient_name}</p>
                    <p style={{ fontSize: 11, color: C.faint }}>
                      {row.type?.replace(/_/g, " ")} · {row.doctor_name}
                    </p>
                  </div>
                  <Badge label={row.status} color={statusColor(row.status)} />
                  <ChevronRight size={13} color={C.border} style={{ flexShrink: 0 }} />
                </div>
              ))
            )}
          </Card>

          {/* Right mini-column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Appointment status donut */}
            <Card>
              <SectionHead title="Appt Status" icon={Activity} />
              <div style={{ padding: "14px 18px" }}>
                <DonutChart
                  size={84}
                  segments={[
                    { color: C.teal,  value: completed,                            label: "Completed" },
                    { color: C.blue,  value: appts.filter((a) => a.status === "confirmed").length,  label: "Confirmed" },
                    { color: C.amber, value: appts.filter((a) => a.status === "waiting").length,    label: "Waiting" },
                    { color: C.red,   value: cancelled,                            label: "Cancelled" },
                  ].filter((s) => s.value > 0)}
                />
              </div>
            </Card>

            {/* Quick stats */}
            {[
              { label: "Lab Orders",    value: 4,  icon: FlaskConical, color: C.purple,  path: "/lab-orders" },
              { label: "Prescriptions", value: 12, icon: Stethoscope,  color: C.blue,    path: "/prescriptions" },
              { label: "Notifications", value: 6,  icon: Bell,         color: C.amber,   path: "/notifications" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px",
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, cursor: "pointer",
                  transition: "all .15s", fontFamily: "inherit",
                  width: "100%", textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = item.color + "08"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 8, background: item.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon size={14} color={item.color} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.text, flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
                <ChevronRight size={12} color={C.faint} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Row 3: Revenue chart + Procedures + Low stock ─────────────── */}
        <div className="dash-section" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 14 }}>

          {/* Revenue bar chart */}
          <Card>
            <SectionHead title="Revenue — Last 6 Months" icon={TrendingUp} iconColor={C.teal}>
            </SectionHead>
            <div style={{ padding: "14px 18px 4px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-.03em" }}>
                  {formatCurrency(REVENUE_DATA.reduce((s, d) => s + d.val, 0))}
                </span>
                <span style={{ fontSize: 12, color: C.tealText, fontWeight: 600 }}>↑ 18% vs prev period</span>
              </div>
              {/* Stacked bar chart */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
                {REVENUE_DATA.map((d, i) => {
                  const maxV = Math.max(...REVENUE_DATA.map((x) => x.val));
                  const isLast = i === REVENUE_DATA.length - 1;
                  return (
                    <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10, color: isLast ? C.tealText : C.faint, fontWeight: isLast ? 700 : 400 }}>
                        ${(d.val / 1000).toFixed(1)}k
                      </span>
                      <div style={{
                        width: "100%",
                        height: `${(d.val / maxV) * 68}px`,
                        minHeight: 6,
                        borderRadius: "5px 5px 0 0",
                        background: isLast ? C.teal : "#d4ede5",
                        border: isLast ? "none" : `1px solid ${C.tealBorder}`,
                      }} />
                      <span style={{ fontSize: 10, color: isLast ? C.teal : C.faint, fontWeight: isLast ? 700 : 400 }}>{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Payment method breakdown */}
            <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 18px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[
                { method: "Cash",    pct: 43, color: C.teal },
                { method: "Card",    pct: 31, color: C.blue },
                { method: "Mobile",  pct: 17, color: C.purple },
                { method: "Insur.",  pct: 9,  color: C.amber },
              ].map((m) => (
                <div key={m.method} style={{ textAlign: "center" }}>
                  <div style={{ height: 3, borderRadius: 2, background: m.color, marginBottom: 4 }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.pct}%</p>
                  <p style={{ fontSize: 10, color: C.faint }}>{m.method}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Top procedures */}
          <Card>
            <SectionHead title="Top Procedures" icon={Stethoscope} iconColor={C.blue}
              action={{ label: "Treatments", onClick: () => navigate("/treatments") }}
            />
            <div style={{ padding: "14px 18px" }}>
              {[
                { name: "Scaling",    count: 31, color: C.teal },
                { name: "Filling",    count: 29, color: C.blue },
                { name: "Root Canal", count: 24, color: C.purple },
                { name: "Extraction", count: 18, color: C.amber },
                { name: "Crown",      count: 12, color: C.red },
                { name: "Whitening",  count: 8,  color: C.faint },
              ].map((p) => (
                <ProcBar key={p.name} name={p.name} count={p.count} max={31} color={p.color} />
              ))}
            </div>
          </Card>

          {/* Low stock + inventory status */}
          <Card>
            <SectionHead title="Inventory Status" icon={Package} iconColor={C.red}
              action={{ label: "View all", onClick: () => navigate("/inventory") }}
            />
            <div style={{ padding: "12px 18px 4px" }}>
              {/* Status summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "OK",       value: 79, icon: CheckCircle2, color: C.teal },
                  { label: "Low",      value: 3,  icon: AlertTriangle,color: C.amber },
                  { label: "Critical", value: 2,  icon: XCircle,      color: C.red },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "8px 4px", background: C.bgMuted, borderRadius: 8 }}>
                    <s.icon size={14} color={s.color} style={{ margin: "0 auto 3px", display: "block" }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: C.faint }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Low stock items */}
            {lowStockArr.length === 0 ? (
              <div style={{ padding: "12px 18px 16px", textAlign: "center" }}>
                <CheckCircle2 size={22} color={C.teal} style={{ margin: "0 auto 6px", display: "block" }} />
                <p style={{ fontSize: 12, color: C.tealText, fontWeight: 600 }}>All stock levels good</p>
              </div>
            ) : (
              lowStockArr.slice(0, 4).map((item: any, i: number) => (
                <div key={item.id ?? i} style={{
                  padding: "9px 18px",
                  borderTop: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.red, flexShrink: 0 }}>
                      {item.quantity_in_stock} left
                    </span>
                  </div>
                  <div style={{ height: 3, background: "#edf1ef", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min((item.quantity_in_stock / (item.minimum_stock_level || 10)) * 100, 100)}%`,
                      background: item.quantity_in_stock === 0 ? C.red : C.amber,
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* ── Row 4: Recent invoices + Activity feed + Quick actions ─────── */}
        <div className="dash-section" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>

          {/* Recent invoices */}
          <Card>
            <SectionHead title="Recent Invoices" icon={ReceiptText} iconColor={C.teal}
              action={{ label: "All invoices", onClick: () => navigate("/billing") }}
            />
            <div>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 80px", gap: 8, padding: "8px 18px", borderBottom: `1px solid ${C.border}`, background: C.bgMuted }}>
                {["Patient", "Amount", "Status", "Date"].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".06em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {[
                { patient: "Amina Hassan",   amount: "$266",  status: "partial",  date: "15 Jan" },
                { patient: "Omar Nuur",      amount: "$150",  status: "unpaid",   date: "15 Jan" },
                { patient: "Hodan Jama",     amount: "$500",  status: "paid",     date: "14 Jan" },
                { patient: "Mahad Ali",      amount: "$80",   status: "paid",     date: "13 Jan" },
                { patient: "Khalid Cali",    amount: "$80",   status: "unpaid",   date: "10 Jan" },
              ].map((row, i) => {
                const statusMap: Record<string, "amber" | "green" | "red" | "blue" | "gray"> = {
                  paid: "green", partial: "amber", unpaid: "red", overdue: "red", void: "gray",
                };
                return (
                  <div
                    key={i}
                    onClick={() => navigate("/billing")}
                    style={{
                      display: "grid", gridTemplateColumns: "1fr 90px 80px 80px", gap: 8,
                      padding: "11px 18px",
                      borderBottom: i < 4 ? `1px solid ${C.border}` : "none",
                      cursor: "pointer", transition: "background .1s", alignItems: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.bgMuted)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <Avi name={row.patient} size={26} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.patient}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{row.amount}</span>
                    <Badge label={row.status} color={statusMap[row.status] ?? "gray"} />
                    <span style={{ fontSize: 11, color: C.faint }}>{row.date}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity feed + Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Activity feed */}
            <Card style={{ flex: 1 }}>
              <SectionHead title="Recent Activity" icon={Activity} iconColor={C.purple} />
              <div style={{ padding: "4px 18px 8px" }}>
                {[
                  { icon: Users,       bg: C.tealBg,   title: "New patient registered",      sub: "Ikram Daud — PT-00086",              time: "5m" },
                  { icon: CalendarDays,bg: C.blueBg,   title: "Appointment confirmed",        sub: "Amina Hassan — 15 Jan 09:00",        time: "12m" },
                  { icon: ReceiptText, bg: C.amberBg,  title: "Invoice paid",                 sub: "INV-00203 · $500 by Hodan Jama",     time: "1h" },
                  { icon: Package,     bg: C.redBg,    title: "Low stock alert",              sub: "Composite Resin A2 — 3 units left",  time: "2h" },
                  { icon: Stethoscope, bg: C.purpleBg, title: "Treatment completed",          sub: "Root Canal · Dr. Farah",             time: "3h" },
                  { icon: Bell,        bg: C.tealBg,   title: "Recall reminder sent",         sub: "6 patients — 6-month cleaning due",  time: "4h" },
                ].map((item, i) => (
                  <div key={i} style={{ borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                    <ActivityItem iconBg={""} {...item} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick actions */}
            <Card>
              <SectionHead title="Quick Actions" icon={MoreHorizontal} iconColor={C.muted} />
              <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "New Patient",    icon: Users,       color: C.teal,   path: "/patients" },
                  { label: "Book Appt",      icon: CalendarDays,color: C.blue,   path: "/appointments" },
                  { label: "Create Invoice", icon: ReceiptText, color: C.amber,  path: "/billing" },
                  { label: "Add Expense",    icon: Wallet,      color: C.purple, path: "/expenses" },
                  { label: "Lab Order",      icon: FlaskConical,color: C.red,    path: "/lab-orders" },
                  { label: "View Reports",   icon: TrendingUp,  color: C.teal,   path: "/reports" },
                ].map((a) => (
                  <button
                    key={a.path}
                    onClick={() => navigate(a.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 10px", borderRadius: 8,
                      background: a.color + "10", border: `1px solid ${a.color}25`,
                      cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = a.color + "1e"; e.currentTarget.style.borderColor = a.color + "55"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = a.color + "10"; e.currentTarget.style.borderColor = a.color + "25"; }}
                  >
                    <a.icon size={13} color={a.color} strokeWidth={1.8} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </Card>

          </div>
        </div>

      </div>
    </>
  );
}