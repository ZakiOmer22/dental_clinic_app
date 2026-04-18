import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, CalendarDays, ReceiptText, Package,
  AlertTriangle, ChevronRight, Clock, TrendingUp,
  TrendingDown, Activity, FlaskConical, Stethoscope,
  Wallet, Bell, ArrowUpRight, MoreHorizontal,
  CheckCircle2, XCircle, Timer,
} from "lucide-react";
import { apiGetAppointments } from "@/api/appointments";
import { apiGetPatients } from "@/api/patients";
import { apiGetInvoices } from "@/api/billing";
import { apiGetLowStock } from "@/api/inventory";
import { apiGetLabOrders } from "@/api/labOrders";
import { apiGetPrescriptions } from "@/api/prescriptions";
import { apiGetTreatments } from "@/api/treatments";
import { apiGetProcedures } from "@/api/procedures";
import { formatCurrency, formatDate } from "@/utils";

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
  const initials = (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
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

function statusColor(s: string): "green" | "amber" | "red" | "blue" | "gray" {
  const m: Record<string, "green" | "amber" | "red" | "blue" | "gray"> = {
    completed: "green", confirmed: "blue", in_progress: "green",
    scheduled: "gray", waiting: "amber", cancelled: "red", no_show: "red",
    paid: "green", unpaid: "red", partial: "amber",
  };
  return m[s] ?? "gray";
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AccountantDashboardPage() {
  const navigate = useNavigate();

  // Real API calls
  const { data: todayAppts, isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: apiGetAppointments,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: () => apiGetPatients({ limit: 1 }),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({ limit: 1000 }),
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ["inventory", "low"],
    queryFn: apiGetLowStock,
  });

  const { data: labOrdersData } = useQuery({
    queryKey: ["lab-orders", "all"],
    queryFn: () => apiGetLabOrders({ limit: 1000 }),
  });

  const { data: prescriptionsData } = useQuery({
    queryKey: ["prescriptions", "all"],
    queryFn: () => apiGetPrescriptions({ limit: 1000 }),
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ["treatments", "all"],
    queryFn: () => apiGetTreatments({ limit: 1000 }),
  });

  const { data: proceduresData } = useQuery({
    queryKey: ["procedures", "all"],
    queryFn: () => apiGetProcedures({ limit: 100 }),
  });

  // Process real data
  const appts: any[] = Array.isArray(todayAppts) ? todayAppts : (todayAppts as any)?.data ?? [];
  const totalPatients = (patientsData as any)?.total ?? 0;
  const invoices: any[] = (invoicesData as any)?.data ?? [];
  const labOrders: any[] = (labOrdersData as any)?.data ?? [];
  const prescriptions: any[] = (prescriptionsData as any)?.data ?? [];
  const treatments: any[] = (treatmentsData as any)?.data ?? [];
  const procedures: any[] = (proceduresData as any)?.data ?? [];
  const lowStockArr = lowStock as any[];

  // Calculate real revenue
  const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.paid_amount) || 0), 0);
  const pendingInvoices = invoices.filter((inv: any) => ["unpaid", "partial"].includes(inv.status)).length;

  // Appointment stats
  const completed = appts.filter((a: any) => a.status === "completed").length;
  const cancelled = appts.filter((a: any) => a.status === "cancelled" || a.status === "no_show").length;
  const confirmed = appts.filter((a: any) => a.status === "confirmed").length;
  const waiting = appts.filter((a: any) => a.status === "waiting" || a.status === "scheduled").length;

  // Calculate procedure counts from real treatments
  const procedureCounts: Record<string, number> = {};
  treatments.forEach((treatment: any) => {
    if (treatment.procedures) {
      treatment.procedures.forEach((proc: any) => {
        const procName = proc.procedure?.name || "Other";
        procedureCounts[procName] = (procedureCounts[procName] || 0) + 1;
      });
    }
  });

  const topProcedures = Object.entries(procedureCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Real recent invoices
  const recentInvoices = invoices.slice(0, 5).map((inv: any) => ({
    patient: inv.patient_name || `Patient #${inv.patient_id}`,
    amount: formatCurrency(inv.total_amount || 0),
    status: inv.status || "unpaid",
    date: inv.created_at ? formatDate(inv.created_at) : "—",
  }));

  // Real activity items
  const activityItems = [
    { icon: Users, bg: C.tealBg, title: "New patient registered", sub: `${totalPatients} total patients`, time: "Today" },
    { icon: CalendarDays, bg: C.blueBg, title: "Today's appointments", sub: `${appts.length} scheduled`, time: "Today" },
    { icon: ReceiptText, bg: C.amberBg, title: "Revenue collected", sub: formatCurrency(totalRevenue), time: "This month" },
    { icon: Package, bg: C.redBg, title: "Low stock items", sub: `${lowStockArr.length} items need reorder`, time: "Alert" },
    { icon: Stethoscope, bg: C.purpleBg, title: "Treatments completed", sub: `${treatments.filter((t: any) => t.is_completed).length} completed`, time: "All time" },
  ];

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .dash-section { animation: fadeUp .4s ease both; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Low stock banner */}
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
              background: "none", border: "none", cursor: "pointer",
            }}>
              View inventory <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* Page title */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{today}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/patients/new")} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              background: C.teal + "15", border: `1px solid ${C.teal}30`,
              color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              <ArrowUpRight size={12} /> New Patient
            </button>
            <button onClick={() => navigate("/appointments/new")} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              background: C.blue + "15", border: `1px solid ${C.blue}30`,
              color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              <ArrowUpRight size={12} /> Book Appointment
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="dash-section" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <Card>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Total Patients</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.blue + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={14} color={C.blue} />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{totalPatients}</p>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>All registered patients</p>
            </div>
          </Card>

          <Card>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Today's Appointments</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.teal + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CalendarDays size={14} color={C.teal} />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{appts.length}</p>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{completed} completed · {cancelled} cancelled</p>
            </div>
          </Card>

          <Card>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Revenue Collected</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.teal + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ReceiptText size={14} color={C.teal} />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{formatCurrency(totalRevenue)}</p>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>From {invoices.length} invoices</p>
            </div>
          </Card>

          <Card>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Pending Invoices</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: pendingInvoices > 0 ? C.amber + "18" : C.teal + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={14} color={pendingInvoices > 0 ? C.amber : C.teal} />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{pendingInvoices}</p>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{pendingInvoices > 0 ? "Awaiting payment" : "All invoices settled"}</p>
            </div>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div className="dash-section" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
          <Card>
            <SectionHead
              title="Today's Schedule"
              sub={`${appts.length} appointments · ${today}`}
              icon={CalendarDays}
              action={{ label: "Full calendar", onClick: () => navigate("/appointments") }}
            />
            {loadingAppts ? (
              <div style={{ padding: "16px 18px", textAlign: "center" }}>Loading...</div>
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
                  <span style={{ fontSize: 11, color: C.faint, width: 40, flexShrink: 0 }}>
                    {new Date(row.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Avi name={row.patient_name ?? "?"} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{row.patient_name}</p>
                    <p style={{ fontSize: 11, color: C.faint }}>{row.type?.replace(/_/g, " ")} · {row.doctor_name}</p>
                  </div>
                  <Badge label={row.status} color={statusColor(row.status)} />
                  <ChevronRight size={13} color={C.border} style={{ flexShrink: 0 }} />
                </div>
              ))
            )}
          </Card>

          {/* Right column stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <SectionHead title="Appointment Status" icon={Activity} />
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Completed</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: C.teal }}>{completed}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div style={{ width: `${appts.length ? (completed / appts.length) * 100 : 0}%`, height: 4, background: C.teal, borderRadius: 2 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Confirmed</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>{confirmed}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div style={{ width: `${appts.length ? (confirmed / appts.length) * 100 : 0}%`, height: 4, background: C.blue, borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick stats cards */}
            <Card>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Lab Orders</span>
                  <FlaskConical size={16} color={C.purple} />
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{labOrders.length}</p>
              </div>
            </Card>

            <Card>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Prescriptions</span>
                  <Stethoscope size={16} color={C.blue} />
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{prescriptions.length}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Invoices & Activity */}
        <div className="dash-section" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <Card>
            <SectionHead title="Recent Invoices" icon={ReceiptText} iconColor={C.teal}
              action={{ label: "All invoices", onClick: () => navigate("/billing") }}
            />
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px", gap: 8, padding: "8px 18px", borderBottom: `1px solid ${C.border}`, background: C.bgMuted }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.faint }}>Patient</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.faint }}>Amount</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.faint }}>Status</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.faint }}>Date</span>
              </div>
              {recentInvoices.map((row, i) => (
                <div
                  key={i}
                  onClick={() => navigate("/billing")}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 100px 80px 80px", gap: 8,
                    padding: "11px 18px",
                    borderBottom: i < recentInvoices.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer", alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.bgMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avi name={row.patient} size={26} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{row.patient}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{row.amount}</span>
                  <Badge label={row.status} color={statusColor(row.status)} />
                  <span style={{ fontSize: 11, color: C.faint }}>{row.date}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHead title="Recent Activity" icon={Activity} iconColor={C.purple} />
            <div style={{ padding: "4px 18px 8px" }}>
              {activityItems.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < activityItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <item.icon size={13} color={C.teal} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: C.faint }}>{item.sub}</p>
                  </div>
                  <span style={{ fontSize: 10, color: C.faint }}>{item.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}