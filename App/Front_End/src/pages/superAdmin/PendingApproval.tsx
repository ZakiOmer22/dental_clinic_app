import { useState } from "react";
import { Clock, CheckCircle2, XCircle, Eye, Building2, Mail, Phone, MapPin, User, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { PageWrapper, PageHeader, Card, Badge, Btn, SectionTitle, SA, EmptyState } from "./shared";

const PENDING = [
  {
    id: 4, name: "DentaCare Plus", city: "Kismayo", country: "Somalia",
    plan: "Pro", email: "owner@dentacareplus.so", phone: "+252 69 9876543",
    contactPerson: "Dr. Mahad Ali", address: "Main Street, Kismayo",
    submittedAt: "Apr 10, 2025 · 09:32 AM", notes: "Large clinic with 3 branches planned",
    requestedUsers: 12, website: "dentacareplus.so",
  },
  {
    id: 9, name: "OralCare Hub", city: "Dubai", country: "UAE",
    plan: "Enterprise", email: "admin@oralcare.ae", phone: "+971 50 1234567",
    contactPerson: "Dr. Faisal Al-Rashidi", address: "Healthcare City, Dubai",
    submittedAt: "Apr 9, 2025 · 02:15 PM", notes: "High volume clinic, needs fast activation",
    requestedUsers: 30, website: "oralcare.ae",
  },
  {
    id: 10, name: "Nairobi Smiles", city: "Nairobi", country: "Kenya",
    plan: "Starter", email: "info@nairobiesmiles.ke", phone: "+254 722 123456",
    contactPerson: "Dr. Amina Wanjiku", address: "Westlands, Nairobi",
    submittedAt: "Apr 8, 2025 · 11:50 AM", notes: "",
    requestedUsers: 4, website: "",
  },
];

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(PENDING);
  const [selected, setSelected] = useState<typeof PENDING[0] | null>(null);

  const approve = (id: number) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
    setSelected(null);
    toast.success("Clinic approved & activated!");
  };

  const reject = (id: number) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
    setSelected(null);
    toast.error("Clinic application rejected");
  };

  return (
    <PageWrapper>
      <PageHeader
        breadcrumb="Super Admin · Clinics"
        title="Pending Approvals"
        subtitle="Review and approve or reject new clinic registrations"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: SA.warningBg, border: `1px solid #fde68a`, borderRadius: 10 }}>
            <Clock size={14} color={SA.warning} />
            <span style={{ fontSize: 13, fontWeight: 600, color: SA.warning }}>{items.length} awaiting review</span>
          </div>
        }
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 size={40} />}
            message="All caught up!"
            sub="No clinics are currently pending approval"
          />
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap: 20 }}>
          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((c) => (
              <Card key={c.id} style={{ border: selected?.id === c.id ? `1.5px solid ${SA.accent}` : `1px solid ${SA.border}` }}>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: SA.accentLight, display: "flex", alignItems: "center", justifyContent: "center", color: SA.accent }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: SA.textPrimary, margin: 0 }}>{c.name}</p>
                        <p style={{ fontSize: 12, color: SA.textSecondary, margin: "3px 0 0" }}>
                          {c.city}, {c.country} · Contact: {c.contactPerson}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge label={c.plan} variant={c.plan === "Enterprise" ? "success" : c.plan === "Pro" ? "purple" : "info"} />
                      <Badge label="Pending" variant="warning" />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16, padding: "12px", background: SA.bg, borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={12} color={SA.textMuted} />
                      <span style={{ fontSize: 12, color: SA.textSecondary, overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={12} color={SA.textMuted} />
                      <span style={{ fontSize: 12, color: SA.textSecondary }}>{c.phone}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <User size={12} color={SA.textMuted} />
                      <span style={{ fontSize: 12, color: SA.textSecondary }}>{c.requestedUsers} users requested</span>
                    </div>
                  </div>

                  {c.notes && (
                    <div style={{ padding: "10px 12px", background: "#fffbeb", border: `1px solid #fde68a`, borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
                      📝 {c.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={12} color={SA.textMuted} />
                      <span style={{ fontSize: 12, color: SA.textMuted }}>Submitted {c.submittedAt}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn label="View Details" variant="secondary" size="sm" icon={<Eye size={12} />} onClick={() => setSelected(selected?.id === c.id ? null : c)} />
                      <Btn label="Reject" variant="danger" size="sm" icon={<XCircle size={12} />} onClick={() => reject(c.id)} />
                      <Btn label="Approve" variant="success" size="sm" icon={<CheckCircle2 size={12} />} onClick={() => approve(c.id)} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Detail Panel */}
          {selected && (
            <Card style={{ position: "sticky", top: 20, alignSelf: "start" }}>
              <SectionTitle
                title="Application Details"
                action={<button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: SA.textMuted, fontSize: 18 }}>✕</button>}
              />
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Clinic Name", value: selected.name, icon: <Building2 size={14} /> },
                  { label: "Contact Person", value: selected.contactPerson, icon: <User size={14} /> },
                  { label: "Email", value: selected.email, icon: <Mail size={14} /> },
                  { label: "Phone", value: selected.phone, icon: <Phone size={14} /> },
                  { label: "Address", value: `${selected.address}, ${selected.city}`, icon: <MapPin size={14} /> },
                  { label: "Website", value: selected.website || "Not provided", icon: null },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: SA.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 13, color: SA.textPrimary, margin: 0 }}>{item.value}</p>
                  </div>
                ))}

                <div style={{ borderTop: `1px solid ${SA.border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Btn label="Approve Clinic" variant="success" icon={<CheckCircle2 size={14} />} onClick={() => approve(selected.id)} />
                  <Btn label="Reject Application" variant="danger" icon={<XCircle size={14} />} onClick={() => reject(selected.id)} />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </PageWrapper>
  );
}