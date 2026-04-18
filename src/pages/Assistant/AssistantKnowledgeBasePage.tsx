// ══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, X, BookOpen, Eye, ThumbsUp, Edit, FolderOpen, FileText, TrendingUp } from "lucide-react";
import { apiGetArticles, apiCreateArticle, apiUpdateArticle, apiDeleteArticle } from "@/api/knowledgeBase";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = { border: "#e5eae8", bg: "#fff", bgMuted: "#f7f9f8", text: "#111816", muted: "#7a918b", faint: "#a0b4ae", teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc", amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a", red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7", blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe", purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ddd6fe", gray: "#6b7f75", grayBg: "#f4f7f5" };
const IS: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.art-card:hover{border-color:${C.tealBorder}!important;background:${C.tealBg}!important}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["Getting Started", "Billing & Payments", "Technical Support", "Account Management", "Features & Updates", "Best Practices", "Troubleshooting", "FAQs"];
const E_ARTICLE = { title: "", category: "Getting Started", content: "", tags: "" };

// ── Shared atoms ──────────────────────────────────────────────────────────────
function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) { return <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{label}{req && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}</label>{children}</div>; }
function SBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) { return <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, background: loading ? "#9ab5ae" : C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)" }}>{loading ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", animation: "spin .7s linear infinite", display: "inline-block" }} />Saving…</> : children}</button>; }
function GBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} style={{ padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>; }
function Modal({ open, onClose, title, size = "md", children }: { open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode }) { if (!open) return null; const mw = size === "sm" ? 420 : size === "lg" ? 700 : 540; return <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}><div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: mw, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}><h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3><button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>✕</button></div><div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div></div></div>; }
function TEmpty({ icon: Icon, text }: { icon: any; text: string }) { return <div style={{ padding: "48px 18px", textAlign: "center" }}><Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} /><p style={{ fontSize: 13, color: C.faint }}>{text}</p></div>; }
function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) { return <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}><span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span><div style={{ width: 28, height: 28, borderRadius: 7, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={13} color={color} strokeWidth={1.8} /></div></div><p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>{sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}</div>; }
function SearchB({ value, onChange, placeholder, width = 280 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number }) { return <div style={{ position: "relative", width }}><Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="inp" style={{ ...IS, paddingLeft: 30, height: 34 }} />{value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}><X size={13} /></button>}</div>; }

export function AssistantKnowledgeBasePage() {
    const qc = useQueryClient(); const user = useAuthStore(s => s.user);
    const [search, setSearch] = useState(""); const [catFilter, setCatFilter] = useState("all"); const [modal, setModal] = useState(false); const [editModal, setEditModal] = useState<any>(null); const [viewModal, setViewModal] = useState<any>(null); const [form, setForm] = useState(E_ARTICLE);
    const { data, isLoading } = useQuery({ queryKey: ["kb-articles"], queryFn: () => apiGetArticles() });
    const articles: any[] = data?.data ?? data ?? [];

    const filtered = useMemo(() => articles.filter(a => { if (catFilter !== "all" && a.category !== catFilter) return false; if (search && !a.title?.toLowerCase().includes(search.toLowerCase()) && !a.content?.toLowerCase().includes(search.toLowerCase()) && !a.tags?.toLowerCase().includes(search.toLowerCase())) return false; return true; }), [articles, catFilter, search]);

    const createMut = useMutation({ mutationFn: apiCreateArticle, onSuccess: () => { toast.success("Article created"); qc.invalidateQueries({ queryKey: ["kb-articles"] }); setModal(false); setForm(E_ARTICLE); }, onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed") });
    const updateMut = useMutation({ mutationFn: ({ id, data }: any) => apiUpdateArticle(id, data), onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["kb-articles"] }); setEditModal(null); }, onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed") });
    const deleteMut = useMutation({ mutationFn: apiDeleteArticle, onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["kb-articles"] }); } });

    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!form.title || !form.content) { toast.error("Title and content required"); return; } createMut.mutate({ ...form, authorId: user?.id }); };
    const handleUpdate = (e: React.FormEvent) => { e.preventDefault(); if (!editModal.title || !editModal.content) { toast.error("Title and content required"); return; } updateMut.mutate({ id: editModal.id, data: editModal }); };
    const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
    const ef = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEditModal((p: any) => ({ ...p, [k]: e.target.value }));

    const totalViews = articles.reduce((a, b) => a + (b.views ?? 0), 0);

    return (<>
        <style>{GS}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div><h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Knowledge Base</h1><p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{articles.length} articles · {totalViews} total views</p></div>
                <button onClick={() => setModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(13,158,117,.3)" }} onMouseEnter={e => e.currentTarget.style.background = "#0a8a66"} onMouseLeave={e => e.currentTarget.style.background = C.teal}><Plus size={15} />New Article</button>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                <KPI label="Total Articles" value={articles.length} icon={FileText} color={C.teal} sub="Published" />
                <KPI label="Total Views" value={totalViews} icon={Eye} color={C.blue} sub="All time" />
                <KPI label="Categories" value={[...new Set(articles.map(a => a.category))].length} icon={FolderOpen} color={C.purple} sub="Active categories" />
                <KPI label="Avg Rating" value="4.7" icon={ThumbsUp} color={C.amber} sub="User feedback" />
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <SearchB value={search} onChange={setSearch} placeholder="Search articles…" width={300} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {[{ value: "all", label: "All Categories" }, ...CATEGORIES.map(c => ({ value: c, label: c }))].map(c => { const active = catFilter === c.value; return <button key={c.value} onClick={() => setCatFilter(c.value)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? C.tealBorder : C.border}`, background: active ? C.tealBg : C.bg, color: active ? C.tealText : C.muted, cursor: "pointer", fontFamily: "inherit" }}>{c.label}</button>; })}
                </div>
            </div>

            {/* Articles grid */}
            {isLoading ? <div style={{ padding: "40px 18px", textAlign: "center" }}><div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 13, color: C.faint }}>Loading…</p></div> : filtered.length === 0 ? <TEmpty icon={BookOpen} text="No articles found" /> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    {filtered.map(art => (
                        <div key={art.id} className="art-card" onClick={() => setViewModal(art)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: C.tealBg, border: `1px solid ${C.tealBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={16} color={C.teal} /></div>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>{art.category}</span>
                            </div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>{art.title}</h3>
                            <p style={{ fontSize: 12, color: C.faint, lineHeight: 1.5, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{art.content?.substring(0, 120)}…</p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={11} color={C.faint} /><span style={{ fontSize: 11, color: C.faint }}>{art.views ?? 0}</span></div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}><ThumbsUp size={11} color={C.faint} /><span style={{ fontSize: 11, color: C.faint }}>{art.helpful_count ?? 0}</span></div>
                                </div>
                                <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setEditModal(art)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint }}><Edit size={11} /></button>
                                    <button onClick={() => { if (confirm("Delete article?")) deleteMut.mutate(art.id); }} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.redBg, display: "flex", alignItems: "center", justifyContent: "center", color: C.redText }}><Trash2 size={11} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>}
        </div>

        {/* Create Modal */}
        <Modal open={modal} onClose={() => setModal(false)} title="New Article" size="lg">
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <F label="Title" req><input value={form.title} onChange={f("title")} placeholder="Article title" className="inp" style={IS} /></F>
                <F label="Category" req><select value={form.category} onChange={f("category")} className="inp" style={{ ...IS, cursor: "pointer" }}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></F>
                <F label="Content" req><textarea value={form.content} onChange={f("content")} rows={12} placeholder="Article content (supports Markdown)…" className="inp" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5, fontFamily: "monospace" }} /></F>
                <F label="Tags"><input value={form.tags} onChange={f("tags")} placeholder="tag1, tag2, tag3" className="inp" style={IS} /></F>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}><GBtn onClick={() => setModal(false)}>Cancel</GBtn><SBtn loading={createMut.isPending}><BookOpen size={14} />Publish Article</SBtn></div>
            </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Article" size="lg">
            {editModal && <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <F label="Title" req><input value={editModal.title} onChange={ef("title")} className="inp" style={IS} /></F>
                <F label="Category" req><select value={editModal.category} onChange={ef("category")} className="inp" style={{ ...IS, cursor: "pointer" }}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></F>
                <F label="Content" req><textarea value={editModal.content} onChange={ef("content")} rows={12} className="inp" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5, fontFamily: "monospace" }} /></F>
                <F label="Tags"><input value={editModal.tags} onChange={ef("tags")} className="inp" style={IS} /></F>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}><GBtn onClick={() => setEditModal(null)}>Cancel</GBtn><SBtn loading={updateMut.isPending}><Edit size={14} />Update Article</SBtn></div>
            </form>}
        </Modal>

        {/* View Modal */}
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal?.title ?? ""} size="lg">
            {viewModal && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>{viewModal.category}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} color={C.faint} /><span style={{ fontSize: 11, color: C.faint }}>{viewModal.views ?? 0} views</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}><ThumbsUp size={12} color={C.faint} /><span style={{ fontSize: 11, color: C.faint }}>{viewModal.helpful_count ?? 0} helpful</span></div>
                </div>
                <div style={{ lineHeight: 1.7, fontSize: 13, color: C.text }}><pre style={{ fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0 }}>{viewModal.content}</pre></div>
                {viewModal.tags && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{viewModal.tags.split(",").map((t: string) => <span key={t.trim()} style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: C.blueBg, color: C.blueText, border: `1px solid ${C.blueBorder}` }}>{t.trim()}</span>)}</div>}
                <GBtn onClick={() => setViewModal(null)}>Close</GBtn>
            </div>}
        </Modal>
    </>);
}