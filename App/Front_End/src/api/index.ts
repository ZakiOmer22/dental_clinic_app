export { default as apiClient } from "./client";

// ─────────────────────────────
// AUTH
// ─────────────────────────────
export * from "./auth";

// ─────────────────────────────
// CORE MODULES (STRICT EXPORTS ONLY)
// ─────────────────────────────
export * from "./appointments";
export * from "./patients";
export * from "./treatments";
export * from "./billing";
export * from "./inventory";
export * from "./reports";
export * from "./notifications";

// ─────────────────────────────
// CLINICAL
// ─────────────────────────────
export * from "./prescriptions";
export * from "./labOrders";
export * from "./consentForms";
export * from "./referrals";
export * from "./procedures";

// ─────────────────────────────
// STAFF & ADMIN
// ─────────────────────────────
export * from "./staff";
// Explicitly export only non-conflicting members from "./users"
export {
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  // add other exports from "./users" except 'apiResetPassword'
} from "./users";
// export * from "./roles"; // Removed because './roles' module does not exist

// ─────────────────────────────
// FILES (FIXED DUPLICATION)
// ─────────────────────────────
export {
  apiUploadFile,
  apiDeleteFile,
} from "./files";

// ─────────────────────────────
// BACKOFFICE
// ─────────────────────────────
export * from "./audit";
export * from "./settings";
export * from "./financial";
export * from "./insurance";

// ─────────────────────────────
// SYSTEM
// ─────────────────────────────
export * from "./backups";
export * from "./log";
export * from "./tickets";

// ─────────────────────────────
// ENGAGEMENT
// ─────────────────────────────
export * from "./feedback";
export * from "./recall";
export * from "./knowledgeBase";

// ─────────────────────────────
// BILLING HELPERS
// ─────────────────────────────
export {
  apiGetInvoices,
  apiCreateInvoice,
  apiRecordPayment,
  apiDeleteInvoice,
  apiCreatePayment,
  apiGetPayments,
} from "./billing";