// ══════════════════════════════════════════════════════════════════════════════
// SOORGREEN AI ENGINE — Secured with Authentication & Data Sanitization
// ══════════════════════════════════════════════════════════════════════════════

const AI_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT || "";

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Auth helpers
// ══════════════════════════════════════════════════════════════════════════════

function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getCurrentUser(): { id: number; role: string; clinicId: number } | null {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Role-based access for AI clinical features
// ══════════════════════════════════════════════════════════════════════════════

const CLINICAL_AI_ROLES = ['admin', 'dentist']; // Only dentists and admins can use diagnostic AI

function checkClinicalAIAccess(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return CLINICAL_AI_ROLES.includes(user.role);
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Sanitize patient data before sending to external AI
// ══════════════════════════════════════════════════════════════════════════════

const PHI_FIELDS = [
  'full_name', 'first_name', 'last_name', 'email', 'phone', 'mobile',
  'address', 'city', 'state', 'zip_code', 'zipCode',
  'date_of_birth', 'dateOfBirth', 'national_id', 'nationalId',
  'insurance_policy_number', 'insurancePolicyNumber',
  'emergency_contact_name', 'emergencyContactName',
  'emergency_contact_phone', 'emergencyContactPhone',
  'ssn', 'passport', 'driver_license'
];

function sanitizePatientDataForAI(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizePatientDataForAI(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (PHI_FIELDS.includes(key) || PHI_FIELDS.includes(key.replace(/_/g, ''))) {
        sanitized[key] = '[REDACTED-PHI]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizePatientDataForAI(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Audit logging for AI clinical features
// ══════════════════════════════════════════════════════════════════════════════

async function logClinicalAIAction(action: string, details: any): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  
  const user = getCurrentUser();
  
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/api/v1/audit-logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'CLINICAL_AI_' + action,
        entity: 'clinical_ai',
        userId: user?.id,
        clinicId: user?.clinicId,
        metadata: {
          endpoint: AI_ENDPOINT,
          ...details,
        },
      }),
    });
  } catch (err) {
    console.warn('[Clinical AI Security] Failed to log action:', err);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Make authenticated request to AI endpoint
// ══════════════════════════════════════════════════════════════════════════════

async function authenticatedAIFetch(
  path: string,
  body: any,
  options: { requireClinicalAccess?: boolean } = {}
): Promise<any> {
  // 1. Check authentication
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  
  // 2. Check clinical access if required
  if (options.requireClinicalAccess && !checkClinicalAIAccess()) {
    await logClinicalAIAction('ACCESS_DENIED', { path, reason: 'insufficient_role' });
    throw new Error('Clinical AI features require dentist or admin privileges');
  }
  
  // 3. Check if endpoint is configured
  if (!AI_ENDPOINT) {
    throw new Error('AI endpoint not configured');
  }
  
  // 4. Make request with auth header
  const res = await fetch(AI_ENDPOINT + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }
    if (res.status === 403) {
      throw new Error('Access denied. Insufficient permissions.');
    }
    throw new Error(`AI service error: ${res.status}`);
  }
  
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — Diagnosis Suggestion (Clinical - Requires Dentist/Admin)
// ══════════════════════════════════════════════════════════════════════════════

export const getDiagnosisSuggestion = async (symptoms: string): Promise<{
  suggestion: string;
  confidence?: number;
  differentialDiagnoses?: string[];
  disclaimer?: string;
}> => {
  try {
    // Sanitize symptoms input
    const sanitizedSymptoms = symptoms.replace(/[^\w\s.,;()-]/g, '').substring(0, 500);
    
    const data = await authenticatedAIFetch("/diagnose", {
      symptoms: sanitizedSymptoms,
      timestamp: new Date().toISOString(),
    }, { requireClinicalAccess: true });
    
    await logClinicalAIAction('DIAGNOSIS_REQUESTED', {
      symptomsLength: sanitizedSymptoms.length,
      hasSuggestion: !!data.suggestion,
    });
    
    return {
      suggestion: data.suggestion || "No suggestion available.",
      confidence: data.confidence,
      differentialDiagnoses: data.differentialDiagnoses,
      disclaimer: data.disclaimer || "⚠️ This is an AI suggestion only. Clinical judgment required.",
    };
  } catch (error: any) {
    console.error("Diagnosis suggestion error:", error);
    await logClinicalAIAction('DIAGNOSIS_ERROR', { error: error.message });
    
    return {
      suggestion: `Unable to generate suggestion: ${error.message}`,
      disclaimer: "AI diagnosis unavailable. Please use clinical judgment.",
    };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — Patient Risk Score (Clinical - Requires Dentist/Admin)
// ══════════════════════════════════════════════════════════════════════════════

export const getPatientRiskScore = async (patientData: any): Promise<{
  score: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  factors: string[];
  disclaimer?: string;
}> => {
  try {
    // Sanitize patient data - remove all PHI before sending to AI
    const sanitizedData = sanitizePatientDataForAI(patientData);
    
    const data = await authenticatedAIFetch("/risk", {
      patientData: sanitizedData,
      timestamp: new Date().toISOString(),
    }, { requireClinicalAccess: true });
    
    const score = data.score ?? 0;
    let riskLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    if (score >= 75) riskLevel = 'severe';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 25) riskLevel = 'moderate';
    
    await logClinicalAIAction('RISK_ASSESSMENT', {
      score,
      riskLevel,
      factorsCount: data.factors?.length || 0,
    });
    
    return {
      score,
      riskLevel,
      factors: data.factors || [],
      disclaimer: data.disclaimer || "⚠️ Risk assessment is a screening tool only. Not a clinical diagnosis.",
    };
  } catch (error: any) {
    console.error("Patient risk score error:", error);
    await logClinicalAIAction('RISK_ERROR', { error: error.message });
    
    return {
      score: 0,
      riskLevel: 'low',
      factors: [],
      disclaimer: "Risk assessment unavailable. Please evaluate patient manually.",
    };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — Chatbot Reply (General - All authenticated users)
// ══════════════════════════════════════════════════════════════════════════════

export const getChatbotReply = async (
  message: string,
  history: any[]
): Promise<{
  reply: string;
  suggestions?: string[];
}> => {
  try {
    // Check authentication
    const token = getAuthToken();
    if (!token) {
      return {
        reply: "⚠️ Please log in to use the AI assistant.",
        suggestions: ["Log in to continue"],
      };
    }
    
    if (!AI_ENDPOINT) {
      return {
        reply: "AI assistant is currently being configured. Please check back later.",
        suggestions: ["Contact support for assistance"],
      };
    }
    
    // Sanitize message and history
    const sanitizedMessage = message.replace(/[^\w\s.,!?@#$%&*()-]/g, '').substring(0, 1000);
    const sanitizedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content?.replace(/[^\w\s.,!?@#$%&*()-]/g, '').substring(0, 500) || '',
    }));
    
    const res = await fetch(AI_ENDPOINT + "/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: sanitizedMessage,
        history: sanitizedHistory,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        return {
          reply: "⚠️ Your session has expired. Please log in again.",
          suggestions: ["Log in"],
        };
      }
      throw new Error(`Chat service error: ${res.status}`);
    }
    
    const data = await res.json();
    
    return {
      reply: data.reply || "I'm not sure how to respond to that.",
      suggestions: data.suggestions,
    };
  } catch (error: any) {
    console.error("Chatbot reply error:", error);
    
    return {
      reply: "I'm having trouble connecting to the AI service. Please try again in a moment.",
      suggestions: ["Try again", "Contact support"],
    };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — Check if clinical AI features are available for current user
// ══════════════════════════════════════════════════════════════════════════════

export const canUseClinicalAI = (): boolean => {
  return checkClinicalAIAccess() && !!AI_ENDPOINT && !!getAuthToken();
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — Get AI service status
// ══════════════════════════════════════════════════════════════════════════════

export const getAIStatus = (): {
  configured: boolean;
  authenticated: boolean;
  clinicalAccess: boolean;
  endpoint: string;
} => {
  return {
    configured: !!AI_ENDPOINT,
    authenticated: !!getAuthToken(),
    clinicalAccess: checkClinicalAIAccess(),
    endpoint: AI_ENDPOINT ? `${AI_ENDPOINT.substring(0, 30)}...` : 'Not configured',
  };
};