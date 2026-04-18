import { useState, useMemo } from "react";
import { MessageSquare, ThumbsUp, Tag, Plus, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { PageWrapper, PageHeader, Card, Badge, Btn, SectionTitle, SearchInput, SA, EmptyState } from "./shared";

type Status = "new" | "planned" | "in-progress" | "completed" | "rejected";

interface Request {
  id: number; title: string; description: string;
  clinic: string; votes: number; status: Status;
  category: string; submittedAt: string;
}

const REQUESTS: Request[] = [
  { id: 1, title: "SMS appointment reminders", description: "Auto-send SMS to patients 24h before appointment", clinic: "PerfectTeeth Center", votes: 28, status: "planned", category: "Notifications", submittedAt: "Apr 10" },
  { id: 2, title: "Multi-language invoice support", description: "Allow printing invoices in Arabic, Somali, and English", clinic: "Al-Noor Dental", votes: 19, status: "in-progress", category: "Billing", submittedAt: "Mar 28" },
  { id: 3, title: "WhatsApp integration", description: "Send reminders and notifications via WhatsApp", clinic: "Bright Smile Clinic", votes: 45, status: "planned", category: "Integrations", submittedAt: "Mar 22" },
  { id: 4, title: "Clinic mobile app", description: "Native iOS/Android app for clinic staff", clinic: "DentaFlow Clinic", votes: 62, status: "in-progress", category: "Mobile", submittedAt: "Mar 15" },
  { id: 5, title: "Insurance claim auto-fill", description: "Auto-populate claim forms from visit data", clinic: "SmilePro Clinic", votes: 31, status: "new", category: "Insurance", submittedAt: "Apr 14" },
  { id: 6, title: "Bulk patient import via CSV", description: "Import existing patient records from spreadsheet", clinic: "WhiteArc Dental", votes: 22, status: "completed", category: "Data", submittedAt: "Feb 5" },
  { id: 7, title: "Patient loyalty points", description: "Reward system for returning patients", clinic: "Bright Smile Clinic", votes: 14, status: "new", category: "Engagement", submittedAt: "Apr 12" },
  { id: 8, title: "Offline mode support", description: "Allow basic operations without internet", clinic: "Nairobi Smiles", votes: 8, status: "rejected", category: "Performance", submittedAt: "Mar 1" },
];

const STATUS_OPTIONS: Status[] = ["new", "planned", "in-progress", "completed", "rejected"];
const STATUS_LABELS: Record<Status, string> = { new: "New", planned: "Planned", "in-progress": "In Progress", completed: "Completed", rejected: "Rejected" };
const STATUS_VARIANT: Record<Status, any> = { new: "info", planned: "purple", "in-progress": "warning", completed: "success", rejected: "error" };

const CATEGORIES = ["All", "Notifications", "Billing", "Integrations", "Mobile", "Insurance", "Data", "Engagement", "Performance"];

export default function FeatureRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All Status");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"votes" | "date">("votes");

  const filtered = useMemo(() => {
    return REQUESTS
      .filter((r) => {
        const ms = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
        const mst = statusFilter === "All Status" || r.status === statusFilter;
        const mc = catFilter === "All" || r.category === catFilter;
        return ms && mst && mc;
      })
      .sort((a, b) => sortBy === "votes" ? b.votes - a.votes : 0);
  }, [search, statusFilter, catFilter, sortBy]);

  const updateStatus = (id: number, newStatus: Status) => {
    toast.success(`Status updated to "${STATUS_LABELS[newStatus]}"`);
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = REQUESTS.filter((r) => r.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <PageWrapper>
      <PageHeader
        breadcrumb="Super Admin · Management"
        title="Feature Requests"
        subtitle="Track and manage feature requests from clinics across the platform"
        action={<Btn label="Export CSV" variant="secondary" onClick={() => toast("Exporting...")} />}
      />

      {/* Status overview */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "All Status" : s)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
              borderRadius: 10, border: `1.5px solid ${statusFilter === s ? SA.accent : SA.border}`,
              background: statusFilter === s ? SA.accentLight : "white",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: statusFilter === s ? SA.accent : SA.textSecondary }}>{STATUS_LABELS[s]}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: SA.bg, color: SA.textMuted, padding: "1px 6px", borderRadius: 100 }}>{counts[s]}</span>
          </button>
        ))}
      </div>

      <Card>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${SA.border}`, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search feature requests…" />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ height: 38, padding: "0 12px", border: `1.5px solid ${SA.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "white", cursor: "pointer" }}>
            {CATEGORIES.map((c) => <option key={c}>{c === "All" ? "All Categories" : c}</option>)}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {(["votes", "date"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${SA.border}`, background: sortBy === s ? SA.accentLight : "white", color: sortBy === s ? SA.accent : SA.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: sortBy === s ? 600 : 400 }}>
                {s === "votes" ? "Top Voted" : "Newest"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0
          ? <EmptyState icon={<MessageSquare size={36} />} message="No requests found" />
          : filtered.map((r) => (
            <div key={r.id} className="sa-row-hover" style={{ padding: "16px 20px", borderBottom: `1px solid ${SA.border}`, display: "grid", gridTemplateColumns: "50px 1fr 120px 130px", gap: 16, alignItems: "start" }}>
              {/* Vote count */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: SA.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ThumbsUp size={14} color={SA.accent} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: SA.textPrimary }}>{r.votes}</span>
              </div>

              {/* Content */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: SA.textPrimary, margin: 0 }}>{r.title}</p>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: SA.bg, color: SA.textSecondary, borderRadius: 100, border: `1px solid ${SA.border}` }}>{r.category}</span>
                </div>
                <p style={{ fontSize: 13, color: SA.textSecondary, margin: 0, lineHeight: 1.4 }}>{r.description}</p>
                <p style={{ fontSize: 11, color: SA.textMuted, margin: "6px 0 0" }}>From <strong>{r.clinic}</strong> · {r.submittedAt}</p>
              </div>

              {/* Status badge */}
              <Badge label={STATUS_LABELS[r.status]} variant={STATUS_VARIANT[r.status]} />

              {/* Change status */}
              <select
                defaultValue={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value as Status)}
                onClick={(e) => e.stopPropagation()}
                style={{ height: 32, padding: "0 10px", border: `1.5px solid ${SA.border}`, borderRadius: 8, fontSize: 12, fontFamily: "inherit", background: "white", cursor: "pointer" }}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          ))
        }

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${SA.border}`, fontSize: 12, color: SA.textMuted }}>
          {filtered.length} of {REQUESTS.length} requests
        </div>
      </Card>
    </PageWrapper>
  );
}