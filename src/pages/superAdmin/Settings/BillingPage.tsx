import { useState } from "react";
import { CreditCard, CheckCircle2, Edit2, Plus, DollarSign, Users, HardDrive, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { PageWrapper, PageHeader, Card, Badge, Btn, StatCard, SectionTitle, SA } from "../shared";

const PLANS = [
  {
    id: "starter", name: "Starter", price: 49, color: SA.info, bg: SA.infoBg,
    description: "Perfect for small clinics starting out",
    features: ["Up to 3 staff", "100 appointments/mo", "1 GB storage", "Email support", "Basic reports"],
    clinics: 42, popular: false,
  },
  {
    id: "pro", name: "Pro", price: 299, color: SA.accent, bg: SA.accentLight,
    description: "For growing clinics with advanced needs",
    features: ["Up to 10 staff", "500 appointments/mo", "10 GB storage", "Priority support", "Advanced reports", "Insurance module", "Role-based access"],
    clinics: 71, popular: true,
  },
  {
    id: "enterprise", name: "Enterprise", price: 999, color: SA.success, bg: SA.successBg,
    description: "For large multi-branch clinics",
    features: ["Unlimited staff", "Unlimited appointments", "100 GB storage", "24/7 dedicated support", "Custom reports", "All modules", "White-label option", "API access", "SLA guarantee"],
    clinics: 29, popular: false,
  },
];

const SUBSCRIPTIONS = [
  { id: 1, clinic: "DentaFlow Clinic", plan: "Enterprise", status: "active", start: "Jan 3, 2025", renewal: "May 3, 2025", amount: "$999" },
  { id: 2, clinic: "PerfectTeeth Center", plan: "Enterprise", status: "active", start: "Mar 20, 2025", renewal: "Apr 20, 2025", amount: "$999" },
  { id: 3, clinic: "SmilePro Clinic", plan: "Enterprise", status: "active", start: "Feb 18, 2025", renewal: "May 18, 2025", amount: "$999" },
  { id: 4, clinic: "Bright Smile Clinic", plan: "Pro", status: "active", start: "Apr 14, 2025", renewal: "May 14, 2025", amount: "$299" },
  { id: 5, clinic: "WhiteArc Dental", plan: "Pro", status: "active", start: "Mar 5, 2025", renewal: "May 5, 2025", amount: "$299" },
  { id: 6, clinic: "Sunrise Dental", plan: "Starter", status: "overdue", start: "Jan 12, 2025", renewal: "Apr 12, 2025", amount: "$49" },
  { id: 7, clinic: "Al-Noor Dental", plan: "Starter", status: "active", start: "Apr 13, 2025", renewal: "May 13, 2025", amount: "$49" },
];

export default function AdminBillingPage() {
  const [editPlan, setEditPlan] = useState<string | null>(null);

  const planVariant = (p: string) =>
    p === "Enterprise" ? "success" : p === "Pro" ? "purple" : "info";

  const statusVariant = (s: string) =>
    s === "active" ? "success" : s === "overdue" ? "error" : "warning";

  const totalMRR = SUBSCRIPTIONS.filter(s => s.status === "active")
    .reduce((sum, s) => sum + parseInt(s.amount.replace("$", "").replace(",", "")), 0);

  return (
    <PageWrapper>
      <PageHeader
        breadcrumb="Super Admin · Billing"
        title="Plans & Pricing"
        subtitle="Manage subscription plans and clinic billing"
        action={<Btn label="Add Custom Plan" variant="primary" icon={<Plus size={14} />} onClick={() => toast("Custom plan modal")} />}
      />

      {/* MRR stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<DollarSign size={18} />} label="Monthly Recurring Revenue" value={`$${totalMRR.toLocaleString()}`} trend="+15%" positive={true} color={SA.success} bg={SA.successBg} />
        <StatCard icon={<Users size={18} />} label="Paying Clinics" value={SUBSCRIPTIONS.filter(s => s.status === "active").length} color={SA.accent} bg={SA.accentLight} />
        <StatCard icon={<CreditCard size={18} />} label="Overdue Invoices" value={SUBSCRIPTIONS.filter(s => s.status === "overdue").length} color={SA.error} bg={SA.errorBg} />
        <StatCard icon={<Activity size={18} />} label="Avg. Plan Value" value="$370/mo" trend="+8%" positive={true} color={SA.info} bg={SA.infoBg} />
      </div>

      {/* Plan Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
        {PLANS.map((plan) => (
          <div key={plan.id} style={{
            background: "white", border: `1.5px solid ${plan.popular ? plan.color : SA.border}`,
            borderRadius: 18, overflow: "hidden", position: "relative",
          }}>
            {plan.popular && (
              <div style={{ background: plan.color, padding: "6px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "0.06em" }}>
                MOST POPULAR
              </div>
            )}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: plan.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <CreditCard size={18} color={plan.color} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: SA.textPrimary, margin: 0 }}>{plan.name}</p>
                  <p style={{ fontSize: 12, color: SA.textSecondary, marginTop: 2 }}>{plan.description}</p>
                </div>
                <button onClick={() => setEditPlan(plan.id)} style={{ background: SA.bg, border: `1px solid ${SA.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: SA.textSecondary }}>
                  <Edit2 size={13} />
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: SA.textPrimary, letterSpacing: "-0.03em" }}>${plan.price}</span>
                <span style={{ fontSize: 14, color: SA.textSecondary }}>/mo</span>
              </div>

              <div style={{ padding: "10px 12px", background: plan.bg, borderRadius: 10, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: plan.color, fontWeight: 600 }}>{plan.clinics} clinics subscribed</span>
                <span style={{ fontSize: 12, color: plan.color, fontWeight: 700 }}>${(plan.price * plan.clinics).toLocaleString()}/mo</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={13} color={plan.color} />
                    <span style={{ fontSize: 12, color: SA.textSecondary }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Subscriptions */}
      <Card>
        <SectionTitle title="Active Subscriptions" action={<Badge label={`${SUBSCRIPTIONS.length} total`} variant="neutral" />} />
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 110px 110px 80px 80px", padding: "10px 20px", background: SA.bg, borderBottom: `1px solid ${SA.border}` }}>
            {["Clinic", "Plan", "Status", "Start Date", "Renewal", "Amount", ""].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: SA.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
            ))}
          </div>
          {SUBSCRIPTIONS.map((s) => (
            <div key={s.id} className="sa-row-hover" style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 110px 110px 80px 80px", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${SA.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{s.clinic}</span>
              <Badge label={s.plan} variant={planVariant(s.plan)} />
              <Badge label={s.status} variant={statusVariant(s.status)} />
              <span style={{ fontSize: 12, color: SA.textSecondary }}>{s.start}</span>
              <span style={{ fontSize: 12, color: s.status === "overdue" ? SA.error : SA.textSecondary, fontWeight: s.status === "overdue" ? 600 : 400 }}>{s.renewal}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{s.amount}</span>
              <Btn label="Invoice" variant="ghost" size="sm" onClick={() => toast(`Viewing invoice for ${s.clinic}`)} />
            </div>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}