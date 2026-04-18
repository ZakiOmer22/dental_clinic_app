// // ══════════════════════════════════════════════════════════════════════════════
// // APP ROUTES — Admin + Doctor/Dentist Roles
// // ══════════════════════════════════════════════════════════════════════════════

// import { Routes, Route, Navigate } from "react-router-dom";
// import { useAuthStore } from "@/app/store";

// // Layouts
// import DashboardLayout from "@/layouts/DashboardLayout";
// import DoctorLayout from "@/layouts/DoctorLayout";

// // Auth
// import LoginPage from "@/pages/Login";

// // Admin Routes
// import DashboardPage from "@/pages/admin/Dashboard";
// import PatientsPage from "@/pages/admin/Patients";
// import AppointmentsPage from "@/pages/admin/Appointments";
// import BillingPage from "@/pages/admin/Billing";
// import TreatmentsPage from "@/pages/admin/Treatments";
// import ReportsPage from "@/pages/admin/Reports";
// import PatientProfilePage from "@/pages/admin/PatientProfile";
// import Expensespage from "@/pages/admin/Expensespage";
// import { LabOrdersPage } from "@/pages/admin/LabOrdersPage";
// import { PrescriptionsPage } from "@/pages/admin/Prescriptionspage";
// import { ConsentFormsPage } from "@/pages/admin/Consentformspage";
// import { ReferralsPage } from "@/pages/admin/ReferralsPage";
// import { NotificationsPage } from "@/pages/admin/Notificationspage";
// import InventoryPage from "@/pages/admin/InventoryPage";
// import { StaffPage } from "@/pages/admin/Staffpage";
// import { SettingsPage } from "@/pages/admin/Settingspage";
// import { UsersPage } from "@/pages/admin/Userspage";
// import { BackupRestorePage } from "@/pages/admin/Backuprestorepage";
// import { SystemLogsPage } from "@/pages/admin/Systemlogspage";
// import { AuditTrailPage } from "@/pages/admin/Audittrailpage";
// import { StoragePage } from "@/pages/admin/Storagepage";
// import { HealthMonitorPage } from "@/pages/admin/HealthMonitorPage";
// import { SupportTicketPage } from "@/pages/admin/Supportticketpage";
// import { KnowledgeBasePage } from "@/pages/admin/KnowledgeBasePage";
// import { LiveChatPage } from "@/pages/admin/LiveChatPage";
// import { FeedbackPage } from "@/pages/admin/FeedbackPage";

// // ─── Private Route Guard ──────────────────────────────────────────────────────
// function PrivateRoute({ children }: { children: React.ReactNode }) {
//   const token = useAuthStore((s) => s.token);
//   const hasHydrated = useAuthStore((s) => s._hasHydrated);

//   // Still loading from localStorage
//   if (!hasHydrated) return null;

//   if (!token) return <Navigate to="/login" replace />;
//   return <>{children}</>;
// }

// // ─── Role-based Route Guard ───────────────────────────────────────────────────
// function RoleRoute({
//   children,
//   allowedRoles,
// }: {
//   children: React.ReactNode;
//   allowedRoles: string[];
// }) {
//   const user = useAuthStore((s) => s.user);

//   if (!user || !allowedRoles.includes(user.role)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return <>{children}</>;
// }

// export default function App() {
//   return (
//     <Routes>
//       {/* Public Routes */}
//       <Route path="/login" element={<LoginPage />} />

//       {/* Admin Routes */}
//       <Route
//         path="/"
//         element={
//           <PrivateRoute>
//             <RoleRoute allowedRoles={["admin", "receptionist", "accountant"]}>
//               <DashboardLayout />
//             </RoleRoute>
//           </PrivateRoute>
//         }
//       >
        
//       </Route>

//       {/* Doctor/Dentist Routes */}
//       <Route
//         path="/doctor"
//         element={
//           <PrivateRoute>
//             <RoleRoute allowedRoles={["dentist", "admin"]}>
//               <DoctorLayout />
//             </RoleRoute>
//           </PrivateRoute>
//         }
//       >
//         {/* Dashboard & Schedule */}
//         <Route index element={<DoctorDashboard />} />
//         <Route path="schedule" element={<DoctorSchedule />} />
//         <Route path="today" element={<DoctorTodayPatients />} />
//         <Route path="patients" element={<DoctorPatients />} />

//         {/* Clinical Tools */}
//         <Route path="chart" element={<DoctorDentalChart />} />
//         <Route path="treatments" element={<DoctorTreatments />} />
//         <Route path="procedures" element={<DoctorProcedures />} />
//         <Route path="prescriptions" element={<DoctorPrescriptions />} />

//         {/* Lab & Records */}
//         <Route path="lab-orders" element={<DoctorLabOrders />} />
//         <Route path="consent-forms" element={<DoctorConsentForms />} />
//         <Route path="referrals" element={<DoctorReferrals />} />
//         <Route path="images" element={<DoctorClinicalImages />} />

//         {/* Performance & Analytics */}
//         <Route path="productivity" element={<DoctorProductivity />} />
//         <Route path="analytics" element={<DoctorAnalytics />} />
//         <Route path="knowledge" element={<DoctorKnowledge />} />

//         {/* Settings & Profile */}
//         <Route path="profile" element={<DoctorProfile />} />
//         <Route path="settings" element={<DoctorSettings />} />
//       </Route>

//       {/* Unauthorized & Catch-all */}
//       <Route
//         path="/unauthorized"
//         element={
//           <div
//             style={{
//               height: "100vh",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               flexDirection: "column",
//               gap: 16,
//             }}
//           >
//             <h1 style={{ fontSize: 48, fontWeight: 700 }}>403</h1>
//             <p style={{ fontSize: 16, color: "#7a918b" }}>
//               You don't have permission to access this page.
//             </p>
//             <button
//               onClick={() => window.history.back()}
//               style={{
//                 padding: "10px 20px",
//                 borderRadius: 8,
//                 background: "#0d9e75",
//                 color: "white",
//                 border: "none",
//                 cursor: "pointer",
//                 fontSize: 14,
//                 fontWeight: 600,
//               }}
//             >
//               Go Back
//             </button>
//           </div>
//         }
//       />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }