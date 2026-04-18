// Front_End/src/pages/superAdmin/ClinicDetails.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Users, DollarSign, Activity,
  Mail, Phone, Globe, MapPin, Calendar, X,
  CheckCircle2, Edit2, ShieldAlert, RefreshCw,
  CreditCard, FileText, UserPlus, Settings, Eye,
  Package, FlaskConical, ClipboardList, HardDrive,
  Receipt, Stethoscope, AlertCircle
} from "lucide-react";
import client from "@/api/client";
import toast from "react-hot-toast";

const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
};

function Badge({ label, variant }: { label: string; variant: string }) {
  const variants: Record<string, any> = {
    success: { bg: C.tealBg, text: C.tealText },
    warning: { bg: C.amberBg, text: C.amberText },
    error: { bg: C.redBg, text: C.redText },
    info: { bg: C.blueBg, text: C.blueText },
    purple: { bg: C.purpleBg, text: C.purpleText },
    neutral: { bg: C.bgMuted, text: C.muted },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: v.bg, color: v.text, textTransform: "capitalize" }}>
      {label}
    </span>
  );
}

const TABS = [
  "Overview", "Patients", "Appointments", "Staff", "Treatments", 
  "Prescriptions", "Invoices", "Lab Orders", "Inventory", "Files", "Settings"
];

export default function ClinicDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("Overview");
  const [showEditModal, setShowEditModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "clinic", id],
    queryFn: () => client.get(`/api/v1/admin/clinics/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["admin", "clinic", id, "patients"],
    queryFn: () => client.get(`/api/v1/admin/clinics/${id}/patients`).then(r => r.data),
    enabled: !!id && tab === "Patients",
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["admin", "clinic", id, "appointments"],
    queryFn: () => client.get(`/api/v1/admin/clinics/${id}/appointments`).then(r => r.data),
    enabled: !!id && tab === "Appointments",
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ["admin", "clinic", id, "treatments"],
    queryFn: () => client.get(`/api/v1/admin/clinics/${id}/treatments`).then(r => r.data),
    enabled: !!id && tab === "Treatments",
  });

  const { data: prescriptionsData } = useQuery({
    queryKey: ["admin", "clinic", id, "prescriptions"],
    queryFn: () => client.get(`/api/v1/admin/clinics/${id}/prescriptions`).then(r => r.data),
    enabled: !!id && tab === "Prescriptions",
  });

  const { data: labOrdersData } = useQuery({
    queryKey: ["admin", "clinic", id, "lab-orders"],
    queryFn: () => client.get(`/api/v1/admin/clinics/${id}/lab-orders`).then(r => r.data),
    enabled: !!id && tab === "Lab Orders",
  });

  const { data: inventoryData } = useQuery({
    queryKey: ["admin", "clinic", id, "inventory"],
    queryFn: () => client.get(`/api/v1/admin/clinics/${id}/inventory`).then(r => r.data),
    enabled: !!id && tab === "Inventory",
  });

  const suspendMutation = useMutation({
    mutationFn: () => client.post(`/api/v1/admin/clinics/${id}/suspend`),
    onSuccess: () => { toast.success("Clinic suspended"); refetch(); },
    onError: () => toast.error("Failed to suspend clinic"),
  });

  const activateMutation = useMutation({
    mutationFn: () => client.post(`/api/v1/admin/clinics/${id}/activate`),
    onSuccess: () => { toast.success("Clinic activated"); refetch(); },
    onError: () => toast.error("Failed to activate clinic"),
  });

  const clinic = data?.clinic || {};
  const staff = clinic.staff || [];
  const invoices = clinic.recent_invoices || [];
  const patients = patientsData?.patients || [];
  const appointments = appointmentsData?.appointments || [];
  const treatments = treatmentsData?.treatments || [];
  const prescriptions = prescriptionsData?.prescriptions || [];
  const labOrders = labOrdersData?.labOrders || [];
  const inventory = inventoryData?.inventory || [];

  const isSuspended = clinic.status === 'suspended';

  const planVariant = (p: string) => {
    if (p === 'Enterprise') return 'success';
    if (p === 'Professional') return 'purple';
    if (p === 'Basic') return 'info';
    return 'neutral';
  };

  const statusVariant = (s: string) => {
    if (s === 'active') return 'success';
    if (s === 'trialing') return 'info';
    if (s === 'pending') return 'warning';
    if (s === 'canceled' || s === 'suspended') return 'error';
    return 'neutral';
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.purple, animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: C.faint }}>Loading clinic details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        <div>
          <button onClick={() => navigate("/admin/clinics")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to Clinics
          </button>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 700 }}>
                {clinic.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, margin: 0 }}>{clinic.name}</h1>
                  <Badge label={clinic.plan_name || 'Free'} variant={planVariant(clinic.plan_name)} />
                  <Badge label={clinic.subscription_status || clinic.status || 'trial'} variant={statusVariant(clinic.subscription_status || clinic.status)} />
                </div>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                  {clinic.city}{clinic.country ? `, ${clinic.country}` : ''} · Joined {new Date(clinic.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 12, color: C.muted, cursor: "pointer" }}>
                <RefreshCw size={12} />
              </button>
              {isSuspended ? (
                <button onClick={() => activateMutation.mutate()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.tealBorder}`, borderRadius: 8, background: C.tealBg, fontSize: 12, color: C.tealText, cursor: "pointer" }}>
                  <CheckCircle2 size={12} /> Activate
                </button>
              ) : (
                <button onClick={() => suspendMutation.mutate()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.redBorder}`, borderRadius: 8, background: C.redBg, fontSize: 12, color: C.redText, cursor: "pointer" }}>
                  <ShieldAlert size={12} /> Suspend
                </button>
              )}
              <button onClick={() => setShowEditModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 12, color: C.muted, cursor: "pointer" }}>
                <Edit2 size={12} /> Edit
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, overflowX: "auto", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: tab === t ? 600 : 400, whiteSpace: "nowrap",
              color: tab === t ? C.purple : C.muted,
              borderBottom: tab === t ? `2px solid ${C.purple}` : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s ease",
            }}>{t}</button>
          ))}
        </div>

        {tab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <StatCard label="Staff" value={clinic.user_count || 0} icon={Users} color={C.purple} />
              <StatCard label="Appointments" value={clinic.appointment_count || 0} icon={Calendar} color={C.blue} />
              <StatCard label="Revenue" value={`$${(clinic.total_revenue || 0).toLocaleString()}`} icon={DollarSign} color={C.teal} />
              <StatCard label="Patients" value={clinic.patient_count || 0} icon={Activity} color={C.amber} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Contact Information</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { icon: Mail, label: "Email", value: clinic.email },
                    { icon: Phone, label: "Phone", value: clinic.phone || '—' },
                    { icon: Globe, label: "Website", value: clinic.website || '—' },
                    { icon: MapPin, label: "Address", value: clinic.address || clinic.city || '—' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <item.icon size={15} color={C.faint} style={{ marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", margin: 0 }}>{item.label}</p>
                        <p style={{ fontSize: 13, color: C.text, margin: "2px 0 0" }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Subscription Details</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><p style={{ fontSize: 11, color: C.faint }}>Plan</p><p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{clinic.plan_name || 'Free'}</p></div>
                  <div><p style={{ fontSize: 11, color: C.faint }}>Status</p><Badge label={clinic.subscription_status || clinic.status || 'trial'} variant={statusVariant(clinic.subscription_status || clinic.status)} /></div>
                  {clinic.trial_end_date && <div><p style={{ fontSize: 11, color: C.faint }}>Trial Ends</p><p style={{ fontSize: 14, color: C.text }}>{new Date(clinic.trial_end_date).toLocaleDateString()}</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Patients" && <DataTable title="Patients" data={patients} columns={["Name", "Phone", "Email", "Last Visit"]} icon={Users} />}
        {tab === "Appointments" && <DataTable title="Appointments" data={appointments} columns={["Patient", "Doctor", "Date", "Status"]} icon={Calendar} />}
        {tab === "Treatments" && <DataTable title="Treatments" data={treatments} columns={["Patient", "Procedure", "Doctor", "Date", "Status"]} icon={Stethoscope} />}
        {tab === "Prescriptions" && <DataTable title="Prescriptions" data={prescriptions} columns={["Patient", "Medication", "Dosage", "Prescribed", "Status"]} icon={ClipboardList} />}
        
        {tab === "Staff" && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Staff Members ({staff.length})</h3>
            </div>
            {staff.length === 0 ? <EmptyState message="No staff members" icon={Users} /> : staff.map((s: any) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr 100px", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                <div><p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.full_name}</p><p style={{ fontSize: 11, color: C.faint }}>{s.email}</p></div>
                <Badge label={s.role} variant="purple" />
                <span style={{ fontSize: 12, color: C.muted }}>Last active: {s.last_active || 'Never'}</span>
                <Badge label={s.is_active ? 'active' : 'inactive'} variant={s.is_active ? 'success' : 'neutral'} />
              </div>
            ))}
          </div>
        )}

        {tab === "Invoices" && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}><h3 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Invoice History</h3></div>
            {invoices.length === 0 ? <EmptyState message="No invoices" icon={Receipt} /> : invoices.map((inv: any) => (
              <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{inv.stripe_invoice_number || inv.id}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{new Date(inv.created_at).toLocaleDateString()}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.tealText }}>${inv.amount_paid || 0}</span>
                <Badge label={inv.status} variant={inv.status === 'paid' ? 'success' : 'warning'} />
              </div>
            ))}
          </div>
        )}

        {tab === "Lab Orders" && <DataTable title="Lab Orders" data={labOrders} columns={["Patient", "Type", "Lab", "Status", "Date"]} icon={FlaskConical} />}
        {tab === "Inventory" && <DataTable title="Inventory Items" data={inventory} columns={["Item", "Category", "Stock", "Min Level", "Status"]} icon={Package} />}
        {tab === "Files" && <EmptyState message="File management coming soon" icon={HardDrive} />}

        {tab === "Settings" && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Danger Zone</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: isSuspended ? "Activate Clinic" : "Suspend Clinic", desc: isSuspended ? "Restore access for all users" : "Temporarily disable access", action: () => isSuspended ? activateMutation.mutate() : suspendMutation.mutate() },
                { label: "Reset Clinic Data", desc: "Clear all appointments and patient data", action: () => toast.error("Not implemented") },
                { label: "Delete Clinic", desc: "Permanently remove clinic and all data", action: () => toast.error("Not implemented") },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 12 }}>
                  <div><p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{item.label}</p><p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>{item.desc}</p></div>
                  <button onClick={item.action} style={{ padding: "8px 16px", borderRadius: 8, background: C.red, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Execute</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EditClinicModal open={showEditModal} onClose={() => setShowEditModal(false)} clinic={clinic} onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ["admin", "clinics"] }); }} />
    </>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
        <Icon size={16} color={color} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 6 }}>{value}</p>
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon: React.ElementType }) {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <Icon size={40} color={C.border} style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 13, color: C.faint }}>{message}</p>
    </div>
  );
}

function DataTable({ title, data, columns, icon: Icon }: { title: string; data: any[]; columns: string[]; icon: React.ElementType }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={16} color={C.purple} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title} ({data.length})</h3>
      </div>
      {data.length === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} found`} icon={Icon} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, padding: "10px 20px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
            {columns.map(c => <span key={c} style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: "uppercase" }}>{c}</span>)}
          </div>
          {data.map((item: any, i: number) => (
            <div key={item.id || i} style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12 }}>{item.full_name || item.patient_name || item.name || item.item_name || '—'}</span>
              {columns.length > 1 && <span style={{ fontSize: 12 }}>{item.phone || item.doctor_name || item.procedure || item.medication || item.type || item.category || '—'}</span>}
              {columns.length > 2 && <span style={{ fontSize: 12 }}>{item.email || item.date || item.lab || item.dosage || item.stock || '—'}</span>}
              {columns.length > 3 && <span style={{ fontSize: 12 }}>{item.last_visit || item.status || item.prescribed || '—'}</span>}
              {columns.length > 4 && <span style={{ fontSize: 12 }}>{item.status || '—'}</span>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function EditClinicModal({ open, onClose, clinic, onSuccess }: { open: boolean; onClose: () => void; clinic: any; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: clinic.name || "", email: clinic.email || "", phone: clinic.phone || "",
    city: clinic.city || "", country: clinic.country || "", address: clinic.address || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.put(`/api/v1/admin/clinics/${clinic.id}`, form);
      toast.success("Clinic updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: 16, width: 480, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Edit Clinic</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer" }}><X size={14} color={C.muted} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: "block" }}>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: "block" }}>Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: "block" }}>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: "block" }}>City</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: "block" }}>Country</label><input value={form.country} onChange={e => setForm({...form, country: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} /></div>
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: "block" }}>Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "10px 22px", borderRadius: 10, background: C.purple, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}