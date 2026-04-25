// ══════════════════════════════════════════════════════════════════════════════
// src/pages/InventoryPage.tsx
// ══════════════════════════════════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Search, X, AlertTriangle, Package,
  TrendingDown, RefreshCw, Filter, ChevronDown, ChevronUp,
  DollarSign, Edit, Eye, Clock, History
} from "lucide-react";
import {
  apiGetInventory,
  apiCreateInventoryItem,
  apiGetLowStock,
  apiRecordInventoryTransaction
} from "@/api/inventory";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

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

const CATS = ["Consumables", "Medications", "Equipment", "PPE", "Instruments", "Lab Materials", "Office Supplies", "Other"];
const TX_TYPES = [
  { value: "received", label: "Stock Received", icon: Plus, color: C.teal },
  { value: "used", label: "Used in Treatment", icon: TrendingDown, color: C.blue },
  { value: "wasted", label: "Wasted / Expired", icon: AlertTriangle, color: C.red },
  { value: "adjusted", label: "Manual Adjustment", icon: RefreshCw, color: C.amber }
];

const E_ITEM = {
  name: "",
  sku: "",
  category: "Consumables",
  unit: "",
  unitCost: "",
  minimumStockLevel: "5",
  supplierName: "",
  supplierContact: "",
  storageLocation: "",
  notes: ""
};

const E_TX = {
  itemId: "",
  transactionType: "received",
  quantity: "",
  reason: ""
};

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
          <span style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,.3)",
            borderTopColor: "white",
            animation: "spin .7s linear infinite",
            display: "inline-block"
          }} />
          Saving…
        </>
      ) : children}
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
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0
        }}>
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

// Detail View Component
function InventoryDetail({ item, onClose }: { item: any; onClose: () => void }) {
  const isLow = item.quantity_in_stock <= item.minimum_stock_level;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: C.bgMuted,
        borderRadius: 12,
        border: `1px solid ${C.border}`
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: isLow ? C.redBg : C.tealBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Package size={20} color={isLow ? C.red : C.teal} />
        </div>
        <div>
          <span style={{ fontSize: 11, color: C.faint }}>ITEM #{item.id}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{item.name}</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Category</p>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 100,
            background: C.bgMuted,
            color: C.muted,
            border: `1px solid ${C.border}`
          }}>
            {item.category || "—"}
          </span>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>SKU</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "monospace" }}>{item.sku || "—"}</p>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Current Stock</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: isLow ? C.redText : C.text }}>
            {item.quantity_in_stock} <span style={{ fontSize: 12, color: C.faint }}>{item.unit || ""}</span>
          </p>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Min Stock Level</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.minimum_stock_level}</p>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Unit Cost</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            ${parseFloat(item.unit_cost || 0).toFixed(2)}
          </p>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Total Value</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            ${(parseFloat(item.quantity_in_stock || 0) * parseFloat(item.unit_cost || 0)).toFixed(2)}
          </p>
        </div>
      </div>

      {item.supplier_name && (
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Supplier</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.supplier_name}</p>
          {item.supplier_contact && (
            <p style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{item.supplier_contact}</p>
          )}
        </div>
      )}

      {item.storage_location && (
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Storage Location</p>
          <p style={{ fontSize: 13, color: C.text }}>{item.storage_location}</p>
        </div>
      )}

      {item.notes && (
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Notes</p>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{item.notes}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={onClose}
          style={{
            padding: "10px 16px",
            borderRadius: 9,
            border: `1px solid ${C.border}`,
            background: C.bg,
            fontSize: 13,
            fontWeight: 500,
            color: C.muted,
            cursor: "pointer",
            fontFamily: "inherit",
            flex: 1
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [txModal, setTxModal] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState(E_ITEM);
  const [txForm, setTxForm] = useState(E_TX);

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", catFilter, lowOnly],
    queryFn: () => apiGetInventory({
      category: catFilter !== "all" ? catFilter : undefined,
      lowstock: lowOnly ? "true" : undefined
    })
  });

  const { data: alertsData } = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: apiGetLowStock
  });

  const items: any[] = data?.data ?? data ?? [];
  const alerts: any[] = alertsData ?? [];

  const filtered = useMemo(() => items.filter(it =>
    !search || it.name?.toLowerCase().includes(search.toLowerCase()) ||
    it.sku?.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const totalValue = items.reduce((a, it) =>
    a + (parseFloat(it.unit_cost || 0) * parseFloat(it.quantity_in_stock || 0)), 0
  );

  const createMut = useMutation({
    mutationFn: apiCreateInventoryItem,
    onSuccess: () => {
      toast.success("Item added");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setAddModal(false);
      setForm(E_ITEM);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed")
  });

  const txMut = useMutation({
    mutationFn: apiRecordInventoryTransaction,
    onSuccess: () => {
      toast.success("Transaction recorded");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setTxModal(null);
      setTxForm(E_TX);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed")
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Item name required");
      return;
    }
    createMut.mutate({
      ...form,
      unitCost: form.unitCost ? parseFloat(form.unitCost) : 0,
      minimumStockLevel: parseInt(form.minimumStockLevel) || 5
    });
  };

  const handleTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.quantity) {
      toast.error("Quantity required");
      return;
    }
    txMut.mutate({
      itemId: txModal.id,
      transactionType: txForm.transactionType,
      quantity: parseInt(txForm.quantity),
      reason: txForm.reason,
      userId: user?.id
    });
  };

  const handleRowClick = (row: any, e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if ((e.target as HTMLElement).closest('.del-btn') ||
      (e.target as HTMLElement).closest('.act-btn')) return;

    setExpandedId(expandedId === row.id ? null : row.id);
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const tf = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTxForm(p => ({ ...p, [k]: e.target.value }));

  const stockPct = (it: any) => {
    const max = it.maximum_stock_level || 100;
    return Math.min(100, Math.round((it.quantity_in_stock / max) * 100));
  };

  const stockColor = (it: any) =>
    it.quantity_in_stock <= it.minimum_stock_level ? C.red :
      it.quantity_in_stock <= (it.minimum_stock_level * 1.5) ? C.amber : C.teal;

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Inventory</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              {items.length} items · {alerts.length} low stock alerts
            </p>
          </div>
          <button
            onClick={() => setAddModal(true)}
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
            onMouseEnter={e => e.currentTarget.style.background = "#0a8a66"}
            onMouseLeave={e => e.currentTarget.style.background = C.teal}
          >
            <Plus size={15} />
            Add Item
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Total Items", value: items.length, icon: Package, color: C.teal, sub: "Active stock items" },
            {
              label: "Low Stock",
              value: alerts.length,
              icon: AlertTriangle,
              color: alerts.length > 0 ? C.red : C.teal,
              sub: alerts.length > 0 ? "Needs restocking" : "All good"
            },
            {
              label: "Total Value",
              value: `$${totalValue.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
              icon: TrendingDown,
              color: C.blue,
              sub: "Stock on hand"
            },
            {
              label: "Categories",
              value: [...new Set(items.map(i => i.category))].length,
              icon: Filter,
              color: C.purple,
              sub: "Item categories"
            }
          ].map(k => (
            <div key={k.label} style={{
              background: C.bg,
              border: `1px solid ${k.label === "Low Stock" && alerts.length > 0 ? C.redBorder : C.border}`,
              borderRadius: 12,
              padding: "15px 16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{k.label}</span>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: k.color + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <k.icon size={13} color={k.color} strokeWidth={1.8} />
                </div>
              </div>
              <p style={{
                fontSize: 22,
                fontWeight: 700,
                color: k.label === "Low Stock" && alerts.length > 0 ? C.redText : C.text,
                letterSpacing: "-.03em",
                lineHeight: 1
              }}>
                {k.value}
              </p>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Low stock alert bar */}
        {alerts.length > 0 && (
          <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={14} color={C.redText} />
              <p style={{ fontSize: 13, fontWeight: 600, color: C.redText }}>{alerts.length} items need restocking</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {alerts.slice(0, 8).map((a: any) => (
                <span
                  key={a.id}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: C.bg,
                    color: C.redText,
                    border: `1px solid ${C.redBorder}`
                  }}
                >
                  {a.name} ({a.quantity_in_stock} left)
                </span>
              ))}
              {alerts.length > 8 && (
                <span style={{ fontSize: 11, color: C.redText }}>+{alerts.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 260 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search item name or SKU…"
              className="inp"
              style={{ ...IS, paddingLeft: 30, height: 34 }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
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
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[{ value: "all", label: "All" }, ...CATS.map(c => ({ value: c, label: c }))].map(t => {
              const active = catFilter === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setCatFilter(t.value)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${active ? C.tealBorder : C.border}`,
                    background: active ? C.tealBg : C.bg,
                    color: active ? C.tealText : C.muted,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setLowOnly(v => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              border: `1px solid ${lowOnly ? C.redBorder : C.border}`,
              background: lowOnly ? C.redBg : C.bg,
              color: lowOnly ? C.redText : C.muted,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            <AlertTriangle size={11} />
            {lowOnly ? "Showing low stock" : "Low stock only"}
          </button>
        </div>

        {/* Table with clickable rows */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 100px 90px 80px 80px 130px 120px 90px 70px",
            padding: "9px 18px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`
          }}>
            {["Item", "Category", "SKU", "Stock", "Min", "Stock Level", "Unit Cost", "Supplier", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>
                {h}
              </span>
            ))}
          </div>

          {isLoading && (
            <div style={{ padding: "40px 18px", textAlign: "center" }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${C.border}`,
                borderTopColor: C.teal,
                animation: "spin .7s linear infinite",
                margin: "0 auto 8px"
              }} />
              <p style={{ fontSize: 13, color: C.faint }}>Loading…</p>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div style={{ padding: "48px 18px", textAlign: "center" }}>
              <Package size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} />
              <p style={{ fontSize: 13, color: C.faint }}>No items found</p>
            </div>
          )}

          {!isLoading && filtered.map((row: any, i: number) => {
            const isLow = row.quantity_in_stock <= row.minimum_stock_level;
            const sc = stockColor(row);
            const pct = stockPct(row);
            const isExpanded = expandedId === row.id;

            return (
              <div key={row.id}>
                <div
                  className="t-row"
                  onClick={(e) => handleRowClick(row, e)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 100px 90px 80px 80px 130px 120px 90px 70px",
                    padding: "11px 18px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    transition: "background .1s",
                    background: isLow ? "#fff8f8" : (isExpanded ? C.bgMuted : C.bg)
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {row.name}
                      </p>
                      {isLow && <AlertTriangle size={11} color={C.red} />}
                      {isExpanded ? (
                        <ChevronUp size={12} color={C.faint} />
                      ) : (
                        <ChevronDown size={12} color={C.faint} />
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: C.faint }}>{row.storage_location || ""}</p>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 100,
                    background: C.bgMuted,
                    color: C.muted,
                    border: `1px solid ${C.border}`,
                    whiteSpace: "nowrap"
                  }}>
                    {row.category || "—"}
                  </span>
                  <span style={{ fontSize: 11, color: C.faint, fontFamily: "monospace" }}>{row.sku || "—"}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isLow ? C.redText : C.text }}>
                    {row.quantity_in_stock}
                    <span style={{ fontSize: 10, fontWeight: 400, color: C.faint, marginLeft: 2 }}>{row.unit || ""}</span>
                  </span>
                  <span style={{ fontSize: 12, color: C.muted }}>{row.minimum_stock_level}</span>
                  <div>
                    <div style={{ height: 4, background: "#edf1ef", borderRadius: 2, overflow: "hidden", marginBottom: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: sc, borderRadius: 2, transition: "width .4s" }} />
                    </div>
                    <p style={{ fontSize: 9, color: sc }}>{pct}% of capacity</p>
                  </div>
                  <span style={{ fontSize: 12, color: C.text }}>${parseFloat(row.unit_cost || 0).toFixed(2)}</span>
                  <span style={{ fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.supplier_name || "—"}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IBtn
                      onClick={() => {
                        setTxModal(row);
                        setTxForm({ ...E_TX, itemId: String(row.id) });
                      }}
                      title="Record transaction"
                    >
                      <RefreshCw size={11} />
                    </IBtn>
                    
                  </div>
                </div>

                {/* Expanded detail row */}
                {isExpanded && (
                  <div
                    className="detail-row"
                    style={{
                      padding: "20px 18px",
                      background: C.bgMuted,
                      borderTop: `1px solid ${C.border}`,
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none"
                    }}
                  >
                    <InventoryDetail item={row} onClose={() => setExpandedId(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Inventory Item" size="lg">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <F label="Item Name" req>
                <input
                  value={form.name}
                  onChange={f("name")}
                  placeholder="e.g. Disposable Gloves (Medium)"
                  className="inp"
                  style={IS}
                />
              </F>
            </div>
            <F label="Category" req>
              <select value={form.category} onChange={f("category")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="SKU / Item Code">
              <input value={form.sku} onChange={f("sku")} placeholder="e.g. GL-M-001" className="inp" style={IS} />
            </F>
            <F label="Unit (e.g. box, piece, ml)">
              <input value={form.unit} onChange={f("unit")} placeholder="box" className="inp" style={IS} />
            </F>
            <F label="Unit Cost ($)">
              <input type="number" step="0.01" value={form.unitCost} onChange={f("unitCost")} placeholder="0.00" className="inp" style={IS} />
            </F>
            <F label="Minimum Stock Level" req>
              <input type="number" value={form.minimumStockLevel} onChange={f("minimumStockLevel")} placeholder="5" className="inp" style={IS} />
            </F>
            <F label="Supplier Name">
              <input value={form.supplierName} onChange={f("supplierName")} placeholder="Supplier company name" className="inp" style={IS} />
            </F>
            <F label="Supplier Contact">
              <input value={form.supplierContact} onChange={f("supplierContact")} placeholder="Phone or email" className="inp" style={IS} />
            </F>
            <div style={{ gridColumn: "1/-1" }}>
              <F label="Storage Location">
                <input value={form.storageLocation} onChange={f("storageLocation")} placeholder="e.g. Cabinet A, Shelf 2" className="inp" style={IS} />
              </F>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <GBtn onClick={() => setAddModal(false)}>Cancel</GBtn>
            <SBtn loading={createMut.isPending}><Package size={14} />Add Item</SBtn>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal open={!!txModal} onClose={() => setTxModal(null)} title={`Stock Transaction — ${txModal?.name ?? ""}`} size="sm">
        {txModal && (
          <form onSubmit={handleTx} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.bgMuted, borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Current stock</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: stockColor(txModal) }}>
                  {txModal.quantity_in_stock} {txModal.unit || ""}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted }}>Minimum level</span>
                <span style={{ fontSize: 12, color: C.faint }}>{txModal.minimum_stock_level}</span>
              </div>
            </div>
            <F label="Transaction Type" req>
              <select value={txForm.transactionType} onChange={tf("transactionType")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </F>
            <F label="Quantity" req>
              <input type="number" min="1" value={txForm.quantity} onChange={tf("quantity")} placeholder="Enter quantity" className="inp" style={IS} />
            </F>
            <F label="Reason / Notes">
              <input value={txForm.reason} onChange={tf("reason")} placeholder="Optional reason…" className="inp" style={IS} />
            </F>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
              <GBtn onClick={() => setTxModal(null)}>Cancel</GBtn>
              <SBtn loading={txMut.isPending}><RefreshCw size={14} />Record</SBtn>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}