// src/pages/accountant/inventory/AccountantInventoryValuationPage.jsx
import { useState, useMemo } from "react";
import {
  Search, Filter, X, RefreshCw,
  CheckCircle, DollarSign, Download, Tag,
  TrendingUp, TrendingDown, Scale, Calculator as CalcIcon,
  Package, Boxes, XCircle
} from "lucide-react";
import { formatCurrency } from "@/utils";
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
  indigo: "#6366f1", indigoBg: "#eef2ff", indigoText: "#4338ca"
};

const VALUATION_METHODS = [
  { value: "fifo", label: "FIFO (First In, First Out)", icon: TrendingUp, color: C.teal },
  { value: "lifo", label: "LIFO (Last In, First Out)", icon: TrendingDown, color: C.amber },
  { value: "weighted_average", label: "Weighted Average", icon: Scale, color: C.purple },
  { value: "specific_id", label: "Specific Identification", icon: Tag, color: C.blue }
];

// Mock inventory data
const MOCK_INVENTORY = [
  { id: 1, name: "Dental Chair", sku: "DEN-001", category: "Equipment", current_quantity: 5, unit_cost: 2500, location: "Main Storage" },
  { id: 2, name: "Surgical Gloves", sku: "SUP-002", category: "Supplies", current_quantity: 500, unit_cost: 0.5, location: "Supply Room" },
  { id: 3, name: "Dental Implants", sku: "IMP-003", category: "Implants", current_quantity: 25, unit_cost: 150, location: "Cold Storage" },
  { id: 4, name: "Anesthetic", sku: "MED-004", category: "Medications", current_quantity: 100, unit_cost: 8, location: "Pharmacy" },
  { id: 5, name: "X-Ray Sensors", sku: "EQU-005", category: "Equipment", current_quantity: 8, unit_cost: 1200, location: "Imaging Dept" },
  { id: 6, name: "Sterilization Pouches", sku: "SUP-006", category: "Supplies", current_quantity: 1000, unit_cost: 0.15, location: "Supply Room" },
  { id: 7, name: "Composite Resin", sku: "MAT-007", category: "Materials", current_quantity: 50, unit_cost: 45, location: "Materials Lab" },
  { id: 8, name: "Diamond Burs", sku: "TOOL-008", category: "Tools", current_quantity: 120, unit_cost: 12, location: "Tool Crib" }
];

// Mock movements data for FIFO/LIFO calculations
const MOCK_MOVEMENTS = {
  1: [ // Dental Chair
    { type: 'purchase', quantity: 3, unit_cost: 2400, date: '2024-01-15' },
    { type: 'purchase', quantity: 2, unit_cost: 2600, date: '2024-02-20' }
  ],
  2: [ // Surgical Gloves
    { type: 'purchase', quantity: 300, unit_cost: 0.45, date: '2024-01-10' },
    { type: 'purchase', quantity: 200, unit_cost: 0.55, date: '2024-02-15' }
  ],
  3: [ // Dental Implants
    { type: 'purchase', quantity: 15, unit_cost: 145, date: '2024-01-05' },
    { type: 'purchase', quantity: 10, unit_cost: 155, date: '2024-02-10' }
  ],
  4: [ // Anesthetic
    { type: 'purchase', quantity: 100, unit_cost: 8, date: '2024-01-20' }
  ],
  5: [ // X-Ray Sensors
    { type: 'purchase', quantity: 8, unit_cost: 1200, date: '2024-01-25' }
  ],
  6: [ // Sterilization Pouches
    { type: 'purchase', quantity: 1000, unit_cost: 0.15, date: '2024-01-30' }
  ],
  7: [ // Composite Resin
    { type: 'purchase', quantity: 30, unit_cost: 42, date: '2024-01-12' },
    { type: 'purchase', quantity: 20, unit_cost: 48, date: '2024-02-18' }
  ],
  8: [ // Diamond Burs
    { type: 'purchase', quantity: 120, unit_cost: 12, date: '2024-01-08' }
  ]
};

// Helper functions for valuation calculations
const calculateFIFO = (movements, quantity, currentPrice) => {
  let remainingQty = quantity;
  let totalValue = 0;
  const sortedMovements = [...movements].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  for (const move of sortedMovements) {
    if (move.type === 'purchase' && remainingQty > 0) {
      const qtyToTake = Math.min(move.quantity, remainingQty);
      totalValue += qtyToTake * move.unit_cost;
      remainingQty -= qtyToTake;
    }
  }
  
  if (remainingQty > 0) {
    totalValue += remainingQty * currentPrice;
  }
  
  return totalValue;
};

const calculateLIFO = (movements, quantity, currentPrice) => {
  let remainingQty = quantity;
  let totalValue = 0;
  const sortedMovements = [...movements].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  for (const move of sortedMovements) {
    if (move.type === 'purchase' && remainingQty > 0) {
      const qtyToTake = Math.min(move.quantity, remainingQty);
      totalValue += qtyToTake * move.unit_cost;
      remainingQty -= qtyToTake;
    }
  }
  
  if (remainingQty > 0) {
    totalValue += remainingQty * currentPrice;
  }
  
  return totalValue;
};

const calculateWeightedAverage = (movements, quantity) => {
  let totalUnits = 0;
  let totalCost = 0;
  
  for (const move of movements) {
    if (move.type === 'purchase') {
      totalUnits += move.quantity;
      totalCost += move.quantity * move.unit_cost;
    }
  }
  
  const avgCost = totalUnits > 0 ? totalCost / totalUnits : 0;
  return quantity * avgCost;
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AccountantInventoryValuationPage() {
  const [search, setSearch] = useState("");
  const [valuationMethod, setValuationMethod] = useState("weighted_average");
  const [showDetails, setShowDetails] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(MOCK_INVENTORY.map(item => item.category))];
  }, []);

  // Calculate valuation for each item based on selected method
  const valuedInventory = useMemo(() => {
    return MOCK_INVENTORY.map(item => {
      const itemMovements = MOCK_MOVEMENTS[item.id] || [];
      const currentQuantity = item.current_quantity;
      const currentPrice = item.unit_cost;
      
      let valuationValue = 0;
      
      switch (valuationMethod) {
        case "fifo":
          valuationValue = calculateFIFO(itemMovements, currentQuantity, currentPrice);
          break;
        case "lifo":
          valuationValue = calculateLIFO(itemMovements, currentQuantity, currentPrice);
          break;
        case "weighted_average":
          valuationValue = calculateWeightedAverage(itemMovements, currentQuantity);
          break;
        case "specific_id":
          valuationValue = currentQuantity * currentPrice;
          break;
        default:
          valuationValue = currentQuantity * currentPrice;
      }
      
      return {
        ...item,
        valuationValue,
        currentQuantity,
        currentPrice,
        movements: itemMovements
      };
    });
  }, [valuationMethod]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    let filtered = [...valuedInventory];
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.sku?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }
    
    filtered = filtered.filter(i => i.currentQuantity > 0);
    
    return filtered;
  }, [valuedInventory, search, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalItems = filteredInventory.length;
    const totalQuantity = filteredInventory.reduce((sum, i) => sum + i.currentQuantity, 0);
    const totalValuation = filteredInventory.reduce((sum, i) => sum + i.valuationValue, 0);
    const avgUnitValue = totalQuantity > 0 ? totalValuation / totalQuantity : 0;
    
    const byCategory = {};
    filteredInventory.forEach(i => {
      const cat = i.category || "Uncategorized";
      if (!byCategory[cat]) {
        byCategory[cat] = { quantity: 0, value: 0 };
      }
      byCategory[cat].quantity += i.currentQuantity;
      byCategory[cat].value += i.valuationValue;
    });
    
    return { totalItems, totalQuantity, totalValuation, avgUnitValue, categories, byCategory };
  }, [filteredInventory]);

  // Compare methods
  const methodComparison = useMemo(() => {
    const methods = {};
    VALUATION_METHODS.forEach(method => {
      let total = 0;
      valuedInventory.forEach(item => {
        if (item.currentQuantity > 0) {
          const itemMovements = MOCK_MOVEMENTS[item.id] || [];
          switch (method.value) {
            case "fifo":
              total += calculateFIFO(itemMovements, item.currentQuantity, item.currentPrice);
              break;
            case "lifo":
              total += calculateLIFO(itemMovements, item.currentQuantity, item.currentPrice);
              break;
            case "weighted_average":
              total += calculateWeightedAverage(itemMovements, item.currentQuantity);
              break;
            case "specific_id":
              total += item.currentQuantity * item.currentPrice;
              break;
          }
        }
      });
      methods[method.value] = total;
    });
    return methods;
  }, [valuedInventory]);

  const InputStyle = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1.5px solid ${C.border}`, borderRadius: 9,
    background: C.bg, fontSize: 13, color: C.text,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box"
  };

  function Field({ label, children }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
          {label}
        </label>
        {children}
      </div>
    );
  }

  const handleExport = () => {
    const reportData = filteredInventory.map(item => ({
      Name: item.name,
      SKU: item.sku,
      Category: item.category,
      Quantity: item.currentQuantity,
      'Unit Cost': item.currentPrice,
      Valuation: item.valuationValue,
      'Method': VALUATION_METHODS.find(m => m.value === valuationMethod)?.label
    }));
    
    console.table(reportData);
    toast.success(`Report exported - ${filteredInventory.length} items`);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Inventory data refreshed");
    }, 500);
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .valuation-row:hover{background:${C.indigoBg}!important;transform:translateX(2px);transition:all 0.15s}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={24} color={C.teal} /> Inventory Valuation
            </h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              Calculate inventory value using different accounting methods
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRefresh} style={{ padding: "0 14px", height: 34, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} className={isLoading ? "spin" : ""} /> Refresh
            </button>
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 34, borderRadius: 9, background: C.indigo, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Download size={15} /> Export Report
            </button>
          </div>
        </div>

        {/* Valuation Method Selector */}
        <div style={{ background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalcIcon size={18} color={C.indigo} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.indigoText }}>Valuation Method:</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {VALUATION_METHODS.map(method => (
                <button
                  key={method.value}
                  onClick={() => setValuationMethod(method.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 20,
                    background: valuationMethod === method.value ? method.color : C.bg,
                    border: `1.5px solid ${valuationMethod === method.value ? method.color : C.border}`,
                    fontSize: 12, fontWeight: 500,
                    color: valuationMethod === method.value ? "white" : C.muted,
                    cursor: "pointer", transition: "all 0.15s"
                  }}
                >
                  <method.icon size={14} />
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Total Items", value: stats.totalItems, icon: Package, color: C.blue, bg: C.blueBg, sub: "Active stock items" },
            { label: "Total Quantity", value: stats.totalQuantity.toLocaleString(), icon: Boxes, color: C.teal, bg: C.tealBg, sub: "Units in stock" },
            { label: "Total Valuation", value: formatCurrency(stats.totalValuation), icon: DollarSign, color: C.purple, bg: C.purpleBg, sub: `Using ${VALUATION_METHODS.find(m => m.value === valuationMethod)?.label}` },
            { label: "Avg Unit Value", value: formatCurrency(stats.avgUnitValue), icon: Scale, color: C.amber, bg: C.amberBg, sub: "Per unit average" }
          ].map(k => (
            <div key={k.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
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

        {/* Method Comparison */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 12 }}>Method Comparison</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {VALUATION_METHODS.map(method => {
              const value = methodComparison[method.value] || 0;
              const maxValue = Math.max(...Object.values(methodComparison).filter(v => v > 0), 1);
              const percentage = (value / maxValue) * 100;
              return (
                <div key={method.value}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <method.icon size={14} color={method.color} />
                    <span style={{ fontSize: 11, color: C.muted }}>{method.label}</span>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: method.color, marginBottom: 6 }}>
                    {formatCurrency(value)}
                  </p>
                  <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${percentage}%`, height: 4, background: method.color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, or category..." className="inp" style={{ ...InputStyle, paddingLeft: 36, height: 42, fontSize: 14 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}><X size={14} color={C.faint} /></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 42, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
            <Filter size={13} /> Filters
          </button>
        </div>

        {showFilters && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
            <Field label="Category">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="inp" style={{ ...InputStyle, cursor: "pointer" }}>
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </Field>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={() => { setCategoryFilter("all"); setSearch(""); }} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgMuted, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Valuation Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 2fr) minmax(100px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(100px, 0.8fr)",
            padding: "12px 20px",
            background: C.bgMuted,
            borderBottom: `1px solid ${C.border}`,
            gap: "8px"
          }}>
            {["Item Name / SKU", "Quantity", "Unit Cost", "Valuation", "Category"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: C.faint }}>Loading inventory...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Package size={30} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: C.faint }}>No inventory items found</p>
            </div>
          ) : (
            filteredInventory.map((item, i) => (
              <div
                key={item.id}
                className="valuation-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(200px, 2fr) minmax(100px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(100px, 0.8fr)",
                  padding: "14px 20px",
                  borderBottom: i < filteredInventory.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  transition: "all .1s",
                  cursor: "pointer",
                  gap: "8px"
                }}
                onClick={() => setShowDetails(item)}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{item.name}</p>
                  {item.sku && <p style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>SKU: {item.sku}</p>}
                </div>
                
                <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{item.currentQuantity}</span>
                
                <span style={{ fontSize: 13, color: C.muted }}>{formatCurrency(item.currentPrice)}</span>
                
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.teal }}>{formatCurrency(item.valuationValue)}</span>
                  <p style={{ fontSize: 9, color: C.faint, marginTop: 2 }}>
                    @ {formatCurrency(item.currentQuantity > 0 ? item.valuationValue / item.currentQuantity : 0)}/unit
                  </p>
                </div>
                
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 12, background: C.blueBg, color: C.blueText, display: "inline-block", width: "fit-content" }}>
                  {item.category || "Uncategorized"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {filteredInventory.length > 0 && (
          <div style={{ marginTop: 8, padding: "12px 20px", background: C.bgMuted, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: C.muted }}>{filteredInventory.length} items • {stats.totalQuantity.toLocaleString()} total units</span>
            <div style={{ display: "flex", gap: 24 }}>
              <span>Total Valuation: <strong>{formatCurrency(stats.totalValuation)}</strong></span>
              <span>Categories: <strong>{categories.length}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {showDetails && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowDetails(null)}>
          <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{showDetails.name}</h3>
              <button onClick={() => setShowDetails(null)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>SKU</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{showDetails.sku || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Current Quantity</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>{showDetails.currentQuantity} units</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Unit Cost</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(showDetails.currentPrice)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Valuation ({VALUATION_METHODS.find(m => m.value === valuationMethod)?.label})</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.purple }}>{formatCurrency(showDetails.valuationValue)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Category</span>
                  <span style={{ fontSize: 13 }}>{showDetails.category || "—"}</span>
                </div>
                {showDetails.location && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Location</span>
                    <span style={{ fontSize: 13 }}>{showDetails.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}