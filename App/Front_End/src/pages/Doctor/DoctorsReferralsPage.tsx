// ══════════════════════════════════════════════════════════════════════════════
// REFERRALS PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, X, UserCheck, Clock, CheckCircle2, XCircle, Send, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { apiGetReferrals, apiCreateReferral, apiDeleteReferral, apiUpdateReferral } from "@/api/referrals";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = { border: "#e5eae8", bg: "#fff", bgMuted: "#f7f9f8", text: "#111816", muted: "#7a918b", faint: "#a0b4ae", teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc", amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a", red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7", blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe", purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ddd6fe", gray: "#6b7f75", grayBg: "#f4f7f5" };
const IS: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.t-row:hover{background:${C.bgMuted}!important}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.act-btn:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const SPECIALTIES = ["Orthodontist", "Oral Surgeon", "Periodontist", "Endodontist", "Prosthodontist", "Pediatric Dentist", "Oral Pathologist", "Maxillofacial Surgeon", "Dental Radiologist", "General Physician", "ENT Specialist"];
const STATUSES = ["pending", "sent", "scheduled", "completed", "cancelled"];
const STATUS_CFG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "Pending" },
    sent: { bg: C.blueBg, text: C.blueText, border: C.blueBorder, label: "Sent" },
    scheduled: { bg: C.purpleBg, text: C.purpleText, border: C.purpleBorder, label: "Scheduled" },
    completed: { bg: C.tealBg, text: C.tealText, border: C.tealBorder, label: "Completed" },
    cancelled: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Cancelled" },
};
const E_REF = { patientId: "", specialistName: "", specialty: "Orthodontist", reason: "", specialistPhone: "", specialistEmail: "", specialistAddress: "", urgency: "routine", notes: "" };

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Avi({ name, size = 28 }: { name: string; size?: number }) { const p = ["linear-gradient(135deg,#0d9e75,#0a7d5d)", "linear-gradient(135deg,#3b82f6,#1d4ed8)", "linear-gradient(135deg,#8b5cf6,#5b21b6)", "linear-gradient(135deg,#f59e0b,#92400e)"]; return <div style={{ width: size, height: size, borderRadius: "50%", background: p[(name?.charCodeAt(0) ?? 0) % p.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * .35, fontWeight: 700, color: "white", flexShrink: 0 }}>{(name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</div>; }
function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) { return <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{label}{req && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}</label>{children}</div>; }
function SBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) { return <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, background: loading ? "#9ab5ae" : C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)" }}>{loading ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", animation: "spin .7s linear infinite", display: "inline-block" }} />Saving…</> : children}</button>; }
function GBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} style={{ padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>; }
function IBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) { return <button type="button" title={title} onClick={onClick} className={danger ? "del-btn" : "act-btn"} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.faint, transition: "all .12s" }}>{children}</button>; }
function Modal({ open, onClose, title, size = "md", children }: { open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode }) { if (!open) return null; const mw = size === "sm" ? 420 : size === "lg" ? 700 : 540; return <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}><div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: mw, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}><h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3><button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>✕</button></div><div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div></div></div>; }
function PatCombo({ patients, value, onSelect }: { patients: any[]; value: string; onSelect: (id: string) => void }) {
    const [open, setOpen] = useState(false); const [q, setQ] = useState(""); const ref = useRef<HTMLDivElement>(null);
    const sel = patients.find(p => String(p.id) === value); const list = patients.filter(p => !q || p.full_name?.toLowerCase().includes(q.toLowerCase()) || p.phone?.includes(q)).slice(0, 60);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return <div ref={ref} style={{ position: "relative" }}><div onClick={() => setOpen(v => !v)} style={{ ...IS, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>{sel ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avi name={sel.full_name} size={22} /><span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{sel.full_name}</span></div> : <span style={{ color: C.faint, fontSize: 13 }}>Search patient…</span>}<ChevronDown size={13} color={C.faint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} /></div>{open && <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.bg, border: `1.5px solid ${C.tealBorder}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 100, overflow: "hidden" }}><div style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}><div style={{ position: "relative" }}><Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.faint }} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Name or phone…" style={{ ...IS, paddingLeft: 28, height: 34, fontSize: 12 }} /></div></div><div style={{ maxHeight: 220, overflowY: "auto" }}>{list.length === 0 ? <p style={{ padding: "14px", textAlign: "center", fontSize: 12, color: C.faint }}>No patients</p> : list.map(p => <div key={p.id} onClick={() => { onSelect(String(p.id)); setOpen(false); setQ(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.bgMuted} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><Avi name={p.full_name} size={26} /><div><p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.full_name}</p></div></div>)}</div></div>}</div>;
}
function TH({ cols, tmpl }: { cols: string[]; tmpl: string }) { return <div style={{ display: "grid", gridTemplateColumns: tmpl, padding: "9px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>{cols.map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>)}</div>; }
function TEmpty({ icon: Icon, text }: { icon: any; text: string }) { return <div style={{ padding: "48px 18px", textAlign: "center" }}><Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} /><p style={{ fontSize: 13, color: C.faint }}>{text}</p></div>; }
function TLoad() { return <div style={{ padding: "40px 18px", textAlign: "center" }}><div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 13, color: C.faint }}>Loading…</p></div>; }
function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) { return <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}><span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span><div style={{ width: 28, height: 28, borderRadius: 7, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={13} color={color} strokeWidth={1.8} /></div></div><p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>{sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}</div>; }
function SearchB({ value, onChange, placeholder, width = 280 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number }) { return <div style={{ position: "relative", width }}><Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="inp" style={{ ...IS, paddingLeft: 30, height: 34 }} />{value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}><X size={13} /></button>}</div>; }

export function DoctorsReferralsPage() {
    const qc = useQueryClient(); const user = useAuthStore(s => s.user);
    const [search, setSearch] = useState(""); const [sf, setSF] = useState("all"); const [modal, setModal] = useState(false); const [form, setForm] = useState(E_REF); const [viewModal, setViewModal] = useState<any>(null);
    const { data, isLoading } = useQuery({ queryKey: ["referrals"], queryFn: () => apiGetReferrals() });
    const { data: pR } = useQuery({ queryKey: ["patients", "select"], queryFn: () => apiGetPatients({ limit: 500 }) });
    const referrals: any[] = data?.data ?? data ?? []; const patients: any[] = pR?.data ?? [];
    const filtered = useMemo(() => referrals.filter(r => { if (sf !== "all" && r.status !== sf) return false; if (search && !r.patient_name?.toLowerCase().includes(search.toLowerCase()) && !r.specialist_name?.toLowerCase().includes(search.toLowerCase()) && !r.specialty?.toLowerCase().includes(search.toLowerCase())) return false; return true; }), [referrals, sf, search]);
    const createMut = useMutation({ mutationFn: apiCreateReferral, onSuccess: () => { toast.success("Referral created"); qc.invalidateQueries({ queryKey: ["referrals"] }); setModal(false); setForm(E_REF); }, onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed") });
    const deleteMut = useMutation({ mutationFn: apiDeleteReferral, onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["referrals"] }); } });
    const updateStatus = (id: number, status: string) => apiUpdateReferral(id, { status }).then(() => qc.invalidateQueries({ queryKey: ["referrals"] })).catch(() => toast.error("Update failed"));

    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!form.patientId || !form.specialistName || !form.reason) { toast.error("Patient, specialist and reason required"); return; } createMut.mutate({ ...form, patientId: Number(form.patientId), referredBy: user?.id }); };
    const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (<>
        <style>{GS}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div><h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Referrals</h1><p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{referrals.length} referrals · {referrals.filter(r => r.status === "pending").length} pending</p></div>
                <button onClick={() => setModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(13,158,117,.3)" }} onMouseEnter={e => e.currentTarget.style.background = "#0a8a66"} onMouseLeave={e => e.currentTarget.style.background = C.teal}><Plus size={15} />New Referral</button>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                {Object.entries(STATUS_CFG).map(([status, cfg]) => (
                    <div key={status} onClick={() => setSF(sf === status ? "all" : status)} style={{ background: sf === status ? cfg.bg : C.bg, border: `1px solid ${sf === status ? cfg.border : C.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all .15s" }}>
                        <p style={{ fontSize: 11, color: cfg.text, fontWeight: 600, marginBottom: 4 }}>{cfg.label}</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{referrals.filter(r => r.status === status).length}</p>
                        <p style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>{sf === status ? "Clear filter" : "Click to filter"}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <SearchB value={search} onChange={setSearch} placeholder="Search patient, specialist or specialty…" width={340} />

            {/* Table */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                <TH cols={["Patient", "Specialist", "Specialty", "Reason", "Date", "Urgency", "Status", ""]} tmpl="1.4fr 1.2fr 1.2fr 1.6fr 110px 90px 120px 80px" />
                {isLoading && <TLoad />}
                {!isLoading && filtered.length === 0 && <TEmpty icon={UserCheck} text="No referrals found" />}
                {!isLoading && filtered.map((row: any, i: number) => (
                    <div key={row.id} className="t-row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.2fr 1.6fr 110px 90px 120px 80px", padding: "11px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background .1s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}><Avi name={row.patient_name ?? "?"} size={30} /><div style={{ minWidth: 0 }}><p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.patient_name ?? "—"}</p><p style={{ fontSize: 11, color: C.faint }}>{row.referred_by_name ?? "—"}</p></div></div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{row.specialist_name ?? "—"}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}`, whiteSpace: "nowrap" }}>{row.specialty ?? "—"}</span>
                        <span style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.reason}>{row.reason ?? "—"}</span>
                        <span style={{ fontSize: 11, color: C.faint }}>{row.referral_date ? new Date(row.referral_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: row.urgency === "urgent" ? C.redBg : C.grayBg, color: row.urgency === "urgent" ? C.redText : C.gray, border: `1px solid ${row.urgency === "urgent" ? C.redBorder : C.border}` }}>{row.urgency ?? "routine"}</span>
                        <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 100, background: (STATUS_CFG[row.status] ?? STATUS_CFG.pending).bg, border: `1px solid ${(STATUS_CFG[row.status] ?? STATUS_CFG.pending).border}` }}>
                            <select value={row.status} onChange={e => { e.stopPropagation(); updateStatus(row.id, e.target.value); }} style={{ appearance: "none", background: "transparent", border: "none", outline: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: (STATUS_CFG[row.status] ?? STATUS_CFG.pending).text, paddingRight: 2 }}>
                                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                            <IBtn onClick={() => setViewModal(row)} title="View"><UserCheck size={12} /></IBtn>
                            <IBtn danger onClick={() => { if (confirm("Delete referral?")) deleteMut.mutate(row.id); }} title="Delete"><Trash2 size={12} /></IBtn>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Create Modal */}
        <Modal open={modal} onClose={() => setModal(false)} title="New Referral" size="lg">
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <F label="Patient" req><PatCombo patients={patients} value={form.patientId} onSelect={id => setForm(p => ({ ...p, patientId: id }))} /></F>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <F label="Specialist Name" req><input value={form.specialistName} onChange={f("specialistName")} placeholder="Dr. Full Name" className="inp" style={IS} /></F>
                    <F label="Specialty" req>
                        <select value={form.specialty} onChange={f("specialty")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </F>
                    <F label="Phone"><input type="tel" value={form.specialistPhone} onChange={f("specialistPhone")} placeholder="+252 61 234 5678" className="inp" style={IS} /></F>
                    <F label="Email"><input type="email" value={form.specialistEmail} onChange={f("specialistEmail")} placeholder="specialist@example.com" className="inp" style={IS} /></F>
                    <F label="Urgency">
                        <select value={form.urgency} onChange={f("urgency")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </F>
                </div>
                <F label="Address / Location"><input value={form.specialistAddress} onChange={f("specialistAddress")} placeholder="Clinic address…" className="inp" style={IS} /></F>
                <F label="Reason for Referral" req><textarea value={form.reason} onChange={f("reason")} rows={3} placeholder="Detailed reason for referral…" className="inp" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }} /></F>
                <F label="Additional Notes"><textarea value={form.notes} onChange={f("notes")} rows={2} placeholder="Any other relevant information…" className="inp" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }} /></F>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}><GBtn onClick={() => setModal(false)}>Cancel</GBtn><SBtn loading={createMut.isPending}><Send size={14} />Create Referral</SBtn></div>
            </form>
        </Modal>

        {/* View Modal */}
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Referral — ${viewModal?.specialist_name ?? ""}`} size="md">
            {viewModal && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 14px", background: C.bgMuted, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <div><p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Patient</p><p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{viewModal.patient_name}</p></div>
                    <div><p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Referred by</p><p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{viewModal.referred_by_name}</p></div>
                    <div><p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Date</p><p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{new Date(viewModal.referral_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                    <div><p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Urgency</p><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: viewModal.urgency === "urgent" ? C.redBg : C.grayBg, color: viewModal.urgency === "urgent" ? C.redText : C.gray, border: `1px solid ${viewModal.urgency === "urgent" ? C.redBorder : C.border}` }}>{viewModal.urgency}</span></div>
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Specialist Information</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><UserCheck size={13} color={C.teal} /><p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{viewModal.specialist_name}</p></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>{viewModal.specialty}</span></div>
                        {viewModal.specialist_phone && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={11} color={C.muted} /><p style={{ fontSize: 12, color: C.text }}>{viewModal.specialist_phone}</p></div>}
                        {viewModal.specialist_email && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={11} color={C.muted} /><p style={{ fontSize: 12, color: C.text }}>{viewModal.specialist_email}</p></div>}
                        {viewModal.specialist_address && <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><MapPin size={11} color={C.muted} style={{ marginTop: 2 }} /><p style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{viewModal.specialist_address}</p></div>}
                    </div>
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", background: C.bg }}><p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Reason for Referral</p><p style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{viewModal.reason}</p></div>
                {viewModal.notes && <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", background: C.bgMuted }}><p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Additional Notes</p><p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{viewModal.notes}</p></div>}
                <GBtn onClick={() => setViewModal(null)}>Close</GBtn>
            </div>}
        </Modal>
    </>);
}