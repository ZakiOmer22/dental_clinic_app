// ══════════════════════════════════════════════════════════════════════════════
// FEEDBACK PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Heart, Search, X, CheckCircle2 } from "lucide-react";
import { apiGetFeedback, apiRespondToFeedback, apiGetFeedbackStats } from "@/api/feedback";
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

const GS = `
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fb-card:hover { border-color: ${C.tealBorder} !important; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .inp:focus { border-color: ${C.teal} !important; box-shadow: 0 0 0 3px rgba(13,158,117,.1) !important; }
`;

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPES = ["rating", "review", "suggestion", "complaint", "compliment", "bug_report"];
const TYPE_CFG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  rating: { icon: Star, color: C.amber, bg: C.amberBg, label: "Rating" },
  review: { icon: MessageSquare, color: C.blue, bg: C.blueBg, label: "Review" },
  suggestion: { icon: ThumbsUp, color: C.purple, bg: C.purpleBg, label: "Suggestion" },
  complaint: { icon: ThumbsDown, color: C.red, bg: C.redBg, label: "Complaint" },
  compliment: { icon: Heart, color: C.teal, bg: C.tealBg, label: "Compliment" },
  bug_report: { icon: MessageSquare, color: C.gray, bg: C.grayBg, label: "Bug Report" },
};

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Avi({ name, size = 28 }: { name: string; size?: number }) {
  const colors = [
    "linear-gradient(135deg,#0d9e75,#0a7d5d)",
    "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    "linear-gradient(135deg,#8b5cf6,#5b21b6)",
    "linear-gradient(135deg,#f59e0b,#92400e)"
  ];
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: colors[(name?.charCodeAt(0) ?? 0) % colors.length],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * .35,
      fontWeight: 700,
      color: "white",
      flexShrink: 0
    }}>
      {(name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  );
}

function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={color} strokeWidth={1.8} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function SearchB({ value, onChange, placeholder, width = 280 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number }) {
  return (
    <div style={{ position: "relative", width }}>
      <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="inp"
        style={{ ...IS, paddingLeft: 30, height: 34 }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.faint,
          display: "flex"
        }}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={14} fill={s <= rating ? C.amber : "none"} color={s <= rating ? C.amber : C.border} />
      ))}
    </div>
  );
}

export function ReceptionFeedbackPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [respondingTo, setRespondingTo] = useState<any>(null);
  const [response, setResponse] = useState("");

  // Fetch feedback
  const { data, isLoading, error } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => apiGetFeedback(),
    retry: 1
  });

  // Fetch stats with fallback
  const { data: statsData } = useQuery({
    queryKey: ["feedback-stats"],
    queryFn: () => apiGetFeedbackStats(),
    retry: false,
    onError: (err) => {
      console.warn("Stats endpoint not available, using local calculation");
    }
  });

  const feedback: any[] = data?.data ?? data ?? [];

  // Calculate stats locally if API fails
  const localStats = {
    totalRatings: feedback.filter(f => f.rating).length,
    sumRatings: feedback.reduce((sum, f) => sum + (f.rating || 0), 0),
    responseRate: feedback.length > 0
      ? Math.round((feedback.filter(f => f.response).length / feedback.length) * 100)
      : 0,
    satisfactionScore: feedback.filter(f => f.rating && f.rating >= 4).length > 0
      ? Math.round((feedback.filter(f => f.rating && f.rating >= 4).length / (feedback.filter(f => f.rating).length || 1)) * 100)
      : 85
  };

  const stats = statsData?.data ?? localStats;

  const filtered = useMemo(() => {
    return feedback.filter(f => {
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (search && !f.comment?.toLowerCase().includes(search.toLowerCase()) &&
        !f.user_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [feedback, typeFilter, search]);

  const respondMut = useMutation({
    mutationFn: ({ id, response }: any) => apiRespondToFeedback(id, { response, respondedBy: user?.id }),
    onSuccess: () => {
      toast.success("Response sent successfully");
      qc.invalidateQueries({ queryKey: ["feedback"] });
      setRespondingTo(null);
      setResponse("");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to send response");
    }
  });

  const avgRating = stats.totalRatings > 0
    ? (stats.sumRatings / stats.totalRatings).toFixed(1)
    : "0.0";

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <MessageSquare size={48} color={C.red} style={{ margin: "0 auto 16px", display: "block" }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>Unable to load feedback</h3>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Please check your connection and try again</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 20px",
            background: C.teal,
            border: "none",
            borderRadius: 8,
            color: "white",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Feedback</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              {feedback.length} submissions · {feedback.filter(f => !f.response).length} pending response
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          <KPI label="Avg Rating" value={avgRating} icon={Star} color={C.amber} sub={`${stats.totalRatings ?? 0} ratings`} />
          <KPI label="Total Feedback" value={feedback.length} icon={MessageSquare} color={C.blue} sub="All submissions" />
          <KPI label="Response Rate" value={`${stats.responseRate ?? 0}%`} icon={CheckCircle2} color={C.teal} sub="Replied to" />
          <KPI label="Satisfaction" value={`${stats.satisfactionScore ?? 85}%`} icon={Heart} color={C.purple} sub="Overall score" />
          <KPI label="This Month" value={feedback.filter(f => new Date(f.created_at).getMonth() === new Date().getMonth()).length} icon={TrendingUp} color={C.teal} sub="Recent activity" />
        </div>

        {/* Rating distribution */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>Rating Distribution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[5, 4, 3, 2, 1].map(r => {
              const count = feedback.filter(f => f.rating === r).length;
              const pct = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0;
              return (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, width: 60 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r}</span>
                    <Star size={12} fill={C.amber} color={C.amber} />
                  </div>
                  <div style={{ flex: 1, height: 8, background: "#edf1ef", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: C.amber, borderRadius: 4, transition: "width .6s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text, width: 50, textAlign: "right" }}>{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <SearchB value={search} onChange={setSearch} placeholder="Search feedback…" width={280} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[{ value: "all", label: "All Types" }, ...TYPES.map(t => ({ value: t, label: TYPE_CFG[t]?.label ?? t }))].map(t => {
              const active = typeFilter === t.value;
              const cfg = TYPE_CFG[t.value];
              return (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${active && cfg ? cfg.color + "40" : C.border}`,
                    background: active && cfg ? cfg.bg : C.bg,
                    color: active && cfg ? cfg.color : C.muted,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback cards */}
        {isLoading ? (
          <div style={{ padding: "40px 18px", textAlign: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 13, color: C.faint }}>Loading feedback...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 18px", textAlign: "center" }}>
            <MessageSquare size={28} color={C.border} style={{ margin: "0 auto 10px", display: "block" }} />
            <p style={{ fontSize: 13, color: C.faint }}>No feedback found</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {filtered.map(fb => {
              const cfg = TYPE_CFG[fb.type] ?? TYPE_CFG.review;
              const Icon = cfg.icon;
              return (
                <div key={fb.id} className="fb-card" style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "16px 18px",
                  transition: "all .15s"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <Avi name={fb.user_name ?? "Anonymous"} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fb.user_name ?? "Anonymous"}</p>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 100,
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}40`
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {fb.rating && <Stars rating={fb.rating} />}
                        <span style={{ fontSize: 10, color: C.faint }}>· {formatTime(fb.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {fb.comment && (
                    <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>{fb.comment}</p>
                  )}

                  {fb.response ? (
                    <div style={{ background: C.tealBg, border: `1px solid ${C.tealBorder}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.tealText, marginBottom: 4 }}>Response from {fb.responded_by_name || "Admin"}</p>
                      <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{fb.response}</p>
                    </div>
                  ) : respondingTo?.id === fb.id ? (
                    <div style={{ marginTop: 8 }}>
                      <textarea
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                        rows={3}
                        placeholder="Write your response…"
                        className="inp"
                        style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5, marginBottom: 8 }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => { setRespondingTo(null); setResponse(""); }}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: `1px solid ${C.border}`,
                            background: C.bg,
                            fontSize: 12,
                            fontWeight: 500,
                            color: C.muted,
                            cursor: "pointer",
                            fontFamily: "inherit"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (response.trim()) respondMut.mutate({ id: fb.id, response: response.trim() });
                          }}
                          disabled={!response.trim() || respondMut.isPending}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: !response.trim() || respondMut.isPending ? "#9ab5ae" : C.teal,
                            border: "none",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: !response.trim() || respondMut.isPending ? "not-allowed" : "pointer",
                            fontFamily: "inherit"
                          }}
                        >
                          {respondMut.isPending ? "Sending..." : "Send Response"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(fb)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${C.tealBorder}`,
                        background: C.tealBg,
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.tealText,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        marginTop: 8
                      }}
                    >
                      Respond to Feedback
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}