// ══════════════════════════════════════════════════════════════════════════════
// CONSENT FORMS PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, X, FileCheck, Download, User, Calendar, CheckCircle2, Clock, FileText, Edit, ChevronDown } from "lucide-react";
import { apiGetConsentForms, apiCreateConsentForm, apiDeleteConsentForm, apiUpdateConsentForm } from "@/api/consentForms";
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

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.t-row:hover{background:${C.bgMuted}!important}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.act-btn:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const FORM_TYPES = [
  "Treatment Consent",
  "Anesthesia Consent",
  "Extraction Consent",
  "Orthodontic Treatment",
  "Cosmetic Procedure",
  "X-Ray Consent",
  "General Dental Treatment",
  "Surgical Procedure",
  "Data Privacy Consent",
  "Photography Consent"
];
const E_FORM = { patientId: "", formType: "Treatment Consent", formContent: "", witnessName: "", signatureData: "" };

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
          </div>
        ) : (
          <span style={{ color: C.faint, fontSize: 13 }}>Search patient…</span>
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
                placeholder="Name or phone…"
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
                    <p style={{ fontSize: 11, color: C.faint }}>{p.phone}</p>
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

// ── Signature Pad ─────────────────────────────────────────────────────────────
function SignaturePad({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL());
  };

  return (
    <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 12, background: C.bgMuted }}>
      <canvas
        ref={canvasRef}
        width={460}
        height={150}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        style={{
          width: "100%",
          height: 150,
          background: C.bg,
          borderRadius: 8,
          cursor: "crosshair",
          border: `1px solid ${C.border}`
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={clear}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.bg,
            fontSize: 11,
            fontWeight: 600,
            color: C.muted,
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            background: C.teal,
            border: "none",
            fontSize: 11,
            fontWeight: 600,
            color: "white",
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

export function AssistantConsentFormsPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(E_FORM);
  const [viewModal, setViewModal] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["consent-forms"],
    queryFn: () => apiGetConsentForms()
  });

  const { data: pR } = useQuery({
    queryKey: ["patients", "select"],
    queryFn: () => apiGetPatients({ limit: 500 })
  });

  const forms: any[] = data?.data ?? data ?? [];
  const patients: any[] = pR?.data ?? [];

  const filtered = useMemo(
    () => forms.filter(f => !search || f.patient_name?.toLowerCase().includes(search.toLowerCase()) || f.form_type?.toLowerCase().includes(search.toLowerCase())),
    [forms, search]
  );

  const createMut = useMutation({
    mutationFn: apiCreateConsentForm,
    onSuccess: () => {
      toast.success("Consent form created");
      qc.invalidateQueries({ queryKey: ["consent-forms"] });
      setModal(false);
      setForm(E_FORM);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed")
  });

  const deleteMut = useMutation({
    mutationFn: apiDeleteConsentForm,
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["consent-forms"] });
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.formType || !form.signatureData) {
      toast.error("Patient, form type and signature required");
      return;
    }
    createMut.mutate({
      ...form,
      patientId: Number(form.patientId),
      witnessedBy: user?.id
    });
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Consent Forms</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{forms.length} forms collected</p>
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
            New Form
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <KPI label="Total Forms" value={forms.length} icon={FileCheck} color={C.teal} sub="All time" />
          <KPI
            label="This Month"
            value={forms.filter(f => new Date(f.signed_date).getMonth() === new Date().getMonth()).length}
            icon={Calendar}
            color={C.purple}
            sub="Recently signed"
          />
          <KPI label="Form Types" value={[...new Set(forms.map(f => f.form_type))].length} icon={FileText} color={C.blue} sub="Different types" />
          <KPI label="Completion Rate" value="100%" icon={CheckCircle2} color={C.teal} sub="All signed" />
        </div>

        {/* Search */}
        <SearchB value={search} onChange={setSearch} placeholder="Search patient or form type…" width={300} />

        {/* Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <TH cols={["Patient", "Form Type", "Signed Date", "Witness", "Status", ""]} tmpl="1.6fr 1.4fr 140px 1.2fr 100px 80px" />
          {isLoading && <TLoad />}
          {!isLoading && filtered.length === 0 && <TEmpty icon={FileCheck} text="No consent forms found" />}
          {!isLoading &&
            filtered.map((row: any, i: number) => (
              <div
                key={row.id}
                className="t-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1.4fr 140px 1.2fr 100px 80px",
                  padding: "11px 18px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  transition: "background .1s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Avi name={row.patient_name ?? "?"} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.patient_name ?? "—"}
                    </p>
                    <p style={{ fontSize: 11, color: C.faint }}>{row.patient_number ?? ""}</p>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{row.form_type ?? "—"}</span>
                <span style={{ fontSize: 11, color: C.faint }}>
                  {row.signed_date ? new Date(row.signed_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </span>
                <span style={{ fontSize: 12, color: C.muted }}>{row.witnessed_by_name ?? "—"}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 100,
                    background: C.tealBg,
                    color: C.tealText,
                    border: `1px solid ${C.tealBorder}`,
                    whiteSpace: "nowrap"
                  }}
                >
                  Signed
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <IBtn onClick={() => setViewModal(row)} title="View">
                    <FileText size={12} />
                  </IBtn>
                  <IBtn
                    danger
                    onClick={() => {
                      if (confirm("Delete form?")) deleteMut.mutate(row.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </IBtn>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Consent Form" size="lg">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <F label="Patient" req>
            <PatCombo patients={patients} value={form.patientId} onSelect={id => setForm(p => ({ ...p, patientId: id }))} />
          </F>
          <F label="Form Type" req>
            <select value={form.formType} onChange={f("formType")} className="inp" style={{ ...IS, cursor: "pointer" }}>
              {FORM_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </F>
          <F label="Form Content / Details">
            <textarea
              value={form.formContent}
              onChange={f("formContent")}
              rows={4}
              placeholder="Detailed description of the procedure, risks, benefits…"
              className="inp"
              style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }}
            />
          </F>
          <F label="Witness Name">
            <input value={form.witnessName} onChange={f("witnessName")} placeholder="Full name of witness" className="inp" style={IS} />
          </F>
          <F label="Patient Signature" req>
            <SignaturePad onSave={sig => setForm(p => ({ ...p, signatureData: sig }))} />
            {form.signatureData && <p style={{ fontSize: 11, color: C.teal, marginTop: 4 }}>✓ Signature captured</p>}
          </F>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <GBtn onClick={() => setModal(false)}>Cancel</GBtn>
            <SBtn loading={createMut.isPending}>
              <FileCheck size={14} />
              Create Form
            </SBtn>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Consent Form — ${viewModal?.form_type ?? ""}`} size="md">
        {viewModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                padding: "12px 14px",
                background: C.bgMuted,
                borderRadius: 10,
                border: `1px solid ${C.border}`
              }}
            >
              <div>
                <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Patient</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{viewModal.patient_name}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Date Signed</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                  {new Date(viewModal.signed_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Witnessed By</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{viewModal.witnessed_by_name}</p>
              </div>
              {viewModal.witness_name && (
                <div>
                  <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Witness Name</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{viewModal.witness_name}</p>
                </div>
              )}
            </div>
            {viewModal.form_content && (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", background: C.bg }}>
                <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Form Content</p>
                <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{viewModal.form_content}</p>
              </div>
            )}
            {viewModal.signature_data && (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", background: C.bg }}>
                <p style={{ fontSize: 10, color: C.faint, marginBottom: 6 }}>Patient Signature</p>
                <img src={viewModal.signature_data} alt="Signature" style={{ maxWidth: "100%", height: "auto", border: `1px solid ${C.border}`, borderRadius: 6 }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px",
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                <Download size={14} />
                Download PDF
              </button>
              <GBtn onClick={() => setViewModal(null)}>Close</GBtn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}