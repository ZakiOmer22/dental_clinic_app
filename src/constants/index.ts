export const ROLES = {
  ADMIN:         "admin",
  DENTIST:       "dentist",
  RECEPTIONIST:  "receptionist",
} as const;

export const APPOINTMENT_STATUSES = {
  SCHEDULED:  "scheduled",
  COMPLETED:  "completed",
  CANCELLED:  "cancelled",
  NO_SHOW:    "no_show",
} as const;

export const PAYMENT_STATUSES = {
  PAID:     "paid",
  PARTIAL:  "partial",
  UNPAID:   "unpaid",
} as const;

export const PAYMENT_METHODS = {
  CASH:   "cash",
  CARD:   "card",
  MOBILE: "mobile",
} as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export const NAV_ITEMS = [
  { label: "Dashboard",     path: "/",              icon: "LayoutDashboard" },
  { label: "Patients",      path: "/patients",      icon: "Users" },
  { label: "Appointments",  path: "/appointments",  icon: "CalendarDays" },
  { label: "Treatments",    path: "/treatments",    icon: "Stethoscope" },
  { label: "Billing",       path: "/billing",       icon: "ReceiptText" },
  { label: "Reports",       path: "/reports",       icon: "BarChart3" },
] as const;
