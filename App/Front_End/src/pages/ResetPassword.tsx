import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { apiResetPassword } from "@/api/auth";
import toast from "react-hot-toast";
import client from "@/api/client";

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 16, height: 16,
      borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white", animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract token from URL and validate it
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (!tokenParam) {
      setTokenValid(false);
      setTokenError("No reset token provided. Please request a new password reset link.");
      return;
    }
    setToken(tokenParam);

    const validateToken = async () => {
      try {
        const res = await client.get(`/auth/verify-reset-token?token=${tokenParam}`);
        if (res.data.valid) {
          setTokenValid(true);
          setTokenError("");
        } else {
          setTokenValid(false);
          setTokenError(res.data.error || "Invalid or expired reset link.");
        }
      } catch (err: any) {
        console.error("Token validation error:", err);
        setTokenValid(false);
        setTokenError("Unable to verify reset link. Please try again.");
      }
    };

    validateToken();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Double-check token validity before sending
    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiResetPassword(token, newPassword);
      setSuccess(true);
      toast.success("Password reset successfully! You can now log in.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error("Reset password error:", err);
      // Extract the actual error message from backend
      const backendError = err?.response?.data?.error;
      let userMessage = "Failed to reset password. The link may have expired.";
      
      if (backendError) {
        userMessage = backendError;
        // If token expired or used, show a more helpful message with a "Request new link" button
        if (backendError.toLowerCase().includes("expired") || backendError.toLowerCase().includes("invalid")) {
          userMessage = backendError + " Please request a new password reset link.";
        }
      }
      setError(userMessage);
      toast.error(userMessage);
      
      // If token is now invalid, update the UI to show the error state
      if (backendError && (backendError.toLowerCase().includes("expired") || backendError.toLowerCase().includes("invalid"))) {
        setTokenValid(false);
        setTokenError(backendError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    // Navigate to login and open the forgot password modal
    navigate("/login", { state: { openForgotPassword: true } });
  };

  const inputStyle = {
    width: "100%",
    height: "48px",
    padding: "0 16px",
    border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const buttonStyle = {
    width: "100%",
    height: "48px",
    background: "#0d9e75",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    opacity: loading ? 0.7 : 1,
  };

  if (tokenValid === null) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      }}>
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <p style={{ marginTop: "16px", color: "#64748b" }}>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "white",
        borderRadius: "24px",
        boxShadow: "0 20px 35px -10px rgba(0,0,0,0.1)",
        overflow: "hidden",
        animation: "slideUp 0.4s ease-out",
      }}>
        <div style={{
          padding: "32px",
          textAlign: "center",
          borderBottom: "1px solid #e2e8f0",
          background: "white",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: success ? "#f0fdf4" : (tokenValid ? "#f0fdf4" : "#fef2f2"),
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            {success ? (
              <CheckCircle2 size={32} color="#10b981" />
            ) : tokenValid ? (
              <img src="/icon.png" alt="Logo" style={{ width: 40, height: 40 }} />
            ) : (
              <AlertCircle size={32} color="#ef4444" />
            )}
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f1a14", marginBottom: "8px" }}>
            {success ? "Password Reset Complete" : (tokenValid ? "Create New Password" : "Invalid Reset Link")}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            {success
              ? "Your password has been updated successfully."
              : tokenValid
              ? "Enter your new password below."
              : tokenError}
          </p>
        </div>

        <div style={{ padding: "32px" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "12px 24px",
                  background: "#0d9e75",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Go to Login
              </button>
            </div>
          ) : !tokenValid ? (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleRequestNewLink}
                style={{
                  padding: "12px 24px",
                  background: "#0d9e75",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <RefreshCw size={16} />
                Request New Reset Link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  fontSize: "13px",
                  color: "#b91c1c",
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#334155", marginBottom: "6px" }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "28px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#334155", marginBottom: "6px" }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={buttonStyle}
              >
                {loading ? <Spinner /> : null}
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0d9e75",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}