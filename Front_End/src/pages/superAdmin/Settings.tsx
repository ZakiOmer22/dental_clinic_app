 
// ─── Settings.tsx ─────────────────────────────────────────────────────────────
import { Settings, Globe, Bell, Shield, Save } from "lucide-react";
import { Btn, Card, PageHeader, PageWrapper, SA, SectionTitle } from "./shared";
import { toast } from "react-hot-toast";
import { useState } from "react";
 
export function PlatformSettingsPage() {
  const [saved, setSaved] = useState(false);
 
  const handleSave = () => {
    setSaved(true);
    toast.success("Platform settings saved!");
    setTimeout(() => setSaved(false), 3000);
  };
 
  return (
    <PageWrapper>
      <PageHeader breadcrumb="Super Admin · Settings" title="Platform Settings" subtitle="Configure global platform settings and defaults"
        action={<Btn label={saved ? "Saved!" : "Save Changes"} variant="primary" icon={<Save size={14} />} onClick={handleSave} />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
        {/* Sidebar nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { icon: <Globe size={15} />, label: "General" },
            { icon: <Bell size={15} />, label: "Notifications" },
            { icon: <Shield size={15} />, label: "Security" },
            { icon: <Settings size={15} />, label: "Integrations" },
          ].map((item, i) => (
            <button key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${i === 0 ? SA.accent : SA.border}`, background: i === 0 ? SA.accentLight : "white", color: i === 0 ? SA.accent : SA.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: i === 0 ? 600 : 400, textAlign: "left" }}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
 
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* General settings */}
          <Card>
            <SectionTitle title="General Settings" />
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { label: "Platform Name", value: "Dentify SaaS", type: "text" },
                { label: "Support Email", value: "support@ealif.com", type: "email" },
                { label: "Default Currency", value: "USD", type: "text" },
                { label: "Default Timezone", value: "UTC+3 (East Africa Time)", type: "text" },
              ].map((field) => (
                <div key={field.label}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: SA.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                  <input defaultValue={field.value} type={field.type} className="sa-input" style={{ width: "100%", height: 42, padding: "0 14px", border: `1.5px solid ${SA.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", transition: "all 0.2s" }} onFocus={(e) => { e.target.style.borderColor = SA.accent; e.target.style.boxShadow = `0 0 0 3px ${SA.accentLight}`; }} onBlur={(e) => { e.target.style.borderColor = SA.border; e.target.style.boxShadow = "none"; }} />
                </div>
              ))}
            </div>
          </Card>
 
          {/* Notification settings */}
          <Card>
            <SectionTitle title="Notification Settings" />
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Email notifications for new clinic registrations", defaultChecked: true },
                { label: "Email alerts for overdue invoices", defaultChecked: true },
                { label: "Daily revenue summary email", defaultChecked: false },
                { label: "Alert when clinic exceeds storage limit", defaultChecked: true },
                { label: "Notify on support ticket creation", defaultChecked: true },
              ].map((item) => (
                <label key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked={item.defaultChecked} style={{ width: 16, height: 16, accentColor: SA.accent }} />
                  <span style={{ fontSize: 13, color: SA.textPrimary }}>{item.label}</span>
                </label>
              ))}
            </div>
          </Card>
 
          {/* Security */}
          <Card>
            <SectionTitle title="Security Settings" />
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Require 2FA for all super admins", defaultChecked: true },
                { label: "Auto-suspend clinics after 30 days of non-payment", defaultChecked: true },
                { label: "Log all admin actions to audit trail", defaultChecked: true },
                { label: "Auto-expire sessions after 8 hours of inactivity", defaultChecked: false },
              ].map((item) => (
                <label key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked={item.defaultChecked} style={{ width: 16, height: 16, accentColor: SA.accent }} />
                  <span style={{ fontSize: 13, color: SA.textPrimary }}>{item.label}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}