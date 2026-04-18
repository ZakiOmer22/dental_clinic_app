import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, Save, X, Activity, AlertCircle, CheckCircle2,
    Heart, Brain, Lung, Syringe, Pill, AlertTriangle,
    Search, ChevronDown, User, Calendar, Clock,
    FileText, Plus, Trash2, Edit2, Eye, Download,
    Stethoscope, Thermometer, Droplet, Bone, EyeIcon,
    Microscope, Shield, Moon, Apple, Coffee, Smile
} from "lucide-react";
import { apiGetPatients, apiGetPatient, apiUpdatePatient } from "@/api/patients";
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

const MEDICAL_CONDITIONS = [
    "Hypertension",
    "Diabetes",
    "Heart Disease",
    "Asthma",
    "Allergies",
    "Anemia",
    "Thyroid Disorders",
    "Hepatitis",
    "HIV/AIDS",
    "Cancer",
    "Autoimmune Disease",
    "Kidney Disease",
    "Liver Disease",
    "Epilepsy",
    "Mental Health Condition",
    "Other"
];

const ALLERGIES_LIST = [
    "Penicillin",
    "Amoxicillin",
    "Latex",
    "Iodine",
    "Aspirin",
    "NSAIDs",
    "Codeine",
    "Sulfa Drugs",
    "Local Anesthetics",
    "Nickel",
    "Shellfish",
    "Peanuts",
    "Other"
];

const MEDICATIONS_LIST = [
    "Blood Thinners",
    "Antibiotics",
    "Antihypertensives",
    "Insulin",
    "Steroids",
    "Pain Relievers",
    "Antidepressants",
    "Antianxiety",
    "Anticonvulsants",
    "Other"
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

    const patients = patientsData?.data || patientsData || [];

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
                                {selectedPatient.patient_number || `PT-${selectedPatient.id}`} · {selectedPatient.phone || "No phone"}
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
                                    {searchQuery ? `No patients found matching "${searchQuery}"` : "No patients found"}
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
                                                {patient.patient_number || `PT-${patient.id}`} · {patient.phone || "No phone"}
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

function MedicalHistorySection({
    title,
    icon: Icon,
    items,
    value,
    onChange,
    onRemove,
    color,
    isEditing
}: {
    title: string;
    icon: any;
    items: string[];
    value: string[];
    onChange: (value: string[]) => void;
    onRemove: (item: string) => void;
    color: string;
    isEditing: boolean;
}) {
    const [customItem, setCustomItem] = useState("");
    const [showCustom, setShowCustom] = useState(false);

    const handleAdd = () => {
        if (customItem && !value.includes(customItem)) {
            onChange([...value, customItem]);
            setCustomItem("");
            setShowCustom(false);
        }
    };

    const handleSelectFromList = (item: string) => {
        if (!value.includes(item)) {
            onChange([...value, item]);
        }
    };

    return (
        <div style={{
            background: C.bg,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: "20px",
            marginBottom: 20,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <Icon size={16} color={color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
            </div>

            {/* Current Items */}
            {value.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>
                        Current {title}:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {value.map(item => (
                            <span
                                key={item}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "4px 10px",
                                    borderRadius: 20,
                                    background: `${color}10`,
                                    color: color,
                                    fontSize: 12,
                                }}
                            >
                                {item}
                                {isEditing && (
                                    <button
                                        onClick={() => onRemove(item)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            display: "flex",
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {isEditing && (
                <>
                    {/* Common Items List */}
                    <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
                            Common {title}:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {items.map(item => (
                                <button
                                    key={item}
                                    onClick={() => handleSelectFromList(item)}
                                    disabled={value.includes(item)}
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: 20,
                                        border: `1px solid ${value.includes(item) ? C.border : color}`,
                                        background: value.includes(item) ? C.bgMuted : C.bg,
                                        color: value.includes(item) ? C.muted : color,
                                        fontSize: 11,
                                        cursor: value.includes(item) ? "not-allowed" : "pointer",
                                        opacity: value.includes(item) ? 0.5 : 1,
                                    }}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Custom */}
                    {!showCustom ? (
                        <button
                            onClick={() => setShowCustom(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: `1px dashed ${C.border}`,
                                background: C.bgMuted,
                                fontSize: 12,
                                cursor: "pointer",
                                color: C.muted,
                            }}
                        >
                            <Plus size={12} />
                            Add Custom {title.slice(0, -1)}
                        </button>
                    ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                type="text"
                                value={customItem}
                                onChange={(e) => setCustomItem(e.target.value)}
                                placeholder={`Enter custom ${title.slice(0, -1).toLowerCase()}...`}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    outline: "none",
                                }}
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!customItem}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: 8,
                                    background: customItem ? C.teal : C.muted,
                                    border: "none",
                                    color: "white",
                                    fontSize: 12,
                                    cursor: customItem ? "pointer" : "not-allowed",
                                }}
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setShowCustom(false)}
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
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssistantMedicalHistoryPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        conditions: [] as string[],
        allergies: [] as string[],
        medications: [] as string[],
        smoking: false,
        alcohol: false,
        pregnancy: false,
        bloodType: "",
        notes: "",
    });

    // Fetch patient data
    const { data: patientData, isLoading: patientLoading, refetch } = useQuery({
        queryKey: ["patient", selectedPatient?.id],
        queryFn: () => apiGetPatient(selectedPatient.id),
        enabled: !!selectedPatient && showHistory,
    });

    const patient = patientData?.data || patientData;

    // Initialize form data from patient data
    useEffect(() => {
        if (patient) {
            setFormData({
                conditions: patient.medical_conditions || patient.conditions || [],
                allergies: patient.allergies || [],
                medications: patient.medications || [],
                smoking: patient.smoking || false,
                alcohol: patient.alcohol || false,
                pregnancy: patient.pregnancy || false,
                bloodType: patient.blood_type || "",
                notes: patient.medical_notes || "",
            });
        }
    }, [patient]);

    const updatePatientMutation = useMutation({
        mutationFn: async (data: any) => {
            // Get the current full patient data
            const currentPatient = await apiGetPatient(selectedPatient.id);
            const fullPatient = currentPatient?.data || currentPatient;

            // Merge the updated medical fields with existing patient data
            const updatedPatient = {
                ...fullPatient,
                medical_conditions: data.medical_conditions,
                allergies: data.allergies,
                medications: data.medications,
                smoking: data.smoking,
                alcohol: data.alcohol,
                pregnancy: data.pregnancy,
                blood_type: data.blood_type,
                medical_notes: data.medical_notes,
            };

            return await apiUpdatePatient(selectedPatient.id, updatedPatient);
        },
        onSuccess: () => {
            toast.success("Medical history updated");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["patient", selectedPatient?.id] });
            refetch();
        },
        onError: (error: any) => {
            console.error("Update error:", error);
            toast.error(error?.response?.data?.message || "Failed to update medical history");
        },
    });

    const handleSave = () => {
        updatePatientMutation.mutate({
            medical_conditions: formData.conditions,
            allergies: formData.allergies,
            medications: formData.medications,
            smoking: formData.smoking,
            alcohol: formData.alcohol,
            pregnancy: formData.pregnancy,
            blood_type: formData.bloodType,
            medical_notes: formData.notes,
        });
    };

    const handleViewHistory = () => {
        if (!selectedPatient) {
            toast.error("Please select a patient first");
            return;
        }
        setShowHistory(true);
    };

    const removeCondition = (condition: string) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.filter(c => c !== condition)
        }));
    };

    const removeAllergy = (allergy: string) => {
        setFormData(prev => ({
            ...prev,
            allergies: prev.allergies.filter(a => a !== allergy)
        }));
    };

    const removeMedication = (medication: string) => {
        setFormData(prev => ({
            ...prev,
            medications: prev.medications.filter(m => m !== medication)
        }));
    };

    const getAlertLevel = () => {
        let alerts = 0;
        if (formData.conditions.length > 0) alerts++;
        if (formData.allergies.length > 0) alerts++;
        if (formData.smoking || formData.alcohol) alerts++;
        if (formData.medications.length > 0) alerts++;
        if (alerts >= 3) return C.red;
        if (alerts >= 1) return C.amber;
        return C.teal;
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
                                Medical History
                            </h1>
                            <p style={{ fontSize: 13, color: C.muted }}>
                                View and manage patient medical records
                            </p>
                        </div>
                    </div>
                </div>

                {!showHistory ? (
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
                            onClick={handleViewHistory}
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
                            <Heart size={18} />
                            View Medical History for {selectedPatient?.full_name?.split(" ")[0] || "Patient"}
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
                                        {selectedPatient.patient_number || `PT-${selectedPatient.id}`} · {selectedPatient.phone || "No phone"}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: 8,
                                            background: C.teal,
                                            color: "white",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <Edit2 size={14} />
                                        Edit History
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
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
                                            disabled={updatePatientMutation.isPending}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: 8,
                                                background: C.teal,
                                                border: "none",
                                                color: "white",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: updatePatientMutation.isPending ? "not-allowed" : "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                            }}
                                        >
                                            {updatePatientMutation.isPending ? (
                                                <>
                                                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.5s linear infinite" }} />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={14} />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setShowHistory(false);
                                        setSelectedPatient(null);
                                        setIsEditing(false);
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
                        </div>

                        {/* Alert Banner */}
                        {(formData.conditions.length > 0 || formData.allergies.length > 0 || formData.medications.length > 0 || formData.smoking || formData.alcohol) && (
                            <div style={{
                                background: `${getAlertLevel()}10`,
                                border: `1px solid ${getAlertLevel()}30`,
                                borderRadius: 12,
                                padding: "12px 16px",
                                marginBottom: 24,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}>
                                <AlertTriangle size={20} color={getAlertLevel()} />
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: getAlertLevel() }}>
                                        Medical Alert
                                    </p>
                                    <p style={{ fontSize: 12, color: C.muted }}>
                                        This patient has {formData.conditions.length} condition(s), {formData.allergies.length} allergy(ies), and {formData.medications.length} medication(s) on record.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Medical History Sections */}
                        <MedicalHistorySection
                            title="Medical Conditions"
                            icon={Stethoscope}
                            items={MEDICAL_CONDITIONS}
                            value={formData.conditions}
                            onChange={(val) => setFormData(prev => ({ ...prev, conditions: val }))}
                            onRemove={removeCondition}
                            color={C.red}
                            isEditing={isEditing}
                        />

                        <MedicalHistorySection
                            title="Allergies"
                            icon={AlertCircle}
                            items={ALLERGIES_LIST}
                            value={formData.allergies}
                            onChange={(val) => setFormData(prev => ({ ...prev, allergies: val }))}
                            onRemove={removeAllergy}
                            color={C.amber}
                            isEditing={isEditing}
                        />

                        <MedicalHistorySection
                            title="Current Medications"
                            icon={Pill}
                            items={MEDICATIONS_LIST}
                            value={formData.medications}
                            onChange={(val) => setFormData(prev => ({ ...prev, medications: val }))}
                            onRemove={removeMedication}
                            color={C.blue}
                            isEditing={isEditing}
                        />

                        {/* Lifestyle & Additional Info */}
                        <div style={{
                            background: C.bg,
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            padding: "20px",
                            marginBottom: 20,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: `${C.purple}15`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <Heart size={16} color={C.purple} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Lifestyle & Additional Info</h3>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.smoking}
                                        onChange={(e) => setFormData(prev => ({ ...prev, smoking: e.target.checked }))}
                                        disabled={!isEditing}
                                        style={{ width: 16, height: 16 }}
                                    />
                                    <span style={{ fontSize: 12, color: C.text }}>Smoker</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.alcohol}
                                        onChange={(e) => setFormData(prev => ({ ...prev, alcohol: e.target.checked }))}
                                        disabled={!isEditing}
                                        style={{ width: 16, height: 16 }}
                                    />
                                    <span style={{ fontSize: 12, color: C.text }}>Alcohol Consumption</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.pregnancy}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pregnancy: e.target.checked }))}
                                        disabled={!isEditing}
                                        style={{ width: 16, height: 16 }}
                                    />
                                    <span style={{ fontSize: 12, color: C.text }}>Pregnant</span>
                                </label>
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>
                                    Blood Type
                                </label>
                                <select
                                    value={formData.bloodType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                                    disabled={!isEditing}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        background: isEditing ? C.bg : C.bgMuted,
                                    }}
                                >
                                    <option value="">Select Blood Type</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div style={{
                            background: C.bg,
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            padding: "20px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: `${C.teal}15`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <FileText size={16} color={C.teal} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Medical Notes</h3>
                            </div>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                disabled={!isEditing}
                                placeholder="Add important medical notes, history, or observations..."
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontFamily: "inherit",
                                    resize: "vertical",
                                    background: isEditing ? C.bg : C.bgMuted,
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}