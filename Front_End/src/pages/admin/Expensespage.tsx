import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Search, X, Trash2, Filter, Download,
    Wallet, TrendingDown, TrendingUp, Calendar,
    ChevronDown, DollarSign, BarChart3, ChevronRight,
    FileText, User, Clock, Edit, Eye
} from "lucide-react";
import { apiGetExpenses, apiCreateExpense, apiDeleteExpense } from "@/api/expenses";
import { useAuthStore } from "@/app/store";
import { formatCurrency } from "@/utils";
import toast from "react-hot-toast";

const C = { border: "#e5eae8", bg: "#fff", bgMuted: "#f7f9f8", text: "#111816", muted: "#7a918b", faint: "#a0b4ae", teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc", amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a", red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7", blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe", purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6" };
const CATS = ["Rent", "Utilities", "Salaries", "Supplies", "Equipment", "Marketing", "Maintenance", "Insurance", "Other"];
const METHODS = ["cash", "card", "bank_transfer", "cheque", "mobile_money", "other"];
const CAT_COLORS: Record<string, string> = { Rent: C.blue, Utilities: C.amber, Salaries: C.purple, Supplies: C.teal, Equipment: C.red, Marketing: "#ec4899", Maintenance: "#14b8a6", Insurance: "#6366f1", Other: C.gray };
const EMPTY = { category: "", description: "", amount: "", paymentMethod: "cash", reference: "", expenseDate: new Date().toISOString().split("T")[0], notes: "" };
const IS: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const C2 = { gray: "#6b7f75" };

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{label}</label>{children}</div>; }
function Btn({ loading, children, onClick, variant = "primary" }: { loading?: boolean; children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" }) {
    if (variant === "ghost") return <button type="button" onClick={onClick} style={{ padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 500, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>;
    return <button type={onClick ? "button" : "submit"} onClick={onClick} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, background: loading ? "#9ab5ae" : C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)" }}>{loading ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", animation: "spin .7s linear infinite", display: "inline-block" }} />Saving…</> : children}</button>;
}
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}><div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "modalIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}><h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3><button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><X size={14} /></button></div><div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div></div></div>;
}

// Detail View Component
function ExpenseDetail({ expense, onClose }: { expense: any; onClose: () => void }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.bgMuted, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: (CAT_COLORS[expense.category] || C.muted) + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wallet size={20} color={CAT_COLORS[expense.category] || C.muted} />
                </div>
                <div>
                    <span style={{ fontSize: 11, color: C.faint }}>EXPENSE #{expense.id}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{expense.description}</h3>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Category</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[expense.category] || C.muted }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{expense.category}</span>
                    </div>
                </div>
                <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Amount</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.redText }}>{formatCurrency(expense.amount)}</p>
                </div>
                <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Payment Method</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{expense.payment_method?.replace(/_/g, " ")}</p>
                </div>
                <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Date</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                </div>
            </div>

            {expense.reference && (
                <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Reference #</p>
                    <p style={{ fontSize: 13, color: C.text }}>{expense.reference}</p>
                </div>
            )}

            {expense.notes && (
                <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Notes</p>
                    <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{expense.notes}</p>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                    onClick={() => window.print()}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "inherit" }}
                >
                    <Download size={14} />
                    Export
                </button>
                <Btn variant="ghost" onClick={onClose}>Close</Btn>
            </div>
        </div>
    );
}

export default function ExpensesPage() {
    const qc = useQueryClient();
    const user = useAuthStore(s => s.user);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [modal, setModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const { data, isLoading } = useQuery({ queryKey: ["expenses"], queryFn: () => apiGetExpenses() });
    const expenses: any[] = data?.data ?? data ?? [];

    const filtered = useMemo(() => expenses.filter(e => {
        if (catFilter !== "all" && e.category !== catFilter) return false;
        if (search && !e.description?.toLowerCase().includes(search.toLowerCase()) && !e.category?.toLowerCase().includes(search.toLowerCase())) return false;
        if (dateFrom && e.expense_date < dateFrom) return false;
        if (dateTo && e.expense_date > dateTo) return false;
        return true;
    }), [expenses, catFilter, search, dateFrom, dateTo]);

    const totalAll = expenses.reduce((a, e) => a + parseFloat(e.amount ?? 0), 0);
    const totalFiltered = filtered.reduce((a, e) => a + parseFloat(e.amount ?? 0), 0);
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => { const c = e.category || "Other"; byCategory[c] = (byCategory[c] || 0) + parseFloat(e.amount ?? 0); });
    const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCat = Math.max(...topCat.map(([, v]) => v), 1);

    // Monthly trend
    const monthly: Record<string, number> = {};
    expenses.forEach(e => { if (!e.expense_date) return; const m = new Date(e.expense_date).toLocaleDateString("en", { month: "short", year: "2-digit" }); monthly[m] = (monthly[m] || 0) + parseFloat(e.amount ?? 0); });
    const monthKeys = Object.keys(monthly).slice(-6);
    const maxMonth = Math.max(...monthKeys.map(k => monthly[k]), 1);

    const createMut = useMutation({
        mutationFn: apiCreateExpense,
        onSuccess: () => { toast.success("Expense recorded"); qc.invalidateQueries({ queryKey: ["expenses"] }); setModal(false); setForm(EMPTY); },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed"),
    });
    const deleteMut = useMutation({
        mutationFn: apiDeleteExpense,
        onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["expenses"] }); },
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.amount || !form.description) { toast.error("Category, description and amount required"); return; }
        createMut.mutate({ ...form, amount: parseFloat(form.amount), clinicId: user?.clinicId, recordedBy: user?.id });
    };
    const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleRowClick = (row: any, e: React.MouseEvent) => {
        // Don't trigger if clicking on delete button
        if ((e.target as HTMLElement).closest('.delete-btn')) return;
        setExpandedRow(expandedRow === row.id ? null : row.id);
    };

    return (
        <>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.exp-row:hover{background:${C.bgMuted}!important;cursor:pointer}.delete-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.detail-row{animation:fadeUp .2s ease both}`}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div><h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Expenses</h1><p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{expenses.length} records · {formatCurrency(totalAll)} total</p></div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1px solid ${showFilters ? C.tealBorder : C.border}`, borderRadius: 9, background: showFilters ? C.tealBg : C.bg, fontSize: 12, fontWeight: 500, color: showFilters ? C.tealText : C.muted, cursor: "pointer", fontFamily: "inherit" }}><Filter size={13} /> Filters</button>
                        <button onClick={() => setModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(13,158,117,.3)" }} onMouseEnter={e => (e.currentTarget.style.background = "#0a8a66")} onMouseLeave={e => (e.currentTarget.style.background = C.teal)}><Plus size={15} /> Add Expense</button>
                    </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                    {[
                        { label: "Total Expenses", value: formatCurrency(totalAll), icon: Wallet, color: C.red, sub: "All time" },
                        { label: "This Month", value: formatCurrency(expenses.filter(e => e.expense_date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((a, e) => a + parseFloat(e.amount ?? 0), 0)), icon: Calendar, color: C.amber, sub: "Current month" },
                        { label: "Largest Category", value: topCat[0]?.[0] ?? "—", icon: BarChart3, color: C.blue, sub: topCat[0] ? formatCurrency(topCat[0][1]) : "No data" },
                        { label: "Filtered Total", value: formatCurrency(totalFiltered), icon: DollarSign, color: C.teal, sub: `${filtered.length} records` },
                    ].map(k => (
                        <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}><span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{k.label}</span><div style={{ width: 28, height: 28, borderRadius: 7, background: k.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><k.icon size={13} color={k.color} strokeWidth={1.8} /></div></div>
                            <p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{k.value}</p>
                            <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{k.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                    {/* Monthly trend */}
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 12 }}>Monthly Spend Trend</p>
                        {monthKeys.length === 0 ? <p style={{ fontSize: 11, color: C.faint, textAlign: "center", padding: "12px 0" }}>No data yet</p> :
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                                {monthKeys.map((m, i) => {
                                    const isLast = i === monthKeys.length - 1; return (
                                        <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                            <span style={{ fontSize: 9, color: isLast ? C.redText : C.faint, fontWeight: isLast ? 700 : 400 }}>${(monthly[m] / 1000).toFixed(1)}k</span>
                                            <div style={{ width: "100%", height: `${(monthly[m] / maxMonth) * 60}px`, minHeight: 4, borderRadius: "3px 3px 0 0", background: isLast ? C.red : "#fde8e8", border: isLast ? "none" : `1px solid ${C.redBorder}` }} />
                                            <span style={{ fontSize: 9, color: isLast ? C.redText : C.faint, fontWeight: isLast ? 700 : 400 }}>{m}</span>
                                        </div>
                                    );
                                })}
                            </div>}
                    </div>
                    {/* Category breakdown */}
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 }}>By Category</p>
                        {topCat.map(([cat, val]) => (
                            <div key={cat} style={{ marginBottom: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[cat] || C.muted, display: "inline-block" }} /><span style={{ fontSize: 11, color: C.text }}>{cat}</span></div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{formatCurrency(val)}</span>
                                </div>
                                <div style={{ height: 4, background: "#edf1ef", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${(val / maxCat) * 100}%`, background: CAT_COLORS[cat] || C.muted, borderRadius: 2 }} /></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div style={{ background: C.bg, border: `1px solid ${C.tealBorder}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, animation: "fadeUp .2s ease both" }}>
                        <Field label="Category"><select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="inp" style={{ ...IS, cursor: "pointer" }}><option value="all">All categories</option>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
                        <Field label="Date from"><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="inp" style={IS} /></Field>
                        <Field label="Date to"><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="inp" style={IS} /></Field>
                        <div style={{ display: "flex", alignItems: "flex-end" }}><button onClick={() => { setCatFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgMuted, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>Clear All</button></div>
                    </div>
                )}

                {/* Category tabs + search */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", width: 260 }}>
                        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description or category…" className="inp" style={{ ...IS, paddingLeft: 30, height: 34 }} />
                        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}><X size={13} /></button>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {[{ value: "all", label: "All" }, ...CATS.map(c => ({ value: c, label: c }))].map(t => (
                            <button key={t.value} onClick={() => setCatFilter(t.value)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${catFilter === t.value ? (CAT_COLORS[t.value] || C.tealBorder) + "66" : C.border}`, background: catFilter === t.value ? (CAT_COLORS[t.value] || C.teal) + "14" : C.bg, color: catFilter === t.value ? (CAT_COLORS[t.value] || C.tealText) : C.muted, cursor: "pointer", fontFamily: "inherit", transition: "all .12s" }}>{t.label}</button>
                        ))}
                    </div>
                </div>

                {/* Table with clickable rows */}
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 100px 120px 130px 100px 60px", padding: "9px 18px", background: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
                        {["Category", "Description", "Amount", "Method", "Date", "Reference", ""].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>)}
                    </div>
                    {isLoading && <div style={{ padding: "40px 18px", textAlign: "center" }}><div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 13, color: C.faint }}>Loading…</p></div>}
                    {!isLoading && filtered.length === 0 && <div style={{ padding: "48px 18px", textAlign: "center" }}><Wallet size={28} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} /><p style={{ fontSize: 13, color: C.faint }}>No expenses found</p></div>}
                    {!isLoading && filtered.map((row: any, i: number) => (
                        <div key={row.id}>
                            <div 
                                className="exp-row" 
                                onClick={(e) => handleRowClick(row, e)}
                                style={{ 
                                    display: "grid", 
                                    gridTemplateColumns: "110px 1fr 100px 120px 130px 100px 60px", 
                                    padding: "11px 18px", 
                                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", 
                                    alignItems: "center", 
                                    transition: "background .1s",
                                    background: expandedRow === row.id ? C.bgMuted : "transparent"
                                }}
                            >
                                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: (CAT_COLORS[row.category] || C.muted) + "14", color: CAT_COLORS[row.category] || C.muted, border: `1px solid ${(CAT_COLORS[row.category] || C.muted)}33`, whiteSpace: "nowrap", display: "inline-block" }}>{row.category}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.description}</span>
                                    {row.notes && <FileText size={11} color={C.faint} style={{ opacity: 0.6 }} />}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.redText }}>{formatCurrency(row.amount)}</span>
                                <span style={{ fontSize: 12, color: C.muted, textTransform: "capitalize" }}>{row.payment_method?.replace(/_/g, " ")}</span>
                                <span style={{ fontSize: 12, color: C.faint }}>{row.expense_date ? new Date(row.expense_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                                <span style={{ fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.reference || "—"}</span>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button 
                                        className="delete-btn" 
                                        onClick={(e) => { 
                                            e.stopPropagation();
                                            if (confirm("Delete expense?")) deleteMut.mutate(row.id); 
                                        }} 
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
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            {/* Expanded detail row */}
                            {expandedRow === row.id && (
                                <div className="detail-row" style={{ 
                                    padding: "20px 18px", 
                                    background: C.bgMuted, 
                                    borderTop: `1px solid ${C.border}`,
                                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none"
                                }}>
                                    <ExpenseDetail expense={row} onClose={() => setExpandedRow(null)} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal open={modal} onClose={() => setModal(false)} title="Add Expense">
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Category *"><select value={form.category} onChange={f("category")} className="inp" style={{ ...IS, cursor: "pointer" }}><option value="">Select category…</option>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
                        <Field label="Amount *"><input type="number" step="0.01" value={form.amount} onChange={f("amount")} placeholder="0.00" className="inp" style={IS} /></Field>
                        <div style={{ gridColumn: "1/-1" }}><Field label="Description *"><input value={form.description} onChange={f("description")} placeholder="e.g. January office rent…" className="inp" style={IS} /></Field></div>
                        <Field label="Payment Method"><select value={form.paymentMethod} onChange={f("paymentMethod")} className="inp" style={{ ...IS, cursor: "pointer" }}>{METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}</select></Field>
                        <Field label="Expense Date"><input type="date" value={form.expenseDate} onChange={f("expenseDate")} className="inp" style={IS} /></Field>
                        <div style={{ gridColumn: "1/-1" }}><Field label="Reference # (optional)"><input value={form.reference} onChange={f("reference")} placeholder="Invoice, receipt number…" className="inp" style={IS} /></Field></div>
                        <div style={{ gridColumn: "1/-1" }}><Field label="Notes"><textarea value={form.notes} onChange={f("notes")} rows={2} placeholder="Additional notes…" className="inp" style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }} /></Field></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn><Btn loading={createMut.isPending}><Wallet size={14} /> Save Expense</Btn></div>
                </form>
            </Modal>
        </>
    );
}