// ══════════════════════════════════════════════════════════════════════════════
// SECURE AI AGENT FUNCTION HANDLERS - With Auth & RBAC
// ══════════════════════════════════════════════════════════════════════════════

import {
  apiGetAppointments,
  apiSendAppointmentReminder,
  apiSearchPatients,
  apiGetPatient,
  apiGetPatientHistory as apiGetPatientTreatments,
  apiGetDashboardStats,
  apiGetRevenueReport as apiGetRevenue,
  apiCreateNotification,
  apiGetAllergies,
  apiGetConditions,
} from "@/api";

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Get auth token and user from localStorage
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
// SECURITY: Role-based access control for AI functions
// ══════════════════════════════════════════════════════════════════════════════

const FUNCTION_PERMISSIONS: Record<string, string[]> = {
  get_today_appointments: ['admin', 'dentist', 'receptionist', 'assistant'],
  send_appointment_notification: ['admin', 'dentist', 'receptionist'],
  get_doctor_schedule: ['admin', 'dentist', 'receptionist'],
  search_patients: ['admin', 'dentist', 'receptionist', 'assistant', 'accountant'],
  get_patient_info: ['admin', 'dentist', 'receptionist', 'assistant'],
  get_patient_history: ['admin', 'dentist', 'receptionist'],
  get_patient_balance: ['admin', 'dentist', 'receptionist', 'accountant'],
  get_dashboard_stats: ['admin', 'dentist', 'accountant'],
  get_revenue_report: ['admin', 'accountant'],
  get_top_procedures: ['admin', 'dentist'],
  send_notification: ['admin', 'receptionist'],
  create_task: ['admin', 'dentist', 'receptionist'],
  get_low_stock_items: ['admin', 'dentist', 'assistant'],
};

function checkPermission(functionName: string): boolean {
  const user = getCurrentUser();
  if (!user) {
    console.warn(`[AI Security] No user found for function: ${functionName}`);
    return false;
  }
  
  const allowedRoles = FUNCTION_PERMISSIONS[functionName];
  if (!allowedRoles) return true;
  
  const hasPermission = allowedRoles.includes(user.role);
  if (!hasPermission) {
    console.warn(`[AI Security] Permission denied: ${functionName} for role ${user.role}`);
  }
  return hasPermission;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Sanitize sensitive data before returning to AI
// ══════════════════════════════════════════════════════════════════════════════

const SENSITIVE_FIELDS = [
  'password', 'password_hash', 'token', 'refreshToken',
  'credit_card', 'ssn', 'national_id', 'insurance_policy_number',
  'stripe_customer_id', 'stripe_subscription_id', 'full_address',
  'emergency_contact_phone', 'emergency_contact_name'
];

function sanitizeForAI(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForAI(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeForAI(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Audit logging for AI actions
// ══════════════════════════════════════════════════════════════════════════════

async function logAIAction(action: string, details: any): Promise<void> {
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
        action: 'AI_' + action,
        entity: 'ai_agent',
        userId: user?.id,
        clinicId: user?.clinicId,
        metadata: sanitizeForAI(details),
      }),
    });
  } catch (err) {
    console.warn('[AI Security] Failed to log action:', err);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY: Wrapper for all function handlers
// ══════════════════════════════════════════════════════════════════════════════

function secureHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  functionName: string
): T {
  return (async (args: any) => {
    // 1. Check authentication
    const token = getAuthToken();
    if (!token) {
      await logAIAction('AUTH_FAILED', { function: functionName, reason: 'no_token' });
      return {
        status: "error",
        error: "Authentication required. Please log in to use the AI assistant.",
        summary: "Session expired - please log in",
        authRequired: true,
      };
    }
    
    // 2. Check permissions
    if (!checkPermission(functionName)) {
      const user = getCurrentUser();
      await logAIAction('PERMISSION_DENIED', { 
        function: functionName, 
        userRole: user?.role 
      });
      
      return {
        status: "error",
        error: `Permission denied: Your role (${user?.role || 'unknown'}) cannot access this function.`,
        summary: `Access denied for ${functionName}`,
        permissionDenied: true,
      };
    }
    
    // 3. Execute handler
    try {
      const result = await fn(args);
      
      // 4. Log successful action
      await logAIAction('FUNCTION_CALL', {
        function: functionName,
        args: sanitizeForAI(args),
        status: result.status,
      }).catch(() => {});
      
      // 5. Sanitize result before returning
      return {
        ...result,
        data: sanitizeForAI(result.data),
      };
    } catch (error: any) {
      await logAIAction('FUNCTION_ERROR', {
        function: functionName,
        error: error.message,
      });
      throw error;
    }
  }) as T;
}

// ══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT FUNCTIONS (SECURED)
// ══════════════════════════════════════════════════════════════════════════════

async function _getTodayAppointments(args: {
  doctorId?: number;
  status?: string;
}) {
  try {
    const today = new Date().toISOString().split("T")[0];

    let appointments = [];
    try {
      const response = await apiGetAppointments({
        date: today,
        doctorId: args.doctorId,
        status: args.status,
      });
      appointments = response.data?.data || response.data || [];
    } catch (apiError: any) {
      if (apiError.response?.status === 401) {
        return {
          status: "error",
          error: "Authentication required. Please log in again.",
          summary: "Session expired - please log in",
          authRequired: true,
        };
      }
      if (apiError.response?.status === 403) {
        return {
          status: "error",
          error: "You don't have permission to view appointments.",
          summary: "Access denied",
          permissionDenied: true,
        };
      }
      console.warn("Appointments API not available");
      appointments = [];
    }

    return {
      status: "success",
      data: appointments,
      summary: `Found ${appointments.length} appointment(s) for today${
        args.doctorId ? " for this doctor" : ""
      }`,
    };
  } catch (error: any) {
    return {
      status: "error",
      error: error.message || "Failed to fetch appointments",
      summary: "Could not retrieve appointments",
    };
  }
}

async function _sendAppointmentNotification(args: {
  appointmentId: number;
  channel: "sms" | "email" | "both";
  message?: string;
}) {
  try {
    await apiSendAppointmentReminder(args.appointmentId);

    return {
      status: "success",
      message: `Notification sent successfully via ${args.channel}`,
      summary: `Appointment reminder sent to patient`,
    };
  } catch (error: any) {
    return {
      status: "error",
      error: error.message || "Failed to send notification",
      summary: "Could not send reminder",
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PATIENT FUNCTIONS (SECURED with PHI protection)
// ══════════════════════════════════════════════════════════════════════════════

async function _searchPatients(args: { query: string }) {
  try {
    const response = await apiSearchPatients(args.query);

    let patients = [];
    if (response.data?.data) {
      patients = response.data.data;
    } else if (response.data) {
      patients = response.data;
    } else if (Array.isArray(response)) {
      patients = response;
    }

    // Only return non-sensitive patient fields
    const sanitizedPatients = patients.map((p: any) => ({
      id: p.id,
      full_name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      phone: p.phone,
      email: p.email,
      date_of_birth: p.date_of_birth,
      gender: p.gender,
      patient_number: p.patient_number,
    }));

    return {
      status: "success",
      data: sanitizedPatients,
      summary: `Found ${patients.length} patient(s) matching "${args.query}"`,
    };
  } catch (error: any) {
    console.error("Patient search error:", error);
    
    return {
      status: "error",
      error: error.message || "Backend error",
      data: [],
      summary: `Unable to search for "${args.query}" - Service error`,
    };
  }
}

async function _getPatientInfo(args: { patientId: number }) {
  try {
    const response = await apiGetPatient(args.patientId);
    const patient = response.data?.data || response.data;

    // Only return non-sensitive fields to AI
    const sanitized = {
      id: patient.id,
      full_name: patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      phone: patient.phone,
      email: patient.email,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_type: patient.blood_type,
      is_active: patient.is_active,
      patient_number: patient.patient_number,
    };

    return {
      status: "success",
      data: sanitized,
      summary: `Retrieved information for ${sanitized.full_name || "patient"}`,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        status: "error",
        error: "Patient not found",
        summary: "Patient not found",
      };
    }
    return {
      status: "error",
      error: error.message || "Failed to get patient info",
      summary: "Could not retrieve patient information",
    };
  }
}

async function _getPatientHistory(args: { patientId: number }) {
  try {
    const [treatmentsRes, allergiesRes, conditionsRes] = await Promise.all([
      apiGetPatientTreatments(args.patientId).catch(() => ({ data: [] })),
      apiGetAllergies(args.patientId).catch(() => ({ data: [] })),
      apiGetConditions(args.patientId).catch(() => ({ data: [] })),
    ]);

    const treatments = (treatmentsRes.data?.data || treatmentsRes.data || []).slice(0, 10);
    const allergies = allergiesRes.data?.data || allergiesRes.data || [];
    const conditions = conditionsRes.data?.data || conditionsRes.data || [];

    return {
      status: "success",
      data: {
        treatments: treatments.map((t: any) => ({
          id: t.id,
          date: t.treatment_date || t.created_at,
          type: t.treatment_type,
          notes: t.notes?.substring(0, 200),
        })),
        allergies: allergies.map((a: any) => ({ allergen: a.allergen, severity: a.severity })),
        medicalConditions: conditions.map((c: any) => ({ condition: c.condition_name, status: c.status })),
      },
      summary: `Found ${treatments.length} treatment(s), ${allergies.length} allergy/allergies, ${conditions.length} medical condition(s)`,
    };
  } catch (error: any) {
    return {
      status: "error",
      error: error.message || "Failed to get patient history",
      summary: "Could not retrieve patient history",
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS FUNCTIONS (SECURED)
// ══════════════════════════════════════════════════════════════════════════════

async function _getDashboardStats(args: any) {
  try {
    const response = await apiGetDashboardStats();
    const stats = response.data?.data || response.data;

    return {
      status: "success",
      data: stats,
      summary: "Dashboard statistics retrieved successfully",
    };
  } catch (error: any) {
    return {
      status: "error",
      error: error.message || "Failed to get dashboard stats",
      summary: "Could not retrieve dashboard statistics",
    };
  }
}

async function _getRevenueReport(args: {
  startDate: string;
  endDate: string;
  groupBy?: string;
}) {
  try {
    const response = await apiGetRevenue(args);
    const report = response.data?.data || response.data;

    return {
      status: "success",
      data: report,
      summary: `Revenue report from ${args.startDate} to ${args.endDate}`,
    };
  } catch (error: any) {
    return {
      status: "error",
      error: error.message || "Failed to get revenue report",
      summary: "Could not retrieve revenue report",
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN FUNCTIONS (SECURED)
// ══════════════════════════════════════════════════════════════════════════════

async function _sendNotification(args: {
  to: string;
  type: "sms" | "email" | "in_app";
  message: string;
  title?: string;
}) {
  try {
    await apiCreateNotification({
      userId: parseInt(args.to),
      type: "system",
      channel: args.type,
      title: args.title || "Notification",
      message: args.message,
    });

    return {
      status: "success",
      message: `Notification sent via ${args.type}`,
      summary: "Notification sent successfully",
    };
  } catch (error: any) {
    return {
      status: "error",
      error: error.message || "Failed to send notification",
      summary: "Could not send notification",
    };
  }
}

async function _createTask(args: {
  assignedTo: number;
  title: string;
  description?: string;
  priority: string;
  dueDate?: string;
}) {
  try {
    await apiCreateNotification({
      userId: args.assignedTo,
      type: "system",
      channel: "in_app",
      title: `📋 New Task: ${args.title}`,
      message: args.description || args.title,
    });

    return {
      status: "success",
      message: `Task "${args.title}" created and assigned`,
      data: args,
      summary: `Task assigned successfully`,
    };
  } catch (error: any) {
    return {
      status: "error",
      error: error.message || "Failed to create task",
      summary: "Could not create task",
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED SECURED HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export const getTodayAppointments = secureHandler(_getTodayAppointments, 'get_today_appointments');
export const sendAppointmentNotification = secureHandler(_sendAppointmentNotification, 'send_appointment_notification');
export const searchPatients = secureHandler(_searchPatients, 'search_patients');
export const getPatientInfo = secureHandler(_getPatientInfo, 'get_patient_info');
export const getPatientHistory = secureHandler(_getPatientHistory, 'get_patient_history');
export const getDashboardStats = secureHandler(_getDashboardStats, 'get_dashboard_stats');
export const getRevenueReport = secureHandler(_getRevenueReport, 'get_revenue_report');
export const sendNotification = secureHandler(_sendNotification, 'send_notification');
export const createTask = secureHandler(_createTask, 'create_task');

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (unchanged)
// ══════════════════════════════════════════════════════════════════════════════

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}