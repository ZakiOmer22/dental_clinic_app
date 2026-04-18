import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// ─── Super Admin Design Tokens ─────────────────────────────────────
export const SA = {
  accent: "#8b5cf6",
  accentLight: "rgba(139,92,246,0.1)",
  accentHover: "#7c3aed",
  success: "#10b981",
  successBg: "#f0fdf4",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  error: "#ef4444",
  errorBg: "#fef2f2",
  info: "#3b82f6",
  infoBg: "#eff6ff",
  textPrimary: "#0f1a14",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  bg: "#f8fafc",
  card: "#ffffff",
};

// ─── PageWrapper ────────────────────────────────────────────────────
export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div style={{
      padding: "32px 40px",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      maxWidth: 1400,
      margin: "0 auto",
      minHeight: "100vh",
      background: SA.bg,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .sa-btn-primary { transition: all 0.15s ease !important; }
        .sa-btn-primary:hover:not(:disabled) { background: #7c3aed !important; transform: translateY(-1px); }
        .sa-btn-secondary:hover:not(:disabled) { border-color: #8b5cf6 !important; color: #8b5cf6 !important; background: rgba(139,92,246,0.04) !important; }
        .sa-btn-danger:hover:not(:disabled) { background: #fef2f2 !important; border-color: #fca5a5 !important; }
        .sa-btn-success:hover:not(:disabled) { background: #059669 !important; }
        .sa-row-hover:hover { background: #f8fafc !important; }
        .sa-link:hover { color: #8b5cf6 !important; }
        .sa-input:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.1) !important; outline: none; }
        .sa-card-hover:hover { border-color: #c4b5fd !important; box-shadow: 0 4px 20px rgba(139,92,246,0.08) !important; }
        @keyframes sa-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sa-animate { animation: sa-fade-in 0.4s ease-out forwards; }
      `}</style>
      {children}
    </div>
  );
}

// ─── PageHeader ─────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, action, breadcrumb,
}: {
  title: string; subtitle?: string; action?: ReactNode; breadcrumb?: string;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      {breadcrumb && (
        <p style={{ fontSize: 11, color: SA.textMuted, marginBottom: 8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {breadcrumb}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: SA.textPrimary, letterSpacing: "-0.03em", lineHeight: 1.2, margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 14, color: SA.textSecondary, marginTop: 5, lineHeight: 1.5 }}>{subtitle}</p>}
        </div>
        {action && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{action}</div>}
      </div>
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────
export function StatCard({
  icon, label, value, trend, positive = true,
  color = SA.accent, bg = SA.accentLight,
}: {
  icon: ReactNode; label: string; value: string | number;
  trend?: string; positive?: boolean; color?: string; bg?: string;
}) {
  return (
    <div className="sa-animate" style={{
      background: SA.card, border: `1px solid ${SA.border}`,
      borderRadius: 16, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 12, fontWeight: 600,
            color: positive ? SA.success : SA.error,
            background: positive ? SA.successBg : SA.errorBg,
            padding: "3px 8px", borderRadius: 100,
          }}>
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color: SA.textPrimary, letterSpacing: "-0.03em", lineHeight: 1, margin: 0 }}>{value}</p>
        <p style={{ fontSize: 13, color: SA.textSecondary, marginTop: 4 }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────
type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "purple";
const BADGE: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: "#f0fdf4", color: "#059669" },
  warning: { bg: "#fffbeb", color: "#d97706" },
  error: { bg: "#fef2f2", color: "#dc2626" },
  info: { bg: "#eff6ff", color: "#2563eb" },
  neutral: { bg: "#f1f5f9", color: "#64748b" },
  purple: { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6" },
};
export function Badge({ label, variant = "neutral" }: { label: string; variant?: BadgeVariant }) {
  const s = BADGE[variant];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ─── Btn ─────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
export function Btn({
  label, onClick, variant = "secondary", icon, disabled = false, size = "md",
}: {
  label: string; onClick?: () => void; variant?: BtnVariant; icon?: ReactNode; disabled?: boolean; size?: "sm" | "md";
}) {
  const S: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: SA.accent, color: "white", border: "none" },
    secondary: { background: "white", color: "#334155", border: `1.5px solid ${SA.border}` },
    danger: { background: SA.errorBg, color: SA.error, border: `1.5px solid #fee2e2` },
    success: { background: SA.success, color: "white", border: "none" },
    ghost: { background: "transparent", color: SA.textSecondary, border: "none" },
  };
  const pad = size === "sm" ? "6px 12px" : "9px 18px";
  const fSize = size === "sm" ? 12 : 13;
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`sa-btn-${variant}`}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: pad, borderRadius: 10, fontSize: fSize, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        fontFamily: "inherit", ...S[variant],
      }}
    >
      {icon}{label}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: SA.card, border: `1px solid ${SA.border}`, borderRadius: 16, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

// ─── TableHead ────────────────────────────────────────────────────────
export function TableHead({ cols, template }: { cols: string[]; template: string }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: template,
      padding: "10px 20px", background: SA.bg,
      borderBottom: `1px solid ${SA.border}`,
    }}>
      {cols.map((c) => (
        <span key={c} style={{ fontSize: 11, fontWeight: 700, color: SA.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c}</span>
      ))}
    </div>
  );
}

// ─── SearchInput ──────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="sa-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search..."}
      style={{
        height: 38, padding: "0 14px", border: `1.5px solid ${SA.border}`,
        borderRadius: 10, fontSize: 13, fontFamily: "inherit",
        background: "white", color: SA.textPrimary, width: 260,
        transition: "all 0.2s ease",
      }}
    />
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────
export function EmptyState({ icon, message, sub }: { icon?: ReactNode; message: string; sub?: string }) {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      {icon && <div style={{ marginBottom: 12, color: SA.textMuted }}>{icon}</div>}
      <p style={{ fontSize: 15, fontWeight: 600, color: SA.textSecondary }}>{message}</p>
      {sub && <p style={{ fontSize: 13, color: SA.textMuted, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────
export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${SA.border}` }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: SA.textPrimary, margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}