import { DollarSign, TrendingUp, CreditCard, BarChart3, Download } from "lucide-react";
import { PageWrapper, PageHeader, Card, Badge, Btn, StatCard, SectionTitle, SA } from "./shared";
import toast from "react-hot-toast";

const MONTHLY_DATA = [
  { month: "Nov", revenue: 28400, clinics: 108 },
  { month: "Dec", revenue: 32100, clinics: 118 },
  { month: "Jan", revenue: 35600, clinics: 124 },
  { month: "Feb", revenue: 38200, clinics: 130 },
  { month: "Mar", revenue: 42800, clinics: 136 },
  { month: "Apr", revenue: 48600, clinics: 142 },
];

const TOP_CLINICS = [
  { name: "DentaFlow Clinic", plan: "Enterprise", revenue: "$999", pct: 100, color: SA.success },
  { name: "PerfectTeeth Center", plan: "Enterprise", revenue: "$999", pct: 100, color: SA.success },
  { name: "SmilePro Clinic", plan: "Enterprise", revenue: "$999", pct: 100, color: SA.success },
  { name: "Bright Smile Clinic", plan: "Pro", revenue: "$299", pct: 30, color: SA.accent },
  { name: "WhiteArc Dental", plan: "Pro", revenue: "$299", pct: 30, color: SA.accent },
];

const TRANSACTIONS = [
  { id: "TXN-4421", clinic: "DentaFlow Clinic", plan: "Enterprise", amount: "$999", date: "Apr 1, 2025", method: "Stripe", status: "succeeded" },
  { id: "TXN-4420", clinic: "PerfectTeeth Center", plan: "Enterprise", amount: "$999", date: "Mar 20, 2025", method: "Stripe", status: "succeeded" },
  { id: "TXN-4419", clinic: "SmilePro Clinic", plan: "Enterprise", amount: "$999", date: "Mar 18, 2025", method: "Stripe", status: "succeeded" },
  { id: "TXN-4418", clinic: "Bright Smile Clinic", plan: "Pro", amount: "$299", date: "Apr 14, 2025", method: "Stripe", status: "succeeded" },
  { id: "TXN-4417", clinic: "WhiteArc Dental", plan: "Pro", amount: "$299", date: "Mar 5, 2025", method: "Stripe", status: "succeeded" },
  { id: "TXN-4416", clinic: "Sunrise Dental", plan: "Starter", amount: "$49", date: "Mar 12, 2025", method: "Stripe", status: "failed" },
];

const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));

export default function AnalyticsPage() {
  const planVariant = (p: string) =>
    p === "Enterprise" ? "success" : p === "Pro" ? "purple" : "info";

  return (
    <PageWrapper>
      <PageHeader
        breadcrumb="Super Admin · Reports"
        title="Revenue Analytics"
        subtitle="Platform-wide revenue metrics and transaction history"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ height: 38, padding: "0 12px", border: `1.5px solid ${SA.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "white", cursor: "pointer" }}>
              <option>Last 6 months</option>
              <option>Last 12 months</option>
              <option>This year</option>
            </select>
            <Btn label="Export" variant="secondary" icon={<Download size={14} />} onClick={() => toast("Exporting revenue report...")} />
          </div>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<DollarSign size={18} />} label="This Month MRR" value="$48,600" trend="+13.6%" positive={true} color={SA.success} bg={SA.successBg} />
        <StatCard icon={<TrendingUp size={18} />} label="YoY Revenue Growth" value="71.4%" trend="+8% vs last yr" positive={true} color={SA.accent} bg={SA.accentLight} />
        <StatCard icon={<CreditCard size={18} />} label="Avg. Revenue / Clinic" value="$342" trend="+$22 vs last mo" positive={true} color={SA.info} bg={SA.infoBg} />
        <StatCard icon={<BarChart3 size={18} />} label="Annual Run Rate" value="$583K" color={SA.warning} bg={SA.warningBg} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 20 }}>
        {/* Bar Chart */}
        <Card>
          <SectionTitle title="Monthly Revenue (Last 6 Months)" />
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 200, marginBottom: 12 }}>
              {MONTHLY_DATA.map((d) => (
                <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: SA.textSecondary }}>${(d.revenue / 1000).toFixed(0)}k</span>
                  <div style={{
                    width: "100%", background: `linear-gradient(180deg, ${SA.accent}, ${SA.accentLight})`,
                    borderRadius: "8px 8px 0 0",
                    height: `${(d.revenue / maxRevenue) * 160}px`,
                    position: "relative", overflow: "hidden",
                    transition: "height 0.5s ease",
                  }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(139,92,246,0.8), rgba(139,92,246,0.3))" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, height: 20 }}>
              {MONTHLY_DATA.map((d) => (
                <div key={d.month} style={{ flex: 1, textAlign: "center", fontSize: 12, color: SA.textSecondary, fontWeight: 500 }}>{d.month}</div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top Clinics by Revenue */}
        <Card>
          <SectionTitle title="Top Clinics by Revenue" />
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {TOP_CLINICS.map((c, i) => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", background: SA.bg, display: "flex", alignItems: "center", justifyContent: "center", color: SA.textMuted }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: SA.textPrimary, fontWeight: 500 }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: SA.textPrimary }}>{c.revenue}</span>
                </div>
                <div style={{ height: 4, background: SA.bg, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue by Plan */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { plan: "Starter", clinics: 42, mRev: 49, color: SA.info },
          { plan: "Pro", clinics: 71, mRev: 299, color: SA.accent },
          { plan: "Enterprise", clinics: 29, mRev: 999, color: SA.success },
        ].map((p) => (
          <Card key={p.plan}>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Badge label={p.plan} variant={p.plan === "Enterprise" ? "success" : p.plan === "Pro" ? "purple" : "info"} />
                <span style={{ fontSize: 12, color: SA.textSecondary }}>{p.clinics} clinics</span>
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: SA.textPrimary, margin: 0 }}>${(p.mRev * p.clinics).toLocaleString()}<span style={{ fontSize: 12, color: SA.textSecondary, fontWeight: 400 }}>/mo</span></p>
              <div style={{ height: 4, background: SA.bg, borderRadius: 2, overflow: "hidden", marginTop: 12 }}>
                <div style={{ width: `${(p.clinics / 142) * 100}%`, height: "100%", background: p.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Transactions */}
      <Card>
        <SectionTitle title="Recent Transactions" action={<Btn label="View All" variant="ghost" size="sm" onClick={() => toast("View all")} />} />
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 2fr 100px 80px 80px 120px 90px", padding: "10px 20px", background: SA.bg, borderBottom: `1px solid ${SA.border}` }}>
            {["Txn ID", "Clinic", "Plan", "Amount", "Method", "Date", "Status"].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: SA.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
            ))}
          </div>
          {TRANSACTIONS.map((t) => (
            <div key={t.id} className="sa-row-hover" style={{ display: "grid", gridTemplateColumns: "120px 2fr 100px 80px 80px 120px 90px", alignItems: "center", padding: "13px 20px", borderBottom: `1px solid ${SA.border}` }}>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: SA.textSecondary }}>{t.id}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: SA.textPrimary }}>{t.clinic}</span>
              <Badge label={t.plan} variant={planVariant(t.plan)} />
              <span style={{ fontSize: 13, fontWeight: 700, color: SA.textPrimary }}>{t.amount}</span>
              <span style={{ fontSize: 12, color: SA.textSecondary }}>{t.method}</span>
              <span style={{ fontSize: 12, color: SA.textMuted }}>{t.date}</span>
              <Badge label={t.status} variant={t.status === "succeeded" ? "success" : "error"} />
            </div>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}

function planVariant(p: string) {
  return p === "Enterprise" ? "success" : p === "Pro" ? "purple" : "info";
}