import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Search, Filter, ChevronDown, X, Plus, 
  Activity, Stethoscope, Syringe, Eye, 
  Clock, CheckCircle2, AlertCircle, Calendar, 
  User, FileText, Download, Printer, ChevronRight,
  Grid3x3, List, CalendarDays, BarChart3
} from "lucide-react";
import { apiGetProceduresCatalog, apiAddProcedure } from "@/api/treatments";
import { apiGetPatients } from "@/api/patients";
import toast from "react-hot-toast";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8",
  bg: "#ffffff",
  bgMuted: "#f7f9f8",
  bgPage: "#f0f2f1",
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
  gray: "#6b7f75",
  grayBg: "#f4f7f5",
};

const PROCEDURE_CATEGORIES = [
  "All",
  "Diagnostic",
  "Preventive",
  "Restorative",
  "Endodontic",
  "Periodontic",
  "Prosthodontic",
  "Oral Surgery",
  "Orthodontic",
  "Radiology"
];

// ─── Components ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = (name ?? "?").split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.teal}, #0a7d5d)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.37,
      fontWeight: 600,
      color: "white",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function ProcedureCard({ procedure, onViewDetails }: { 
  procedure: any; 
  onViewDetails: (proc: any) => void;
}) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Diagnostic: C.blue,
      Preventive: C.teal,
      Restorative: C.purple,
      Endodontic: C.red,
      Periodontic: C.amber,
      Prosthodontic: C.purple,
      "Oral Surgery": C.red,
      Orthodontic: C.blue,
      Radiology: C.gray,
    };
    return colors[category] || C.gray;
  };

  return (
    <div
      onClick={() => onViewDetails(procedure)}
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = C.tealBorder;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: `${getCategoryColor(procedure.category)}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Syringe size={24} color={getCategoryColor(procedure.category)} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {procedure.name}
            </h3>
            <span style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 12,
              background: `${getCategoryColor(procedure.category)}15`,
              color: getCategoryColor(procedure.category),
              fontWeight: 600,
            }}>
              {procedure.category}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>
            {procedure.description || "No description available"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>
              ${procedure.price || "—"}
            </span>
            <span style={{ fontSize: 11, color: C.faint }}>
              ~{procedure.duration || "30"} min
            </span>
          </div>
        </div>
        <ChevronRight size={16} color={C.faint} />
      </div>
    </div>
  );
}

function ProcedureModal({ procedure, onClose }: { procedure: any; onClose: () => void }) {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["patients", searchQuery],
    queryFn: () => apiGetPatients({ search: searchQuery, limit: 20 }),
    enabled: showPatientSearch,
  });
  
  const patients = patientsData?.data || [];
  
  const addProcedureMut = useMutation({
    mutationFn: (data: any) => apiAddProcedure(data.treatmentId, data),
    onSuccess: () => {
      toast.success("Procedure added to treatment");
      onClose();
    },
    onError: () => toast.error("Failed to add procedure"),
  });
  
  const handleAddProcedure = () => {
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }
    
    addProcedureMut.mutate({
      treatmentId: 0,
      procedure_name: procedure.name,
      tooth_number: null,
      notes: "",
      status: "pending"
    });
  };
  
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: C.bg,
        borderRadius: 16,
        width: "100%",
        maxWidth: 500,
        maxHeight: "90vh",
        overflow: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            {procedure.name}
          </h3>
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
            }}
          >
            <X size={14} />
          </button>
        </div>
        
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
              Category
            </p>
            <p style={{ fontSize: 13, color: C.text }}>{procedure.category}</p>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
              Description
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>{procedure.description || "No description available"}</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                Price
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>${procedure.price || "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                Duration
              </p>
              <p style={{ fontSize: 13, color: C.text }}>{procedure.duration || "30"} minutes</p>
            </div>
          </div>
          
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={handleAddProcedure}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                background: C.teal,
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={14} />
              Add to Treatment Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssistantProceduresPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid"); // <-- THIS WAS MISSING
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  
  // Fetch procedures catalog
  const { data: proceduresData, isLoading } = useQuery({
    queryKey: ["procedures-catalog"],
    queryFn: apiGetProceduresCatalog,
  });
  
  const procedures = proceduresData?.data || proceduresData || [];
  
  // Filter procedures
  const filteredProcedures = useMemo(() => {
    let filtered = procedures;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p: any) => p.category === selectedCategory);
    }
    
    return filtered;
  }, [procedures, searchQuery, selectedCategory]);
  
  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: procedures.length };
    procedures.forEach((p: any) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [procedures]);
  
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .procedure-card:hover { transform: translateY(-2px); }
      `}</style>
      
      <div style={{ animation: "slideIn 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate("/assistant")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 12,
              color: C.muted,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Procedures Catalog
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Browse and manage dental procedures
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}>
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 16px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
              Total Procedures
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
              {procedures.length}
            </p>
          </div>
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 16px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
              Categories
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
              {Object.keys(categoryCounts).length - 1}
            </p>
          </div>
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 16px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
              Avg. Duration
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
              45 min
            </p>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div style={{
          background: C.bg,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: "16px",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search procedures by name, description, or category..."
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={14} color={C.faint} />
                </button>
              )}
            </div>
            
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${viewMode === "grid" ? C.tealBorder : C.border}`,
                  background: viewMode === "grid" ? C.tealBg : C.bg,
                  color: viewMode === "grid" ? C.tealText : C.muted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Grid3x3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${viewMode === "list" ? C.tealBorder : C.border}`,
                  background: viewMode === "list" ? C.tealBg : C.bg,
                  color: viewMode === "list" ? C.tealText : C.muted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <List size={14} />
              </button>
            </div>
          </div>
          
          {/* Category Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PROCEDURE_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${selectedCategory === category ? C.tealBorder : C.border}`,
                  background: selectedCategory === category ? C.tealBg : C.bg,
                  color: selectedCategory === category ? C.tealText : C.muted,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {category}
                <span style={{
                  fontSize: 10,
                  padding: "0 4px",
                  borderRadius: 10,
                  background: selectedCategory === category ? `${C.teal}20` : C.bgMuted,
                  color: selectedCategory === category ? C.tealText : C.muted,
                }}>
                  {categoryCounts[category] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Results Count */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, color: C.muted }}>
            Showing {filteredProcedures.length} of {procedures.length} procedures
          </p>
        </div>
        
        {/* Procedures Grid/List */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: C.muted }}>Loading procedures...</p>
          </div>
        ) : filteredProcedures.length === 0 ? (
          <div style={{
            background: C.bg,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: "60px 20px",
            textAlign: "center",
          }}>
            <Syringe size={48} color={C.faint} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>No procedures found</p>
            <p style={{ fontSize: 12, color: C.muted }}>
              {searchQuery ? `No results for "${searchQuery}"` : "No procedures in this category"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}>
            {filteredProcedures.map((procedure: any) => (
              <ProcedureCard
                key={procedure.id}
                procedure={procedure}
                onViewDetails={setSelectedProcedure}
              />
            ))}
          </div>
        ) : (
          <div style={{
            background: C.bg,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 100px 80px 80px 40px",
              padding: "12px 16px",
              background: C.bgMuted,
              borderBottom: `1px solid ${C.border}`,
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
            }}>
              <div></div>
              <div>Procedure</div>
              <div>Category</div>
              <div>Price</div>
              <div>Duration</div>
              <div></div>
            </div>
            {filteredProcedures.map((procedure: any) => (
              <div
                key={procedure.id}
                onClick={() => setSelectedProcedure(procedure)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 100px 80px 80px 40px",
                  padding: "12px 16px",
                  borderBottom: `1px solid ${C.border}`,
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.bgMuted; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: C.tealBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Syringe size={14} color={C.teal} />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{procedure.name}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{procedure.description?.substring(0, 60)}...</p>
                </div>
                <div>
                  <span style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: C.blueBg,
                    color: C.blueText,
                  }}>
                    {procedure.category}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.teal }}>${procedure.price || "—"}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: C.muted }}>{procedure.duration || "30"} min</span>
                </div>
                <div>
                  <ChevronRight size={14} color={C.faint} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Procedure Details Modal */}
      {selectedProcedure && (
        <ProcedureModal
          procedure={selectedProcedure}
          onClose={() => setSelectedProcedure(null)}
        />
      )}
    </>
  );
}