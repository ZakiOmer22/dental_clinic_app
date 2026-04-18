import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Save, X, Activity, Stethoscope, Syringe,
  FileText, Plus, Trash2, AlertCircle, CheckCircle2,
  Heart, Upload, Award, Link, Anchor, Search, ChevronDown,
  Clock, Shield, DollarSign, User, Calendar, Percent,
  CheckCircle, XCircle, Building2, RefreshCw
} from "lucide-react";
import { apiGetPatients } from "@/api/patients";
import { apiGetInsurancePolicies, apiValidateInsuranceCoverage } from "@/api/insurance";
import { apiGetProcedures } from "@/api/procedures";
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
  green: "#10b981",
  greenBg: "#f0fdf4",
  greenText: "#059669",
  gray: "#6b7f75",
  grayBg: "#f4f7f5",
};

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

function PatientSelector({ selectedPatient, onSelectPatient }: { 
  selectedPatient: any; 
  onSelectPatient: (patient: any) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["patients", searchQuery],
    queryFn: () => apiGetPatients({ search: searchQuery, limit: 20 }),
  });
  
  const patients = patientsData?.data || [];
  
  const handleSelect = (patient: any) => {
    onSelectPatient(patient);
    setIsOpen(false);
    setSearchQuery("");
  };
  
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
        Patient <span style={{ color: C.red }}>*</span>
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
            onClick={() => onSelectPatient(null)}
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

function PolicyCard({ policy, isSelected, onSelect }: { policy: any; isSelected: boolean; onSelect: () => void }) {
  const usagePercent = ((policy.used_amount || 0) / (policy.annual_limit || 1)) * 100;
  const isExpiringSoon = (() => {
    if (!policy.expiry_date) return false;
    const daysUntil = Math.ceil((new Date(policy.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  })();

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "16px",
        border: `2px solid ${isSelected ? C.teal : C.border}`,
        borderRadius: 12,
        background: isSelected ? C.tealBg : C.bg,
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: 12,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = C.teal;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{policy.provider_name}</p>
          <p style={{ fontSize: 11, color: C.muted }}>Policy: {policy.policy_number}</p>
        </div>
        {isExpiringSoon && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 12, background: C.amberBg, color: C.amberText }}>
            Expiring Soon
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 11, color: C.muted }}>Coverage</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>{policy.coverage_percent}%</p>
        </div>
        <div>
          <span style={{ fontSize: 11, color: C.muted }}>Annual Limit</span>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(policy.annual_limit)}</p>
        </div>
        <div>
          <span style={{ fontSize: 11, color: C.muted }}>Used</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>{formatCurrency(policy.used_amount)}</p>
        </div>
      </div>

      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(usagePercent, 100)}%`,
          height: 4,
          background: usagePercent > 80 ? C.red : usagePercent > 50 ? C.amber : C.teal,
          borderRadius: 2
        }} />
      </div>
    </div>
  );
}

function ProcedureSelector({ procedures, selectedProcedure, onSelect }: { 
  procedures: any[]; 
  selectedProcedure: any; 
  onSelect: (procedure: any) => void;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = procedures.filter(p => 
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
        Procedure <span style={{ color: C.red }}>*</span>
      </label>
      
      {selectedProcedure ? (
        <div style={{
          background: C.tealBg,
          border: `1px solid ${C.tealBorder}`,
          borderRadius: 10,
          padding: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{selectedProcedure.name}</p>
            <p style={{ fontSize: 11, color: C.muted }}>
              {selectedProcedure.category} • {formatCurrency(selectedProcedure.base_price)}
            </p>
          </div>
          <button
            onClick={() => onSelect(null)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.bg,
              fontSize: 11,
              cursor: "pointer",
              color: C.muted,
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div>
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
              {isOpen ? "Search for a procedure..." : "Click to select a procedure"}
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
              maxHeight: 300,
              overflow: "auto",
            }}>
              <div style={{ padding: "12px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search procedure..."
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

              {filtered.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: C.muted }}>No procedures found</div>
              ) : (
                filtered.map(proc => (
                  <div
                    key={proc.id}
                    onClick={() => { onSelect(proc); setIsOpen(false); setSearch(""); }}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${C.border}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.bgMuted; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{proc.name}</p>
                        <p style={{ fontSize: 11, color: C.muted }}>{proc.category}</p>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>
                        {formatCurrency(proc.base_price)}
                      </div>
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

function CoverageResultCard({ result, procedure, policy }: { result: any; procedure: any; policy: any }) {
  if (!result) return null;

  const isCovered = result.covered;
  const coveragePercent = result.coveragePercent;
  const coveredAmount = result.coveredAmount;
  const patientResponsibility = result.patientResponsibility;
  const remainingLimit = result.remainingAnnualLimit;

  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${isCovered ? C.greenBorder : C.redBorder}`,
      borderRadius: 12,
      padding: 20,
      marginTop: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {isCovered ? (
          <CheckCircle size={24} color={C.green} />
        ) : (
          <XCircle size={24} color={C.red} />
        )}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            {isCovered ? "Coverage Verified" : "Coverage Not Available"}
          </h3>
          <p style={{ fontSize: 12, color: C.muted }}>
            {isCovered 
              ? "The selected procedure is covered under this policy" 
              : result.reason || "This procedure is not covered or annual limit exceeded"}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <div style={{ padding: "12px", background: C.bgMuted, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: C.muted }}>Coverage Percentage</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.teal }}>{coveragePercent}%</div>
        </div>
        <div style={{ padding: "12px", background: C.bgMuted, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: C.muted }}>Insurance Pays</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{formatCurrency(coveredAmount)}</div>
        </div>
        <div style={{ padding: "12px", background: C.bgMuted, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: C.muted }}>Patient Pays</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.amber }}>{formatCurrency(patientResponsibility)}</div>
        </div>
        <div style={{ padding: "12px", background: C.bgMuted, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: C.muted }}>Remaining Annual Limit</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.blue }}>{formatCurrency(remainingLimit)}</div>
        </div>
      </div>

      {!isCovered && result.reason && (
        <div style={{ padding: "12px", background: C.amberBg, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} color={C.amber} />
          <span style={{ fontSize: 12, color: C.amberText }}>{result.reason}</span>
        </div>
      )}
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AccountantInsuranceVerificationPage() {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ["insurance-policies", selectedPatient?.id],
    queryFn: () => apiGetInsurancePolicies({ 
      patientId: selectedPatient?.id,
      isActive: true 
    }),
    enabled: !!selectedPatient?.id,
  });

  const { data: proceduresData, isLoading: proceduresLoading } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => apiGetProcedures({ is_active: true }),
  });

  const policies = policiesData?.data || [];
  const procedures = proceduresData?.data || [];

  const validateCoverage = async () => {
    if (!selectedPolicy || !selectedProcedure) {
      toast.error("Please select a policy and procedure");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await apiValidateInsuranceCoverage({
        policyId: selectedPolicy.id,
        procedureCode: selectedProcedure.cdt_code || selectedProcedure.name,
        amount: selectedProcedure.base_price
      });
      setVerificationResult(result);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to verify coverage");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setSelectedPatient(null);
    setSelectedPolicy(null);
    setSelectedProcedure(null);
    setVerificationResult(null);
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
              <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={24} color={C.teal} /> Verify Insurance Coverage
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>
                Check insurance coverage for procedures before treatment
              </p>
            </div>
            {selectedPatient && (
              <button
                onClick={resetVerification}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 12,
                  cursor: "pointer",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RefreshCw size={12} /> Start Over
              </button>
            )}
          </div>
        </div>

        <PatientSelector selectedPatient={selectedPatient} onSelectPatient={setSelectedPatient} />

        {selectedPatient && (
          <>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                Insurance Policy <span style={{ color: C.red }}>*</span>
              </label>
              
              {policiesLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </div>
              ) : policies.length === 0 ? (
                <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 12, padding: "20px", textAlign: "center" }}>
                  <AlertCircle size={24} color={C.amber} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: C.amberText }}>No active insurance policies found for this patient</p>
                </div>
              ) : (
                <div>
                  {policies.map(policy => (
                    <PolicyCard
                      key={policy.id}
                      policy={policy}
                      isSelected={selectedPolicy?.id === policy.id}
                      onSelect={() => {
                        setSelectedPolicy(policy);
                        setVerificationResult(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {selectedPolicy && (
              <>
                <ProcedureSelector
                  procedures={procedures}
                  selectedProcedure={selectedProcedure}
                  onSelect={setSelectedProcedure}
                />

                {selectedProcedure && (
                  <button
                    onClick={validateCoverage}
                    disabled={isVerifying}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 10,
                      background: C.teal,
                      border: "none",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isVerifying ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: isVerifying ? 0.7 : 1,
                      marginTop: 24,
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                        Verifying Coverage...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Verify Coverage
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {verificationResult && (
              <CoverageResultCard
                result={verificationResult}
                procedure={selectedProcedure}
                policy={selectedPolicy}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}