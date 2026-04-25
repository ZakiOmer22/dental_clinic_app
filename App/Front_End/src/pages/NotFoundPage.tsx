import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Search, AlertCircle, Activity, Calendar, Users, FileText, Shield } from "lucide-react";

const C = {
  border: "#e5eae8",
  bg: "#ffffff",
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
  red: "#e53e3e",
  redBg: "#fff5f5",
  redText: "#c53030",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1d4ed8",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  purpleText: "#5b21b6",
};

export default function NotFoundPage() {
  const navigate = useNavigate();

  const quickLinks = [
    { path: "/", label: "Dashboard", icon: Activity, color: C.teal },
    { path: "/appointments", label: "Appointments", icon: Calendar, color: C.blue },
    { path: "/patients", label: "Patients", icon: Users, color: C.purple },
    { path: "/billing", label: "Billing", icon: FileText, color: C.teal },
    { path: "/insurance", label: "Insurance", icon: Shield, color: C.amber },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${C.bgMuted} 0%, ${C.bg} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
        <div style={{
          maxWidth: "600px",
          width: "100%",
          animation: "fadeIn 0.5s ease-out",
        }}>
          {/* Error Code */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div className="float-animation" style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}>
              <AlertCircle size={120} color={C.amber} strokeWidth={1.5} />
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "48px",
                fontWeight: "800",
                color: C.amberText,
                fontFamily: "monospace",
              }}>404</div>
            </div>
          </div>

          {/* Message */}
          <div style={{
            background: C.bg,
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "700",
              color: C.text,
              marginBottom: "12px",
            }}>
              Page Not Found
            </h1>
            <p style={{
              fontSize: "15px",
              color: C.muted,
              marginBottom: "30px",
              lineHeight: "1.6",
            }}>
              Oops! The page you're looking for doesn't exist or has been moved.
              <br />
              Let's get you back on track.
            </p>

            {/* Search Bar */}
            <div style={{
              position: "relative",
              marginBottom: "30px",
              maxWidth: "400px",
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              <Search size={18} style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: C.faint,
              }} />
              <input
                type="text"
                placeholder="Search for patients, appointments, or invoices..."
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 42px",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: C.text,
                  background: C.bg,
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.teal;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${C.tealBg}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginBottom: "40px",
              flexWrap: "wrap",
            }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: `1.5px solid ${C.border}`,
                  background: C.bg,
                  color: C.muted,
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.bgMuted;
                  e.currentTarget.style.borderColor = C.teal;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <ArrowLeft size={16} />
                Go Back
              </button>
              <button
                onClick={() => navigate("/")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  background: C.teal,
                  border: "none",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(13,158,117,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0a8a66";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.teal;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Home size={16} />
                Back to Dashboard
              </button>
            </div>

            {/* Quick Links */}
            <div style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: "30px",
            }}>
              <p style={{
                fontSize: "12px",
                color: C.muted,
                marginBottom: "20px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                Quick Navigation
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
              }}>
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: `1px solid ${C.border}`,
                        background: C.bg,
                        color: link.color,
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${link.color}10`;
                        e.currentTarget.style.borderColor = link.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = C.bg;
                        e.currentTarget.style.borderColor = C.border;
                      }}
                    >
                      <Icon size={14} />
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center",
            marginTop: "30px",
            fontSize: "11px",
            color: C.faint,
          }}>
            <p>© {new Date().getFullYear()} Daryeel App — Multi-Clinic Dental SaaS Platform | Powered by Ealif Suite</p>
            <p style={{ marginTop: "4px" }}>
              Need help? Contact support at{" "}
              <a href="mailto:support@dentalclinic.com" style={{ color: C.teal, textDecoration: "none" }}>
                support@dentalclinic.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}