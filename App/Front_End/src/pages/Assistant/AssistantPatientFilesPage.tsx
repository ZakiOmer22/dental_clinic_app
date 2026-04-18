import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Upload, FileText, Image, X, Download, Trash2,
  Search, Filter, Calendar, User, Eye, FolderOpen,
  File, FileImage, FileArchive, FileSpreadsheet, FileCode,
  MoreVertical, CheckCircle2, AlertCircle, Clock,
  Plus, Grid3x3, List, ChevronDown, Printer, Share2
} from "lucide-react";
import { apiGetPatients, apiGetPatientFiles } from "@/api/patients";
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

const FILE_CATEGORIES = [
  { value: "all", label: "All Files", icon: FileText },
  { value: "xray", label: "X-Rays", icon: FileImage },
  { value: "photo", label: "Photos", icon: Image },
  { value: "document", label: "Documents", icon: FileText },
  { value: "consent", label: "Consent Forms", icon: FileText },
  { value: "prescription", label: "Prescriptions", icon: FileText },
  { value: "lab", label: "Lab Orders", icon: FileText },
  { value: "other", label: "Other", icon: File },
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

function FileCard({ file, onDownload, onDelete, onView }: {
  file: any;
  onDownload: (file: any) => void;
  onDelete: (file: any) => void;
  onView: (file: any) => void;
}) {
  const getFileIcon = (type: string) => {
    if (type === "xray" || type === "photo") return FileImage;
    if (type === "document") return FileText;
    if (type === "consent") return FileText;
    if (type === "prescription") return FileText;
    if (type === "lab") return FileText;
    return File;
  };
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      xray: C.blue,
      photo: C.purple,
      document: C.teal,
      consent: C.amber,
      prescription: C.red,
      lab: C.amber,
    };
    return colors[category] || C.gray;
  };
  
  const IconComponent = getFileIcon(file.category);
  const categoryColor = getCategoryColor(file.category);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "16px",
      transition: "all 0.2s",
      position: "relative",
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
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: `${categoryColor}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <IconComponent size={24} color={categoryColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {file.name || file.file_name || "Untitled"}
          </p>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
            {file.category?.toUpperCase() || "DOCUMENT"} • {formatDate(file.created_at || file.uploaded_at)}
          </p>
          {file.tooth_number && (
            <p style={{ fontSize: 11, color: C.teal }}>
              Tooth #{file.tooth_number}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onView(file)}
            style={{
              padding: "6px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="View"
          >
            <Eye size={14} color={C.muted} />
          </button>
          <button
            onClick={() => onDownload(file)}
            style={{
              padding: "6px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Download"
          >
            <Download size={14} color={C.muted} />
          </button>
          <button
            onClick={() => onDelete(file)}
            style={{
              padding: "6px",
              borderRadius: 6,
              border: `1px solid ${C.redBorder}`,
              background: C.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Delete"
          >
            <Trash2 size={14} color={C.red} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilePreviewModal({ file, onClose }: { file: any; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
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
        maxWidth: 800,
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            {file.name || file.file_name}
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
        <div style={{ padding: 20, textAlign: "center" }}>
          {file.category === "xray" || file.category === "photo" ? (
            <img
              src={file.url || file.preview}
              alt={file.name}
              style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }}
            />
          ) : (
            <div style={{
              padding: "40px",
              textAlign: "center",
              background: C.bgMuted,
              borderRadius: 8,
            }}>
              <FileText size={48} color={C.faint} />
              <p style={{ marginTop: 12, color: C.muted }}>Preview not available</p>
              <button
                onClick={() => window.open(file.url, "_blank")}
                style={{
                  marginTop: 12,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: C.teal,
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssistantPatientFilesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showFiles, setShowFiles] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  // Fetch patient files
  const { data: filesData, isLoading: filesLoading, refetch } = useQuery({
    queryKey: ["patient-files", selectedPatient?.id],
    queryFn: () => apiGetPatientFiles(selectedPatient.id),
    enabled: !!selectedPatient && showFiles,
  });
  
  const files = filesData?.data || filesData || [];
  
  // Filter files
  const filteredFiles = React.useMemo(() => {
    let filtered = files;
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter((f: any) => f.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((f: any) =>
        f.name?.toLowerCase().includes(query) ||
        f.file_name?.toLowerCase().includes(query) ||
        f.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [files, selectedCategory, searchQuery]);
  
  const uploadMutation = useMutation({
    mutationFn: async ({ file, category, toothNumber, description }: { 
      file: File; 
      category: string; 
      toothNumber?: string; 
      description?: string;
    }) => {
      return await apiUploadFile(
        selectedPatient.id,
        file,
        category,
        toothNumber,
        description
      );
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      refetch();
      setUploading(false);
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast.error(error?.response?.data?.message || "Failed to upload file");
      setUploading(false);
    },
  });

  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = Array.from(e.target.files || []);
    if (filesList.length === 0) return;
    
    const category = window.prompt("Select category (xray, photo, document, consent, prescription, lab, other):", "document");
    if (!category) return;
    
    const toothNumber = window.prompt("Tooth number (optional):", "");
    const description = window.prompt("Description (optional):", "");
    
    setUploading(true);
    filesList.forEach(file => {
      uploadMutation.mutate({ 
        file, 
        category, 
        toothNumber: toothNumber || undefined,
        description: description || undefined
      });
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleDownload = (file: any) => {
    if (file.url) {
      window.open(file.url, "_blank");
    } else {
      toast.error("Download URL not available");
    }
  };
  
  const handleDelete = (file: any) => {
    if (confirm(`Are you sure you want to delete "${file.name || file.file_name}"?`)) {
      deleteMutation.mutate(file.id);
    }
  };
  
  const handleViewFiles = () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }
    setShowFiles(true);
  };
  
  const getCategoryCount = (category: string) => {
    if (category === "all") return files.length;
    return files.filter((f: any) => f.category === category).length;
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
                Patient Files
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Upload and manage patient documents, X-rays, and images
              </p>
            </div>
          </div>
        </div>

        {!showFiles ? (
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
              onClick={handleViewFiles}
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
              <FolderOpen size={18} />
              View Files for {selectedPatient?.full_name?.split(" ")[0] || "Patient"}
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
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  style={{ display: "none" }}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
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
                  <Upload size={14} />
                  Upload Files
                </label>
                <button
                  onClick={() => {
                    setShowFiles(false);
                    setSelectedPatient(null);
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
            
            {/* Upload Status */}
            {uploading && (
              <div style={{
                background: C.blueBg,
                border: `1px solid ${C.blueBorder}`,
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.blueBorder}`, borderTopColor: C.blue, animation: "spin 0.7s linear infinite" }} />
                <span style={{ fontSize: 12, color: C.blueText }}>Uploading files...</span>
              </div>
            )}
            
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
                    placeholder="Search files by name or category..."
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
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
                    }}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
              
              {/* Category Filters */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {FILE_CATEGORIES.map(cat => {
                  const IconComponent = cat.icon;
                  const count = getCategoryCount(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 20,
                        border: `1px solid ${selectedCategory === cat.value ? C.tealBorder : C.border}`,
                        background: selectedCategory === cat.value ? C.tealBg : C.bg,
                        color: selectedCategory === cat.value ? C.tealText : C.muted,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      <IconComponent size={12} />
                      {cat.label}
                      {count > 0 && (
                        <span style={{
                          fontSize: 10,
                          padding: "0 4px",
                          borderRadius: 10,
                          background: selectedCategory === cat.value ? `${C.teal}20` : C.bgMuted,
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Results Count */}
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, color: C.muted }}>
                {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
              </p>
            </div>
            
            {/* Files Grid/List */}
            {filesLoading ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 13, color: C.muted }}>Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div style={{
                background: C.bg,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "60px 20px",
                textAlign: "center",
              }}>
                <Upload size={48} color={C.faint} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>No files found</p>
                <p style={{ fontSize: 12, color: C.muted }}>
                  {searchQuery ? `No results for "${searchQuery}"` : "Upload files to get started"}
                </p>
                <label
                  htmlFor="file-upload"
                  style={{
                    display: "inline-block",
                    marginTop: 16,
                    padding: "8px 20px",
                    borderRadius: 8,
                    background: C.teal,
                    color: "white",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Upload Files
                </label>
              </div>
            ) : viewMode === "grid" ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
              }}>
                {filteredFiles.map((file: any) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onView={setPreviewFile}
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
                  gridTemplateColumns: "40px 1fr 100px 120px 100px",
                  padding: "12px 16px",
                  background: C.bgMuted,
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.muted,
                }}>
                  <div></div>
                  <div>Name</div>
                  <div>Category</div>
                  <div>Date</div>
                  <div>Actions</div>
                </div>
                {filteredFiles.map((file: any) => {
                  const getCategoryColor = (cat: string) => {
                    const colors: Record<string, string> = {
                      xray: C.blue, photo: C.purple, document: C.teal,
                      consent: C.amber, prescription: C.red, lab: C.amber,
                    };
                    return colors[cat] || C.gray;
                  };
                  const formatDate = (date: string) => {
                    if (!date) return "—";
                    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                  };
                  return (
                    <div
                      key={file.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr 100px 120px 100px",
                        padding: "12px 16px",
                        borderBottom: `1px solid ${C.border}`,
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${getCategoryColor(file.category)}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <FileText size={14} color={getCategoryColor(file.category)} />
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                          {file.name || file.file_name}
                        </p>
                        {file.tooth_number && (
                          <p style={{ fontSize: 10, color: C.teal }}>Tooth #{file.tooth_number}</p>
                        )}
                      </div>
                      <div>
                        <span style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: `${getCategoryColor(file.category)}15`,
                          color: getCategoryColor(file.category),
                        }}>
                          {file.category?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: C.muted }}>
                          {formatDate(file.created_at || file.uploaded_at)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setPreviewFile(file)}
                          style={{ padding: 4, cursor: "pointer", background: "none", border: "none" }}
                        >
                          <Eye size={14} color={C.muted} />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          style={{ padding: 4, cursor: "pointer", background: "none", border: "none" }}
                        >
                          <Download size={14} color={C.muted} />
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          style={{ padding: 4, cursor: "pointer", background: "none", border: "none" }}
                        >
                          <Trash2 size={14} color={C.red} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
}