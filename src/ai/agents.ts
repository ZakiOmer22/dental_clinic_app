// ══════════════════════════════════════════════════════════════════════════════
// AI AGENT DEFINITIONS - All Specialized Agents (with Secured Handlers)
// ══════════════════════════════════════════════════════════════════════════════

import { Calendar, Users, Stethoscope, BarChart3, Settings, MessageCircle } from "lucide-react";
import { Agent, AgentRole } from "./types";
import { 
  getTodayAppointments, 
  sendAppointmentNotification,
  getPatientInfo,
  getPatientHistory,
  searchPatients,
  getDashboardStats,
  getRevenueReport,
  createTask,
  sendNotification
} from "./agentFunctions";

// ══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT AGENT
// ══════════════════════════════════════════════════════════════════════════════
export const appointmentAgent: Agent = {
  id: "appointment",
  name: "Appointment Agent",
  description: "Manages appointments, scheduling, and reminders",
  icon: Calendar,
  color: "#3b82f6",
  systemPrompt: `You are an expert appointment scheduling assistant for a dental clinic. You help staff:
- View today's appointments and schedules
- Send appointment reminders and notifications
- Check appointment conflicts
- Reschedule or cancel appointments
- Find available time slots
- Send SMS/email notifications to patients

Always be professional, efficient, and patient-focused. When sending notifications, ask for confirmation first.
Provide clear, concise information about appointments including patient name, time, doctor, and procedure.

⚠️ IMPORTANT: You can only access data that the current user has permission to view. If you receive an "Access Denied" message, inform the user they don't have the required permissions.`,
  
  functions: [
    {
      name: "get_today_appointments",
      description: "Get all appointments scheduled for today",
      parameters: {
        type: "object",
        properties: {
          doctorId: {
            type: "number",
            description: "Filter by specific doctor ID (optional)"
          },
          status: {
            type: "string",
            description: "Filter by status: scheduled, confirmed, completed, cancelled (optional)"
          }
        }
      },
      handler: getTodayAppointments
    },
    {
      name: "send_appointment_notification",
      description: "Send appointment reminder to patient via SMS or email",
      parameters: {
        type: "object",
        properties: {
          appointmentId: {
            type: "number",
            description: "The appointment ID"
          },
          channel: {
            type: "string",
            enum: ["sms", "email", "both"],
            description: "Notification channel"
          },
          message: {
            type: "string",
            description: "Custom message (optional)"
          }
        },
        required: ["appointmentId", "channel"]
      },
      handler: sendAppointmentNotification
    }
  ]
};

// ══════════════════════════════════════════════════════════════════════════════
// PATIENT AGENT
// ══════════════════════════════════════════════════════════════════════════════
export const patientAgent: Agent = {
  id: "patient",
  name: "Patient Agent",
  description: "Manages patient information and records",
  icon: Users,
  color: "#8b5cf6",
  systemPrompt: `You are a patient information specialist for a dental clinic. You help staff:
- Search and find patient records quickly
- View patient medical history and allergies
- Check patient balances and billing status
- View treatment history
- Access patient contact information
- Review insurance information

Always protect patient privacy. Be accurate with medical information. Highlight important details like allergies and medical conditions.

⚠️ IMPORTANT: Patient data is protected by HIPAA. Only return information the current user is authorized to see. Sensitive fields like full addresses and national IDs are automatically redacted.`,
  
  functions: [
    {
      name: "search_patients",
      description: "Search for patients by name, phone, or patient number",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (name, phone, or patient number)"
          }
        },
        required: ["query"]
      },
      handler: searchPatients
    },
    {
      name: "get_patient_info",
      description: "Get detailed patient information including contact and insurance",
      parameters: {
        type: "object",
        properties: {
          patientId: {
            type: "number",
            description: "Patient ID"
          }
        },
        required: ["patientId"]
      },
      handler: getPatientInfo
    },
    {
      name: "get_patient_history",
      description: "Get patient's treatment history, allergies, and medical conditions",
      parameters: {
        type: "object",
        properties: {
          patientId: {
            type: "number",
            description: "Patient ID"
          }
        },
        required: ["patientId"]
      },
      handler: getPatientHistory
    }
  ]
};

// ══════════════════════════════════════════════════════════════════════════════
// CLINICAL AGENT
// ══════════════════════════════════════════════════════════════════════════════
export const clinicalAgent: Agent = {
  id: "clinical",
  name: "Clinical Agent",
  description: "Assists with clinical tasks and treatment information",
  icon: Stethoscope,
  color: "#0d9e75",
  systemPrompt: `You are a clinical assistant for dental professionals. You help with:
- Treatment planning and procedure information
- Dental chart interpretation
- Prescription guidance
- Lab order tracking
- Clinical documentation
- CPT/CDT code lookup

Be precise with medical terminology. Always prioritize patient safety. Remind doctors to verify information.`,
  
  functions: [
    {
      name: "lookup_procedure",
      description: "Look up dental procedure information including CDT codes and pricing",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Procedure name or CDT code"
          }
        },
        required: ["query"]
      },
      handler: async (args) => {
        return { status: "success", data: [], summary: "Procedure lookup not yet implemented" };
      }
    }
  ]
};

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS AGENT
// ══════════════════════════════════════════════════════════════════════════════
export const analyticsAgent: Agent = {
  id: "analytics",
  name: "Analytics Agent",
  description: "Provides insights, reports, and data analysis",
  icon: BarChart3,
  color: "#f59e0b",
  systemPrompt: `You are a business intelligence analyst for a dental clinic. You help staff:
- Generate reports and analytics
- Track revenue and financial metrics
- Monitor appointment trends
- Analyze patient acquisition and retention
- Identify operational inefficiencies
- Provide data-driven insights

Present data clearly with key metrics highlighted. Use percentages and comparisons. Suggest actionable improvements.`,
  
  functions: [
    {
      name: "get_dashboard_stats",
      description: "Get today's key metrics for the dashboard",
      parameters: {
        type: "object",
        properties: {}
      },
      handler: getDashboardStats
    },
    {
      name: "get_revenue_report",
      description: "Get revenue report for a date range",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "Start date (YYYY-MM-DD)"
          },
          endDate: {
            type: "string",
            description: "End date (YYYY-MM-DD)"
          },
          groupBy: {
            type: "string",
            enum: ["day", "week", "month"],
            description: "Grouping period"
          }
        },
        required: ["startDate", "endDate"]
      },
      handler: getRevenueReport
    }
  ]
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN AGENT
// ══════════════════════════════════════════════════════════════════════════════
export const adminAgent: Agent = {
  id: "admin",
  name: "Admin Agent",
  description: "Handles administrative tasks and system operations",
  icon: Settings,
  color: "#e53e3e",
  systemPrompt: `You are an administrative assistant for clinic operations. You help with:
- Sending notifications and reminders
- Creating tasks and assignments
- Managing staff schedules
- Inventory alerts
- System notifications
- Document management

Be proactive in suggesting operational improvements. Prioritize urgent tasks. Keep staff informed.`,
  
  functions: [
    {
      name: "send_notification",
      description: "Send notification to staff or patients",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "User ID or patient ID"
          },
          type: {
            type: "string",
            enum: ["sms", "email", "in_app"],
            description: "Notification type"
          },
          message: {
            type: "string",
            description: "Notification message"
          },
          title: {
            type: "string",
            description: "Notification title"
          }
        },
        required: ["to", "type", "message"]
      },
      handler: sendNotification
    },
    {
      name: "create_task",
      description: "Create a task or reminder for staff",
      parameters: {
        type: "object",
        properties: {
          assignedTo: {
            type: "number",
            description: "User ID to assign task to"
          },
          title: {
            type: "string",
            description: "Task title"
          },
          description: {
            type: "string",
            description: "Task description"
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "Task priority"
          },
          dueDate: {
            type: "string",
            description: "Due date (YYYY-MM-DD)"
          }
        },
        required: ["assignedTo", "title", "priority"]
      },
      handler: createTask
    }
  ]
};

// ══════════════════════════════════════════════════════════════════════════════
// GENERAL AGENT
// ══════════════════════════════════════════════════════════════════════════════
export const generalAgent: Agent = {
  id: "general",
  name: "General Assistant",
  description: "General purpose assistant for various tasks",
  icon: MessageCircle,
  color: "#6b7f75",
  systemPrompt: `You are a helpful general assistant for a dental clinic. You can:
- Answer questions about clinic operations
- Provide general information
- Route requests to specialized agents
- Help with basic queries

Be friendly and helpful. If a request requires specialized knowledge, suggest which agent would be better suited.`,
  
  functions: []
};

// ══════════════════════════════════════════════════════════════════════════════
// AGENT REGISTRY
// ══════════════════════════════════════════════════════════════════════════════
export const AGENTS: Record<AgentRole, Agent> = {
  appointment: appointmentAgent,
  patient: patientAgent,
  clinical: clinicalAgent,
  analytics: analyticsAgent,
  admin: adminAgent,
  general: generalAgent,
};

export const getAgent = (role: AgentRole): Agent => AGENTS[role];

export const getAllAgents = (): Agent[] => Object.values(AGENTS);