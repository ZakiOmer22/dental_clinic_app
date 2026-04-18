// ══════════════════════════════════════════════════════════════════════════════
// STORAGE MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HardDrive, Folder, File, Image, FileText, Trash2, Download, RefreshCw, AlertTriangle, CheckCircle2, Search, X } from "lucide-react";
import { apiGetStorageStats, apiGetFiles, apiDeleteFile, apiCleanupStorage } from "@/api/storage";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = { border: "#e5eae8", bg: "#fff", bgMuted: "#f7f9f8", text: "#111816", muted: "#7a918b", faint: "#a0b4ae", teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc", amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a", red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7", blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe", purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ddd6fe", gray: "#6b7f75", grayBg: "#f4f7f5" };
const IS: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.t-row:hover{background:${C.bgMuted}!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.act-btn:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const FILE_TYPE_CFG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    image: { icon: Image, color: C.purpleText, bg: C.purpleBg, label: "Image" },
    document: { icon: FileText, color: C.blueText, bg: C.blueBg, label: "Document" },
    pdf: { icon: FileText, color: C.redText, bg: C.redBg, label: "PDF" },
    backup: { icon: Folder, color: C.tealText, bg: C.tealBg, label: "Backup" },
    other: { icon: File, color: C.gray, bg: C.grayBg, label: "Other" },
};

// ── Shared atoms ──────────────────────────────────────────────────────────────
function IBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) { return <button type="button" title={title} onClick={onClick} className={danger ? "del-btn" : "act-btn"} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.faint, transition: "all .12s" }}>{children}</button>; }
function TH({ cols, tmpl }: { cols: string[]; tmpl: string }) { return <div style={{ display: "grid", gridTemplateColumns: tmpl, padding: "9px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>{cols.map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>)}</div>; }
function TEmpty({ icon: Icon, text }: { icon: any; text: string }) { return <div style={{ padding: "48px 18px", textAlign: "center" }}><Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} /><p style={{ fontSize: 13, color: C.faint }}>{text}</p></div>; }
function TLoad() { return <div style={{ padding: "40px 18px", textAlign: "center" }}><div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 13, color: C.faint }}>Loading…</p></div>; }
function SearchB({ value, onChange, placeholder, width = 280 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number }) { return <div style={{ position: "relative", width }}><Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="inp" style={{ ...IS, paddingLeft: 30, height: 34 }} />{value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}><X size={13} /></button>}</div>; }

export function StoragePage() {
    const qc = useQueryClient(); const user = useAuthStore(s => s.user);
    const [search, setSearch] = useState(""); const [typeFilter, setTypeFilter] = useState("all");
    const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ["storage-stats"], queryFn: () => apiGetStorageStats() });
    const { data, isLoading } = useQuery({ queryKey: ["storage-files", typeFilter], queryFn: () => apiGetFiles({ type: typeFilter !== "all" ? typeFilter : undefined }) });
    const files: any[] = data?.data ?? data ?? []; const stats: any = statsData ?? {};

    const filtered = useMemo(() => files.filter(f => !search || f.name?.toLowerCase().includes(search.toLowerCase())), [files, search]);
    const deleteMut = useMutation({ mutationFn: apiDeleteFile, onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["storage-files"] }); qc.invalidateQueries({ queryKey: ["storage-stats"] }); } });
    const cleanupMut = useMutation({ mutationFn: apiCleanupStorage, onSuccess: (data: any) => { toast.success(`Cleaned ${data.filesDeleted} files, freed ${formatSize(data.spaceFreed)}`); qc.invalidateQueries({ queryKey: ["storage-files"] }); qc.invalidateQueries({ queryKey: ["storage-stats"] }); } });

    const formatSize = (bytes: number) => { if (!bytes) return "0 B"; if (bytes < 1024) return bytes + " B"; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"; if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"; return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"; };
    const usedPct = stats.total ? Math.round((stats.used / stats.total) * 100) : 0;

    return (<>
        <style>{GS}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div><h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Storage Management</h1><p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{formatSize(stats.used)} used of {formatSize(stats.total)} · {files.length} files</p></div>
                <button onClick={() => cleanupMut.mutate()} disabled={cleanupMut.isPending} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: cleanupMut.isPending ? "#9ab5ae" : C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: cleanupMut.isPending ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: cleanupMut.isPending ? "none" : "0 2px 10px rgba(13,158,117,.3)" }}>{cleanupMut.isPending ? <><RefreshCw size={14} style={{ animation: "spin .7s linear infinite" }} />Cleaning…</> : <><Trash2 size={15} />Cleanup Storage</>}</button>
            </div>

            {/* Storage usage */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <HardDrive size={18} color={C.teal} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Disk Usage</h3>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: usedPct > 80 ? C.redText : C.text }}>{usedPct}% used</span>
                </div>
                <div style={{ height: 12, background: "#edf1ef", borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ height: "100%", width: `${usedPct}%`, background: usedPct > 90 ? C.red : usedPct > 70 ? C.amber : C.teal, borderRadius: 6, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {[
                        { label: "Total", value: formatSize(stats.total), color: C.gray },
                        { label: "Used", value: formatSize(stats.used), color: C.blue },
                        { label: "Free", value: formatSize(stats.total - stats.used), color: C.teal },
                        { label: "Files", value: files.length, color: C.purple },
                    ].map(s => (
                        <div key={s.label} style={{ padding: "10px 12px", background: C.bgMuted, borderRadius: 8, border: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, color: C.faint, marginBottom: 3 }}>{s.label}</p>
                            <p style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Breakdown by type */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                {Object.entries(stats.byType ?? {}).map(([type, size]) => {
                    const cfg = FILE_TYPE_CFG[type] ?? FILE_TYPE_CFG.other; const Icon = cfg.icon;
                    return <div key={type} onClick={() => setTypeFilter(typeFilter === type ? "all" : type)} style={{ background: typeFilter === type ? cfg.bg : C.bg, border: `1px solid ${typeFilter === type ? cfg.color + "40" : C.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all .15s" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={11} color={cfg.color} /></div>
                        </div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{formatSize(size as number)}</p>
                        <p style={{ fontSize: 9, color: C.faint, marginTop: 2 }}>{typeFilter === type ? "Clear filter" : "Click to filter"}</p>
                    </div>;
                })}
            </div>

            {/* Warning banner */}
            {usedPct > 80 && <div style={{ background: usedPct > 90 ? C.redBg : C.amberBg, border: `1px solid ${usedPct > 90 ? C.redBorder : C.amberBorder}`, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <AlertTriangle size={16} color={usedPct > 90 ? C.redText : C.amberText} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: usedPct > 90 ? C.redText : C.amberText, marginBottom: 2 }}>{usedPct > 90 ? "Critical: Storage Almost Full" : "Warning: High Storage Usage"}</p>
                        <p style={{ fontSize: 12, color: usedPct > 90 ? C.redText : C.amberText, lineHeight: 1.5, opacity: .95 }}>Your storage is {usedPct > 90 ? "critically low" : "running high"}. Consider deleting old files or upgrading your storage plan to avoid service interruption.</p>
                    </div>
                </div>
            </div>}

            {/* Search */}
            <SearchB value={search} onChange={setSearch} placeholder="Search files…" width={260} />

            {/* Files table */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                <TH cols={["File Name", "Type", "Size", "Uploaded", "Last Accessed", ""]} tmpl="2fr 110px 100px 140px 140px 80px" />
                {isLoading && <TLoad />}
                {!isLoading && filtered.length === 0 && <TEmpty icon={File} text="No files found" />}
                {!isLoading && filtered.map((row: any, i: number) => {
                    const cfg = FILE_TYPE_CFG[row.type] ?? FILE_TYPE_CFG.other; const Icon = cfg.icon;
                    return <div key={row.id} className="t-row" style={{ display: "grid", gridTemplateColumns: "2fr 110px 100px 140px 140px 80px", padding: "11px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background .1s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color={cfg.color} /></div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</p>
                                <p style={{ fontSize: 10, color: C.faint, fontFamily: "monospace" }}>{row.path}</p>
                            </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, whiteSpace: "nowrap" }}>{cfg.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{formatSize(row.size)}</span>
                        <span style={{ fontSize: 11, color: C.faint }}>{row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                        <span style={{ fontSize: 11, color: C.faint }}>{row.last_accessed ? new Date(row.last_accessed).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                            <IBtn onClick={() => { const a = document.createElement("a"); a.href = row.url; a.download = row.name; a.click(); }} title="Download"><Download size={12} /></IBtn>
                            <IBtn danger onClick={() => { if (confirm("Delete this file?")) deleteMut.mutate(row.id); }} title="Delete"><Trash2 size={12} /></IBtn>
                        </div>
                    </div>;
                })}
            </div>
        </div>
    </>);
}