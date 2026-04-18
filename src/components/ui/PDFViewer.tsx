import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Printer, RefreshCw, FileText, ExternalLink } from "lucide-react";
import client from "@/api/client";
import toast from "react-hot-toast";

const C = {
  border: "#e5eae8",
  bg: "#ffffff",
  bgMuted: "#f7f9f8",
  text: "#111816",
  muted: "#7a918b",
  faint: "#a0b4ae",
  teal: "#0d9e75",
  tealText: "#0a7d5d",
  red: "#e53e3e",
  redText: "#c53030",
  amber: "#f59e0b",
  amberText: "#92400e",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

function formatDate(date: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString('en-GB');
}

const LAB_STATUS = {
  pending: { bg: "#fffbeb", text: "#92400e", border: "#fde68a", label: "Pending" },
  sent: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "Sent to Lab" },
  in_progress: { bg: "#f5f3ff", text: "#5b21b6", border: "#ede9fe", label: "In Progress" },
  received: { bg: "#f0fdfa", text: "#115e59", border: "#ccfbf1", label: "Received" },
  delayed: { bg: "#fef2f2", text: "#b91c1c", border: "#fee2e2", label: "Delayed" }
};

export default function PDFViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<string>("");

  const type = searchParams.get('type');
  const patientId = searchParams.get('patient_id');
  const orderId = searchParams.get('order_id');
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');
  const status = searchParams.get('status');

  useEffect(() => {
    setReportType(type || "");
  }, [type]);

  const { isLoading, refetch } = useQuery({
    queryKey: ["report", type, patientId, orderId, fromDate, toDate, status],
    queryFn: async () => {
      let url = "";
      const params = new URLSearchParams();
      
      if (type === "patient-transcript") {
        params.append('patient_id', patientId || '');
        url = `/reports/patient-transcript?${params.toString()}`;
      } else if (type === "financial-summary") {
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
        if (patientId) params.append('patient_id', patientId);
        url = `/reports/financial-summary?${params.toString()}`;
      } else if (type === "appointment-summary") {
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
        if (status && status !== 'all') params.append('status', status);
        url = `/reports/appointment-summary?${params.toString()}`;
      } else if (type === "insurance-summary") {
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
        url = `/reports/insurance-summary?${params.toString()}`;
      } else if (type === "lab-order") {
        params.append('order_id', orderId || '');
        url = `/reports/lab-order?${params.toString()}`;
      } else {
        throw new Error("Invalid report type");
      }
      
      const res = await client.get(url);
      setReportData(res.data);
      return res.data;
    },
    enabled: !!type,
  });

  const handlePrint = () => {
    window.print();
  };

  const renderLabOrder = () => {
    if (!reportData) return null;
    const order = reportData;
    const statusConfig = LAB_STATUS[order.status as keyof typeof LAB_STATUS] || LAB_STATUS.pending;
    const isDelayed = order.expected_date && new Date(order.expected_date) < new Date() && order.status !== "received";

    return (
      <div id="report-content" className="print-container" style={{ padding: "30px", fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: `2px solid ${C.teal}`, paddingBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div style={{ width: "80px" }}></div>
            <div>
              <h1 style={{ fontSize: "28px", margin: "0", color: C.teal, letterSpacing: "1px" }}>Dental Clinic</h1>
              <p style={{ color: C.muted, margin: "5px 0 0", fontSize: "12px" }}>Advanced Dental Care Center</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", color: C.faint, margin: 0 }}>Powered by Ealif Suite</p>
              <p style={{ fontSize: "10px", color: C.faint, margin: 0 }}>Dental Clinic Portal</p>
            </div>
          </div>
          <p style={{ fontSize: "14px", color: C.muted, marginTop: "5px" }}>Laboratory Order Form</p>
          <p style={{ fontSize: "11px", color: C.faint, marginTop: "2px" }}>Generated on {new Date().toLocaleString()}</p>
        </div>

        {/* Order Header Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "25px" }}>
          <div style={{ background: C.bgMuted, padding: "12px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>LAB ORDER #</p>
            <p style={{ fontSize: "18px", fontWeight: "700", color: C.teal }}>{order.id}</p>
          </div>
          <div style={{ background: statusConfig.bg, padding: "12px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>STATUS</p>
            <p style={{ fontSize: "14px", fontWeight: "700", color: statusConfig.text }}>{statusConfig.label}</p>
          </div>
          <div style={{ background: C.bgMuted, padding: "12px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>DATE SENT</p>
            <p style={{ fontSize: "14px", fontWeight: "600" }}>{order.sent_date ? formatDate(order.sent_date) : "—"}</p>
          </div>
          <div style={{ background: C.bgMuted, padding: "12px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>EXPECTED RETURN</p>
            <p style={{ fontSize: "14px", fontWeight: "600", color: isDelayed ? C.redText : C.text }}>{order.expected_date ? formatDate(order.expected_date) : "—"}</p>
          </div>
        </div>

        {/* Patient Information */}
        <div style={{ marginBottom: "25px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.teal, marginBottom: "12px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px" }}>
            PATIENT INFORMATION
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", padding: "15px", border: `1px solid ${C.border}`, borderRadius: "10px", background: C.bgMuted }}>
            <div><strong>Full Name:</strong> {order.patient_name || "—"}</div>
            <div><strong>Patient ID:</strong> {order.patient_number || "—"}</div>
            <div><strong>Phone:</strong> {order.phone || "—"}</div>
            <div><strong>Email:</strong> {order.email || "—"}</div>
            <div><strong>Date of Birth:</strong> {order.date_of_birth ? formatDate(order.date_of_birth) : "—"}</div>
            <div><strong>Gender:</strong> {order.gender || "—"}</div>
            <div><strong>Doctor:</strong> {order.doctor_name || "—"}</div>
            <div><strong>Specialization:</strong> {order.specialization || "General Dentistry"}</div>
          </div>
        </div>

        {/* Order Details */}
        <div style={{ marginBottom: "25px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.teal, marginBottom: "12px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px" }}>
            ORDER DETAILS
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", padding: "15px", border: `1px solid ${C.border}`, borderRadius: "10px" }}>
            <div><strong>Order Type:</strong> {order.order_type || "—"}</div>
            <div><strong>Shade:</strong> {order.shade || "Not specified"}</div>
            <div><strong>Lab Name:</strong> {order.lab_name || "—"}</div>
            <div><strong>Cost:</strong> <span style={{ color: C.teal, fontWeight: "700" }}>{order.cost ? formatCurrency(parseFloat(order.cost)) : "—"}</span></div>
            <div><strong>Date Sent:</strong> {order.sent_date ? formatDate(order.sent_date) : "—"}</div>
            <div><strong>Expected Return:</strong> {order.expected_date ? formatDate(order.expected_date) : "—"}</div>
          </div>
        </div>

        {/* Instructions */}
        {order.instructions && (
          <div style={{ marginBottom: "25px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.teal, marginBottom: "12px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px" }}>
              SPECIAL INSTRUCTIONS
            </h2>
            <div style={{ padding: "15px", border: `1px solid ${C.border}`, borderRadius: "10px", background: C.bgMuted }}>
              <p style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{order.instructions}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <p style={{ fontSize: "11px", color: C.muted, margin: 0 }}>Authorized Signature</p>
              <div style={{ width: "200px", height: "40px", borderBottom: `1px solid ${C.border}`, marginTop: "5px" }}></div>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: C.muted, margin: 0 }}>Doctor Signature</p>
              <div style={{ width: "200px", height: "40px", borderBottom: `1px solid ${C.border}`, marginTop: "5px" }}></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: C.muted, margin: 0 }}>Date</p>
              <div style={{ width: "150px", height: "40px", borderBottom: `1px solid ${C.border}`, marginTop: "5px" }}></div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p style={{ fontSize: "10px", color: C.faint, margin: 0 }}>This is a computer-generated document. No signature required for electronic processing.</p>
            <p style={{ fontSize: "9px", color: C.faint, marginTop: "5px" }}>
              Healthcare Facility | +252 XXX XXX XXX | info@dentalclinic.com
            </p>
            <p style={{ fontSize: "9px", color: C.faint, marginTop: "5px" }}>
              © {new Date().getFullYear()} Dental Clinic - All Rights Reserved | Powered by Ealif Suite
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderPatientTranscript = () => {
    if (!reportData) return null;
    const { patient, treatments, invoices, insurance } = reportData;

    return (
      <div id="report-content" className="print-container" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: `2px solid ${C.teal}`, paddingBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", margin: "0", color: C.teal }}>Patient Treatment Transcript</h1>
          <p style={{ color: C.muted, margin: "5px 0 0" }}>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "18px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px", marginBottom: "15px" }}>Patient Information</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", background: C.bgMuted, padding: "15px", borderRadius: "8px" }}>
            <div><strong>Name:</strong> {patient.full_name}</div>
            <div><strong>Patient ID:</strong> {patient.patient_number}</div>
            <div><strong>Phone:</strong> {patient.phone}</div>
            <div><strong>Email:</strong> {patient.email || "—"}</div>
            <div><strong>Date of Birth:</strong> {formatDate(patient.date_of_birth)}</div>
            <div><strong>Gender:</strong> {patient.gender || "—"}</div>
          </div>
        </div>

        {insurance && insurance.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "18px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px", marginBottom: "15px" }}>Insurance Information</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bgMuted }}>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Provider</th>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Policy Number</th>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Coverage %</th>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Annual Limit</th>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {insurance.map((ins: any) => (
                  <tr key={ins.id}>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{ins.provider_name}</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{ins.policy_number}</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{ins.coverage_percent}%</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{formatCurrency(ins.annual_limit)}</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{ins.is_active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "18px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px", marginBottom: "15px" }}>Treatment History</h2>
          {treatments.length === 0 ? (
            <p style={{ color: C.muted }}>No treatments recorded</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bgMuted }}>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Date</th>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Doctor</th>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Chief Complaint</th>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{formatDate(tx.created_at)}</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{tx.doctor_name || "—"}</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{tx.chief_complaint || "—"}</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{tx.diagnosis || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "18px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px", marginBottom: "15px" }}>Financial Summary</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgMuted }}>
                <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Invoice #</th>
                <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Date</th>
                <th style={{ padding: "10px", textAlign: "right", border: `1px solid ${C.border}` }}>Total</th>
                <th style={{ padding: "10px", textAlign: "right", border: `1px solid ${C.border}` }}>Paid</th>
                <th style={{ padding: "10px", textAlign: "right", border: `1px solid ${C.border}` }}>Balance</th>
                <th style={{ padding: "10px", textAlign: "center", border: `1px solid ${C.border}` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => {
                const balance = inv.total_amount - inv.paid_amount;
                return (
                  <tr key={inv.id}>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{inv.invoice_number}</td>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{formatDate(inv.created_at)}</td>
                    <td style={{ padding: "8px", textAlign: "right", border: `1px solid ${C.border}` }}>{formatCurrency(inv.total_amount)}</td>
                    <td style={{ padding: "8px", textAlign: "right", border: `1px solid ${C.border}` }}>{formatCurrency(inv.paid_amount)}</td>
                    <td style={{ padding: "8px", textAlign: "right", border: `1px solid ${C.border}` }}>{formatCurrency(balance)}</td>
                    <td style={{ padding: "8px", textAlign: "center", border: `1px solid ${C.border}` }}>{inv.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: "12px" }}>
          This is a computer-generated document. No signature required.
        </div>
      </div>
    );
  };

  const renderFinancialSummary = () => {
    if (!reportData) return null;
    const { summary, payment_methods } = reportData;

    return (
      <div id="report-content" className="print-container" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: `2px solid ${C.teal}`, paddingBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", margin: "0", color: C.teal }}>Financial Summary Report</h1>
          <p style={{ color: C.muted, margin: "5px 0 0" }}>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
          <div style={{ background: C.bgMuted, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>Total Invoices</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.total_invoices}</div>
          </div>
          <div style={{ background: C.bgMuted, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>Total Amount</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: C.teal }}>{formatCurrency(summary.total_amount)}</div>
          </div>
          <div style={{ background: C.bgMuted, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>Total Paid</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: C.teal }}>{formatCurrency(summary.total_paid)}</div>
          </div>
          <div style={{ background: C.bgMuted, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>Outstanding Balance</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#e53e3e" }}>{formatCurrency(summary.total_balance)}</div>
          </div>
        </div>

        {payment_methods.length > 0 && (
          <div>
            <h2 style={{ fontSize: "18px", borderLeft: `4px solid ${C.teal}`, paddingLeft: "10px", marginBottom: "15px" }}>Payment Methods Breakdown</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bgMuted }}>
                  <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Method</th>
                  <th style={{ padding: "10px", textAlign: "right", border: `1px solid ${C.border}` }}>Transactions</th>
                  <th style={{ padding: "10px", textAlign: "right", border: `1px solid ${C.border}` }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {payment_methods.map((pm: any) => (
                  <tr key={pm.method}>
                    <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{pm.method.replace(/_/g, " ").toUpperCase()}</td>
                    <td style={{ padding: "8px", textAlign: "right", border: `1px solid ${C.border}` }}>{pm.count}</td>
                    <td style={{ padding: "8px", textAlign: "right", border: `1px solid ${C.border}` }}>{formatCurrency(pm.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAppointmentSummary = () => {
    if (!reportData) return null;
    const { appointments, summary } = reportData;

    return (
      <div id="report-content" className="print-container" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: `2px solid ${C.teal}`, paddingBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", margin: "0", color: C.teal }}>Appointment Summary Report</h1>
          <p style={{ color: C.muted, margin: "5px 0 0" }}>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "30px" }}>
          <div style={{ background: C.bgMuted, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>Total</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.total}</div>
          </div>
          <div style={{ background: "#e8f7f2", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.tealText }}>Completed</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: C.tealText }}>{summary.completed}</div>
          </div>
          <div style={{ background: "#fffbeb", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#92400e" }}>Scheduled</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>{summary.scheduled}</div>
          </div>
          <div style={{ background: "#fff5f5", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#c53030" }}>Cancelled</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#c53030" }}>{summary.cancelled}</div>
          </div>
          <div style={{ background: "#fff5f5", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#c53030" }}>No Show</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#c53030" }}>{summary.no_show}</div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bgMuted }}>
              <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Date & Time</th>
              <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Patient</th>
              <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Doctor</th>
              <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Type</th>
              <th style={{ padding: "10px", textAlign: "center", border: `1px solid ${C.border}` }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt: any) => (
              <tr key={apt.id}>
                <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{new Date(apt.scheduled_at).toLocaleString()}</td>
                <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{apt.patient_name}</td>
                <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{apt.doctor_name}</td>
                <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{apt.type?.replace(/_/g, " ")}</td>
                <td style={{ padding: "8px", textAlign: "center", border: `1px solid ${C.border}` }}>{apt.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInsuranceSummary = () => {
    if (!reportData) return null;
    const { claims, summary } = reportData;

    return (
      <div id="report-content" className="print-container" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: `2px solid ${C.teal}`, paddingBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", margin: "0", color: C.teal }}>Insurance Claims Summary Report</h1>
          <p style={{ color: C.muted, margin: "5px 0 0" }}>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
          <div style={{ background: C.bgMuted, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.muted }}>Total Claims</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.total_claims}</div>
          </div>
          <div style={{ background: C.tealBg, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.tealText }}>Total Amount</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: C.tealText }}>{formatCurrency(summary.total_amount)}</div>
          </div>
          <div style={{ background: C.successBg, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: C.successText }}>Covered Amount</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: C.successText }}>{formatCurrency(summary.total_covered)}</div>
          </div>
          <div style={{ background: "#eff6ff", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#1e40af" }}>Paid Claims</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e40af" }}>{summary.paid}</div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bgMuted }}>
              <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Claim #</th>
              <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Patient</th>
              <th style={{ padding: "10px", textAlign: "left", border: `1px solid ${C.border}` }}>Provider</th>
              <th style={{ padding: "10px", textAlign: "right", border: `1px solid ${C.border}` }}>Amount</th>
              <th style={{ padding: "10px", textAlign: "right", border: `1px solid ${C.border}` }}>Covered</th>
              <th style={{ padding: "10px", textAlign: "center", border: `1px solid ${C.border}` }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim: any) => (
              <tr key={claim.id}>
                <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{claim.claim_number}</td>
                <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{claim.patient_name}</td>
                <td style={{ padding: "8px", border: `1px solid ${C.border}` }}>{claim.provider_name || "—"}</td>
                <td style={{ padding: "8px", textAlign: "right", border: `1px solid ${C.border}` }}>{formatCurrency(claim.total_amount)}</td>
                <td style={{ padding: "8px", textAlign: "right", border: `1px solid ${C.border}` }}>{formatCurrency(claim.covered_amount)}</td>
                <td style={{ padding: "8px", textAlign: "center", border: `1px solid ${C.border}` }}>{claim.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    switch (reportType) {
      case "patient-transcript":
        return renderPatientTranscript();
      case "financial-summary":
        return renderFinancialSummary();
      case "appointment-summary":
        return renderAppointmentSummary();
      case "insurance-summary":
        return renderInsuranceSummary();
      case "lab-order":
        return renderLabOrder();
      default:
        return <div style={{ textAlign: "center", padding: "50px" }}>Invalid report type</div>;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #report-content, #report-content * {
            visibility: visible !important;
          }
          #report-content {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
          }
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Bar - Not printed */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: C.muted }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer" }}>
              <Printer size={14} /> Print / Save PDF
            </button>
            <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer" }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Report Content */}
        {renderContent()}
      </div>
    </>
  );
}