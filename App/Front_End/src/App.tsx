import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/app/store";

import DashboardLayout from "@/layouts/DashboardLayout";
import DoctorLayout from "@/layouts/Doctors/DoctorLayout";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/admin/Dashboard";
import PatientsPage from "@/pages/admin/Patients";
import AppointmentsPage from "@/pages/admin/Appointments";
import BillingPage from "@/pages/admin/Billing";
import TreatmentsPage from "@/pages/admin/Treatments";
import ReportsPage from "@/pages/admin/Reports";
import PatientProfilePage from "@/pages/admin/PatientProfile";
import Expensespage from "./pages/admin/Expensespage";
import { LabOrdersPage } from "./pages/admin/LabOrdersPage";
import { PrescriptionsPage } from "./pages/admin/Prescriptionspage";
import { ConsentFormsPage } from "./pages/admin/Consentformspage";
import { NotificationsPage } from "./pages/admin/Notificationspage";
import InventoryPage from "./pages/admin/InventoryPage";
import { StaffPage } from "./pages/admin/Staffpage";
import { SettingsPage } from "./pages/admin/Settingspage";
import { UsersPage } from "./pages/admin/Userspage";
import { BackupRestorePage } from "./pages/admin/Backuprestorepage";
import { SystemLogsPage } from "./pages/admin/Systemlogspage";
import { AuditTrailPage } from "./pages/admin/Audittrailpage";
import { StoragePage } from "./pages/admin/Storagepage";
import { SupportTicketPage } from "./pages/admin/Supportticketpage";

// Doctor Routes
import DoctorDashboardPage from "@/pages/Doctor/Dashboard";
import DoctorPatientsPage from "./pages/Doctor/DoctorPatients";
import DoctorPatientProfilePage from "./pages/Doctor/DoctorPatientProfilePage";
import { KnowledgeBasePage } from "./pages/admin/Knowledgebasepage";
import { DoctorFeedbackPage } from "./pages/Doctor/DoctorFeedbackpage";
import { ReceptionFeedbackPage } from "./pages/receptionist/ReceptionistFeedback";
import { DoctorsReferralsPage } from "./pages/Doctor/DoctorsReferralsPage";
import DoctorDentalChartPage from "./pages/Doctor/DoctorDentalChartPage";
import AdminBillingPage from "@/pages/superAdmin/Settings/BillingPage";
import SuperAdminDashboard from "@/pages/superAdmin/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

// Receptionist Routes
import ReceptionistLayout from "./layouts/receptionist/ReceptionistLayout";
import ReceptionistDashboardPage from "./pages/receptionist/Dashboard";
import ReceptionistPatientsPage from "./pages/receptionist/ReceptionistPatients";
import ReceptionistPatientProfilePage from "./pages/receptionist/ReceptionistPatientProfile";
import ReceptionistAppointmentsPage from "./pages/receptionist/ReceptionistAppointement";
import ReceptionistInvoicesPage from "./pages/receptionist/ReceptionistInvoices";
import CalendarView from "./pages/receptionist/ReceptionistCalendarView";
import { ReceptionistConsentFormsPage } from "./pages/receptionist/ReceptionistConsentForm";
import ReceptionistCalendarView from "./pages/receptionist/ReceptionistCalendarView";
import ReceptionistTodaySchedule from "./pages/receptionist/ReceptionistTodaySchedule";
import ReceptionistCheckIn from "./pages/receptionist/ReceptionistCheckIn";
import ReceptionistPatientFiles from "./pages/receptionist/ReceptionistPatientFiles";
import ReceptionistReceipts from "./pages/receptionist/ReceptionistReciepts";
import ReceptionistRoomsPage from "./pages/receptionist/ReceptionistRooms";
import { ReceptionistNotificationsPage } from "./pages/receptionist/ReceptionistNotificationsPage";
import ReceptionistPaymentsPage from "./pages/receptionist/ReceptionistPaymentsPage";

// Assistant Routes
import AssistantLayout from "./layouts/Assistant/AssistanceLayout";
import AssistanceDashboardPage from "./pages/Assistant/Dashboard";
import AssistantTodaySchedule from "./pages/Assistant/AssistantTodaySchedule";
import AssistantPatientsPage from "./pages/Assistant/AssistantPatientsPage";
import AssistantPatientProfilePage from "./pages/Assistant/AssistantPatientProfile";
import AssistantTreatmentsPage from "./pages/Assistant/AssistanceTreatments";
import AssistantStartTreatmentPage from "./pages/Assistant/AssistantStartTreatmentPage";
import AssistantDentalChartPage from "./pages/Assistant/AssistantDentalChartPage";
import AssistantProceduresPage from "./pages/Assistant/AssistantProceduresPage";
import AssistantPatientFilesPage from "./pages/Assistant/AssistantPatientFilesPage";
import AssistantMedicalHistoryPage from "./pages/Assistant/AssistantMedicalHistoryPage";
import AssistantRoomsPage from "./pages/Assistant/AssistantRoomsPage";
import { AssistantPrescriptionsPage } from "./pages/Assistant/AssistantPrescriptionsPage";
import { AssistantLabOrdersPage } from "./pages/Assistant/AssistantLabOrdersPage";
import { AssistantConsentFormsPage } from "./pages/Assistant/AssistantConsentFormsPage";
import AssistantInventoryPage from "./pages/Assistant/AssistantInventoryPage";
import { AssistantKnowledgeBasePage } from "./pages/Assistant/AssistantKnowledgeBasePage";
import { AssistantFeedbackPage } from "./pages/Assistant/AssistantFeedbackPage";
import { AssistantNotificationsPage } from "./pages/Assistant/AssistantNotificationsPage";
import { AssistantReferralsPage } from "./pages/Assistant/AssistantReferralsPage";

// Accountant Routes
import AccountantLayout from "./layouts/Accountant/AccountantLayout";
import AccountantDashboardPage from "./pages/accountant/Dashboard";
import AccountantReportsPage from "./pages/accountant/AccountantReportsPage";
import AccountantInvoicesPage from "./pages/accountant/AccountantInvoicesPage";
import AccountantCreateInvoicePage from "./pages/accountant/AccountantCreateInvoicePage";
import AccountantInvoicesListPage from "./pages/accountant/AccountantInvoicesListPage";
import AccountantUnpaidInvoicesPage from "./pages/accountant/AccountantInvoicesListPage";
import AccountantRefundsPage from "./pages/accountant/AccountantRefundsPage";
import AccountantInsuranceClaimsPage from "./pages/accountant/AccountantInsuranceClaimsPage";
import AccountantInsurancePoliciesPage from "./pages/accountant/AccountantInsurancePoliciesPage";
import AccountantInsuranceVerificationPage from "./pages/accountant/AccountantInsuranceVerificationPage";
import AccountantExpensesPage from "./pages/accountant/AccountantExpensesPage";
import AccountantRevenuePage from "./pages/accountant/AccountantRevenuePage";
import AccountantPatientBalancePage from "./pages/accountant/AccountantPatientBalancePage";
import AccountantTaxReportsPage from "./pages/accountant/AccountantTaxReportsPage";
import AccountantProceduresPage from "./pages/accountant/AccountantProceduresPage";
import AccountantInventoryValuationPage from "./pages/accountant/AccountantInventoryValuationPage";
import AccountantAuditLogsPage from "./pages/accountant/AccountantAuditLogsPage";
import AccountantFinancialSettingsPage from "./pages/accountant/AccountantFinancialSettingsPage";
import PDFViewer from "./components/ui/PDFViewer";
import NotFoundPage from "./pages/NotFoundPage";
import ResetPasswordPage from "./pages/ResetPassword";

// Super Admin Routes
import SuperAdminLayout from "./layouts/SuperAdmin/SAdminLayout";
import ClinicsPage from "./pages/superAdmin/Clinics";
import PlatformUsersPage from "./pages/superAdmin/PlatformUsers";
import AnalyticsPage from "./pages/superAdmin/Analytics";
import ClinicDetailsPage from "./pages/superAdmin/ClinicDetails";
import UsageMetricsPage from "./pages/superAdmin/UsageMetrics";
import SecurityPage from "./pages/superAdmin/Security";
import PendingApprovalPage from "./pages/superAdmin/PendingApproval";
import FeatureRequestsPage from "./pages/superAdmin/FeatureRequests";
import { InvoicesPage } from "./pages/superAdmin/Invoices";
import { GrowthPage } from "./pages/superAdmin/Growth";
import SupportTicketsPage from "./pages/superAdmin/Support";
import { PlatformSettingsPage } from "./pages/superAdmin/Settings";
import PaymentsPage from "./pages/superAdmin/Payments";
import AuditLogPage from "./pages/superAdmin/AuditLog";
import BillingHistoryPage from "./pages/superAdmin/Settings/BillingHistoryPage";

// ─── Waits for Zustand to finish reading localStorage before deciding ──────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // Wait for store hydration
  if (!hasHydrated) {
    return null; // or spinner
  }

  // No user = not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const user = useAuthStore((s) => s.user);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reports/view" element={<PDFViewer />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            {user?.role === 'super_admin' ? (
              <SuperAdminLayout />
            ) : user?.role === 'dentist' ? (
              <DoctorLayout />
            ) : user?.role === 'receptionist' ? (
              <ReceptionistLayout />
            ) : user?.role === 'assistant' ? (
              <AssistantLayout />
            ) : user?.role === 'accountant' ? (
              <AccountantLayout />
            ) : (
              <DashboardLayout />
            )}
          </PrivateRoute>
        }
      >
        {/* Root path - show different dashboard based on role */}
        <Route
          index
          element={
            user?.role === 'dentist'
              ? <DoctorDashboardPage />
              : user?.role === 'accountant'
                ? <AccountantDashboardPage />
                : user?.role === 'super_admin'
                  ? <SuperAdminDashboard />
                  : user?.role === 'receptionist'
                    ? <ReceptionistDashboardPage />
                    : user?.role === 'assistant'
                      ? <AssistanceDashboardPage />
                      : <DashboardPage />
          }
        />

        {/* Super Admin Routes - Business Focused */}
        <Route path="admin/platform" element={<SuperAdminDashboard />} />
        <Route path="admin/clinics" element={<ClinicsPage />} />
        <Route path="admin/clinics/:id" element={<ClinicDetailsPage />} />
        <Route path="admin/pending" element={<PendingApprovalPage />} />
        <Route path="admin/users" element={<PlatformUsersPage />} />
        <Route path="admin/requests" element={<FeatureRequestsPage />} />
        <Route path="settings/billing" element={<AdminBillingPage />} />
        <Route path="admin/reports/revenue" element={<AnalyticsPage />} />
        <Route path="admin/reports/usage" element={<UsageMetricsPage />} />
        <Route path="admin/invoices" element={<InvoicesPage />} />
        <Route path="admin/payments" element={<PaymentsPage />} />
        <Route path="admin/reports/growth" element={<GrowthPage />} />
        <Route path="admin/support" element={<SupportTicketsPage />} />
        <Route path="admin/settings" element={<PlatformSettingsPage />} />
        <Route path="admin/audit" element={<AuditLogPage />} />
        <Route path="admin/billing/history" element={<BillingHistoryPage />} />

        {/* Admin Routes */}
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientProfilePage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="treatments" element={<TreatmentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="expenses" element={<Expensespage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="lab-orders" element={<LabOrdersPage />} />
        <Route path="consent-forms" element={<ConsentFormsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="system/backup" element={<BackupRestorePage />} />
        <Route path="system/logs" element={<SystemLogsPage />} />
        <Route path="system/audit" element={<AuditTrailPage />} />
        <Route path="system/storage" element={<StoragePage />} />
        <Route path="support/tickets" element={<SupportTicketPage />} />
        <Route path="support/knowledge" element={<KnowledgeBasePage />} />

        {/* Doctor Routes */}
        <Route path="doctor/patients" element={<DoctorPatientsPage />} />
        <Route path="doctor/patients/:id" element={<DoctorPatientProfilePage />} />
        <Route path="doctor/appointments" element={<AppointmentsPage />} />
        <Route path="doctor/treatments" element={<TreatmentsPage />} />
        <Route path="doctor/dental-chart" element={<DoctorDentalChartPage />} />
        <Route path="doctor/prescriptions" element={<PrescriptionsPage />} />
        <Route path="doctor/lab-orders" element={<LabOrdersPage />} />
        <Route path="doctor/consent-forms" element={<ConsentFormsPage />} />
        <Route path="doctor/referrals" element={<DoctorsReferralsPage />} />
        <Route path="doctor/notifications" element={<NotificationsPage />} />
        <Route path="doctor/inventory" element={<InventoryPage />} />
        <Route path="doctor/support/feedback" element={<DoctorFeedbackPage />} />

        {/* Receptionist Routes */}
        <Route path="receptionist" element={<ReceptionistDashboardPage />} />
        <Route path="receptionist/patients" element={<ReceptionistPatientsPage />} />
        <Route path="receptionist/patients/:id" element={<ReceptionistPatientProfilePage />} />
        <Route path="receptionist/appointments" element={<ReceptionistAppointmentsPage />} />
        <Route path="receptionist/appointments/calendar" element={<ReceptionistCalendarView appointments={[]} />} />
        <Route path="receptionist/consent-forms" element={<ReceptionistConsentFormsPage />} />
        <Route path="receptionist/appointments/today" element={<ReceptionistTodaySchedule />} />
        <Route path="receptionist/check-in" element={<ReceptionistCheckIn />} />
        <Route path="receptionist/patient-files" element={<ReceptionistPatientFiles />} />
        <Route path="support/feedback" element={<ReceptionFeedbackPage />} />
        <Route path="receptionist/receipts" element={<ReceptionistReceipts />} />
        <Route path="receptionist/notifications" element={<ReceptionistNotificationsPage />} />
        <Route path="receptionist/invoices" element={<ReceptionistInvoicesPage />} />
        <Route path="receptionist/payments" element={<ReceptionistPaymentsPage />} />
        <Route path="receptionist/rooms" element={<ReceptionistRoomsPage />} />

        {/* Assistant Routes */}
        <Route path="assistant" element={<AssistanceDashboardPage />} />
        <Route path="assistant/appointments/today" element={<AssistantTodaySchedule />} />
        <Route path="assistant/patients" element={<AssistantPatientsPage />} />
        <Route path="assistant/patients/:id" element={<AssistantPatientProfilePage />} />
        <Route path="assistant/treatments" element={<AssistantTreatmentsPage />} />
        <Route path="assistant/start-treatment" element={<AssistantStartTreatmentPage />} />
        <Route path="assistant/dental-chart" element={<AssistantDentalChartPage />} />
        <Route path="assistant/procedures" element={<AssistantProceduresPage />} />
        <Route path="assistant/patient-files" element={<AssistantPatientFilesPage />} />
        <Route path="assistant/prescriptions" element={<AssistantPrescriptionsPage />} />
        <Route path="assistant/lab-orders" element={<AssistantLabOrdersPage />} />
        <Route path="assistant/referrals" element={<AssistantReferralsPage />} />
        <Route path="assistant/consent-forms" element={<AssistantConsentFormsPage />} />
        <Route path="assistant/rooms" element={<AssistantRoomsPage />} />
        <Route path="assistant/inventory" element={<AssistantInventoryPage />} />
        <Route path="assistant/medical-history" element={<AssistantMedicalHistoryPage />} />
        <Route path="assistant/support/knowledge" element={<AssistantKnowledgeBasePage />} />
        <Route path="assistant/support/feedback" element={<AssistantFeedbackPage />} />
        <Route path="assistant/notifications" element={<AssistantNotificationsPage />} />

        {/* Accountant Routes */}
        <Route path="accountant" element={<AccountantDashboardPage />} />
        <Route path="accountant/reports" element={<AccountantReportsPage />} />
        <Route path="accountant/invoices" element={<AccountantInvoicesPage />} />
        <Route path="accountant/invoices/create" element={<AccountantCreateInvoicePage />} />
        <Route path="accountant/invoices/unpaid" element={<AccountantUnpaidInvoicesPage />} />
        <Route path="accountant/refunds" element={<AccountantRefundsPage />} />
        <Route path="accountant/insurance/claims" element={<AccountantInsuranceClaimsPage />} />
        <Route path="accountant/insurance/policies" element={<AccountantInsurancePoliciesPage />} />
        <Route path="accountant/insurance/verification" element={<AccountantInsuranceVerificationPage />} />
        <Route path="accountant/expenses" element={<AccountantExpensesPage />} />
        <Route path="accountant/revenue" element={<AccountantRevenuePage />} />
        <Route path="accountant/patient-balance" element={<AccountantPatientBalancePage />} />
        <Route path="accountant/tax-reports" element={<AccountantTaxReportsPage />} />
        <Route path="accountant/procedures" element={<AccountantProceduresPage />} />
        <Route path="accountant/inventory/valuation" element={<AccountantInventoryValuationPage />} />
        <Route path="accountant/audit-logs" element={<AccountantAuditLogsPage />} />
        <Route path="accountant/financial-settings" element={<AccountantFinancialSettingsPage />} />
      </Route>

      {/* 404 Page - Catch all unmatched routes */}
      <Route path="*" element={<NotFoundPage />} />

      {/* Reset Password Route */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  );
}