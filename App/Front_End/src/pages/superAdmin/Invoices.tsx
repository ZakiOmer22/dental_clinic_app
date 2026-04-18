// ─── Invoices.tsx ──────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { Receipt, Download, Send, Eye, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { PageWrapper, PageHeader, Card, Badge, Btn, StatCard, SectionTitle, SearchInput, SA, EmptyState } from "./shared";
 
const INVOICES_DATA = [
  { id: "INV-1042", clinic: "DentaFlow Clinic", plan: "Enterprise", amount: "$999", issued: "Apr 1, 2025", due: "Apr 7, 2025", status: "paid", paidAt: "Apr 2, 2025" },
  { id: "INV-1041", clinic: "PerfectTeeth Center", plan: "Enterprise", amount: "$999", issued: "Apr 1, 2025", due: "Apr 7, 2025", status: "paid", paidAt: "Apr 1, 2025" },
  { id: "INV-1040", clinic: "SmilePro Clinic", plan: "Enterprise", amount: "$999", issued: "Apr 1, 2025", due: "Apr 7, 2025", status: "paid", paidAt: "Apr 3, 2025" },
  { id: "INV-1039", clinic: "Bright Smile Clinic", plan: "Pro", amount: "$299", issued: "Apr 14, 2025", due: "Apr 21, 2025", status: "open", paidAt: "" },
  { id: "INV-1038", clinic: "WhiteArc Dental", plan: "Pro", amount: "$299", issued: "Mar 5, 2025", due: "Mar 12, 2025", status: "paid", paidAt: "Mar 6, 2025" },
  { id: "INV-1037", clinic: "Sunrise Dental", plan: "Starter", amount: "$49", issued: "Mar 12, 2025", due: "Mar 19, 2025", status: "overdue", paidAt: "" },
  { id: "INV-1036", clinic: "Al-Noor Dental", plan: "Starter", amount: "$49", issued: "Apr 13, 2025", due: "Apr 20, 2025", status: "open", paidAt: "" },
];
 
export function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
 
  const filtered = useMemo(() => INVOICES_DATA.filter((inv) => {
    const ms = inv.clinic.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "All" || inv.status === statusFilter;
    return ms && mst;
  }), [search, statusFilter]);
 
  const planVariant = (p: string) => p === "Enterprise" ? "success" : p === "Pro" ? "purple" : "info";
  const statusVariant = (s: string) => s === "paid" ? "success" : s === "open" ? "info" : "error";
 
  const totalPaid = INVOICES_DATA.filter(i => i.status === "paid").reduce((s, i) => s + parseInt(i.amount.replace("$", "").replace(",", "")), 0);
  const totalOpen = INVOICES_DATA.filter(i => i.status === "open").reduce((s, i) => s + parseInt(i.amount.replace("$", "").replace(",", "")), 0);
 
  return (
    <PageWrapper>
      <PageHeader breadcrumb="Super Admin · Billing" title="Invoices" subtitle="All invoices issued to clinics on the platform"
        action={<Btn label="Create Invoice" variant="primary" icon={<Receipt size={14} />} onClick={() => toast("Create invoice")} />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon={<Receipt size={18} />} label="Total Invoices" value={INVOICES_DATA.length} color={SA.accent} bg={SA.accentLight} />
        <StatCard icon={<Receipt size={18} />} label="Paid This Month" value={`$${totalPaid.toLocaleString()}`} trend="100% collected" positive={true} color={SA.success} bg={SA.successBg} />
        <StatCard icon={<Receipt size={18} />} label="Open Invoices" value={`$${totalOpen}`} color={SA.info} bg={SA.infoBg} />
        <StatCard icon={<Receipt size={18} />} label="Overdue" value={INVOICES_DATA.filter(i => i.status === "overdue").length} color={SA.error} bg={SA.errorBg} />
      </div>
      <Card>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${SA.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by clinic or invoice ID…" />
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {["All", "paid", "open", "overdue"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${statusFilter === s ? SA.accent : SA.border}`, background: statusFilter === s ? SA.accentLight : "white", color: statusFilter === s ? SA.accent : SA.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: statusFilter === s ? 600 : 400, textTransform: "capitalize" }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "120px 2fr 90px 80px 100px 100px 90px 80px", padding: "10px 20px", background: SA.bg, borderBottom: `1px solid ${SA.border}` }}>
          {["Invoice #", "Clinic", "Plan", "Amount", "Issued", "Due Date", "Status", ""].map((h) => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: SA.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? <EmptyState message="No invoices found" /> : filtered.map((inv) => (
          <div key={inv.id} className="sa-row-hover" style={{ display: "grid", gridTemplateColumns: "120px 2fr 90px 80px 100px 100px 90px 80px", alignItems: "center", padding: "13px 20px", borderBottom: `1px solid ${SA.border}` }}>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: SA.accent, fontWeight: 600 }}>{inv.id}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: SA.textPrimary }}>{inv.clinic}</span>
            <Badge label={inv.plan} variant={planVariant(inv.plan)} />
            <span style={{ fontSize: 13, fontWeight: 700, color: SA.textPrimary }}>{inv.amount}</span>
            <span style={{ fontSize: 12, color: SA.textSecondary }}>{inv.issued}</span>
            <span style={{ fontSize: 12, color: inv.status === "overdue" ? SA.error : SA.textSecondary, fontWeight: inv.status === "overdue" ? 600 : 400 }}>{inv.due}</span>
            <Badge label={inv.status} variant={statusVariant(inv.status)} />
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => toast(`Viewing ${inv.id}`)} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: SA.textMuted }}><Eye size={14} /></button>
              {inv.status !== "paid" && <button onClick={() => toast(`Sending reminder for ${inv.id}`)} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: SA.textMuted }}><Send size={14} /></button>}
            </div>
          </div>
        ))}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${SA.border}`, fontSize: 12, color: SA.textMuted }}>{filtered.length} of {INVOICES_DATA.length} invoices</div>
      </Card>
    </PageWrapper>
  );
}
