import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Search, Filter, X, Eye, Edit, RefreshCw,
  Shield, Building2, FileText, CheckCircle, XCircle, Clock,
  DollarSign, Download, User, Calendar, Percent, Receipt, ChevronDown,
  AlertCircle, FileCheck, CreditCard, Calendar as CalendarIcon,
  TrendingUp, TrendingDown, Wallet, Home, Car, Coffee, ShoppingBag,
  MoreVertical, Printer, Upload, Tag, Briefcase, Landmark, Users,
  Wrench, BookOpen, Laptop, Utensils, Fuel, GraduationCap, Heart,
  BarChart3, PieChart, LineChart, Activity, Award, Target, Zap,
  ArrowUp, ArrowDown, Minus, Phone, Mail, MapPin, Calculator,
  ReceiptText, FileSpreadsheet, Building, Banknote, Landmark as LandmarkIcon,
  Stethoscope, Syringe, Bone, Sparkles
} from "lucide-react";
import { apiGetProcedures, apiCreateProcedure, apiUpdateProcedure, apiDeleteProcedure } from "@/api/procedures";
import { useAuthStore } from "@/app/store";
import { formatCurrency, formatDate } from "@/utils";
import toast from "react-hot-toast";

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

const PROCEDURE_CATEGORIES = [
  { value: "Diagnostic", label: "Diagnostic", icon: Stethoscope, color: C.blue },
  { value: "Preventive", label: "Preventive", icon: Shield, color: C.teal },
  { value: "Restorative", label: "Restorative", icon: Activity, color: C.amber },
  { value: "Endodontics", label: "Endodontics", icon: Activity, color: C.purple },
  { value: "Periodontics", label: "Periodontics", icon: Bone, color: C.red },
  { value: "Prosthodontics", label: "Prosthodontics", icon: Award, color: C.green },
  { value: "Oral Surgery", label: "Oral Surgery", icon: Syringe, color: C.red },
  { value: "Orthodontics", label: "Orthodontics", icon: Activity, color: C.blue },
  { value: "Cosmetic", label: "Cosmetic", icon: Sparkles, color: C.purple },
  { value: "Emergency", label: "Emergency", icon: AlertCircle, color: C.amber }
];

const EMPTY_PROCEDURE = {
  name: "",
  category: "",
  basePrice: 0,
  durationMinutes: 30,
  cdtCode: "",
  description: "",
  requiresLab: false,
  isActive: true
};

// Helper to safely parse numbers
const safeParseNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

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

function ViewProcedureModal({ open, onClose, procedure }: { open: boolean; onClose: () => void; procedure: any }) {
  if (!procedure) return null;
  const category = PROCEDURE_CATEGORIES.find(c => c.value === procedure.category);
  const Icon = category?.icon || Tag;

  return (
    <Modal open={open} onClose={onClose} title="Procedure Details" size="lg">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Procedure Information</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Name</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{procedure.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Category</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon size={14} color={category?.color} />
              {category?.label || procedure.category}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>CDT Code</span>
            <span style={{ fontSize: 13, fontFamily: "monospace" }}>{procedure.cdt_code || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Status</span>
            <span style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 600,
              background: procedure.is_active ? C.greenBg : C.redBg,
              color: procedure.is_active ? C.greenText : C.redText
            }}>
              {procedure.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Pricing & Duration</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Base Price</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>{formatCurrency(procedure.base_price)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Duration</span>
            <span style={{ fontSize: 13 }}>{procedure.duration_minutes} minutes</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Requires Lab</span>
            <span style={{ fontSize: 13 }}>{procedure.requires_lab ? "Yes" : "No"}</span>
          </div>
        </div>

        {procedure.description && (
          <div style={{ background: C.bgMuted, borderRadius: 12, padding: 16, gridColumn: "span 2" }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Description</h4>
            <p style={{ fontSize: 13, color: C.text }}>{procedure.description}</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

function CreateEditProcedureModal({ open, onClose, procedure, onSave, isLoading }: {
  open: boolean;
  onClose: () => void;
  procedure?: any;
  onSave: (data: any) => void;
  isLoading?: boolean;
}) {
  const [form, setForm] = useState(EMPTY_PROCEDURE);

  useEffect(() => {
    if (procedure && open) {
      setForm({
        name: procedure.name || "",
        category: procedure.category || "",
        basePrice: procedure.base_price || 0,
        durationMinutes: procedure.duration_minutes || 30,
        cdtCode: procedure.cdt_code || "",
        description: procedure.description || "",
        requiresLab: procedure.requires_lab || false,
        isActive: procedure.is_active !== undefined ? procedure.is_active : true
      });
    } else if (open && !procedure) {
      setForm({ ...EMPTY_PROCEDURE });
    }
  }, [procedure, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Please enter procedure name"); return; }
    if (!form.category) { toast.error("Please select a category"); return; }
    if (!form.basePrice || form.basePrice <= 0) { toast.error("Please enter a valid price"); return; }

    onSave(form);
  };

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

  return (
    <Modal open={open} onClose={onClose} title={procedure ? "Edit Procedure" : "Add New Procedure"} size="lg">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Procedure Name" required>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Root Canal Treatment" style={InputStyle} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Category" required>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={InputStyle}>
              <option value="">Select category...</option>
              {PROCEDURE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </Field>
          <Field label="CDT Code">
            <input type="text" value={form.cdtCode} onChange={e => setForm({ ...form, cdtCode: e.target.value })} placeholder="e.g., D3310" style={InputStyle} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Base Price" required>
            <input type="number" step="0.01" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })} placeholder="0.00" style={InputStyle} />
          </Field>
          <Field label="Duration (minutes)">
            <input type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 30 })} placeholder="30" style={InputStyle} />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Procedure description..." style={{ ...InputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }} />
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text, cursor: "pointer" }}>
            <input type="checkbox" checked={form.requiresLab} onChange={e => setForm({ ...form, requiresLab: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
            Requires Lab Work
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
            Procedure is Active
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={isLoading}>Save Procedure</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantProceduresPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewingProcedure, setViewingProcedure] = useState<any>(null);
  const [editingProcedure, setEditingProcedure] = useState<any>(null);
  const [creatingProcedure, setCreatingProcedure] = useState(false);

  // Fetch procedures
  const { data: proceduresData, isLoading, refetch } = useQuery({
    queryKey: ["procedures", "all"],
    queryFn: () => apiGetProcedures({ is_active: true })
  });

  const procedures = proceduresData?.data || [];

  // Filter procedures
  const filteredProcedures = useMemo(() => {
    let filtered = [...procedures];
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.cdt_code?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.is_active === (statusFilter === "active"));
    }
    
    return filtered;
  }, [procedures, search, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalProcedures = procedures.length;
    const activeProcedures = procedures.filter(p => p.is_active).length;
    const avgPrice = procedures.reduce((sum, p) => sum + safeParseNumber(p.base_price), 0) / (totalProcedures || 1);
    const categoryCount = PROCEDURE_CATEGORIES.map(cat => ({
      ...cat,
      count: procedures.filter(p => p.category === cat.value).length
    })).filter(c => c.count > 0);
    
    return { totalProcedures, activeProcedures, avgPrice, categoryCount };
  }, [procedures]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: apiCreateProcedure,
    onSuccess: () => {
      toast.success("Procedure created successfully");
      refetch();
      setCreatingProcedure(false);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to create procedure")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiUpdateProcedure(id, data),
    onSuccess: () => {
      toast.success("Procedure updated successfully");
      refetch();
      setEditingProcedure(null);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to update procedure")
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteProcedure,
    onSuccess: () => {
      toast.success("Procedure deleted");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || "Failed to delete procedure")
  });

  const handleView = (procedure: any) => setViewingProcedure(procedure);
  const handleEdit = (procedure: any) => setEditingProcedure(procedure);
  const handleCreate = () => setCreatingProcedure(true);

  const handleSaveProcedure = (data: any) => {
    if (editingProcedure) {
      updateMutation.mutate({ id: editingProcedure.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (procedure: any) => {
    if (confirm(`Delete procedure "${procedure.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(procedure.id);
    }
  };

  const activeFilters = [
    search && `"${search}"`,
    categoryFilter !== "all" && `Category: ${PROCEDURE_CATEGORIES.find(c => c.value === categoryFilter)?.label}`,
    statusFilter !== "all" && `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`
  ].filter(Boolean);

  const InputStyle: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1.5px solid ${C.border}`, borderRadius: 9,
    background: C.bg, fontSize: 13, color: C.text,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box"
  };

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
          {label}
        </label>
        {children}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .procedure-row:hover{background:${C.purpleBg}!important;transform:translateX(2px);transition:all 0.15s}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
              <Stethoscope size={24} color={C.teal} /> Dental Procedures
            </h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              Manage procedure catalog, pricing, and service offerings
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1px solid ${showFilters ? C.purpleBorder : C.border}`, borderRadius: 9, background: showFilters ? C.purpleBg : C.bg, fontSize: 12, fontWeight: 500, color: showFilters ? C.purpleText : C.muted, cursor: "pointer" }}>
              <Filter size={13} /> Filters {activeFilters.length > 0 && <span style={{ background: C.purple, color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{activeFilters.length}</span>}
            </button>
            <button onClick={() => refetch()} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={handleCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(139,92,246,.3)" }}>
              <Plus size={15} /> Add Procedure
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Total Procedures", value: stats.totalProcedures, icon: Stethoscope, color: C.purple, bg: C.purpleBg, sub: "All services" },
            { label: "Active Procedures", value: stats.activeProcedures, icon: CheckCircle, color: C.green, bg: C.greenBg, sub: `${((stats.activeProcedures / stats.totalProcedures) * 100).toFixed(0)}% of total` },
            { label: "Average Price", value: formatCurrency(stats.avgPrice), icon: DollarSign, color: C.teal, bg: C.tealBg, sub: "Per procedure" },
            { label: "Categories", value: stats.categoryCount.length, icon: Tag, color: C.blue, bg: C.blueBg, sub: "Service categories" }
          ].map(k => (
            <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", transition: "all 0.2s" }}>
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
        {stats.categoryCount.length > 0 && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 12 }}>Procedures by Category</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {stats.categoryCount.map(cat => {
                const Icon = cat.icon;
                const percent = (cat.count / stats.totalProcedures) * 100;
                return (
                  <div key={cat.value} style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Icon size={14} color={cat.color} />
                      <span style={{ fontSize: 12, color: C.text }}>{cat.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: cat.color, marginLeft: "auto" }}>{cat.count}</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: 4, background: cat.color, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ background: C.bg, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, animation: "fadeUp .2s ease" }}>
            <Field label="Category">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                <option value="all">All Categories</option>
                {PROCEDURE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={() => { setCategoryFilter("all"); setStatusFilter("all"); setSearch(""); }} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgMuted, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, category, or CDT code..." className="inp" style={{ ...InputStyle, paddingLeft: 36, height: 42, fontSize: 14 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint }}><X size={14} /></button>}
          </div>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeFilters.map((f, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>
                {f}<X size={10} style={{ cursor: "pointer" }} onClick={() => { if (f.startsWith('"')) setSearch(""); else if (f.startsWith("Category")) setCategoryFilter("all"); else if (f.startsWith("Status")) setStatusFilter("all"); }} />
              </span>
            ))}
          </div>
        </div>

        {/* Procedures Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 2fr) minmax(120px, 1.2fr) minmax(100px, 0.8fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr)",
            padding: "12px 20px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`,
            gap: "8px"
          }}>
            {["Procedure Name", "Category", "Price", "Duration", "CDT Code", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: C.faint }}>Loading procedures...</p>
            </div>
          ) : filteredProcedures.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Stethoscope size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: C.faint }}>No procedures found</p>
            </div>
          ) : (
            filteredProcedures.map((row: any, i: number) => {
              const category = PROCEDURE_CATEGORIES.find(c => c.value === row.category);
              const Icon = category?.icon || Tag;
              
              return (
                <div
                  key={row.id}
                  className="procedure-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(200px, 2fr) minmax(120px, 1.2fr) minmax(100px, 0.8fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr)",
                    padding: "14px 20px",
                    borderBottom: i < filteredProcedures.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    transition: "all .1s",
                    cursor: "pointer",
                    gap: "8px",
                    background: !row.is_active ? C.bgMuted : "transparent"
                  }}
                  onClick={() => handleView(row)}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{row.name}</p>
                    {row.description && <p style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{row.description.substring(0, 50)}...</p>}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={14} color={category?.color} />
                    <span style={{ fontSize: 12, color: C.muted }}>{category?.label || row.category}</span>
                  </div>
                  
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.teal }}>{formatCurrency(row.base_price)}</span>
                  
                  <span style={{ fontSize: 12, color: C.muted }}>{row.duration_minutes} min</span>
                  
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: C.purple }}>{row.cdt_code || "—"}</span>
                  
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={(e) => { e.stopPropagation(); handleView(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.blue }}><Eye size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.amber }}><Edit size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.red }}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {filteredProcedures.length > 0 && (
          <div style={{ marginTop: 8, padding: "12px 20px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: C.muted }}>{filteredProcedures.length} procedure{filteredProcedures.length !== 1 ? 's' : ''} found</span>
            <div style={{ display: "flex", gap: 24 }}>
              <span>Price Range: <strong>{formatCurrency(Math.min(...filteredProcedures.map(p => p.base_price)))} - {formatCurrency(Math.max(...filteredProcedures.map(p => p.base_price)))}</strong></span>
              <span>Categories: <strong>{new Set(filteredProcedures.map(p => p.category)).size}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewProcedureModal open={!!viewingProcedure} onClose={() => setViewingProcedure(null)} procedure={viewingProcedure} />
      <CreateEditProcedureModal
        open={!!editingProcedure}
        onClose={() => setEditingProcedure(null)}
        procedure={editingProcedure}
        onSave={handleSaveProcedure}
        isLoading={updateMutation.isPending}
      />
      <CreateEditProcedureModal
        open={creatingProcedure}
        onClose={() => setCreatingProcedure(false)}
        onSave={handleSaveProcedure}
        isLoading={createMutation.isPending}
      />
    </>
  );
}