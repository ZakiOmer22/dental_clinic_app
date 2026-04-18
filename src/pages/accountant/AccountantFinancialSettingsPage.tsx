// src/pages/accountant/AccountantFinancialSettingsPage.jsx
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Settings, DollarSign, Percent, Calendar, CreditCard, Building,
    Globe, Shield, Bell, Lock, Users, FileText, Printer, Mail,
    Plus, Trash2, Edit, Save, X, RefreshCw, CheckCircle, AlertCircle,
    TrendingUp, TrendingDown, Wallet, Banknote, Landmark, Calculator,
    Receipt, FileSpreadsheet, PieChart, BarChart3, Activity,
    Sun, Moon, Monitor, Palette, Type, Layout, Grid, List,
    ChevronDown, ChevronRight, FolderOpen, Star, Heart, Award,
    Clock, AlertTriangle, Info, HelpCircle, ExternalLink, Copy
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils";
import {
    apiGetTaxRates,
    apiCreateTaxRate,
    apiUpdateTaxRate,
    apiDeleteTaxRate,
    apiGetFinancialSettings,
    apiUpdateFinancialSettings,
    apiGetPaymentTerms,
    apiCreatePaymentTerm,
    apiUpdatePaymentTerm,
    apiDeletePaymentTerm
} from "@/api/financial";
import { useAuthStore } from "@/app/store";
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
    indigo: "#6366f1", indigoBg: "#eef2ff", indigoText: "#4338ca",
    rose: "#f43f5e", roseBg: "#fff1f2", roseText: "#e11d48"
};

const CURRENCIES = [
    { code: "SOS", symbol: "Sh", name: "Somaliland Shilling" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" }
];

const FISCAL_YEARS = [
    { value: "jan-dec", label: "January - December" },
    { value: "apr-mar", label: "April - March" },
    { value: "jul-jun", label: "July - June" },
    { value: "oct-sep", label: "October - September" }
];

const INVOICE_TEMPLATES = [
    { id: "modern", name: "Modern", icon: Layout, color: C.purple },
    { id: "classic", name: "Classic", icon: FileText, color: C.teal },
    { id: "minimal", name: "Minimal", icon: Grid, color: C.gray },
    { id: "professional", name: "Professional", icon: Building, color: C.blue }
];

const TAX_TYPES = [
    { value: "sales", label: "Sales Tax" },
    { value: "vat", label: "VAT" },
    { value: "gst", label: "GST" }
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantFinancialSettingsPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [activeTab, setActiveTab] = useState("general");
    const [editingTax, setEditingTax] = useState(null);
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [editingTerm, setEditingTerm] = useState(null);
    const [showTermModal, setShowTermModal] = useState(false);

    // Fetch tax rates
    const { data: taxData, isLoading: taxLoading, refetch: refetchTaxes } = useQuery({
        queryKey: ["tax_rates"],
        queryFn: () => apiGetTaxRates()
    });
    const taxRates = taxData?.data || [];

    // Fetch payment terms
    const { data: termsData, isLoading: termsLoading, refetch: refetchTerms } = useQuery({
        queryKey: ["payment_terms"],
        queryFn: () => apiGetPaymentTerms()
    });
    const paymentTerms = termsData?.data || [];

    // Fetch financial settings
    const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
        queryKey: ["financial_settings"],
        queryFn: () => apiGetFinancialSettings()
    });
    const financialSettings = settingsData?.data || {};

    // Mutations
    const updateSettingsMutation = useMutation({
        mutationFn: (data) => apiUpdateFinancialSettings(data),
        onSuccess: (response) => {
            queryClient.setQueryData(["financial_settings"], response);
            toast.success("Settings updated successfully");
        },
        onError: (error) => toast.error(error?.response?.data?.error || "Failed to update settings")
    });

    const createTaxMutation = useMutation({
        mutationFn: (data) => apiCreateTaxRate(data),
        onSuccess: () => {
            refetchTaxes();
            toast.success("Tax rate created");
            setShowTaxModal(false);
            setEditingTax(null);
        },
        onError: (error) => toast.error(error?.response?.data?.error || "Failed to create tax rate")
    });

    const updateTaxMutation = useMutation({
        mutationFn: ({ id, data }) => apiUpdateTaxRate(id, data),
        onSuccess: () => {
            refetchTaxes();
            toast.success("Tax rate updated");
            setShowTaxModal(false);
            setEditingTax(null);
        },
        onError: (error) => toast.error(error?.response?.data?.error || "Failed to update tax rate")
    });

    const deleteTaxMutation = useMutation({
        mutationFn: (id) => apiDeleteTaxRate(id),
        onSuccess: () => {
            refetchTaxes();
            toast.success("Tax rate deleted");
        },
        onError: (error) => toast.error(error?.response?.data?.error || "Failed to delete tax rate")
    });

    const createTermMutation = useMutation({
        mutationFn: (data) => apiCreatePaymentTerm(data),
        onSuccess: () => {
            refetchTerms();
            toast.success("Payment term created");
            setShowTermModal(false);
            setEditingTerm(null);
        },
        onError: (error) => toast.error(error?.response?.data?.error || "Failed to create payment term")
    });

    const updateTermMutation = useMutation({
        mutationFn: ({ id, data }) => apiUpdatePaymentTerm(id, data),
        onSuccess: () => {
            refetchTerms();
            toast.success("Payment term updated");
            setShowTermModal(false);
            setEditingTerm(null);
        },
        onError: (error) => toast.error(error?.response?.data?.error || "Failed to update payment term")
    });

    const deleteTermMutation = useMutation({
        mutationFn: (id) => apiDeletePaymentTerm(id),
        onSuccess: () => {
            refetchTerms();
            toast.success("Payment term deleted");
        },
        onError: (error) => toast.error(error?.response?.data?.error || "Failed to delete payment term")
    });

    // Handlers - FIXED: Update flat object directly
    const handleUpdateSettings = (field, value) => {
        const updatedSettings = { ...financialSettings, [field]: value };
        updateSettingsMutation.mutate(updatedSettings);
    };

    const handleSaveTax = (taxData) => {
        if (editingTax) {
            updateTaxMutation.mutate({ id: editingTax.id, data: taxData });
        } else {
            createTaxMutation.mutate(taxData);
        }
    };

    const handleDeleteTax = (id) => {
        if (confirm("Are you sure you want to delete this tax rate?")) {
            deleteTaxMutation.mutate(id);
        }
    };

    const handleSaveTerm = (termData) => {
        if (editingTerm) {
            updateTermMutation.mutate({ id: editingTerm.id, data: termData });
        } else {
            createTermMutation.mutate(termData);
        }
    };

    const handleDeleteTerm = (id) => {
        if (confirm("Are you sure you want to delete this payment term?")) {
            deleteTermMutation.mutate(id);
        }
    };

    const InputStyle = {
        width: "100%", height: 38, padding: "0 12px",
        border: `1.5px solid ${C.border}`, borderRadius: 9,
        background: C.bg, fontSize: 13, color: C.text,
        fontFamily: "inherit", outline: "none", boxSizing: "border-box"
    };

    function Field({ label, required, children }) {
        return (
            <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    {label}{required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
                </label>
                {children}
            </div>
        );
    }

    // Tax Modal Component
    function TaxModal({ open, onClose, tax, onSave, isLoading }) {
        const [form, setForm] = useState({
            name: "",
            rate: 0,
            type: "sales",
            is_active: true
        });

        useEffect(() => {
            if (tax && open) {
                setForm({
                    name: tax.name || "",
                    rate: tax.rate || 0,
                    type: tax.type || "sales",
                    is_active: tax.is_active !== undefined ? tax.is_active : true
                });
            } else if (open && !tax) {
                setForm({ name: "", rate: 0, type: "sales", is_active: true });
            }
        }, [tax, open]);

        if (!open) return null;

        return (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
                <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: 500, animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{tax ? "Edit Tax Rate" : "Add Tax Rate"}</h3>
                        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer" }}><X size={14} /></button>
                    </div>
                    <div style={{ padding: 20 }}>
                        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
                            <Field label="Tax Name" required>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Sales Tax, VAT" style={InputStyle} />
                            </Field>
                            <Field label="Rate (%)" required>
                                <input type="number" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} placeholder="0.00" style={InputStyle} />
                            </Field>
                            <Field label="Tax Type">
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={InputStyle}>
                                    {TAX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </Field>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }}>
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                <span style={{ fontSize: 12 }}>Active</span>
                            </label>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                                <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                                <button type="submit" disabled={isLoading} style={{ padding: "8px 16px", borderRadius: 8, background: C.teal, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Payment Term Modal
    function TermModal({ open, onClose, term, onSave, isLoading }) {
        const [form, setForm] = useState({
            name: "",
            days: 30,
            discount_percent: 0,
            discount_days: 0,
            is_default: false
        });

        useEffect(() => {
            if (term && open) {
                setForm({
                    name: term.name || "",
                    days: term.days || 30,
                    discount_percent: term.discount_percent || 0,
                    discount_days: term.discount_days || 0,
                    is_default: term.is_default || false
                });
            } else if (open && !term) {
                setForm({ name: "", days: 30, discount_percent: 0, discount_days: 0, is_default: false });
            }
        }, [term, open]);

        if (!open) return null;

        return (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
                <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: 500, animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{term ? "Edit Payment Term" : "Add Payment Term"}</h3>
                        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer" }}><X size={14} /></button>
                    </div>
                    <div style={{ padding: 20 }}>
                        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
                            <Field label="Term Name" required>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Net 30" style={InputStyle} />
                            </Field>
                            <Field label="Due Days" required>
                                <input type="number" value={form.days} onChange={e => setForm({ ...form, days: parseInt(e.target.value) || 0 })} placeholder="30" style={InputStyle} />
                            </Field>
                            <Field label="Early Discount (%)">
                                <input type="number" step="0.01" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: parseFloat(e.target.value) || 0 })} placeholder="0" style={InputStyle} />
                            </Field>
                            <Field label="Discount Valid Days">
                                <input type="number" value={form.discount_days} onChange={e => setForm({ ...form, discount_days: parseInt(e.target.value) || 0 })} placeholder="0" style={InputStyle} />
                            </Field>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }}>
                                <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
                                <span style={{ fontSize: 12 }}>Set as default</span>
                            </label>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                                <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                                <button type="submit" disabled={isLoading} style={{ padding: "8px 16px", borderRadius: 8, background: C.teal, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "general", label: "General", icon: Settings },
        { id: "taxes", label: "Tax Rates", icon: Percent },
        { id: "payment", label: "Payment Terms", icon: CreditCard },
        { id: "invoicing", label: "Invoicing", icon: FileText },
        { id: "accounting", label: "Accounting", icon: Calculator }
    ];

    if (settingsLoading) {
        return <div style={{ padding: 40, textAlign: "center" }}>Loading settings...</div>;
    }

    return (
        <>
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                .setting-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.08);transition:all 0.2s}
                .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
            `}</style>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
                            <Settings size={24} color={C.teal} /> Financial Settings
                        </h1>
                        <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                            Configure tax rates, payment terms, and accounting preferences
                        </p>
                    </div>
                    <button onClick={() => { refetchSettings(); refetchTaxes(); refetchTerms(); }} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "10px 20px", borderRadius: "10px 10px 0 0",
                                    background: isActive ? C.bg : "transparent",
                                    border: isActive ? `1px solid ${C.border}` : "none",
                                    borderBottom: isActive ? "none" : `1px solid transparent`,
                                    color: isActive ? C.teal : C.muted,
                                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                                    cursor: "pointer", transition: "all 0.15s"
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>

                    {/* General Settings */}
                    {activeTab === "general" && (
                        <div style={{ display: "grid", gap: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Currency & Localization</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    <Field label="Default Currency">
                                        <select value={financialSettings.currency || "SOS"} onChange={(e) => handleUpdateSettings("currency", e.target.value)} style={InputStyle}>
                                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Date Format">
                                        <select value={financialSettings.date_format || "DD/MM/YYYY"} onChange={(e) => handleUpdateSettings("date_format", e.target.value)} style={InputStyle}>
                                            <option>DD/MM/YYYY</option>
                                            <option>MM/DD/YYYY</option>
                                            <option>YYYY-MM-DD</option>
                                        </select>
                                    </Field>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Fiscal Year</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    <Field label="Fiscal Year Start">
                                        <select value={financialSettings.fiscal_year || "jan-dec"} onChange={(e) => handleUpdateSettings("fiscal_year", e.target.value)} style={InputStyle}>
                                            {FISCAL_YEARS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Current Financial Year">
                                        <input type="text" value={financialSettings.current_fy || "2024"} readOnly style={{ ...InputStyle, background: C.bgMuted }} />
                                    </Field>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Rounding & Precision</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    <Field label="Decimal Places">
                                        <select value={financialSettings.decimal_places || 2} onChange={(e) => handleUpdateSettings("decimal_places", parseInt(e.target.value))} style={InputStyle}>
                                            <option value={0}>0</option>
                                            <option value={2}>2</option>
                                            <option value={4}>4</option>
                                        </select>
                                    </Field>
                                    <Field label="Rounding Method">
                                        <select value={financialSettings.rounding || "half_up"} onChange={(e) => handleUpdateSettings("rounding", e.target.value)} style={InputStyle}>
                                            <option value="half_up">Half Up</option>
                                            <option value="half_down">Half Down</option>
                                            <option value="ceil">Ceiling</option>
                                            <option value="floor">Floor</option>
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax Rates */}
                    {activeTab === "taxes" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Tax Rates</h3>
                                <button onClick={() => { setEditingTax(null); setShowTaxModal(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: C.teal, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                    <Plus size={14} /> Add Tax Rate
                                </button>
                            </div>

                            {taxLoading ? (
                                <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
                            ) : taxRates.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 40, color: C.faint }}>No tax rates configured</div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgMuted }}>
                                                <th style={{ padding: 12, textAlign: "left", fontSize: 12 }}>Name</th>
                                                <th style={{ padding: 12, textAlign: "left", fontSize: 12 }}>Rate</th>
                                                <th style={{ padding: 12, textAlign: "left", fontSize: 12 }}>Type</th>
                                                <th style={{ padding: 12, textAlign: "left", fontSize: 12 }}>Status</th>
                                                <th style={{ padding: 12, textAlign: "right", fontSize: 12 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {taxRates.map(tax => (
                                                <tr key={tax.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                                                    <td style={{ padding: 12, fontSize: 13, fontWeight: 500 }}>{tax.name}</td>
                                                    <td style={{ padding: 12, fontSize: 13 }}>{tax.rate}%</td>
                                                    <td style={{ padding: 12, fontSize: 13 }}>{tax.type?.toUpperCase()}</td>
                                                    <td style={{ padding: 12 }}>
                                                        <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, background: tax.is_active ? C.greenBg : C.redBg, color: tax.is_active ? C.greenText : C.redText }}>
                                                            {tax.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: 12, textAlign: "right" }}>
                                                        <button onClick={() => { setEditingTax(tax); setShowTaxModal(true); }} style={{ padding: 4, marginRight: 8, background: "none", border: "none", cursor: "pointer", color: C.blue }}><Edit size={14} /></button>
                                                        <button onClick={() => handleDeleteTax(tax.id)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Terms */}
                    {activeTab === "payment" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Payment Terms</h3>
                                <button onClick={() => { setEditingTerm(null); setShowTermModal(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: C.teal, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                    <Plus size={14} /> Add Payment Term
                                </button>
                            </div>

                            {termsLoading ? (
                                <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
                            ) : paymentTerms.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 40, color: C.faint }}>No payment terms configured</div>
                            ) : (
                                <div style={{ display: "grid", gap: 12 }}>
                                    {paymentTerms.map(term => (
                                        <div key={term.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, border: `1px solid ${C.border}`, borderRadius: 12, background: term.is_default ? C.tealBg : C.bg }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{term.name}</span>
                                                    {term.is_default && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: C.teal, color: "white" }}>Default</span>}
                                                </div>
                                                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                                                    Due in {term.days} days
                                                    {term.discount_percent > 0 && ` • ${term.discount_percent}% discount if paid within ${term.discount_days} days`}
                                                </p>
                                            </div>
                                            <div>
                                                <button onClick={() => { setEditingTerm(term); setShowTermModal(true); }} style={{ padding: 6, marginRight: 8, background: "none", border: "none", cursor: "pointer", color: C.blue }}><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteTerm(term.id)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invoicing Settings */}
                    {activeTab === "invoicing" && (
                        <div style={{ display: "grid", gap: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Invoice Settings</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    <Field label="Invoice Prefix">
                                        <input type="text" value={financialSettings.invoice_prefix || "INV-"} onChange={(e) => handleUpdateSettings("invoice_prefix", e.target.value)} placeholder="INV-" style={InputStyle} />
                                    </Field>
                                    <Field label="Next Invoice Number">
                                        <input type="number" value={financialSettings.next_invoice_number || 1001} onChange={(e) => handleUpdateSettings("next_invoice_number", parseInt(e.target.value))} style={InputStyle} />
                                    </Field>
                                    <Field label="Default Due Days">
                                        <input type="number" value={financialSettings.default_due_days || 30} onChange={(e) => handleUpdateSettings("default_due_days", parseInt(e.target.value))} style={InputStyle} />
                                    </Field>
                                    <Field label="Late Fee (%)">
                                        <input type="number" step="0.01" value={financialSettings.late_fee_percent || 0} onChange={(e) => handleUpdateSettings("late_fee_percent", parseFloat(e.target.value))} style={InputStyle} />
                                    </Field>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Invoice Template</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                                    {INVOICE_TEMPLATES.map(template => {
                                        const Icon = template.icon;
                                        const isSelected = financialSettings.invoice_template === template.id;
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => handleUpdateSettings("invoice_template", template.id)}
                                                style={{
                                                    padding: 16, border: `2px solid ${isSelected ? C.teal : C.border}`, borderRadius: 12,
                                                    background: isSelected ? C.tealBg : C.bg, cursor: "pointer", textAlign: "center"
                                                }}
                                            >
                                                <Icon size={24} color={template.color} style={{ marginBottom: 8 }} />
                                                <p style={{ fontSize: 12, fontWeight: 500, color: isSelected ? C.teal : C.text }}>{template.name}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Accounting Settings */}
                    {activeTab === "accounting" && (
                        <div style={{ display: "grid", gap: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Chart of Accounts</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    <Field label="Default Revenue Account">
                                        <input type="text" value={financialSettings.revenue_account || "4000"} onChange={(e) => handleUpdateSettings("revenue_account", e.target.value)} style={InputStyle} />
                                    </Field>
                                    <Field label="Default Expense Account">
                                        <input type="text" value={financialSettings.expense_account || "5000"} onChange={(e) => handleUpdateSettings("expense_account", e.target.value)} style={InputStyle} />
                                    </Field>
                                    <Field label="Default Asset Account">
                                        <input type="text" value={financialSettings.asset_account || "1000"} onChange={(e) => handleUpdateSettings("asset_account", e.target.value)} style={InputStyle} />
                                    </Field>
                                    <Field label="Default Liability Account">
                                        <input type="text" value={financialSettings.liability_account || "2000"} onChange={(e) => handleUpdateSettings("liability_account", e.target.value)} style={InputStyle} />
                                    </Field>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Accounting Method</h3>
                                <div style={{ display: "flex", gap: 16 }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                        <input type="radio" name="method" value="accrual" checked={financialSettings.accounting_method === "accrual"} onChange={() => handleUpdateSettings("accounting_method", "accrual")} />
                                        <span style={{ fontSize: 13 }}>Accrual Basis</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                        <input type="radio" name="method" value="cash" checked={financialSettings.accounting_method === "cash"} onChange={() => handleUpdateSettings("accounting_method", "cash")} />
                                        <span style={{ fontSize: 13 }}>Cash Basis</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <TaxModal open={showTaxModal} onClose={() => { setShowTaxModal(false); setEditingTax(null); }} tax={editingTax} onSave={handleSaveTax} isLoading={createTaxMutation.isPending || updateTaxMutation.isPending} />
            <TermModal open={showTermModal} onClose={() => { setShowTermModal(false); setEditingTerm(null); }} term={editingTerm} onSave={handleSaveTerm} isLoading={createTermMutation.isPending || updateTermMutation.isPending} />
        </>
    );
}