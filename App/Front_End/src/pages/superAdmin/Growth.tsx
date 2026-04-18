// ─── Growth.tsx ───────────────────────────────────────────────────────────────
import { Download, TrendingUp } from "lucide-react";
import { Btn, Card, PageHeader, PageWrapper, SA, SectionTitle, StatCard } from "./shared";
import { toast } from "react-hot-toast";
 
const GROWTH_MONTHS = [
  { month: "Oct", clinics: 95, revenue: 22100, users: 820 },
  { month: "Nov", clinics: 102, revenue: 26500, users: 920 },
  { month: "Dec", clinics: 108, revenue: 28400, users: 980 },
  { month: "Jan", clinics: 118, revenue: 32100, users: 1060 },
  { month: "Feb", clinics: 124, revenue: 35600, users: 1140 },
  { month: "Mar", clinics: 130, revenue: 38200, users: 1200 },
  { month: "Apr", clinics: 142, revenue: 48600, users: 1284 },
];
 
export function GrowthPage() {
  const maxVal = Math.max(...GROWTH_MONTHS.map((d) => d.revenue));
  return (
    <PageWrapper>
      <PageHeader breadcrumb="Super Admin · Reports" title="Growth Analytics" subtitle="Platform growth trends over time"
        action={<Btn label="Export" variant="secondary" icon={<Download size={14} />} onClick={() => toast("Exporting...")} />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<TrendingUp size={18} />} label="Clinic Growth (MoM)" value="+9.2%" trend="vs +6.1% last month" positive={true} color={SA.accent} bg={SA.accentLight} />
        <StatCard icon={<TrendingUp size={18} />} label="Revenue Growth (MoM)" value="+27.2%" trend="vs +14.1% last month" positive={true} color={SA.success} bg={SA.successBg} />
        <StatCard icon={<TrendingUp size={18} />} label="User Growth (MoM)" value="+7%" positive={true} color={SA.info} bg={SA.infoBg} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <SectionTitle title="Revenue Growth" />
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, marginBottom: 10 }}>
              {GROWTH_MONTHS.map((d) => (
                <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 10, color: SA.textMuted }}>${(d.revenue / 1000).toFixed(0)}k</span>
                  <div style={{ width: "100%", background: `linear-gradient(180deg, ${SA.accent}, ${SA.accentLight})`, borderRadius: "6px 6px 0 0", height: `${(d.revenue / maxVal) * 140}px` }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>{GROWTH_MONTHS.map((d) => <div key={d.month} style={{ flex: 1, textAlign: "center", fontSize: 11, color: SA.textSecondary }}>{d.month}</div>)}</div>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Clinics & Users Growth" />
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {GROWTH_MONTHS.map((d, i) => (
              <div key={d.month} style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px 1fr 60px", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: SA.textSecondary }}>{d.month}</span>
                <div style={{ height: 6, background: SA.bg, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(d.clinics / 142) * 100}%`, height: "100%", background: SA.accent, borderRadius: 3 }} /></div>
                <span style={{ fontSize: 11, color: SA.textSecondary, textAlign: "right" }}>{d.clinics}</span>
                <div style={{ height: 6, background: SA.bg, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(d.users / 1284) * 100}%`, height: "100%", background: SA.info, borderRadius: 3 }} /></div>
                <span style={{ fontSize: 11, color: SA.textSecondary, textAlign: "right" }}>{d.users}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 16, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${SA.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: SA.accent }} /><span style={{ fontSize: 12, color: SA.textSecondary }}>Clinics</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: SA.info }} /><span style={{ fontSize: 12, color: SA.textSecondary }}>Users</span></div>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}