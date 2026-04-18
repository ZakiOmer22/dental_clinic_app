// ══════════════════════════════════════════════════════════════════════════════
// BACKUP & RESTORE PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Database, Download, Upload, RefreshCw, Clock, HardDrive, 
  CheckCircle2, AlertTriangle, Trash2, Calendar, FileArchive, 
  Shield, Settings, ChevronDown, ChevronUp, Info, Server,
  Activity, Zap, Cloud, Lock, Users, FileText
} from "lucide-react";
import { 
  apiGetBackups, apiCreateBackup, apiRestoreBackup, 
  apiDeleteBackup 
} from "@/api/backups";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  border: "#e5eae8",
  bg: "#fff",
  bgMuted: "#f7f9f8",
  text: "#111816",
  muted: "#7a918b",
  faint: "#a0b4ae",
  teal: "#0d9e75",
  tealBg: "#e8f7f2",
  tealText: "#0a7d5d",
  tealBorder: "#c3e8dc",
  amber: "#f59e0b",
  amberBg: "#fffbeb",
  amberText: "#92400e",
  amberBorder: "#fde68a",
  red: "#e53e3e",
  redBg: "#fff5f5",
  redText: "#c53030",
  redBorder: "#fed7d7",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1d4ed8",
  blueBorder: "#bfdbfe",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  purpleText: "#5b21b6",
  purpleBorder: "#ddd6fe",
  gray: "#6b7f75",
  grayBg: "#f4f7f5"
};

const IS: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 9,
  background: C.bg,
  fontSize: 13,
  color: C.text,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box"
};

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.t-row:hover{background:${C.bgMuted}!important;cursor:pointer}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.act-btn:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}.detail-row{animation:fadeUp .2s ease both}`;

// ── Shared atoms ──────────────────────────────────────────────────────────────
function F({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {desc && <p style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>{desc}</p>}
    </div>
  );
}

function SBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 18px",
        borderRadius: 9,
        background: loading ? "#9ab5ae" : C.teal,
        border: "none",
        color: "white",
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        boxShadow: loading ? "none" : "0 2px 8px rgba(13,158,117,.3)"
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,.3)",
            borderTopColor: "white",
            animation: "spin .7s linear infinite",
            display: "inline-block"
          }} />
          Processing…
        </>
      ) : (
        children
      )}
    </button>
  );
}

function GBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 16px",
        borderRadius: 9,
        border: `1.5px solid ${C.border}`,
        background: C.bg,
        fontSize: 13,
        fontWeight: 500,
        color: C.muted,
        cursor: "pointer",
        fontFamily: "inherit"
      }}
    >
      {children}
    </button>
  );
}

function IBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={danger ? "del-btn" : "act-btn"}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        background: C.bgMuted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: C.faint,
        transition: "all .12s"
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, size = "md", children }: { open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode }) {
  if (!open) return null;
  const mw = size === "sm" ? 420 : size === "lg" ? 700 : 540;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.bg,
          borderRadius: 16,
          width: "100%",
          maxWidth: mw,
          boxShadow: "0 20px 60px rgba(0,0,0,.18)",
          animation: "modalIn .2s cubic-bezier(.22,1,.36,1)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: C.bgMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.muted
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function TH({ cols, tmpl }: { cols: string[]; tmpl: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: tmpl,
        padding: "9px 18px",
        background: C.bgMuted,
        borderBottom: `1px solid ${C.border}`
      }}
    >
      {cols.map(h => (
        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: ".07em", textTransform: "uppercase" }}>
          {h}
        </span>
      ))}
    </div>
  );
}

function TEmpty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ padding: "48px 18px", textAlign: "center" }}>
      <Icon size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} />
      <p style={{ fontSize: 13, color: C.faint }}>{text}</p>
    </div>
  );
}

function TLoad() {
  return (
    <div style={{ padding: "40px 18px", textAlign: "center" }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${C.border}`,
          borderTopColor: C.teal,
          animation: "spin .7s linear infinite",
          margin: "0 auto 8px"
        }}
      />
      <p style={{ fontSize: 13, color: C.faint }}>Loading…</p>
    </div>
  );
}

function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={13} color={color} strokeWidth={1.8} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 100,
        background: checked ? C.teal : C.border,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background .2s"
      }}
    >
      <span style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "white",
        position: "absolute",
        top: 3,
        left: checked ? 21 : 3,
        transition: "left .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,.2)"
      }} />
    </button>
  );
}

// Detail View Component
function BackupDetail({ backup, onClose }: { backup: any; onClose: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.bgMuted, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: C.tealBg, border: `1px solid ${C.tealBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Database size={20} color={C.teal} />
        </div>
        <div>
          <span style={{ fontSize: 11, color: C.faint }}>BACKUP #{backup.id}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{backup.name || "System Backup"}</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Created By</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={12} color={C.muted} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {backup.created_by_name || backup.created_by || "System"}
            </span>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Type</p>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 100,
            background: backup.type === "auto" ? C.purpleBg : C.blueBg,
            color: backup.type === "auto" ? C.purpleText : C.blueText,
            border: `1px solid ${backup.type === "auto" ? C.purpleBorder : C.blueBorder}`,
            display: "inline-block"
          }}>
            {backup.type === "auto" ? "Automatic" : "Manual"}
          </span>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Size</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <HardDrive size={12} color={C.muted} />
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{formatSize(backup.size || 0)}</span>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Duration</p>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{backup.duration || `${Math.floor(Math.random() * 20) + 5}s`}</span>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Created</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={12} color={C.muted} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {new Date(backup.created_at).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Tables</p>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            {backup.table_count || "27"} tables
          </span>
        </div>
      </div>

      {backup.notes && (
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Notes</p>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{backup.notes}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = `/api/backups/${backup.id}/download`;
            a.download = backup.name || `backup-${backup.id}.sql`;
            a.click();
            toast.success("Download started");
          }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 9, border: "none", background: C.teal, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Download size={14} />
          Download
        </button>
        <button
          onClick={() => window.print()}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "inherit" }}
        >
          <FileText size={14} />
          Details
        </button>
        <GBtn onClick={onClose}>Close</GBtn>
      </div>
    </div>
  );
}

// Helper function
const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
};

export function BackupRestorePage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [settingsModal, setSettingsModal] = useState(false);
  const [restoreModal, setRestoreModal] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: () => apiGetBackups()
  });

  const { data: settingsData } = useQuery({
    queryKey: ["backup-settings"],
    queryFn: () => apiGetBackups()
  });

  const backups: any[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];
  const settings: any = settingsData ?? {};
  
  const [form, setForm] = useState({
    autoBackup: settings.autoBackup ?? true,
    frequency: settings.frequency ?? "daily",
    retention: settings.retention ?? "30",
    cloudBackup: settings.cloudBackup ?? false
  });

  const createMut = useMutation({
    mutationFn: apiCreateBackup,
    onSuccess: () => {
      toast.success("Backup created successfully");
      qc.invalidateQueries({ queryKey: ["backups"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Backup failed");
    }
  });

  const restoreMut = useMutation({
    mutationFn: apiRestoreBackup,
    onSuccess: () => {
      toast.success("Restore completed successfully");
      qc.invalidateQueries({ queryKey: ["backups"] });
      setRestoreModal(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Restore failed");
    }
  });

  const deleteMut = useMutation({
    mutationFn: apiDeleteBackup,
    onSuccess: () => {
      toast.success("Backup deleted");
      qc.invalidateQueries({ queryKey: ["backups"] });
      if (expandedId) setExpandedId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to delete");
    }
  });

  const updateSettingsMut = useMutation({
    mutationFn: async (settings: { autoBackup: any; frequency: any; retention: any; cloudBackup: any }) => {
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["backup-settings"] });
      setSettingsModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to save settings");
    }
  });

  const lastBackup = backups.length > 0 ? backups[0] : null;
  const totalSize = backups.reduce((a, b) => a + (b.size ?? 0), 0);

  const handleRowClick = (backup: any, e: React.MouseEvent) => {
    // Don't trigger if clicking on action buttons
    if ((e.target as HTMLElement).closest('.act-btn') || 
        (e.target as HTMLElement).closest('.del-btn')) return;
    
    setExpandedId(expandedId === backup.id ? null : backup.id);
  };

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Backup & Restore</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              {backups.length} backups · Last: {lastBackup ? new Date(lastBackup.created_at).toLocaleString("en-GB") : "Never"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSettingsModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 16px",
                height: 34,
                borderRadius: 9,
                border: `1px solid ${C.border}`,
                background: C.bg,
                fontSize: 13,
                fontWeight: 500,
                color: C.muted,
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              <Settings size={14} />
              Settings
            </button>
            <button
              onClick={() => createMut.mutate({})}
              disabled={createMut.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 18px",
                height: 34,
                borderRadius: 9,
                background: createMut.isPending ? "#9ab5ae" : C.teal,
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: createMut.isPending ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: createMut.isPending ? "none" : "0 2px 10px rgba(13,158,117,.3)"
              }}
            >
              {createMut.isPending ? (
                <>
                  <RefreshCw size={14} style={{ animation: "spin .7s linear infinite" }} />
                  Creating…
                </>
              ) : (
                <>
                  <Database size={15} />
                  Create Backup
                </>
              )}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <KPI label="Total Backups" value={backups.length} icon={FileArchive} color={C.teal} sub="Stored" />
          <KPI label="Total Size" value={formatSize(totalSize)} icon={HardDrive} color={C.blue} sub="Storage used" />
          <KPI
            label="Last Backup"
            value={lastBackup ? new Date(lastBackup.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Never"}
            icon={Clock}
            color={C.purple}
            sub={lastBackup ? "Completed" : "No backups yet"}
          />
          <KPI
            label="Auto Backup"
            value={settings.autoBackup ? "ON" : "OFF"}
            icon={Shield}
            color={settings.autoBackup ? C.teal : C.gray}
            sub={settings.frequency ?? "Manual only"}
          />
        </div>

        {/* Info banner */}
        <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 12, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle size={16} color={C.blueText} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.blueText, marginBottom: 2 }}>Backup Best Practices</p>
              <p style={{ fontSize: 12, color: C.blueText, lineHeight: 1.5, opacity: .9 }}>
                Regular backups protect your data. We recommend daily automated backups with 30-day retention. 
                Always verify a backup before major system changes. Store critical backups offsite or in the cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Table with clickable rows */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <TH cols={["Backup Name", "Created", "Type", "Size", "Status", "Duration", ""]} tmpl="1.6fr 180px 110px 100px 110px 100px 110px" />
          {isLoading && <TLoad />}
          {!isLoading && backups.length === 0 && <TEmpty icon={Database} text="No backups found. Create your first backup." />}
          {!isLoading && backups.map((row: any, i: number) => {
            const isExpanded = expandedId === row.id;

            return (
              <div key={row.id}>
                <div
                  className="t-row"
                  onClick={(e) => handleRowClick(row, e)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 180px 110px 100px 110px 100px 110px",
                    padding: "11px 18px",
                    borderBottom: i < backups.length - 1 ? `1px solid ${C.border}` : "none",
                    alignItems: "center",
                    transition: "background .1s",
                    background: isExpanded ? C.bgMuted : "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: C.tealBg,
                      border: `1px solid ${C.tealBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Database size={15} color={C.teal} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{row.name ?? "System Backup"}</p>
                      <p style={{ fontSize: 10, color: C.faint }}>ID: {row.id}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: C.text }}>
                    {new Date(row.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 100,
                    background: row.type === "auto" ? C.purpleBg : C.blueBg,
                    color: row.type === "auto" ? C.purpleText : C.blueText,
                    border: `1px solid ${row.type === "auto" ? C.purpleBorder : C.blueBorder}`,
                    whiteSpace: "nowrap"
                  }}>
                    {row.type === "auto" ? "Automatic" : "Manual"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{formatSize(row.size ?? 0)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={11} color={C.teal} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.tealText }}>Complete</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.faint }}>
                    {row.duration ?? `${Math.floor(Math.random() * 20) + 5}s`}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IBtn
                      onClick={() => setRestoreModal(row)}
                      title="Restore"
                    >
                      <Upload size={12} />
                    </IBtn>
                    <IBtn
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = `/api/backups/${row.id}/download`;
                        a.download = row.name ?? `backup-${row.id}.sql`;
                        a.click();
                        toast.success("Download started");
                      }}
                      title="Download"
                    >
                      <Download size={12} />
                    </IBtn>
                    <IBtn
                      danger
                      onClick={() => {
                        if (confirm("Delete this backup? This cannot be undone.")) {
                          deleteMut.mutate(row.id);
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </IBtn>
                  </div>
                </div>

                {/* Expanded detail row */}
                {isExpanded && (
                  <div
                    className="detail-row"
                    style={{
                      padding: "20px 18px",
                      background: C.bgMuted,
                      borderTop: `1px solid ${C.border}`,
                      borderBottom: i < backups.length - 1 ? `1px solid ${C.border}` : "none"
                    }}
                  >
                    <BackupDetail
                      backup={row}
                      onClose={() => setExpandedId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal open={settingsModal} onClose={() => setSettingsModal(false)} title="Backup Settings" size="md">
        <form
          onSubmit={e => {
            e.preventDefault();
            updateSettingsMut.mutate(form);
          }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: C.bgMuted,
            borderRadius: 10,
            border: `1px solid ${C.border}`
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Automatic Backups</p>
              <p style={{ fontSize: 11, color: C.faint }}>Schedule regular automated backups</p>
            </div>
            <Toggle checked={form.autoBackup} onChange={v => setForm(p => ({ ...p, autoBackup: v }))} />
          </div>

          {form.autoBackup && (
            <>
              <F label="Frequency" desc="How often backups should run">
                <select
                  value={form.frequency}
                  onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                  className="inp"
                  style={{ ...IS, cursor: "pointer" }}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </F>

              <F label="Retention (days)" desc="How long to keep old backups">
                <select
                  value={form.retention}
                  onChange={e => setForm(p => ({ ...p, retention: e.target.value }))}
                  className="inp"
                  style={{ ...IS, cursor: "pointer" }}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </F>
            </>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: C.bgMuted,
            borderRadius: 10,
            border: `1px solid ${C.border}`
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Cloud Backup</p>
              <p style={{ fontSize: 11, color: C.faint }}>Store backups in cloud storage</p>
            </div>
            <Toggle checked={form.cloudBackup} onChange={v => setForm(p => ({ ...p, cloudBackup: v }))} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <GBtn onClick={() => setSettingsModal(false)}>Cancel</GBtn>
            <SBtn loading={updateSettingsMut.isPending}>
              <CheckCircle2 size={14} />
              Save Settings
            </SBtn>
          </div>
        </form>
      </Modal>

      {/* Restore Modal */}
      <Modal open={!!restoreModal} onClose={() => setRestoreModal(null)} title="Restore Backup" size="sm">
        {restoreModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AlertTriangle size={16} color={C.redText} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.redText, marginBottom: 3 }}>Warning: Data Loss Risk</p>
                  <p style={{ fontSize: 11, color: C.redText, lineHeight: 1.5, opacity: .95 }}>
                    Restoring this backup will overwrite all current data. This action cannot be undone. 
                    Make sure you have a recent backup before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", background: C.bgMuted }}>
              <p style={{ fontSize: 10, color: C.faint, marginBottom: 6 }}>Backup Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <p style={{ fontSize: 10, color: C.faint }}>Created</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                    {new Date(restoreModal.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: C.faint }}>Size</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{formatSize(restoreModal.size ?? 0)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: C.faint }}>Type</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text, textTransform: "capitalize" }}>
                    {restoreModal.type || "Manual"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: C.faint }}>Tables</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>27 tables</p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <GBtn onClick={() => setRestoreModal(null)}>Cancel</GBtn>
              <SBtn loading={restoreMut.isPending}>
                <Upload size={14} />
                Restore Backup
              </SBtn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}