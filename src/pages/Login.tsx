import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Calendar, Users, DollarSign, Activity, Shield, Clock, Award, LogIn, CheckCircle2, Mail } from "lucide-react";
import { apiLogin, apiForgotPassword } from "@/api/auth";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ─── App name from .env ───────────────────────────────────────────────────────
const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Dental Clinic Portal";
const SITE_NAME = import.meta.env.VITE_SITE_NAME ?? "clinics.ealif";

// ─── Role-based demo credentials ──────────────────────────────────────────────
const DEMO_CREDENTIALS = [
  { role: "Super Admin", email: "sadmin@mail.com", password: "12345678", color: "#12B5BE" },
  { role: "Admin", email: "admin@mail.com", password: "12345678", color: "#0d9e75" },
  { role: "Dentist", email: "dentist@mail.com", password: "12345678", color: "#3b82f6" },
  { role: "Receptionist", email: "reception@mail.com", password: "12345678", color: "#8b5cf6" },
  { role: "Assistant", email: "assistant@mail.com", password: "12345678", color: "#ec4899" },
  { role: "Accountant", email: "accountant@mail.com", password: "12345678", color: "#f59e0b" },
];

const SCHEDULE = [
  { time: "09:00", name: "Amina Hassan", proc: "Root Canal", status: "in-progress", badge: "In progress", bBg: "#e8f7f2", bTx: "#0a7d5d" },
  { time: "09:45", name: "Omar Nuur", proc: "Scaling", status: "confirmed", badge: "Confirmed", bBg: "#eff6ff", bTx: "#1d4ed8" },
  { time: "10:30", name: "Hodan Jama", proc: "Crown Fitting", status: "waiting", badge: "Waiting", bBg: "#fffbeb", bTx: "#92400e" },
  { time: "11:15", name: "Mahad Ali", proc: "Check-up", status: "scheduled", badge: "Scheduled", bBg: "#f7f9f8", bTx: "#7a918b" },
];

const STATUS_COLORS = {
  'in-progress': '#0d9e75',
  'confirmed': '#3b82f6',
  'waiting': '#f59e0b',
  'scheduled': '#94a3b8',
};

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 16, height: 16,
      borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white", animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

// Forgot Password Modal Component
function ForgotPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiForgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "450px",
        overflow: "hidden",
        animation: "slideUp 0.3s ease-out",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f1a14" }}>Reset Password</h2>
          <button onClick={onClose} style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            ✕
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#b91c1c",
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#334155", marginBottom: "6px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#0d9e75"}
                  onBlur={(e) => e.currentTarget.style.borderColor = error ? "#ef4444" : "#e2e8f0"}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "44px",
                  background: "#0d9e75",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Spinner /> : <Mail size={16} />}
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "64px",
                height: "64px",
                background: "#f0fdf4",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <CheckCircle2 size={32} color="#10b981" />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f1a14", marginBottom: "8px" }}>Check Your Email</h3>
              <p style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 20px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const rightRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Only redirect if user exists - NO PAGE REFRESH
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const show = () => {
      if (rightRef.current)
        rightRef.current.style.display = window.innerWidth >= 1024 ? "flex" : "none";
    };
    show();
    window.addEventListener("resize", show);
    return () => window.removeEventListener("resize", show);
  }, []);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => { if (errorMsg) setErrorMsg(""); }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await apiLogin(email, password);
      setAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err?.response?.data?.error || "Invalid email or password. Please try again.";
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string, credEmail: string, credPassword: string) => {
    setDemoLoading(role);
    setErrorMsg("");

    try {
      const data = await apiLogin(credEmail, credPassword);
      setAuth(data.token, data.user);
      toast.success(`Logged in as ${role}!`);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Demo login error:", err);
      const errorMessage =
        err?.response?.data?.error || "Demo login failed. Please try again.";
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
      setDemoLoading(null);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        
        .login-input {
          width:100%; height:48px; padding:0 16px;
          border:1.5px solid #e2e8f0; border-radius:12px;
          background:#fff; font-size:15px; color:#0f1a14;
          font-family:'Inter',system-ui,-apple-system,sans-serif; 
          outline:none; transition:all 0.2s ease;
        }
        .login-input::placeholder { color:#94a3b8; font-weight:400; }
        .login-input:hover { border-color:#cbd5e1; }
        .login-input:focus { border-color:#0d9e75; box-shadow:0 0 0 4px rgba(13,158,117,0.1); }
        .login-input.has-err { border-color:#ef4444; background:#fef2f2; }
        .login-input:disabled { background:#f8fafc; cursor:not-allowed; opacity:0.6; }
        
        .login-btn {
          width:100%; height:48px; background:#0d9e75; color:#fff;
          border:none; border-radius:12px; font-size:15px; font-weight:600;
          font-family:'Inter',system-ui,-apple-system,sans-serif; 
          cursor:pointer; letter-spacing:-0.01em;
          display:flex; align-items:center; justifyContent:center; gap:8px;
          transition:all 0.2s ease;
        }
        .login-btn:hover:not(:disabled) { background:#0b8a66; transform:translateY(-2px); }
        .login-btn:active:not(:disabled) { transform:translateY(0); }
        .login-btn:disabled { opacity:0.6; cursor:not-allowed; }
        
        .sched-row { transition:all 0.2s ease; }
        .sched-row:hover { background:#f8fafc; transform:translateX(4px); }
        
        .demo-role-btn {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; padding: 10px 16px; background: #fff;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 13px; font-weight: 500; color: #334155;
          transition: all 0.2s ease; cursor: pointer; width: 100%;
        }
        .demo-role-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: #0d9e75; background: #f8fafc; }
        .demo-role-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .password-toggle {
          position:absolute; right:14px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer;
          color:#94a3b8; display:flex; align-items:center; padding:8px;
          border-radius:8px; transition:all 0.2s ease;
        }
        .password-toggle:hover { color:#0d9e75; background:rgba(13,158,117,0.05); }
        
        .feature-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 100px;
          font-size: 12px; color: #334155; transition: all 0.2s ease;
        }
        .feature-badge:hover { background: #fff; border-color: #0d9e75; }
      `}</style>

      <div style={{
        minHeight: "100vh", display: "flex",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif"
      }}>
        {/* LEFT PANEL */}
        <div style={{
          width: "100%", maxWidth: 520, flexShrink: 0,
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
          borderRight: "1px solid rgba(226,232,240,0.6)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "48px 56px", position: "relative", zIndex: 2,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", animation: "slideUp 0.5s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src="/icon.png" alt="Logo" style={{ width: 40, height: 40 }} />
              </div>
              <div>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#0f1a14", letterSpacing: "-0.02em", display: "block" }}>{APP_NAME}</span>
                <span style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "block" }}>Professional Dental Suite</span>
              </div>
            </div>
          </div>

          {/* Form area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 0", animation: "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", color: "#0f1a14", marginBottom: 12, lineHeight: 1.2 }}>Welcome back</h1>
              <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.5 }}>Sign in to access your personalized clinic dashboard</p>
            </div>

            {errorMsg && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 12, marginBottom: 24, fontSize: 14, color: "#b91c1c", animation: "slideUp 0.3s ease-out" }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="email" style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 8 }}>Email address</label>
                <input ref={emailRef} id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@clinic.com" className={`login-input${errorMsg ? " has-err" : ""}`} disabled={loading || demoLoading !== null} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label htmlFor="password" style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}>Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#0d9e75", fontFamily: "inherit", padding: "4px 8px", borderRadius: 6 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={`login-input${errorMsg ? " has-err" : ""}`} style={{ paddingRight: 48 }} disabled={loading || demoLoading !== null} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="password-toggle" aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>

              <button type="submit" className="login-btn p-3 flex align-middle" disabled={loading || demoLoading !== null}>
                {loading ? <><Spinner />Signing in...</> : "Sign in to dashboard"}
              </button>
            </form>

            {/* Demo credentials section */}
            <div style={{ marginTop: 28, padding: "20px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Shield size={16} color="#0d9e75" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f1a14", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Demo Access</span>
                <span style={{ fontSize: 11, padding: "2px 8px", background: "#0d9e75", color: "white", borderRadius: 100, marginLeft: "auto" }}>One-click login</span>
              </div>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.5 }}>Click any role below to instantly log in and explore the dashboard</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {DEMO_CREDENTIALS.map((cred) => (
                  <button key={cred.role} type="button" onClick={() => handleDemoLogin(cred.role, cred.email, cred.password)} disabled={loading || demoLoading !== null} className="demo-role-btn">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cred.color }} />
                      <span>{cred.role}</span>
                    </div>
                    {demoLoading === cred.role ? <Spinner /> : <LogIn size={14} color="#64748b" />}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#fff", borderRadius: 8, fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8, border: "1px dashed #cbd5e1" }}>
                <Clock size={14} />
                <span>All demo accounts use password: <strong>12345678</strong></span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, padding: "12px 16px", background: "#f1f5f9", borderRadius: 12, fontSize: 13, color: "#475569" }}>
              <Award size={16} color="#64748b" />
              <span>Each role has customized dashboard views and permissions</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ animation: "fadeIn 0.8s ease-out", borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{APP_NAME} · v2.0</span>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>Live · HIPAA Ready</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Terms</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Privacy</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Support</span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>© 2024 eALIF Team Suite</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div ref={rightRef} style={{ display: "none", flex: 1, justifyContent: "center", alignItems: "center", padding: "48px", position: "relative", overflow: "hidden", animation: "fadeIn 0.8s ease-out" }}>
          {/* ... right panel content same as before ... */}
          <div style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0, pointerEvents: "none", background: "radial-gradient(circle at 20% 50%, rgba(13,158,117,0.03) 0%, transparent 50%)" }} />
          <div style={{ position: "absolute", width: 600, height: 600, top: -200, right: -100, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,158,117,0.05) 0%, transparent 70%)", animation: "pulse 8s ease-in-out infinite", pointerEvents: "none" }} />
          <div style={{ maxWidth: 600, width: "100%" }}>
            {/* Dashboard preview card */}
            <div style={{ background: "#fff", border: "1px solid rgba(226,232,240,0.8)", borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative", zIndex: 1, animation: "slideInRight 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%" }}>
                <div style={{ display: "flex", gap: 8 }}>{["#ef4444", "#f59e0b", "#10b981"].map((c) => (<div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />))}</div>
                <div style={{ fontFamily: "'Inter',monospace", fontSize: 12, color: "#475569", background: "#fff", padding: "4px 12px", borderRadius: 20, border: "1px solid #e2e8f0" }}>{SITE_NAME}.com</div>
                <span style={{ fontFamily: "'Inter',monospace", fontSize: 12, color: "#64748b", background: "#fff", padding: "4px 10px", borderRadius: 20, border: "1px solid #e2e8f0" }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
                {[
                  { icon: <Users size={16} />, val: "24", label: "Patients today", trend: "+8 vs yesterday", positive: true },
                  { icon: <DollarSign size={16} />, val: "$3,250", label: "Revenue", trend: "+15% this week", positive: true },
                  { icon: <Activity size={16} />, val: "12", label: "Appointments", trend: "3 completed", positive: true },
                  { icon: <Calendar size={16} />, val: "89%", label: "Occupancy", trend: "92% peak hour", positive: true },
                ].map((k, i) => (
                  <div key={i} style={{ padding: "16px", borderRight: i < 3 ? "1px solid #e2e8f0" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "#64748b", fontSize: 12 }}>{k.icon}<span>{k.label}</span></div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f1a14", lineHeight: 1, marginBottom: 4 }}>{k.val}</div>
                    <div style={{ fontSize: 11, color: k.positive ? "#10b981" : "#ef4444", background: k.positive ? "#f0fdf4" : "#fef2f2", padding: "2px 8px", borderRadius: 100, display: "inline-block" }}>{k.trend}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#64748b" }}>Today's schedule · Dr. Ahmed's list</div>
                <div style={{ fontSize: 11, padding: "4px 10px", background: "#0d9e75", color: "white", borderRadius: 100, display: "flex", alignItems: "center", gap: 4 }}><Shield size={10} /><span>Role: Dentist View</span></div>
              </div>

              {SCHEDULE.map((row, i) => (
                <div key={i} className="sched-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < SCHEDULE.length - 1 ? "1px solid #f1f5f9" : "none", background: "#fff", cursor: "default" }}>
                  <span style={{ fontFamily: "'Inter',monospace", fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "2px 8px", borderRadius: 12, width: 60, textAlign: "center" }}>{row.time}</span>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[row.status as keyof typeof STATUS_COLORS] }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#0f1a14", flex: 1 }}>{row.name}</span>
                  <span style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "4px 10px", borderRadius: 20 }}>{row.proc}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: row.bBg, color: row.bTx }}>{row.badge}</span>
                </div>
              ))}

              <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Award size={16} /><span style={{ fontSize: 12, fontWeight: 500 }}>Enterprise-grade security & compliance</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 100 }}><CheckCircle2 size={12} /><span>eALIF Team Suite</span></div>
              </div>
            </div>

            <div style={{ marginTop: 32, textAlign: "center", position: "relative", zIndex: 1, animation: "fadeIn 0.8s ease-out 0.4s both" }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0f1a14", letterSpacing: "-0.02em", marginBottom: 6 }}>Complete practice management solution</h3>
              <p style={{ fontSize: 14, color: "#475569", maxWidth: 400, margin: "0 auto" }}>Trusted by 500+ dental clinics worldwide</p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24, flexWrap: "wrap", animation: "fadeIn 0.8s ease-out 0.6s both" }}>
              {[
                { icon: <Shield size={12} />, label: "HIPAA Compliant" },
                { icon: <Users size={12} />, label: "Role-based Access" },
                { icon: <Clock size={12} />, label: "24/7 Support" },
                { icon: <Award size={12} />, label: "eALIF Certified" },
              ].map((feature) => (<div key={feature.label} className="feature-badge">{feature.icon}<span>{feature.label}</span></div>))}
            </div>

            <div style={{ marginTop: 32, padding: "16px", textAlign: "center", borderTop: "1px solid #e2e8f0", animation: "fadeIn 0.8s ease-out 0.8s both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", background: "#fff", borderRadius: 100, border: "1px solid #e2e8f0" }}>
                <Award size={16} color="#667eea" />
                <span style={{ fontSize: 13, color: "#334155" }}>Powered by <strong style={{ color: "#667eea" }}>eALIF Team Suite</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </>
  );
}