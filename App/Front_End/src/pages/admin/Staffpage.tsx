// ══════════════════════════════════════════════════════════════════════════════
// STAFF PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, X, Users, Mail, Phone, Calendar, Clock, Edit, UserCheck, Award, TrendingUp, CheckCircle2 } from "lucide-react";
import { apiGetStaff, apiCreateStaff, apiUpdateStaff, apiDeleteStaff } from "@/api/staff";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = { border: "#e5eae8", bg: "#fff", bgMuted: "#f7f9f8", text: "#111816", muted: "#7a918b", faint: "#a0b4ae", teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc", amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a", red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7", blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe", purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ddd6fe", gray: "#6b7f75", grayBg: "#f4f7f5" };
const IS: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.t-row:hover{background:${C.bgMuted}!important}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.act-btn:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = ["Dentist", "Dental Hygienist", "Dental Assistant", "Receptionist", "Practice Manager", "Lab Technician", "Anesthetist"];
const STATUSES = ["active", "on_leave", "inactive"];
const STATUS_CFG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    active: { bg: C.tealBg, text: C.tealText, border: C.tealBorder, label: "Active" },
    on_leave: { bg: C.amberBg, text: C.amberText, border: C.amberBorder, label: "On Leave" },
    inactive: { bg: C.grayBg, text: C.gray, border: C.border, label: "Inactive" },
};
const E_STAFF = { fullName: "", role: "Dentist", email: "", phone: "", dateJoined: "", specialization: "", licenseNumber: "", status: "active" };

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Avi({ name, size = 28 }: { name: string; size?: number }) { const p = ["linear-gradient(135deg,#0d9e75,#0a7d5d)", "linear-gradient(135deg,#3b82f6,#1d4ed8)", "linear-gradient(135deg,#8b5cf6,#5b21b6)", "linear-gradient(135deg,#f59e0b,#92400e)"]; return <div style={{ width: size, height: size, borderRadius: "50%", background: p[(name?.charCodeAt(0) ?? 0) % p.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * .35, fontWeight: 700, color: "white", flexShrink: 0 }}>{(name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</div>; }
function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) { return <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{label}{req && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}</label>{children}</div>; }
function SBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) { return <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, background: loading ? "#9ab5ae" : C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)" }}>{loading ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", animation: "spin .7s linear infinite", display: "inline-block" }} />Saving…</> : children}</button>; }
function GBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} style={{ padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>; }
function IBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) { return <button type="button" title={title} onClick={onClick} className={danger ? "del-btn" : "act-btn"} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.faint, transition: "all .12s" }}>{children}</button>; }
function Modal({ open, onClose, title, size = "md", children }: { open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode }) { if (!open) return null; const mw = size === "sm" ? 420 : size === "lg" ? 700 : 540; return <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}><div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: mw, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}><h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3><button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>✕</button></div><div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div></div></div>; }
function TH({ cols, tmpl }: { cols: string[]; tmpl: string }) { return <div style={{ display: "grid", gridTemplateColumns: tmpl, padding: "9px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>{cols.map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>)}</div>; }
function TEmpty({ icon: Icon, text }: { icon: any; text: string }) { return <div style={{ padding: "48px 18px", textAlign: "center" }}><Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} /><p style={{ fontSize: 13, color: C.faint }}>{text}</p></div>; }
function TLoad() { return <div style={{ padding: "40px 18px", textAlign: "center" }}><div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 13, color: C.faint }}>Loading…</p></div>; }
function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) { return <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}><span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span><div style={{ width: 28, height: 28, borderRadius: 7, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={13} color={color} strokeWidth={1.8} /></div></div><p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>{sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}</div>; }
function SearchB({ value, onChange, placeholder, width = 280 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number }) { return <div style={{ position: "relative", width }}><Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="inp" style={{ ...IS, paddingLeft: 30, height: 34 }} />{value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}><X size={13} /></button>}</div>; }

export function StaffPage() {
    const qc = useQueryClient(); const user = useAuthStore(s => s.user);
    const [search, setSearch] = useState(""); const [roleFilter, setRoleFilter] = useState("all"); const [modal, setModal] = useState(false); const [editModal, setEditModal] = useState<any>(null); const [form, setForm] = useState(E_STAFF);
    const { data, isLoading } = useQuery({ queryKey: ["staff"], queryFn: () => apiGetStaff() });
    const staff: any[] = data?.data ?? data ?? [];
    const filtered = useMemo(() => staff.filter(s => { if (roleFilter !== "all" && s.role !== roleFilter) return false; if (search && !s.full_name?.toLowerCase().includes(search.toLowerCase()) && !s.email?.toLowerCase().includes(search.toLowerCase())) return false; return true; }), [staff, roleFilter, search]);
    const createMut = useMutation({ mutationFn: apiCreateStaff, onSuccess: () => { toast.success("Staff member added"); qc.invalidateQueries({ queryKey: ["staff"] }); setModal(false); setForm(E_STAFF); }, onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed") });
    const updateMut = useMutation({ mutationFn: ({ id, data }: any) => apiUpdateStaff(id, data), onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["staff"] }); setEditModal(null); }, onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed") });
    const deleteMut = useMutation({ mutationFn: apiDeleteStaff, onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["staff"] }); } });

    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!form.fullName || !form.email) { toast.error("Name and email required"); return; } createMut.mutate(form); };
    const handleUpdate = (e: React.FormEvent) => { e.preventDefault(); if (!editModal.full_name || !editModal.email) { toast.error("Name and email required"); return; } updateMut.mutate({ id: editModal.id, data: editModal }); };
    const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
    const ef = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEditModal((p: any) => ({ ...p, [k]: e.target.value }));

    return (<>
        <style>{GS}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div><h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Staff</h1><p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{staff.length} team members · {staff.filter(s => s.status === "active").length} active</p></div>
                <button onClick={() => setModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(13,158,117,.3)" }} onMouseEnter={e => e.currentTarget.style.background = "#0a8a66"} onMouseLeave={e => e.currentTarget.style.background = C.teal}><Plus size={15} />Add Staff</button>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                <KPI label="Total Staff" value={staff.length} icon={Users} color={C.teal} sub="All team members" />
                <KPI label="Active" value={staff.filter(s => s.status === "active").length} icon={CheckCircle2} color={C.teal} sub="Currently working" />
                <KPI label="Roles" value={[...new Set(staff.map(s => s.role))].length} icon={Award} color={C.purple} sub="Different positions" />
                <KPI label="On Leave" value={staff.filter(s => s.status === "on_leave").length} icon={Calendar} color={C.amber} sub="Away from work" />
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <SearchB value={search} onChange={setSearch} placeholder="Search name or email…" width={260} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {[{ value: "all", label: "All" }, ...ROLES.map(r => ({ value: r, label: r }))].map(r => {
                        const active = roleFilter === r.value;
                        return <button key={r.value} onClick={() => setRoleFilter(r.value)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? C.tealBorder : C.border}`, background: active ? C.tealBg : C.bg, color: active ? C.tealText : C.muted, cursor: "pointer", fontFamily: "inherit" }}>{r.label}</button>;
                    })}
                </div>
            </div>

            {/* Table */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                <TH cols={["Name", "Role", "Contact", "Joined", "License", "Status", ""]} tmpl="1.6fr 1.2fr 1.4fr 110px 130px 110px 80px" />
                {isLoading && <TLoad />}
                {!isLoading && filtered.length === 0 && <TEmpty icon={Users} text="No staff members found" />}
                {!isLoading && filtered.map((row: any, i: number) => (
                    <div key={row.id} className="t-row" style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1.4fr 110px 130px 110px 80px", padding: "11px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background .1s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}><Avi name={row.full_name ?? "?"} size={34} /><div style={{ minWidth: 0 }}><p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.full_name ?? "—"}</p>{row.specialization && <p style={{ fontSize: 10, color: C.faint }}>{row.specialization}</p>}</div></div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}`, whiteSpace: "nowrap" }}>{row.role ?? "—"}</span>
                        <div style={{ minWidth: 0 }}>
                            {row.email && <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}><Mail size={9} color={C.faint} /><span style={{ fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.email}</span></div>}
                            {row.phone && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={9} color={C.faint} /><span style={{ fontSize: 11, color: C.faint }}>{row.phone}</span></div>}
                        </div>
                        <span style={{ fontSize: 11, color: C.faint }}>{row.date_joined ? new Date(row.date_joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{row.license_number || "—"}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: (STATUS_CFG[row.status] ?? STATUS_CFG.active).bg, color: (STATUS_CFG[row.status] ?? STATUS_CFG.active).text, border: `1px solid ${(STATUS_CFG[row.status] ?? STATUS_CFG.active).border}`, whiteSpace: "nowrap" }}>{(STATUS_CFG[row.status] ?? STATUS_CFG.active).label}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                            <IBtn onClick={() => setEditModal(row)} title="Edit"><Edit size={12} /></IBtn>
                            <IBtn danger onClick={() => { if (confirm("Delete staff member?")) deleteMut.mutate(row.id); }} title="Delete"><Trash2 size={12} /></IBtn>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Create Modal */}
        <Modal open={modal} onClose={() => setModal(false)} title="Add Staff Member" size="lg">
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <F label="Full Name" req><input value={form.fullName} onChange={f("fullName")} placeholder="Dr. John Doe" className="inp" style={IS} /></F>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <F label="Role" req><select value={form.role} onChange={f("role")} className="inp" style={{ ...IS, cursor: "pointer" }}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></F>
                    <F label="Status"><select value={form.status} onChange={f("status")} className="inp" style={{ ...IS, cursor: "pointer" }}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}</select></F>
                    <F label="Email" req><input type="email" value={form.email} onChange={f("email")} placeholder="john@example.com" className="inp" style={IS} /></F>
                    <F label="Phone"><input type="tel" value={form.phone} onChange={f("phone")} placeholder="+252 61 234 5678" className="inp" style={IS} /></F>
                    <F label="Date Joined"><input type="date" value={form.dateJoined} onChange={f("dateJoined")} className="inp" style={IS} /></F>
                    <F label="License Number"><input value={form.licenseNumber} onChange={f("licenseNumber")} placeholder="LIC-12345" className="inp" style={IS} /></F>
                    <div style={{ gridColumn: "1/-1" }}><F label="Specialization"><input value={form.specialization} onChange={f("specialization")} placeholder="e.g. Orthodontics, Endodontics" className="inp" style={IS} /></F></div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}><GBtn onClick={() => setModal(false)}>Cancel</GBtn><SBtn loading={createMut.isPending}><UserCheck size={14} />Add Staff</SBtn></div>
            </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Staff Member" size="lg">
            {editModal && <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <F label="Full Name" req><input value={editModal.full_name} onChange={ef("full_name")} className="inp" style={IS} /></F>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <F label="Role" req><select value={editModal.role} onChange={ef("role")} className="inp" style={{ ...IS, cursor: "pointer" }}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></F>
                    <F label="Status"><select value={editModal.status} onChange={ef("status")} className="inp" style={{ ...IS, cursor: "pointer" }}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}</select></F>
                    <F label="Email" req><input type="email" value={editModal.email} onChange={ef("email")} className="inp" style={IS} /></F>
                    <F label="Phone"><input type="tel" value={editModal.phone} onChange={ef("phone")} className="inp" style={IS} /></F>
                    <F label="License"><input value={editModal.license_number} onChange={ef("license_number")} className="inp" style={IS} /></F>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}><GBtn onClick={() => setEditModal(null)}>Cancel</GBtn><SBtn loading={updateMut.isPending}><CheckCircle2 size={14} />Update</SBtn></div>
            </form>}
        </Modal>
    </>);
}