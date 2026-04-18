import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Save, X, Activity, Stethoscope, Syringe,
  FileText, Plus, Trash2, AlertCircle, CheckCircle2,
  Heart, Upload, Award, Link, Anchor, Search, ChevronDown,
  Clock
} from "lucide-react";
import { apiCreateTreatment, apiAddProcedure } from "@/api/treatments";
import { apiGetPatients } from "@/api/patients";
import { apiUploadFile } from "@/api/files";
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

// ─── Tooth Diagram Data ───────────────────────────────────────────────────────
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
  { value: "caries", label: "Caries (Cavity)", icon: AlertCircle, color: C.red },
  { value: "fracture", label: "Fracture/Crack", icon: AlertCircle, color: C.amber },
  { value: "missing", label: "Missing", icon: X, color: C.muted },
  { value: "filled", label: "Existing Filling", icon: CheckCircle2, color: C.teal },
  { value: "crown", label: "Crown", icon: Award, color: C.purple },
  { value: "bridge", label: "Bridge", icon: Link, color: C.blue },
  { value: "implant", label: "Implant", icon: Anchor, color: C.amber },
  { value: "root_canal", label: "Root Canal", icon: Activity, color: C.red },
  { value: "impacted", label: "Impacted", icon: AlertCircle, color: C.red },
  { value: "wear", label: "Wear/Abrasion", icon: Activity, color: C.amber },
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

function ToothDiagram({ selectedTooth, onSelectTooth, conditions }: {
  selectedTooth: number | null;
  onSelectTooth: (tooth: number) => void;
  conditions: Record<number, string[]>;
}) {
  const getToothStyle = (tooth: number) => {
    const toothConditions = conditions[tooth] || [];
    let bgColor = C.bgMuted;
    let borderColor = C.border;
    
    if (toothConditions.includes("caries")) {
      bgColor = C.redBg;
      borderColor = C.redBorder;
    } else if (toothConditions.includes("fracture")) {
      bgColor = C.amberBg;
      borderColor = C.amberBorder;
    } else if (toothConditions.includes("filled")) {
      bgColor = C.tealBg;
      borderColor = C.tealBorder;
    } else if (toothConditions.includes("crown")) {
      bgColor = C.purpleBg;
      borderColor = C.purple;
    }
    
    return {
      background: selectedTooth === tooth ? C.tealBg : bgColor,
      border: `2px solid ${selectedTooth === tooth ? C.teal : borderColor}`,
      color: selectedTooth === tooth ? C.tealText : C.text,
    };
  };

  return (
    <div style={{ padding: "16px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 16, textAlign: "center" }}>
        Dental Chart - Click on tooth to add condition
      </p>
      
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: C.faint, marginBottom: 8, textAlign: "center" }}>
          Upper Arch (Right → Left)
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
          {[...TOOTH_NUMBERS.upper.right].reverse().map(tooth => (
            <button
              key={tooth}
              onClick={() => onSelectTooth(tooth)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                ...getToothStyle(tooth),
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                margin: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {tooth}
            </button>
          ))}
          {TOOTH_NUMBERS.upper.left.map(tooth => (
            <button
              key={tooth}
              onClick={() => onSelectTooth(tooth)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                ...getToothStyle(tooth),
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                margin: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {tooth}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <p style={{ fontSize: 10, fontWeight: 600, color: C.faint, marginBottom: 8, textAlign: "center" }}>
          Lower Arch (Right → Left)
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
          {[...TOOTH_NUMBERS.lower.right].reverse().map(tooth => (
            <button
              key={tooth}
              onClick={() => onSelectTooth(tooth)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                ...getToothStyle(tooth),
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                margin: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {tooth}
            </button>
          ))}
          {TOOTH_NUMBERS.lower.left.map(tooth => (
            <button
              key={tooth}
              onClick={() => onSelectTooth(tooth)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                ...getToothStyle(tooth),
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                margin: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {tooth}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcedureSelector({ selected, onSelect }: { selected: string[]; onSelect: (procedures: string[]) => void }) {
  const commonProcedures = [
    "Comprehensive Oral Exam",
    "Dental Cleaning (Prophylaxis)",
    "Fluoride Treatment",
    "X-Ray - Bitewing",
    "X-Ray - Panoramic",
    "Cavity Filling - Composite",
    "Root Canal Therapy",
    "Crown Preparation",
    "Tooth Extraction",
    "Scaling and Root Planing",
  ];

  const toggleProcedure = (proc: string) => {
    if (selected.includes(proc)) {
      onSelect(selected.filter(p => p !== proc));
    } else {
      onSelect([...selected, proc]);
    }
  };

  return (
    <div style={{ background: C.bgMuted, borderRadius: 10, padding: "12px" }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 }}>
        Common Procedures
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {commonProcedures.map(proc => (
          <button
            key={proc}
            onClick={() => toggleProcedure(proc)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: `1px solid ${selected.includes(proc) ? C.tealBorder : C.border}`,
              background: selected.includes(proc) ? C.tealBg : C.bg,
              color: selected.includes(proc) ? C.tealText : C.muted,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {proc}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToothConditionPanel({ tooth, onAddCondition, onRemoveCondition, conditions }: {
  tooth: number | null;
  onAddCondition: (condition: string) => void;
  onRemoveCondition: (condition: string) => void;
  conditions: string[];
}) {
  if (!tooth) {
    return (
      <div style={{
        background: C.bgMuted,
        borderRadius: 12,
        padding: "24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
      }}>
        <AlertCircle size={32} color={C.faint} style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 12, color: C.muted }}>Select a tooth to add conditions</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: C.tealBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <AlertCircle size={24} color={C.teal} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Tooth #{tooth}</h3>
          <p style={{ fontSize: 12, color: C.muted }}>Select conditions observed</p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {TOOTH_CONDITIONS.map(cond => {
          const isSelected = conditions.includes(cond.value);
          const IconComponent = cond.icon;
          return (
            <button
              key={cond.value}
              onClick={() => isSelected ? onRemoveCondition(cond.value) : onAddCondition(cond.value)}
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
                fontWeight: isSelected ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <IconComponent size={12} />
              {cond.label}
            </button>
          );
        })}
      </div>

      {conditions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.faint, marginBottom: 8 }}>
            Current Conditions:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {conditions.map(cond => {
              const condInfo = TOOTH_CONDITIONS.find(c => c.value === cond);
              const IconComponent = condInfo?.icon || AlertCircle;
              return (
                <span
                  key={cond}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    borderRadius: 12,
                    background: `${condInfo?.color}10`,
                    color: condInfo?.color,
                    fontSize: 11,
                  }}
                >
                  <IconComponent size={10} />
                  {condInfo?.label || cond}
                  <button
                    onClick={() => onRemoveCondition(cond)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", marginLeft: 4 }}
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssistantStartTreatmentPage() {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);

  const [formData, setFormData] = useState({
    chief_complaint: "",
    clinical_notes: "",
    diagnosis: "",
    treatment_plan: "",
    blood_pressure: "",
    heart_rate: "",
    temperature: "",
    allergies: "",
    medications: "",
  });

  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothConditions, setToothConditions] = useState<Record<number, string[]>>({});
  const [activeTab, setActiveTab] = useState<"clinical" | "dental" | "vitals" | "notes">("clinical");
  const [images, setImages] = useState<{ file: File; preview: string; category: string; toothNumber?: string }[]>([]);

  const createTreatmentMut = useMutation({
    mutationFn: apiCreateTreatment,
    onSuccess: async (response) => {
      const treatmentId = response.data?.id || response.id;
      toast.success("Treatment started successfully");
      
      try {
        // Save procedures if any
        for (const proc of selectedProcedures) {
          await apiAddProcedure(treatmentId, {
            procedure_name: proc,
            tooth_number: selectedTooth,
            notes: "",
            status: "pending"
          });
        }
        
        // Save tooth conditions
        for (const [toothNum, conditions] of Object.entries(toothConditions)) {
          for (const condition of conditions) {
            await apiAddProcedure(treatmentId, {
              procedure_name: condition,
              tooth_number: Number(toothNum),
              notes: "",
              is_condition: true,
              status: "pending"
            });
          }
        }
        
        // Upload images
        for (const image of images) {
          try {
            await apiUploadFile(
              selectedPatient.id,
              image.file,
              image.category,
              image.toothNumber,
              `Treatment #${treatmentId} - ${new Date().toLocaleDateString()}`
            );
          } catch (err) {
            console.error("Failed to upload image:", err);
          }
        }
        
        toast.success("Treatment details saved");
        navigate(`/assistant/patients/${selectedPatient.id}`);
      } catch (error) {
        console.error("Failed to save details:", error);
        toast.error("Some details failed to save");
        navigate(`/assistant/treatments/${treatmentId}`);
      }
    },
    onError: (error: any) => {
      console.error("Create treatment error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to start treatment";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }
    
    if (!formData.chief_complaint) {
      toast.error("Please enter chief complaint");
      return;
    }
    
    if (!formData.diagnosis) {
      toast.error("Please enter diagnosis");
      return;
    }

    // TRY BOTH FORMATS - Let's try camelCase first (patientId instead of patient_id)
    const payloadCamelCase = {
      patientId: selectedPatient.id,
      chiefComplaint: formData.chief_complaint,
      diagnosis: formData.diagnosis,
      clinicalNotes: formData.clinical_notes,
      treatmentPlan: formData.treatment_plan,
      status: "in_progress",
      bloodPressure: formData.blood_pressure || undefined,
      heartRate: formData.heart_rate ? parseInt(formData.heart_rate) : undefined,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      allergies: formData.allergies || undefined,
      currentMedications: formData.medications || undefined,
    };
    
    // Also try snake_case format
    const payloadSnakeCase = {
      patient_id: selectedPatient.id,
      chief_complaint: formData.chief_complaint,
      diagnosis: formData.diagnosis,
      clinical_notes: formData.clinical_notes,
      treatment_plan: formData.treatment_plan,
      status: "in_progress",
      blood_pressure: formData.blood_pressure || undefined,
      heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : undefined,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      allergies: formData.allergies || undefined,
      current_medications: formData.medications || undefined,
    };
    
    console.log("Sending payload (camelCase):", payloadCamelCase);
    console.log("Sending payload (snake_case):", payloadSnakeCase);
    
    // Try camelCase first (more common in JS backends)
    createTreatmentMut.mutate(payloadCamelCase);
  };

  const addToothCondition = (condition: string) => {
    if (selectedTooth) {
      setToothConditions(prev => ({
        ...prev,
        [selectedTooth]: [...(prev[selectedTooth] || []), condition],
      }));
    }
  };

  const removeToothCondition = (condition: string) => {
    if (selectedTooth) {
      setToothConditions(prev => ({
        ...prev,
        [selectedTooth]: (prev[selectedTooth] || []).filter(c => c !== condition),
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const category = window.prompt("Select category (xray, photo, document):", "xray") || "xray";
    const toothNumber = window.prompt("Tooth number (optional):", "");
    
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      category: category,
      toothNumber: toothNumber || undefined,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartTreatment = () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }
    setShowTreatmentForm(true);
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
            onClick={() => navigate(-1)}
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
            Back
          </button>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Start Treatment
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Begin a new treatment session for a patient
              </p>
            </div>
          </div>
        </div>

        {!showTreatmentForm ? (
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
              onClick={handleStartTreatment}
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
              Start Treatment for {selectedPatient?.full_name?.split(" ")[0] || "Patient"}
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
                  setShowTreatmentForm(false);
                  setSelectedPatient(null);
                  setFormData({
                    chief_complaint: "",
                    clinical_notes: "",
                    diagnosis: "",
                    treatment_plan: "",
                    blood_pressure: "",
                    heart_rate: "",
                    temperature: "",
                    allergies: "",
                    medications: "",
                  });
                  setSelectedProcedures([]);
                  setToothConditions({});
                  setImages([]);
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

            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: 4,
              borderBottom: `1px solid ${C.border}`,
              marginBottom: 24,
            }}>
              {[
                { id: "clinical", label: "Clinical Info", icon: Stethoscope },
                { id: "dental", label: "Dental Chart", icon: AlertCircle },
                { id: "vitals", label: "Vital Signs", icon: Heart },
                { id: "notes", label: "Notes & Images", icon: FileText },
              ].map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      borderBottom: `2px solid ${activeTab === tab.id ? C.teal : "transparent"}`,
                      color: activeTab === tab.id ? C.tealText : C.muted,
                      transition: "all 0.15s",
                    }}
                  >
                    <IconComponent size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "clinical" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{
                    background: C.bg,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "20px",
                  }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                      Chief Complaint <span style={{ color: C.red }}>*</span>
                    </label>
                    <textarea
                      value={formData.chief_complaint}
                      onChange={e => setFormData({ ...formData, chief_complaint: e.target.value })}
                      placeholder="What brings the patient in today?"
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div style={{
                    background: C.bg,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "20px",
                  }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                      Diagnosis <span style={{ color: C.red }}>*</span>
                    </label>
                    <textarea
                      value={formData.diagnosis}
                      onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                      placeholder="Preliminary diagnosis..."
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div style={{
                    background: C.bg,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "20px",
                  }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                      Treatment Plan
                    </label>
                    <textarea
                      value={formData.treatment_plan}
                      onChange={e => setFormData({ ...formData, treatment_plan: e.target.value })}
                      placeholder="Proposed treatment plan..."
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <ProcedureSelector selected={selectedProcedures} onSelect={setSelectedProcedures} />
                </div>
              )}

              {activeTab === "dental" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <ToothDiagram
                    selectedTooth={selectedTooth}
                    onSelectTooth={setSelectedTooth}
                    conditions={toothConditions}
                  />
                  <div style={{
                    background: C.bg,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "20px",
                  }}>
                    <ToothConditionPanel
                      tooth={selectedTooth}
                      onAddCondition={addToothCondition}
                      onRemoveCondition={removeToothCondition}
                      conditions={toothConditions[selectedTooth || 0] || []}
                    />
                  </div>
                </div>
              )}

              {activeTab === "vitals" && (
                <div style={{
                  background: C.bg,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: "20px",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>
                        Blood Pressure (mmHg)
                      </label>
                      <input
                        type="text"
                        value={formData.blood_pressure}
                        onChange={e => setFormData({ ...formData, blood_pressure: e.target.value })}
                        placeholder="120/80"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>
                        Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        value={formData.heart_rate}
                        onChange={e => setFormData({ ...formData, heart_rate: e.target.value })}
                        placeholder="72"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>
                        Temperature (°C)
                      </label>
                      <input
                        type="text"
                        value={formData.temperature}
                        onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                        placeholder="36.6"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>
                      Known Allergies
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="Penicillin, latex, etc."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    />
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>
                      Current Medications
                    </label>
                    <input
                      type="text"
                      value={formData.medications}
                      onChange={e => setFormData({ ...formData, medications: e.target.value })}
                      placeholder="Medications the patient is taking..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{
                    background: C.bg,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "20px",
                  }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                      Clinical Notes
                    </label>
                    <textarea
                      value={formData.clinical_notes}
                      onChange={e => setFormData({ ...formData, clinical_notes: e.target.value })}
                      placeholder="Detailed clinical observations, findings, and notes..."
                      rows={5}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div style={{
                    background: C.bg,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "20px",
                  }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                      Images & X-rays
                    </label>
                    <div style={{
                      border: `2px dashed ${C.border}`,
                      borderRadius: 8,
                      padding: "20px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: C.bgMuted,
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" style={{ cursor: "pointer", display: "block" }}>
                        <Upload size={32} color={C.faint} style={{ marginBottom: 8 }} />
                        <p style={{ fontSize: 12, color: C.muted }}>Click to upload images or X-rays</p>
                        <p style={{ fontSize: 10, color: C.faint }}>JPG, PNG supported</p>
                      </label>
                    </div>
                    
                    {images.length > 0 && (
                      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
                        {images.map((img, idx) => (
                          <div key={idx} style={{ position: "relative" }}>
                            <img src={img.preview} alt={`Upload ${idx + 1}`} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />
                            <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, fontSize: 10, color: "white" }}>
                              {img.category}
                              {img.toothNumber && ` #${img.toothNumber}`}
                            </div>
                            <button
                              onClick={() => removeImage(idx)}
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: C.red,
                                border: "none",
                                borderRadius: "50%",
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <X size={12} color="white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                    <button
                      onClick={() => setShowTreatmentForm(false)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.bg,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={createTreatmentMut.isPending}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 8,
                        background: C.teal,
                        border: "none",
                        color: "white",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: createTreatmentMut.isPending ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {createTreatmentMut.isPending ? (
                        <>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.5s linear infinite" }} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Start Treatment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}