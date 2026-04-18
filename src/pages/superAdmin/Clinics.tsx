// Front_End/src/pages/superAdmin/Clinics.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Search, Plus, RefreshCw, LayoutGrid, List,
  CheckCircle2, Activity, Mail, MapPin, Users, Calendar,
  ChevronRight, X, Globe, Phone
} from "lucide-react";
import client from "@/api/client";
import toast from "react-hot-toast";

const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
};

function Badge({ label, variant }: { label: string; variant: string }) {
  const variants: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: C.tealBg, text: C.tealText, border: C.tealBorder },
    warning: { bg: C.amberBg, text: C.amberText, border: C.amberBorder },
    error: { bg: C.redBg, text: C.redText, border: C.redBorder },
    info: { bg: C.blueBg, text: C.blueText, border: C.blueBorder },
    purple: { bg: C.purpleBg, text: C.purpleText, border: "#ddd6fe" },
    neutral: { bg: C.bgMuted, text: C.muted, border: C.border },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: v.bg, color: v.text, border: `1px solid ${v.border}`, whiteSpace: "nowrap", textTransform: "capitalize" }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{value}</p>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
    </div>
  );
}

function AddClinicModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", city: "", country: "", address: "", plan: "Basic"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/api/v1/admin/clinics', form);
      toast.success("Clinic added successfully");
      onSuccess();
      onClose();
      setForm({ name: "", email: "", phone: "", city: "", country: "", address: "", plan: "Basic" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add clinic");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: 16, width: 480, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Add New Clinic</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color={C.muted} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>Clinic Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="e.g., Bright Smile Clinic" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>Email *</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="admin@clinic.com" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="+252 61 1234567" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>City</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="Mogadishu" /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>Country</label><input value={form.country} onChange={e => setForm({...form, country: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} placeholder="Somalia" /></div>
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>Plan</label><select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} style={{ width: "100%", height: 40, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none", background: C.bg, cursor: "pointer" }}><option value="Basic">Basic - $99/mo</option><option value="Professional">Professional - $199/mo</option><option value="Enterprise">Enterprise - $399/mo</option></select></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "10px 22px", borderRadius: 10, background: C.purple, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>{loading ? "Adding..." : <>Add Clinic</>}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClinicsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "clinics", page, limit],
    queryFn: () => client.get(`/api/v1/admin/clinics?page=${page}&limit=${limit}`).then(r => r.data),
  });

  const clinics = data?.clinics || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const filtered = useMemo(() => {
    return clinics.filter((c: any) => {
      const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.subscription_status === statusFilter;
      const matchPlan = planFilter === "all" || c.plan_name === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [clinics, search, statusFilter, planFilter]);

  const stats = {
    total: total,
    active: clinics.filter((c: any) => c.subscription_status === 'active').length,
    trialing: clinics.filter((c: any) => c.subscription_status === 'trialing').length,
    pending: clinics.filter((c: any) => c.status === 'pending').length,
  };

  const statusVariant = (s: string) => {
    if (s === 'active') return 'success';
    if (s === 'trialing') return 'info';
    if (s === 'pending') return 'warning';
    if (s === 'canceled') return 'error';
    return 'neutral';
  };

  const planVariant = (p: string) => {
    if (p === 'Enterprise') return 'success';
    if (p === 'Professional') return 'purple';
    if (p === 'Basic') return 'info';
    return 'neutral';
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .clinic-card:hover { border-color: ${C.purple} !important; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08) !important; transform: translateY(-2px); }
        .row-hover:hover { background: ${C.bgMuted} !important; }
        .inp:focus { border-color: ${C.purple} !important; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both", padding: "4px 0" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Clinics</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>Manage all dental clinics on the platform</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
              <RefreshCw size={12} /> Refresh
            </button>
            <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 34, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={13} /> Add Clinic
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <StatCard label="Total Clinics" value={stats.total} icon={Building2} color={C.purple} />
          <StatCard label="Active" value={stats.active} icon={CheckCircle2} color={C.teal} />
          <StatCard label="Trial" value={stats.trialing} icon={Activity} color={C.blue} />
          <StatCard label="Pending" value={stats.pending} icon={RefreshCw} color={C.amber} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 300 }}>
            <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clinics..." className="inp" style={{ width: "100%", height: 38, padding: "0 12px 0 36px", border: `1.5px solid ${C.border}`, borderRadius: 10, background: C.bg, fontSize: 13, outline: "none" }} />
          </div>
          
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 38, padding: "0 32px 0 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, background: C.bg, fontSize: 13, color: C.text, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a918b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trial</option>
            <option value="pending">Pending</option>
          </select>

          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={{ height: 38, padding: "0 32px 0 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, background: C.bg, fontSize: 13, color: C.text, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a918b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
            <option value="all">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          <div style={{ marginLeft: "auto", display: "flex", border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <button onClick={() => setView("grid")} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: view === "grid" ? C.purpleBg : C.bg, border: "none", cursor: "pointer", color: view === "grid" ? C.purple : C.faint }}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView("table")} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: view === "table" ? C.purpleBg : C.bg, border: "none", cursor: "pointer", color: view === "table" ? C.purple : C.faint }}>
              <List size={15} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.faint }}>Loading clinics...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 60, textAlign: "center" }}>
            <Building2 size={48} color={C.border} style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No clinics found</h3>
            <p style={{ fontSize: 13, color: C.muted }}>Try adjusting your filters or add a new clinic</p>
          </div>
        ) : view === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filtered.map((clinic: any) => (
              <div key={clinic.id} className="clinic-card" onClick={() => navigate(`/admin/clinics/${clinic.id}`)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all .2s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 20 }}>
                    {clinic.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{clinic.name}</h3>
                      <Badge label={clinic.subscription_status || 'trial'} variant={statusVariant(clinic.subscription_status)} />
                    </div>
                    <Badge label={clinic.plan_name || 'Free'} variant={planVariant(clinic.plan_name)} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={13} color={C.faint} /><span style={{ fontSize: 12, color: C.muted }}>{clinic.email}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={13} color={C.faint} /><span style={{ fontSize: 12, color: C.muted }}>{clinic.city || 'Location not set'}</span></div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={13} color={C.purple} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{clinic.patient_count || 0}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} color={C.blue} /><span style={{ fontSize: 12, color: C.muted }}>{new Date(clinic.created_at).toLocaleDateString()}</span></div>
                  </div>
                  <ChevronRight size={16} color={C.faint} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 100px 80px 100px 100px", padding: "10px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
              {["Clinic", "Location", "Plan", "Status", "Patients", "Revenue", "Joined"].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>)}
            </div>
            {filtered.map((clinic: any) => (
              <div key={clinic.id} className="row-hover" onClick={() => navigate(`/admin/clinics/${clinic.id}`)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 100px 80px 100px 100px", alignItems: "center", padding: "13px 18px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <div><p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{clinic.name}</p><p style={{ fontSize: 11, color: C.faint }}>{clinic.email}</p></div>
                <span style={{ fontSize: 12, color: C.muted }}>{clinic.city || '—'}</span>
                <Badge label={clinic.plan_name || 'Free'} variant={planVariant(clinic.plan_name)} />
                <Badge label={clinic.subscription_status || 'trial'} variant={statusVariant(clinic.subscription_status)} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{clinic.patient_count || 0}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.tealText }}>${clinic.total_revenue || 0}</span>
                <span style={{ fontSize: 11, color: C.faint }}>{new Date(clinic.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}>Previous</button>
            <span style={{ fontSize: 13, color: C.muted }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </div>

      <AddClinicModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ["admin", "clinics"] }); }} />
    </>
  );
}