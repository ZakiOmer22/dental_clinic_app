// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2, Filter, Calendar, AlertTriangle, UserCheck, FileText, DollarSign, Package, Clock, ChevronDown, ChevronUp } from "lucide-react";
import {
  apiGetNotifications,
  apiMarkNotificationRead,
  apiMarkAllRead,
  apiDeleteNotification,
  apiGetUnreadCount
} from "@/api/notifications";
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

const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.notif-r:hover{background:${C.bgMuted}!important;cursor:pointer}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}.detail-row{animation:fadeUp .2s ease both}`;

// ── Constants ─────────────────────────────────────────────────────────────────
const NOTIF_TYPES: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  appointment: { icon: Calendar, color: C.teal, bg: C.tealBg, label: "Appointment" },
  payment: { icon: DollarSign, color: C.blue, bg: C.blueBg, label: "Payment" },
  low_stock: { icon: Package, color: C.red, bg: C.redBg, label: "Low Stock" },
  patient: { icon: UserCheck, color: C.purple, bg: C.purpleBg, label: "Patient" },
  lab_order: { icon: FileText, color: C.amber, bg: C.amberBg, label: "Lab Order" },
  system: { icon: AlertTriangle, color: C.gray, bg: C.grayBg, label: "System" },
  reminder: { icon: Clock, color: C.blue, bg: C.blueBg, label: "Reminder" },
};

// ── Shared atoms ──────────────────────────────────────────────────────────────
function TLoad() {
  return (
    <div style={{ padding: "40px 18px", textAlign: "center" }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: `2px solid ${C.border}`,
        borderTopColor: C.teal,
        animation: "spin .7s linear infinite",
        margin: "0 auto 8px"
      }} />
      <p style={{ fontSize: 13, color: C.faint }}>Loading…</p>
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

// Detail View Component
function NotificationDetail({ notification, onClose, onMarkRead }: { notification: any; onClose: () => void; onMarkRead: () => void }) {
  const cfg = NOTIF_TYPES[notification.type] ?? NOTIF_TYPES.system;
  const Icon = cfg.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.bgMuted, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={cfg.color} />
        </div>
        <div>
          <span style={{ fontSize: 11, color: C.faint }}>NOTIFICATION #{notification.id}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{notification.title}</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Type</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cfg.label}</span>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Status</p>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 100,
            background: notification.is_read ? C.grayBg : C.tealBg,
            color: notification.is_read ? C.gray : C.tealText,
            border: `1px solid ${notification.is_read ? C.border : C.tealBorder}`,
            display: "inline-block"
          }}>
            {notification.is_read ? "Read" : "Unread"}
          </span>
        </div>
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Received</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            {new Date(notification.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        {notification.related_id && (
          <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: C.faint, marginBottom: 2 }}>Related ID</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>#{notification.related_id}</p>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Message</p>
        <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{notification.message}</p>
      </div>

      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
        <div style={{ padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: C.faint, marginBottom: 4 }}>Additional Details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(notification.metadata).map(([key, value]) => (
              <div key={key} style={{ display: "flex", fontSize: 12 }}>
                <span style={{ color: C.muted, width: 100, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}:</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {!notification.is_read && (
          <button
            onClick={() => {
              onMarkRead();
              onClose();
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px",
              borderRadius: 9,
              border: "none",
              background: C.teal,
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            <Check size={14} />
            Mark as Read
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            padding: "10px 16px",
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
          Close
        </button>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { type: typeFilter !== "all" ? typeFilter : undefined, isRead: statusFilter !== "all" ? statusFilter === "read" : undefined }],
    queryFn: () => apiGetNotifications({
      type: typeFilter !== "all" ? typeFilter : undefined,
      isRead: statusFilter !== "all" ? statusFilter === "read" : undefined
    })
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiGetUnreadCount()
  });

  const notifications: any[] = data?.data ?? data ?? [];
  const unreadCount = unreadCountData?.count ?? notifications.filter((n: any) => !n.is_read).length;
  const todayCount = notifications.filter((n: any) =>
    new Date(n.created_at).toDateString() === new Date().toDateString()
  ).length;

  const markReadMut = useMutation({
    mutationFn: apiMarkNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    }
  });

  const markAllMut = useMutation({
    mutationFn: apiMarkAllRead,
    onSuccess: () => {
      toast.success("All marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    }
  });

  const deleteMut = useMutation({
    mutationFn: apiDeleteNotification,
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    }
  });

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const handleRowClick = (notif: any, e: React.MouseEvent) => {
    // Don't trigger if clicking on delete button
    if ((e.target as HTMLElement).closest('.del-btn')) return;

    // Mark as read if unread
    if (!notif.is_read) {
      markReadMut.mutate(notif.id);
    }

    // Toggle expanded view
    setExpandedId(expandedId === notif.id ? null : notif.id);
  };

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Notifications</h1>
            <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
              {notifications.length} total · {unreadCount} unread
            </p>
          </div>
          <button
            onClick={() => markAllMut.mutate()}
            disabled={unreadCount === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 18px",
              height: 34,
              borderRadius: 9,
              background: unreadCount > 0 ? C.teal : "#9ab5ae",
              border: "none",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: unreadCount > 0 ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              boxShadow: unreadCount > 0 ? "0 2px 10px rgba(13,158,117,.3)" : "none"
            }}
          >
            <CheckCheck size={15} />
            Mark All Read
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <KPI label="Total" value={notifications.length} icon={Bell} color={C.teal} sub="All notifications" />
          <KPI
            label="Unread"
            value={unreadCount}
            icon={Bell}
            color={unreadCount > 0 ? C.red : C.teal}
            sub={unreadCount > 0 ? "Needs attention" : "All caught up"}
          />
          <KPI label="Today" value={todayCount} icon={Calendar} color={C.blue} sub="Received today" />
          <KPI
            label="Types"
            value={Object.keys(NOTIF_TYPES).filter(t => notifications.some((n: any) => n.type === t)).length}
            icon={Filter}
            color={C.purple}
            sub="Active categories"
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Filter by:</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[{ value: "all", label: "All" }, ...Object.entries(NOTIF_TYPES).map(([k, v]) => ({ value: k, label: v.label }))].map(t => {
              const active = typeFilter === t.value;
              const cfg = NOTIF_TYPES[t.value];
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
          <div style={{ width: 1, height: 20, background: C.border }} />
          <div style={{ display: "flex", gap: 4 }}>
            {[{ value: "all", label: "All" }, { value: "unread", label: "Unread" }, { value: "read", label: "Read" }].map(s => {
              const active = statusFilter === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${active ? C.tealBorder : C.border}`,
                    background: active ? C.tealBg : C.bg,
                    color: active ? C.tealText : C.muted,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List with clickable rows */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {isLoading && <TLoad />}
          {!isLoading && notifications.length === 0 && <TEmpty icon={Bell} text="No notifications" />}
          {!isLoading && notifications.map((notif: any, i: number) => {
            const cfg = NOTIF_TYPES[notif.type] ?? NOTIF_TYPES.system;
            const Icon = cfg.icon;
            const isExpanded = expandedId === notif.id;

            return (
              <div key={notif.id}>
                <div
                  className="notif-r"
                  onClick={(e) => handleRowClick(notif, e)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 18px",
                    borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer",
                    background: notif.is_read ? (isExpanded ? C.bgMuted : "transparent") : (cfg.bg + "20"),
                    transition: "background .1s"
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: cfg.bg,
                    border: `1px solid ${cfg.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Icon size={16} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 100,
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}40`
                      }}>
                        {cfg.label}
                      </span>
                      {!notif.is_read && (
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                      {notif.title}
                    </p>
                    <p style={{
                      fontSize: 12,
                      color: C.muted,
                      lineHeight: 1.5,
                      marginBottom: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: isExpanded ? "none" : 2,
                      WebkitBoxOrient: "vertical",
                      overflow: isExpanded ? "visible" : "hidden"
                    }}>
                      {notif.message}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ fontSize: 10, color: C.faint }}>{formatTime(notif.created_at)}</p>
                      {isExpanded ? (
                        <ChevronUp size={12} color={C.faint} />
                      ) : (
                        <ChevronDown size={12} color={C.faint} />
                      )}
                    </div>
                  </div>
                  <button
                    className="del-btn"
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm("Delete notification?")) deleteMut.mutate(notif.id);
                    }}
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
                      flexShrink: 0,
                      transition: "all .12s"
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Expanded detail row */}
                {isExpanded && (
                  <div
                    className="detail-row"
                    style={{
                      padding: "20px 18px",
                      background: C.bgMuted,
                      borderTop: `1px solid ${C.border}`,
                      borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}` : "none"
                    }}
                  >
                    <NotificationDetail
                      notification={notif}
                      onClose={() => setExpandedId(null)}
                      onMarkRead={() => markReadMut.mutate(notif.id)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}