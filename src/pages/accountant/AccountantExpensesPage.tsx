import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Search, Filter, X, Eye, Edit, RefreshCw,
  Shield, Building2, FileText, CheckCircle, XCircle, Clock,
  DollarSign, Download, User, Calendar, Percent, Receipt, ChevronDown,
  AlertCircle, FileCheck, CreditCard, Calendar as CalendarIcon,
  TrendingUp, TrendingDown, Wallet, Home, Car, Coffee, ShoppingBag,
  MoreVertical, Printer, Upload, Tag, Briefcase, Landmark, Users,
  Wrench, BookOpen, Laptop, Utensils, Fuel, GraduationCap, Heart
} from "lucide-react";
import { apiGetExpenses, apiCreateExpense, apiUpdateExpense, apiDeleteExpense } from "@/api/expenses";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate } from "@/utils";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent", icon: Home, color: "#8b5cf6" },
  { value: "utilities", label: "Utilities", icon: Landmark, color: "#3b82f6" },
  { value: "salaries", label: "Salaries", icon: Users, color: "#0d9e75" },
  { value: "supplies", label: "Supplies", icon: ShoppingBag, color: "#f59e0b" },
  { value: "equipment", label: "Equipment", icon: Briefcase, color: "#e53e3e" },
  { value: "marketing", label: "Marketing", icon: TrendingUp, color: "#8b5cf6" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "#3b82f6" },
  { value: "travel", label: "Travel", icon: Car, color: "#f59e0b" },
  { value: "meals", label: "Meals & Entertainment", icon: Utensils, color: "#0d9e75" },
  { value: "software", label: "Software", icon: Laptop, color: "#e53e3e" },
  { value: "training", label: "Training", icon: GraduationCap, color: "#8b5cf6" },
  { value: "medical", label: "Medical", icon: Heart, color: "#ef4444" },
  { value: "other", label: "Other", icon: Tag, color: "#6b7f75" }
];

const PAYMENT_METHODS = ["cash", "bank_transfer", "credit_card", "cheque", "mobile_money"];

const EMPTY_EXPENSE = {
  category: "",
  description: "",
  amount: 0,
  paymentMethod: "cash",
  expenseDate: new Date().toISOString().split('T')[0],
  reference: "",
  notes: ""
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ede9fe",
  green: "#10b981", greenBg: "#f0fdf4", greenText: "#059669", greenBorder: "#d1fae5",
  gray: "#6b7f75", grayBg: "#f4f7f5",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
function CategoryIcon({ category }: { category: string }) {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
  if (!cat) return <Tag size={14} color={C.gray} />;
  const Icon = cat.icon;
  return <Icon size={14} color={cat.color} />;
}

const InputStyle: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px",
  border: `1.5px solid ${C.border}`, borderRadius: 9,
  background: C.bg, fontSize: 13, color: C.text,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box"
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Button({ children, variant = "primary", loading = false, onClick, type = "button", disabled, size = "md" }: any) {
  const variants: any = {
    primary: { bg: C.teal, color: "white", border: "none", hoverBg: "#0a8a66" },
    secondary: { bg: C.bg, color: C.muted, border: `1.5px solid ${C.border}`, hoverBg: C.bgMuted },
    danger: { bg: C.redBg, color: C.redText, border: `1px solid ${C.redBorder}`, hoverBg: "#fee2e2" },
    ghost: { bg: "transparent", color: C.muted, border: "none", hoverBg: C.bgMuted },
    success: { bg: C.greenBg, color: C.greenText, border: `1px solid ${C.greenBorder}`, hoverBg: "#e6f7f0" }
  };
  const sizes = { sm: { padding: "4px 10px", fontSize: 11 }, md: { padding: "8px 16px", fontSize: 13 } };
  const style = variants[variant];
  const sizeStyle = sizes[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: sizeStyle.padding,
        borderRadius: 8, background: style.bg, color: style.color, border: style.border,
        fontSize: sizeStyle.fontSize, fontWeight: 500, cursor: loading || disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.15s ease", opacity: loading || disabled ? 0.6 : 1
      }}
    >
      {loading && <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid rgba(255,255,255,.3)`, borderTopColor: "white", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
      {children}
    </button>
  );
}

// ─── Modal Components ─────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, size = "md" }: any) {
  if (!open) return null;
  const widths = { sm: 480, md: 600, lg: 800 };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: widths[size], maxHeight: "90vh", overflow: "auto", animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function ViewExpenseModal({ open, onClose, expense }: { open: boolean; onClose: () => void; expense: any }) {
  if (!expense) return null;
  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
  const Icon = category?.icon || Tag;

  return (
    <Modal open={open} onClose={onClose} title="Expense Details" size="lg">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Expense Information</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Category</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Icon size={14} color={category?.color} />
              {category?.label || expense.category}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Amount</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.redText }}>{formatCurrency(expense.amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Date</span>
            <span style={{ fontSize: 13 }}>{formatDate(expense.expense_date)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Payment Method</span>
            <span style={{ fontSize: 13 }}>{expense.payment_method?.replace(/_/g, " ")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Reference</span>
            <span style={{ fontSize: 13 }}>{expense.reference || "—"}</span>
          </div>
        </div>

        <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Description & Notes</h4>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Description</div>
            <p style={{ fontSize: 13, color: C.text }}>{expense.description || "—"}</p>
          </div>
          {expense.notes && (
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Additional Notes</div>
              <p style={{ fontSize: 13, color: C.text }}>{expense.notes}</p>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

function CreateEditExpenseModal({ open, onClose, expense, onSave, isLoading }: {
  open: boolean;
  onClose: () => void;
  expense?: any;
  onSave: (data: any) => void;
  isLoading?: boolean;
}) {
  const [form, setForm] = useState(EMPTY_EXPENSE);

  useEffect(() => {
    if (expense && open) {
      setForm({
        category: expense.category || "",
        description: expense.description || "",
        amount: expense.amount || 0,
        paymentMethod: expense.payment_method || "cash",
        expenseDate: expense.expense_date || new Date().toISOString().split('T')[0],
        reference: expense.reference || "",
        notes: expense.notes || ""
      });
    } else if (open && !expense) {
      setForm({
        ...EMPTY_EXPENSE,
        expenseDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error("Please select a category"); return; }
    if (!form.description) { toast.error("Please enter description"); return; }
    if (!form.amount || form.amount <= 0) { toast.error("Please enter a valid amount"); return; }
    if (!form.expenseDate) { toast.error("Please select date"); return; }

    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={expense ? "Edit Expense" : "Record Expense"} size="lg">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Category" required>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={InputStyle}>
              <option value="">Select category...</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount" required>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" style={InputStyle} />
          </Field>
        </div>

        <Field label="Description" required>
          <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What was this expense for?" style={InputStyle} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Expense Date" required>
            <input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} style={InputStyle} />
          </Field>
          <Field label="Payment Method">
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={InputStyle}>
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Reference Number (optional)">
          <input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Invoice #, Receipt #, etc." style={InputStyle} />
        </Field>

        <Field label="Notes (optional)">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes..." style={{ ...InputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={isLoading}>Save Expense</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantExpensesPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [creatingExpense, setCreatingExpense] = useState(false);

  // Fetch expenses
  const { data: expensesData, isLoading, refetch } = useQuery({
    queryKey: ["expenses", categoryFilter, dateFrom, dateTo],
    queryFn: () => apiGetExpenses({
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined
    }),
  });

  const expenses = expensesData?.data || [];

  // Filter expenses locally for search
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        e.reference?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [expenses, search]);

  // Statistics
  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const byCategory = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      total: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + (e.amount || 0), 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
    const thisMonth = expenses.filter(e => {
      const date = new Date(e.expense_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + (e.amount || 0), 0);
    const lastMonth = expenses.filter(e => {
      const date = new Date(e.expense_date);
      const now = new Date();
      const lastMonthDate = new Date(now.setMonth(now.getMonth() - 1));
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, e) => sum + (e.amount || 0), 0);
    const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return { totalExpenses, byCategory, thisMonth, lastMonth, trend, count: expenses.length };
  }, [expenses]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: apiCreateExpense,
    onSuccess: () => {
      toast.success("Expense recorded successfully");
      refetch();
      setCreatingExpense(false);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to record expense")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiUpdateExpense(id, data),
    onSuccess: () => {
      toast.success("Expense updated successfully");
      refetch();
      setEditingExpense(null);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to update expense")
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteExpense,
    onSuccess: () => {
      toast.success("Expense deleted");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to delete expense")
  });

  const handleView = (expense: any) => setViewingExpense(expense);
  const handleEdit = (expense: any) => setEditingExpense(expense);
  const handleCreate = () => setCreatingExpense(true);

  const handleSaveExpense = (data: any) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (expense: any) => {
    if (confirm(`Delete this expense? This cannot be undone.`)) {
      deleteMutation.mutate(expense.id);
    }
  };

  const activeFilters = [
    search && `"${search}"`,
    categoryFilter !== "all" && `Category: ${EXPENSE_CATEGORIES.find(c => c.value === categoryFilter)?.label}`,
    dateFrom && `From: ${dateFrom}`,
    dateTo && `To: ${dateTo}`
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .expense-row:hover{background:${C.purpleBg}!important;transform:translateX(2px);transition:all 0.15s}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
              <Wallet size={24} color={C.red} /> Expenses
            </h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{stats.count} expenses · {formatCurrency(stats.totalExpenses)} total</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1px solid ${showFilters ? C.purpleBorder : C.border}`, borderRadius: 9, background: showFilters ? C.purpleBg : C.bg, fontSize: 12, fontWeight: 500, color: showFilters ? C.purpleText : C.muted, cursor: "pointer" }}>
              <Filter size={13} /> Filters {activeFilters.length > 0 && <span style={{ background: C.purple, color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{activeFilters.length}</span>}
            </button>
            <button onClick={() => refetch()} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={handleCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(139,92,246,.3)" }}>
              <Plus size={15} /> Add Expense
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Total Expenses", value: formatCurrency(stats.totalExpenses), icon: DollarSign, color: C.red, bg: C.redBg, sub: `${stats.count} transactions` },
            { label: "This Month", value: formatCurrency(stats.thisMonth), icon: CalendarIcon, color: C.teal, bg: C.tealBg, sub: stats.trend !== 0 ? `${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}% vs last month` : "No change" },
            { label: "Average Expense", value: formatCurrency(stats.count ? stats.totalExpenses / stats.count : 0), icon: TrendingUp, color: C.blue, bg: C.blueBg, sub: "per transaction" },
            { label: "Top Category", value: stats.byCategory[0]?.label || "—", icon: Tag, color: C.amber, bg: C.amberBg, sub: stats.byCategory[0] ? formatCurrency(stats.byCategory[0].total) : "No data" }
          ].map(k => (
            <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", transition: "all 0.2s", cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{k.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <k.icon size={14} color={k.color} />
                </div>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{k.value}</p>
              <p style={{ fontSize: 10, color: C.faint }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        {stats.byCategory.length > 0 && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 12 }}>Expenses by Category</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.byCategory.slice(0, 5).map(cat => {
                const percent = (cat.total / stats.totalExpenses) * 100;
                return (
                  <div key={cat.value}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <cat.icon size={12} color={cat.color} />
                        <span style={{ fontSize: 12, color: C.text }}>{cat.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{formatCurrency(cat.total)}</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: 6, background: cat.color, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ background: C.bg, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, animation: "fadeUp .2s ease" }}>
            <Field label="Category">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Date From">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="inp" style={InputStyle} />
            </Field>
            <Field label="Date To">
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="inp" style={InputStyle} />
            </Field>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={() => { setCategoryFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgMuted, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by description, reference, or notes..." className="inp" style={{ ...InputStyle, paddingLeft: 36, height: 42, fontSize: 14 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint }}><X size={14} /></button>}
          </div>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeFilters.map((f, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>
                {f}<X size={10} style={{ cursor: "pointer" }} onClick={() => { if (f.startsWith('"')) setSearch(""); else if (f.startsWith("Category")) setCategoryFilter("all"); else if (f.startsWith("From")) setDateFrom(""); else if (f.startsWith("To")) setDateTo(""); }} />
              </span>
            ))}
          </div>
        </div>

        {/* Expenses Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(100px, 1fr) minmax(200px, 2fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(80px, 0.6fr)",
            padding: "12px 20px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`,
            gap: "8px"
          }}>
            {["Date", "Description", "Category", "Amount", "Payment Method", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: C.faint }}>Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Wallet size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: C.faint }}>No expenses found</p>
            </div>
          ) : (
            filteredExpenses.map((row: any, i: number) => {
              const category = EXPENSE_CATEGORIES.find(c => c.value === row.category);
              const Icon = category?.icon || Tag;
              
              return (
                <div
                  key={row.id}
                  className="expense-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(100px, 1fr) minmax(200px, 2fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(80px, 0.6fr)",
                    padding: "14px 20px",
                    borderBottom: i < filteredExpenses.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    transition: "all .1s",
                    cursor: "pointer",
                    gap: "8px"
                  }}
                  onClick={() => handleView(row)}
                >
                  <span style={{ fontSize: 12, color: C.muted }}>{formatDate(row.expense_date)}</span>
                  
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.description}</p>
                    {row.reference && <p style={{ fontSize: 10, color: C.faint }}>Ref: {row.reference}</p>}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={14} color={category?.color} />
                    <span style={{ fontSize: 12, color: C.muted }}>{category?.label || row.category}</span>
                  </div>
                  
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.redText }}>{formatCurrency(row.amount)}</span>
                  
                  <span style={{ fontSize: 12, color: C.muted }}>{row.payment_method?.replace(/_/g, " ")}</span>
                  
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.amber }}><Edit size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.red }}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {filteredExpenses.length > 0 && (
          <div style={{ marginTop: 8, padding: "12px 20px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: C.muted }}>{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found</span>
            <div style={{ display: "flex", gap: 24 }}>
              <span>Total: <strong style={{ color: C.redText }}>{formatCurrency(filteredExpenses.reduce((s, c) => s + (c.amount || 0), 0))}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewExpenseModal open={!!viewingExpense} onClose={() => setViewingExpense(null)} expense={viewingExpense} />
      <CreateEditExpenseModal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        onSave={handleSaveExpense}
        isLoading={updateMutation.isPending}
      />
      <CreateEditExpenseModal
        open={creatingExpense}
        onClose={() => setCreatingExpense(false)}
        onSave={handleSaveExpense}
        isLoading={createMutation.isPending}
      />
    </>
  );
}