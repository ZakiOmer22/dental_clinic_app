// ══════════════════════════════════════════════════════════════════════════════
// LAB ORDERS PAGE

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, X, ChevronDown, CheckCircle2, Clock, FlaskConical, FileText, Users, Send, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { apiGetLabOrders, apiCreateLabOrder, apiUpdateLabOrder, apiDeleteLabOrder } from "@/api/labOrders";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8",
  bg: "#fff",
  bgMuted: "#f7f9f8",
  text: "#111816",
  muted: "#7a918b",
  faint: "#a0b4ae",
  teal: "#0d9e75",
  tealBg: "#e8f7f2",
  tealText: "#0a7d5d",
  tealBorder: "#c3e8dc",
  amber: "#f59e0b",
  amberBg: "#fffbeb",
  amberText: "#92400e",
  amberBorder: "#fde68a",
  red: "#e53e3e",
  redBg: "#fff5f5",
  redText: "#c53030",
  redBorder: "#fed7d7",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1d4ed8",
  blueBorder: "#bfdbfe",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  purpleText: "#5b21b6",
  purpleBorder: "#ddd6fe",
  gray: "#6b7f75",
  grayBg: "#f4f7f5"
};

const IS: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 9,
  background: C.bg,
  fontSize: 13,
  color: C.text,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box"
};

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.t-row:hover{background:${C.bgMuted}!important;cursor:pointer}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.act-btn:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}.detail-row{animation:fadeUp .2s ease both}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const LAB_TYPES = [
  "Crown",
  "Bridge",
  "Denture",
  "Partial Denture",
  "Veneer",
  "Implant Crown",
  "Inlay/Onlay",
  "Night Guard",
  "Splint",
  "Orthodontic Appliance",
  "Model/Study Cast",
  "Other"
];

const SHADES = ["A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D2", "D3", "D4", "BLEACH"];

const LAB_STATUS = {
  pending: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "Pending", icon: Clock },
  sent: { bg: C.blueBg, text: C.blueText, border: C.blueBorder, label: "Sent to Lab", icon: Send },
  in_progress: { bg: C.purpleBg, text: C.purpleText, border: C.purpleBorder, label: "In Progress", icon: FlaskConical },
  received: { bg: C.tealBg, text: C.tealText, border: C.tealBorder, label: "Received", icon: CheckCircle2 },
  delayed: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Delayed", icon: AlertTriangle }
};

const E_LAB = {
  patientId: "",
  orderType: "Crown",
  shade: "",
  labName: "",
  cost: "",
  sentDate: "",
  expectedDate: "",
  instructions: "",
  status: "pending"
};

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Avi({ name, size = 28 }: { name: string; size?: number }) {
  const p = [
    "linear-gradient(135deg,#0d9e75,#0a7d5d)",
    "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    "linear-gradient(135deg,#8b5cf6,#5b21b6)",
    "linear-gradient(135deg,#f59e0b,#92400e)"
  ];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: p[(name?.charCodeAt(0) ?? 0) % p.length],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "white",
        flexShrink: 0
      }}
    >
      {(name ?? "?")
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}

function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
        {label}
        {req && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 18px",
        borderRadius: 9,
        background: loading ? "#9ab5ae" : C.teal,
        border: "none",
        color: "white",
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)"
      }}
    >
      {loading ? (
        <>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,.3)",
              borderTopColor: "white",
              animation: "spin .7s linear infinite",
              display: "inline-block"
            }}
          />
          Saving…
        </>
      ) : (
        children
      )}
    </button>
  );
}

function GBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 16px",
        borderRadius: 9,
        border: `1.5px solid ${C.border}`,
        background: C.bg,
        fontSize: 13,
        fontWeight: 500,
        color: C.muted,
        cursor: "pointer",
        fontFamily: "inherit"
      }}
    >
      {children}
    </button>
  );
}

function IBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={danger ? "del-btn" : "act-btn"}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        background: C.bgMuted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: C.faint,
        transition: "all .12s"
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, size = "md", children }: { open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode }) {
  if (!open) return null;
  const mw = size === "sm" ? 420 : size === "lg" ? 700 : 540;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.bg,
          borderRadius: 16,
          width: "100%",
          maxWidth: mw,
          boxShadow: "0 20px 60px rgba(0,0,0,.18)",
          animation: "modalIn .2s cubic-bezier(.22,1,.36,1)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: C.bgMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.muted
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function PatCombo({ patients, value, onSelect }: { patients: any[]; value: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const sel = patients.find(p => String(p.id) === value);
  const list = patients
    .filter(p => !q || p.full_name?.toLowerCase().includes(q.toLowerCase()) || p.phone?.includes(q) || p.patient_number?.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 60);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ ...IS, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        {sel ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avi name={sel.full_name} size={22} />
            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{sel.full_name}</span>
            <span style={{ fontSize: 11, color: C.faint }}>· {sel.patient_number ?? sel.phone}</span>
          </div>
        ) : (
          <span style={{ color: C.faint, fontSize: 13 }}>Search patient by name, phone or ID…</span>
        )}
        <ChevronDown
          size={13}
          color={C.faint}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}
        />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: C.bg,
            border: `1.5px solid ${C.tealBorder}`,
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            zIndex: 100,
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "10px 10px 6px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Name, phone or patient number…"
                style={{ ...IS, paddingLeft: 28, height: 34, fontSize: 12 }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {list.length === 0 ? (
              <p style={{ padding: "14px", textAlign: "center", fontSize: 12, color: C.faint }}>No patients found</p>
            ) : (
              list.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelect(String(p.id));
                    setOpen(false);
                    setQ("");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Avi name={p.full_name} size={26} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.full_name}</p>
                    <p style={{ fontSize: 11, color: C.faint }}>{p.patient_number ?? ""} · {p.phone}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TH({ cols, tmpl }: { cols: string[]; tmpl: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: tmpl,
        padding: "9px 18px",
        background: C.bgMuted,
        borderBottom: `1px solid ${C.border}`
      }}
    >
      {cols.map(h => (
        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>
          {h}
        </span>
      ))}
    </div>
  );
}

function TEmpty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ padding: "48px 18px", textAlign: "center" }}>
      <Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} />
      <p style={{ fontSize: 13, color: C.faint }}>{text}</p>
    </div>
  );
}

function TLoad() {
  return (
    <div style={{ padding: "40px 18px", textAlign: "center" }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${C.border}`,
          borderTopColor: C.teal,
          animation: "spin .7s linear infinite",
          margin: "0 auto 8px"
        }}
      />
      <p style={{ fontSize: 13, color: C.faint }}>Loading…</p>
    </div>
  );
}

function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: color + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon size={13} color={color} strokeWidth={1.8} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function SearchB({ value, onChange, placeholder, width = 280 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number }) {
  return (
    <div style={{ position: "relative", width }}>
      <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="inp"
        style={{ ...IS, paddingLeft: 30, height: 34 }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.faint,
            display: "flex"
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// Detail View Component
function LabOrderDetail({ order, onClose }: { order: any; onClose: () => void }) {
  const status = LAB_STATUS[order.status as keyof typeof LAB_STATUS] || LAB_STATUS.pending;
  const StatusIcon = status.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.bgMuted, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: status.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StatusIcon size={20} color={status.text} />
        </div>
        <div>
          <span style={{ fontSize: 11, color: C.faint }}>LAB ORDER #{order.id}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{order.order_type}</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Patient</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avi name={order.patient_name} size={24} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{order.patient_name}</span>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Doctor</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{order.doctor_name || "—"}</p>
        </div>
        {order.shade && (
          <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Shade</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{order.shade}</p>
          </div>
        )}
        {order.cost && (
          <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Cost</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.tealText }}>${parseFloat(order.cost).toFixed(2)}</p>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Lab Name</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{order.lab_name || "—"}</p>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Status</p>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: status.bg, color: status.text, border: `1px solid ${status.border}`, display: "inline-block" }}>
            {status.label}
          </span>
        </div>
        {order.sent_date && (
          <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Date Sent</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {new Date(order.sent_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}
        {order.expected_date && (
          <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Expected Return</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: new Date(order.expected_date) < new Date() && order.status !== "received" ? C.redText : C.text }}>
              {new Date(order.expected_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}
      </div>

      {order.instructions && (
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Special Instructions</p>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{order.instructions}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={() => window.print()}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "inherit" }}
        >
          <FileText size={14} />
          Print Order
        </button>
        <GBtn onClick={onClose}>Close</GBtn>
      </div>
    </div>
  );
}

export function LabOrdersPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState("");
  const [sf, setSF] = useState("all");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(E_LAB);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lab-orders"],
    queryFn: () => apiGetLabOrders()
  });

  const { data: pR } = useQuery({
    queryKey: ["patients", "select"],
    queryFn: () => apiGetPatients({ limit: 500 })
  });

  const orders: any[] = data?.data ?? data ?? [];
  const patients: any[] = pR?.data ?? [];

  const filtered = useMemo(() => orders.filter(o => {
    if (sf !== "all" && o.status !== sf) return false;
    if (search && !o.patient_name?.toLowerCase().includes(search.toLowerCase()) && !o.order_type?.toLowerCase().includes(search.toLowerCase()) && !o.lab_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [orders, sf, search]);

  const totalCost = orders.reduce((sum, o) => sum + (parseFloat(o.cost) || 0), 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const delayedCount = orders.filter(o => o.status === "delayed" || (o.expected_date && new Date(o.expected_date) < new Date() && o.status !== "received")).length;

  const createMut = useMutation({
    mutationFn: apiCreateLabOrder,
    onSuccess: () => {
      toast.success("Lab order created");
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
      setModal(false);
      setForm(E_LAB);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed")
  });

  const deleteMut = useMutation({
    mutationFn: apiDeleteLabOrder,
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
    }
  });

  const updateStatus = (id: number, status: string) => {
    apiUpdateLabOrder(id, { status })
      .then(() => {
        qc.invalidateQueries({ queryKey: ["lab-orders"] });
        toast.success("Status updated");
      })
      .catch(() => toast.error("Update failed"));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.orderType) {
      toast.error("Patient and order type required");
      return;
    }
    createMut.mutate({
      ...form,
      patientId: Number(form.patientId),
      doctorId: user?.id,
      cost: form.cost ? parseFloat(form.cost) : 0
    });
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleRowClick = (row: any, e: React.MouseEvent) => {
    // Don't trigger if clicking on delete button or status select
    if ((e.target as HTMLElement).closest('.delete-btn') || (e.target as HTMLElement).closest('select')) return;
    setExpandedRow(expandedRow === row.id ? null : row.id);
  };

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Lab Orders</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              {orders.length} orders · {pendingCount} pending · {formatCurrency(totalCost)} total
            </p>
          </div>
          <button
            onClick={() => setModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 18px",
              height: 34,
              borderRadius: 9,
              background: C.teal,
              border: "none",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 2px 10px rgba(13,158,117,.3)"
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0a8a66")}
            onMouseLeave={e => (e.currentTarget.style.background = C.teal)}
          >
            <Plus size={15} />
            New Order
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <KPI label="Total Orders" value={orders.length} icon={FlaskConical} color={C.blue} sub="All time" />
          <KPI label="Pending" value={pendingCount} icon={Clock} color={C.amber} sub="Awaiting processing" />
          <KPI label="Delayed" value={delayedCount} icon={AlertTriangle} color={C.red} sub="Past expected date" />
          <KPI label="Total Cost" value={formatCurrency(totalCost)} icon={DollarSign} color={C.teal} sub="Lab fees" />
        </div>

        {/* Clickable status cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {Object.entries(LAB_STATUS).map(([status, cfg]) => (
            <div
              key={status}
              onClick={() => setSF(sf === status ? "all" : status)}
              style={{
                background: sf === status ? cfg.bg : C.bg,
                border: `1px solid ${sf === status ? cfg.border : C.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                transition: "all .15s"
              }}
            >
              <p style={{ fontSize: 11, color: cfg.text, fontWeight: 600, marginBottom: 4 }}>{cfg.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: C.text }}>
                {orders.filter(o => o.status === status).length}
              </p>
              <p style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>
                {sf === status ? "Click to clear" : "Click to filter"}
              </p>
            </div>
          ))}
        </div>

        {/* Search */}
        <SearchB value={search} onChange={setSearch} placeholder="Search patient, order type or lab…" width={300} />

        {/* Table with clickable rows */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <TH cols={["Patient", "Type", "Shade", "Lab", "Sent", "Expected", "Status", ""]} tmpl="1.6fr 110px 70px 140px 100px 100px 120px 50px" />
          {isLoading && <TLoad />}
          {!isLoading && filtered.length === 0 && <TEmpty icon={FlaskConical} text="No lab orders found" />}
          {!isLoading && filtered.map((row: any, i: number) => {
            const status = LAB_STATUS[row.status as keyof typeof LAB_STATUS] || LAB_STATUS.pending;
            const StatusIcon = status.icon;
            const isDelayed = row.expected_date && new Date(row.expected_date) < new Date() && row.status !== "received";

            return (
              <div key={row.id}>
                <div
                  className="t-row"
                  onClick={(e) => handleRowClick(row, e)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 110px 70px 140px 100px 100px 120px 50px",
                    padding: "11px 18px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    transition: "background .1s",
                    background: expandedRow === row.id ? C.bgMuted : "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Avi name={row.patient_name ?? "?"} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.patient_name ?? "—"}
                      </p>
                      <p style={{ fontSize: 11, color: C.faint }}>{row.doctor_name ?? "—"}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{row.order_type ?? "—"}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: "monospace" }}>{row.shade || "—"}</span>
                  <span style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.lab_name || "—"}</span>
                  <span style={{ fontSize: 11, color: C.faint }}>
                    {row.sent_date ? new Date(row.sent_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                  </span>
                  <span style={{ fontSize: 11, color: isDelayed ? C.redText : C.faint }}>
                    {row.expected_date ? new Date(row.expected_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                  </span>
                  {/* Inline status select */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <div
                      style={{
                        padding: "3px 8px",
                        borderRadius: 100,
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <StatusIcon size={10} color={status.text} />
                      <select
                        value={row.status}
                        onChange={e => {
                          e.stopPropagation();
                          updateStatus(row.id, e.target.value);
                        }}
                        style={{
                          appearance: "none",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          color: status.text,
                          paddingRight: 2
                        }}
                      >
                        {Object.entries(LAB_STATUS).map(([s, c]) => (
                          <option key={s} value={s}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <IBtn
                    danger
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete order?")) deleteMut.mutate(row.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </IBtn>
                </div>

                {/* Expanded detail row */}
                {expandedRow === row.id && (
                  <div
                    className="detail-row"
                    style={{
                      padding: "20px 18px",
                      background: C.bgMuted,
                      borderTop: `1px solid ${C.border}`,
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none"
                    }}
                  >
                    <LabOrderDetail order={row} onClose={() => setExpandedRow(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Lab Order" size="lg">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <F label="Patient" req>
            <PatCombo patients={patients} value={form.patientId} onSelect={id => setForm(p => ({ ...p, patientId: id }))} />
          </F>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <F label="Order Type" req>
              <select value={form.orderType} onChange={f("orderType")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                {LAB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </F>
            <F label="Shade">
              <select value={form.shade} onChange={f("shade")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                <option value="">No shade required</option>
                {SHADES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </F>
            <F label="Lab Name">
              <input value={form.labName} onChange={f("labName")} placeholder="e.g. SmileLab, ProDent" className="inp" style={IS} />
            </F>
            <F label="Cost ($)">
              <input type="number" step="0.01" value={form.cost} onChange={f("cost")} placeholder="0.00" className="inp" style={IS} />
            </F>
            <F label="Date Sent">
              <input type="date" value={form.sentDate} onChange={f("sentDate")} className="inp" style={IS} />
            </F>
            <F label="Expected Return Date">
              <input type="date" value={form.expectedDate} onChange={f("expectedDate")} className="inp" style={IS} />
            </F>
            <div style={{ gridColumn: "1/-1" }}>
              <F label="Special Instructions">
                <textarea
                  value={form.instructions}
                  onChange={f("instructions")}
                  rows={3}
                  placeholder="Shade instructions, bite registration notes, special requirements…"
                  className="inp"
                  style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }}
                />
              </F>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <GBtn onClick={() => setModal(false)}>Cancel</GBtn>
            <SBtn loading={createMut.isPending}>
              <FlaskConical size={14} />
              Create Order
            </SBtn>
          </div>
        </form>
      </Modal>
    </>
  );
}

// Helper function for currency formatting
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}