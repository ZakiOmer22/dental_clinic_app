import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Building2, Mail, Phone, MapPin, User, Calendar, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/app/store";

// ─── Design tokens (matching dashboard) ──────────────────────────────────────
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
  purple:    "#8b5cf6",
  purpleBg:  "#f5f3ff",
  purpleText:"#5b21b6",
};

function Badge({ label, color }: { label: string; color: "green" | "amber" | "red" | "blue" | "gray" | "purple" }) {
  const map = {
    green:  { bg: C.tealBg,   text: C.tealText,   border: C.tealBorder },
    amber:  { bg: C.amberBg,  text: C.amberText,  border: C.amberBorder },
    red:    { bg: C.redBg,    text: C.redText,    border: C.redBorder },
    blue:   { bg: C.blueBg,   text: C.blueText,   border: "#bfdbfe" },
    gray:   { bg: C.bgMuted,  text: C.muted,      border: C.border },
    purple: { bg: C.purpleBg, text: C.purpleText, border: "#ddd6fe" },
  }[color];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
      background: map.bg, color: map.text, border: `1px solid ${map.border}`,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// API fetch helper
const apiFetch = async (endpoint: string, token: string, options?: RequestInit) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/v1/admin${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      if (!token) return;
      try {
        const data = await apiFetch('/clinics/pending', token);
        const pending = (data.clinics || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          city: c.city || 'N/A',
          country: c.country || 'Somalia',
          plan: c.plan_name || 'Basic',
          email: c.email || c.admin_email || 'N/A',
          phone: c.phone || 'N/A',
          contactPerson: c.admin_name || 'Not assigned',
          address: c.address || 'N/A',
          submittedAt: new Date(c.created_at).toLocaleDateString(),
          notes: c.notes || '',
          requestedUsers: c.user_count || 0,
        }));
        setItems(pending);
      } catch (err) {
        toast.error('Failed to load pending approvals');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [token]);

  const approve = async (id: number) => {
    setActionLoading(id);
    try {
      await apiFetch(`/clinics/${id}/approve`, token!, { method: 'POST' });
      setItems(prev => prev.filter(c => c.id !== id));
      toast.success('Clinic approved!');
    } catch (err) {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: number) => {
    setActionLoading(id);
    const reason = prompt('Rejection reason:');
    try {
      await apiFetch(`/clinics/${id}/reject`, token!, { method: 'POST', body: JSON.stringify({ reason: reason || 'Not specified' }) });
      setItems(prev => prev.filter(c => c.id !== id));
      toast.error('Clinic rejected');
    } catch (err) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.teal, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>Pending Approvals</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 4 }}>Review new clinic registrations</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10 }}>
            <Clock size={14} color={C.amber} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.amberText }}>{items.length} awaiting review</span>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: C.bg, borderRadius: 20, border: `1px solid ${C.border}` }}>
          <CheckCircle2 size={48} color={C.teal} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>All caught up!</h3>
          <p style={{ fontSize: 13, color: C.muted }}>No clinics are currently pending approval</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((c) => (
            <div key={c.id} style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px' }}>
                {/* Row 1: Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: C.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={22} color={C.teal} />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{c.name}</p>
                      <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.city}, {c.country} · Contact: {c.contactPerson}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Badge label={c.plan} color={c.plan === 'Enterprise' ? 'purple' : c.plan === 'Pro' ? 'green' : 'blue'} />
                    <Badge label="Pending" color="amber" />
                  </div>
                </div>

                {/* Row 2: Contact Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16, padding: '12px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} color={C.muted} />
                    <span style={{ fontSize: 12, color: C.muted }}>{c.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} color={C.muted} />
                    <span style={{ fontSize: 12, color: C.muted }}>{c.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={14} color={C.muted} />
                    <span style={{ fontSize: 12, color: C.muted }}>{c.requestedUsers} users requested</span>
                  </div>
                </div>

                {/* Row 3: Notes & Actions */}
                {c.notes && (
                  <div style={{ marginBottom: 16, padding: '10px 12px', background: C.amberBg, borderRadius: 8, fontSize: 12, color: C.amberText }}>
                    📝 {c.notes}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={12} color={C.faint} />
                    <span style={{ fontSize: 12, color: C.faint }}>Submitted {c.submittedAt}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => navigate(`/admin/clinics/${c.id}`)}
                      style={{ padding: '6px 14px', background: C.bgMuted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => reject(c.id)}
                      disabled={actionLoading === c.id}
                      style={{ padding: '6px 16px', background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: C.redText, cursor: 'pointer' }}
                    >
                      {actionLoading === c.id ? '...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => approve(c.id)}
                      disabled={actionLoading === c.id}
                      style={{ padding: '6px 16px', background: C.tealBg, border: `1px solid ${C.tealBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: C.tealText, cursor: 'pointer' }}
                    >
                      {actionLoading === c.id ? '...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}