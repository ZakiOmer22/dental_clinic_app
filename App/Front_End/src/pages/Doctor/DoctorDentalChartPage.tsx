import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Save, X, Activity, AlertCircle, CheckCircle2,
  Heart, Award, Link, Anchor, Info, Plus,
  Trash2, Edit2, Eye, Download, Printer,
  CircleDot, Circle, CircleOff, CircleCheck, 
  CircleX, CircleDashed, Star, Diamond, Gem,
  Search, ChevronDown, User, CalendarDays, Phone, Mail
} from "lucide-react";
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

// ─── Tooth Data ───────────────────────────────────────────────────────────────
const TOOTH_NUMBERS = {
  upper: {
    right: [1, 2, 3, 4, 5, 6, 7, 8],
    left: [9, 10, 11, 12, 13, 14, 15, 16],
  },
  lower: {
    right: [17, 18, 19, 20, 21, 22, 23, 24],
    left: [25, 26, 27, 28, 29, 30, 31, 32],
  },
};

const TOOTH_CONDITIONS = [
  { value: "caries", label: "Caries (Cavity)", icon: AlertCircle, color: C.red, description: "Tooth decay requiring filling" },
  { value: "fracture", label: "Fracture/Crack", icon: AlertCircle, color: C.amber, description: "Cracked or fractured tooth" },
  { value: "missing", label: "Missing", icon: CircleX, color: C.muted, description: "Tooth is missing" },
  { value: "filled", label: "Existing Filling", icon: CheckCircle2, color: C.teal, description: "Previously filled tooth" },
  { value: "crown", label: "Crown", icon: Star, color: C.purple, description: "Crown placed" },
  { value: "bridge", label: "Bridge", icon: Link, color: C.blue, description: "Dental bridge present" },
  { value: "implant", label: "Implant", icon: Anchor, color: C.amber, description: "Dental implant" },
  { value: "root_canal", label: "Root Canal", icon: CircleDot, color: C.red, description: "Root canal treatment done" },
  { value: "impacted", label: "Impacted", icon: CircleOff, color: C.red, description: "Tooth is impacted" },
  { value: "wear", label: "Wear/Abrasion", icon: CircleDashed, color: C.amber, description: "Excessive wear or abrasion" },
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

function PatientSelector({ onSelectPatient }: { onSelectPatient: (patient: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["patients", searchQuery],
    queryFn: () => apiGetPatients({ search: searchQuery, limit: 20 }),
  });
  
  const patients = patientsData?.data || [];
  
  const handleSelect = (patient: any) => {
    setSelectedPatient(patient);
    onSelectPatient(patient);
    setIsOpen(false);
  };
  
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
        Select Patient <span style={{ color: C.red }}>*</span>
      </label>
      
      {selectedPatient ? (
        <div style={{
          background: C.tealBg,
          border: `1px solid ${C.tealBorder}`,
          borderRadius: 12,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={selectedPatient.full_name} size={48} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{selectedPatient.full_name}</p>
              <p style={{ fontSize: 12, color: C.muted }}>
                {selectedPatient.patient_number} · {selectedPatient.phone}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedPatient(null);
              onSelectPatient(null);
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.bg,
              fontSize: 12,
              cursor: "pointer",
              color: C.muted,
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setIsOpen(true)}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "12px 16px",
              background: C.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: C.muted, fontSize: 13 }}>
              {isOpen ? "Search for a patient..." : "Click to search for a patient"}
            </span>
            <ChevronDown size={16} color={C.muted} />
          </div>
          
          {isOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 100,
              maxHeight: 400,
              overflow: "auto",
            }}>
              <div style={{ padding: "12px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, phone, or ID..."
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              
              {isLoading ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </div>
              ) : patients.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: C.muted }}>
                  No patients found
                </div>
              ) : (
                patients.map((patient: any) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${C.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.bgMuted; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Avatar name={patient.full_name} size={36} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{patient.full_name}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>
                        {patient.patient_number} · {patient.phone}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToothCard({ tooth, conditions, onEdit }: { 
  tooth: number; 
  conditions: string[]; 
  onEdit: (tooth: number) => void;
}) {
  const hasConditions = conditions.length > 0;
  const primaryCondition = conditions[0];
  const conditionInfo = TOOTH_CONDITIONS.find(c => c.value === primaryCondition);
  const IconComponent = conditionInfo?.icon || Circle;
  
  return (
    <div
      onClick={() => onEdit(tooth)}
      style={{
        width: 48,
        height: 48,
        background: hasConditions ? `${conditionInfo?.color}15` : C.bgMuted,
        border: `2px solid ${hasConditions ? conditionInfo?.color : C.border}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        cursor: "pointer",
        transition: "all 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: hasConditions ? conditionInfo?.color : C.text }}>
        {tooth}
      </span>
      {hasConditions && (
        <IconComponent size={12} color={conditionInfo?.color} strokeWidth={2} />
      )}
    </div>
  );
}

function ToothDetailsModal({ tooth, conditions, onClose, onSave }: {
  tooth: number;
  conditions: string[];
  onClose: () => void;
  onSave: (conditions: string[]) => void;
}) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>(conditions);
  const [notes, setNotes] = useState("");
  
  const handleToggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(prev => prev.filter(c => c !== condition));
    } else {
      setSelectedConditions(prev => [...prev, condition]);
    }
  };
  
  const handleSave = () => {
    onSave(selectedConditions);
    onClose();
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
            Tooth #{tooth}
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
          <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12 }}>
            Select Conditions
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {TOOTH_CONDITIONS.map(cond => {
              const isSelected = selectedConditions.includes(cond.value);
              const IconComponent = cond.icon;
              return (
                <button
                  key={cond.value}
                  onClick={() => handleToggleCondition(cond.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: `1px solid ${isSelected ? cond.color : C.border}`,
                    background: isSelected ? `${cond.color}10` : C.bg,
                    color: isSelected ? cond.color : C.muted,
                    fontSize: 11,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  title={cond.description}
                >
                  <IconComponent size={12} />
                  {cond.label}
                </button>
              );
            })}
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add clinical notes about this tooth..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
          
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bg,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                background: C.teal,
                border: "none",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DoctorDentalChartPage() {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showChart, setShowChart] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [localConditions, setLocalConditions] = useState<Record<number, string[]>>({});
  const [savedPatientId, setSavedPatientId] = useState<number | null>(null);
  
  // Load saved chart data from localStorage when patient is selected
  useEffect(() => {
    if (selectedPatient && showChart) {
      const savedData = localStorage.getItem(`dental_chart_${selectedPatient.id}`);
      if (savedData) {
        setLocalConditions(JSON.parse(savedData));
      } else {
        setLocalConditions({});
      }
      setSavedPatientId(selectedPatient.id);
    }
  }, [selectedPatient, showChart]);
  
  const handleToothClick = (tooth: number) => {
    setSelectedTooth(tooth);
  };
  
  const handleSaveTooth = (conditions: string[]) => {
    const updatedConditions = {
      ...localConditions,
      [selectedTooth!]: conditions,
    };
    setLocalConditions(updatedConditions);
    
    // Save to localStorage
    if (savedPatientId) {
      localStorage.setItem(`dental_chart_${savedPatientId}`, JSON.stringify(updatedConditions));
      toast.success("Dental chart updated locally");
    }
  };
  
  const handleViewChart = () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }
    setShowChart(true);
  };
  
  const handleClearChart = () => {
    if (confirm("Are you sure you want to clear all conditions for this patient?")) {
      setLocalConditions({});
      if (savedPatientId) {
        localStorage.removeItem(`dental_chart_${savedPatientId}`);
        toast.success("Dental chart cleared");
      }
    }
  };
  
  const handleExportChart = () => {
    const chartData = {
      patient: selectedPatient,
      date: new Date().toISOString(),
      conditions: localConditions,
    };
    const dataStr = JSON.stringify(chartData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `dental_chart_${selectedPatient?.full_name}_${new Date().toISOString().split("T")[0]}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    toast.success("Chart exported");
  };
  
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{ animation: "slideIn 0.3s ease-out" }}>
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
                Dental Chart
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                View and update patient's dental chart (Local Storage)
              </p>
            </div>
            {showChart && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleExportChart}
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
                  <Download size={14} />
                  Export
                </button>
                <button
                  onClick={handleClearChart}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${C.redBorder}`,
                    background: C.redBg,
                    color: C.redText,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {!showChart ? (
          <div style={{
            background: C.bg,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "32px",
            maxWidth: 600,
            margin: "0 auto",
          }}>
            <PatientSelector onSelectPatient={(patient) => setSelectedPatient(patient)} />
            
            <button
              onClick={handleViewChart}
              disabled={!selectedPatient}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: selectedPatient ? C.teal : C.muted,
                border: "none",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: selectedPatient ? "pointer" : "not-allowed",
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Activity size={18} />
              View Dental Chart for {selectedPatient?.full_name?.split(" ")[0] || "Patient"}
            </button>
          </div>
        ) : (
          <>
            {/* Patient Info Banner */}
            <div style={{
              background: C.tealBg,
              border: `1px solid ${C.tealBorder}`,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={selectedPatient.full_name} size={48} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{selectedPatient.full_name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    {selectedPatient.patient_number} · {selectedPatient.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChart(false);
                  setSelectedPatient(null);
                  setLocalConditions({});
                  setSavedPatientId(null);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  cursor: "pointer",
                  color: C.muted,
                }}
              >
                Change Patient
              </button>
            </div>

            {/* Legend */}
            <div style={{
              background: C.bg,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "12px 20px",
              marginBottom: 24,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Legend:</span>
              {TOOTH_CONDITIONS.map(cond => (
                <div key={cond.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: cond.color }} />
                  <span style={{ fontSize: 11, color: C.text }}>{cond.label}</span>
                </div>
              ))}
            </div>
            
            {/* Dental Chart */}
            <div style={{
              background: C.bg,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "24px",
              marginBottom: 24,
            }}>
              {/* Upper Arch */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: "80%", height: 2, background: C.border, position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: "50%",
                      top: -8,
                      transform: "translateX(-50%)",
                      background: C.bg,
                      padding: "0 8px",
                      fontSize: 11,
                      color: C.muted,
                    }}>Upper Arch (Maxillary)</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {TOOTH_NUMBERS.upper.right.map(tooth => (
                      <ToothCard
                        key={tooth}
                        tooth={tooth}
                        conditions={localConditions[tooth] || []}
                        onEdit={handleToothClick}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {TOOTH_NUMBERS.upper.left.map(tooth => (
                      <ToothCard
                        key={tooth}
                        tooth={tooth}
                        conditions={localConditions[tooth] || []}
                        onEdit={handleToothClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Lower Arch */}
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: "80%", height: 2, background: C.border, position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: "50%",
                      top: -8,
                      transform: "translateX(-50%)",
                      background: C.bg,
                      padding: "0 8px",
                      fontSize: 11,
                      color: C.muted,
                    }}>Lower Arch (Mandibular)</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {TOOTH_NUMBERS.lower.right.map(tooth => (
                      <ToothCard
                        key={tooth}
                        tooth={tooth}
                        conditions={localConditions[tooth] || []}
                        onEdit={handleToothClick}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {TOOTH_NUMBERS.lower.left.map(tooth => (
                      <ToothCard
                        key={tooth}
                        tooth={tooth}
                        conditions={localConditions[tooth] || []}
                        onEdit={handleToothClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Summary Section */}
            <div style={{
              background: C.bg,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "20px",
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>
                Treatment Summary
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {TOOTH_CONDITIONS.map(cond => {
                  const count = Object.values(localConditions).flat().filter(c => c === cond.value).length;
                  if (count === 0) return null;
                  const IconComponent = cond.icon;
                  return (
                    <div key={cond.value} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      background: C.bgMuted,
                      borderRadius: 8,
                    }}>
                      <IconComponent size={16} color={cond.color} />
                      <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{cond.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: cond.color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
              
              {Object.keys(localConditions).length === 0 && (
                <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "20px" }}>
                  No conditions recorded yet. Click on a tooth to add conditions.
                </p>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Tooth Details Modal */}
      {selectedTooth && (
        <ToothDetailsModal
          tooth={selectedTooth}
          conditions={localConditions[selectedTooth] || []}
          onClose={() => setSelectedTooth(null)}
          onSave={handleSaveTooth}
        />
      )}
    </>
  );
}