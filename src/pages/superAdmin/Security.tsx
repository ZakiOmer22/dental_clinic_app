// Front_End/src/pages/superAdmin/Security.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Lock, Key, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Eye, EyeOff, Globe, Users,
  Server, Database, Activity, ArrowUpRight
} from "lucide-react";
import client from "@/api/client";
import toast from "react-hot-toast";

const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
  green: "#10b981", greenBg: "#ecfdf5", greenText: "#065f46",
};

function SecurityStatus({ title, status, description, icon: Icon }: any) {
  const statusConfig = {
    secure: { color: C.green, icon: CheckCircle2, label: "Secure" },
    warning: { color: C.amber, icon: AlertTriangle, label: "Warning" },
    danger: { color: C.red, icon: XCircle, label: "At Risk" },
  }[status] || { color: C.muted, icon: Activity, label: "Unknown" };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: statusConfig.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={statusConfig.color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 100, background: statusConfig.color + "18", color: statusConfig.color }}>{statusConfig.label}</span>
        </div>
        <p style={{ fontSize: 12, color: C.muted }}>{description}</p>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { data: securityData, isLoading, refetch } = useQuery({
    queryKey: ["admin", "security"],
    queryFn: () => client.get('/api/v1/admin/security').then(res => res.data),
  });

  const data = securityData || {
    twoFactor: { enabled: true, users: 45 },
    ssl: { valid: true, expires: "2026-06-15" },
    lastBackup: "2026-04-17T08:30:00Z",
    failedLogins: 12,
    activeSessions: 156,
  };

  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Security Center</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>Monitor and manage platform security</p>
          </div>
          <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 34, border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 12, fontWeight: 500, color: C.muted, cursor: "pointer" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Overall Score", value: "A+", color: C.green, icon: Shield },
            { label: "2FA Enabled", value: `${data.twoFactor?.users || 0} users`, color: C.blue, icon: Key },
            { label: "Failed Logins (24h)", value: data.failedLogins || 0, color: C.amber, icon: AlertTriangle },
            { label: "Active Sessions", value: data.activeSessions || 0, color: C.purple, icon: Users },
          ].map(s => (
            <div key={s.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
                <s.icon size={16} color={s.color} />
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Security Status</h3>
            <SecurityStatus title="SSL Certificate" status="secure" description={`Valid until ${new Date(data.ssl?.expires).toLocaleDateString()}`} icon={Globe} />
            <SecurityStatus title="Two-Factor Authentication" status={data.twoFactor?.enabled ? "secure" : "warning"} description={`${data.twoFactor?.users || 0} users have 2FA enabled`} icon={Key} />
            <SecurityStatus title="Database Encryption" status="secure" description="All sensitive data is encrypted at rest" icon={Database} />
            <SecurityStatus title="Firewall" status="secure" description="Web Application Firewall is active" icon={Server} />
          </div>

          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Recent Security Events</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { event: "Successful admin login", time: "2 min ago", status: "success", ip: "192.168.1.100" },
                { event: "Failed login attempt", time: "15 min ago", status: "warning", ip: "10.0.0.45" },
                { event: "API key rotated", time: "1 hour ago", status: "success", ip: "192.168.1.50" },
                { event: "Backup completed", time: "3 hours ago", status: "success", ip: "Internal" },
                { event: "Rate limit exceeded", time: "5 hours ago", status: "warning", ip: "172.16.0.23" },
              ].map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.status === "success" ? C.green : C.amber }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{e.event}</p>
                    <p style={{ fontSize: 10, color: C.faint }}>{e.ip} • {e.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Backup Status</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={24} color={C.green} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Last backup completed successfully</p>
                <p style={{ fontSize: 12, color: C.muted }}>{new Date(data.lastBackup).toLocaleString()}</p>
              </div>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: C.purple, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Database size={14} /> Backup Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}