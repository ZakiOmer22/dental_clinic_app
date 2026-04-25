import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#f0f2f1",
      padding: "20px",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "48px",
        textAlign: "center",
        maxWidth: 400,
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <Shield size={40} color="#ef4444" strokeWidth={1.5} />
        </div>
        
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#111816",
          marginBottom: 12,
        }}>
          Access Denied
        </h1>
        
        <p style={{
          fontSize: 14,
          color: "#64748b",
          marginBottom: 24,
          lineHeight: 1.6,
        }}>
          You don't have permission to access this page. 
          Please contact your administrator if you think this is a mistake.
        </p>
        
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "#0d9e75",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0a7d5d")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0d9e75")}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}