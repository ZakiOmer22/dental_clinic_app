// src/layouts/Accountant/AccountantTopbar.tsx
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Bell, Search, ChevronRight, X, Clock, DollarSign } from "lucide-react";
import { apiLogout } from "@/api/auth";
import { useAuthStore } from "@/app/store";
import { 
  apiGetNotifications, 
  apiMarkNotificationRead, 
  apiMarkAllRead, 
  apiDeleteNotification,
  apiGetUnreadCount 
} from "@/api/notifications";
import toast from "react-hot-toast";
import { APP_NAME } from "../APP_NAME";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  color: string;
  actionUrl?: string;
  createdAt: string;
}

const getPageMeta = (pathname: string, role?: string) => {
  const baseMeta: Record<string, { title: string; description: string }> = {
    "/": { title: "Financial Dashboard", description: "Revenue & expense overview" },
    "/accountant/reports": { title: "Financial Reports", description: "Income statements & balance sheets" },
    "/accountant/invoices": { title: "Invoices", description: "Manage patient invoices" },
    "/accountant/invoices/create": { title: "Create Invoice", description: "Generate new invoice" },
    "/accountant/invoices/list": { title: "All Invoices", description: "View all invoices" },
    "/accountant/invoices/unpaid": { title: "Unpaid Invoices", description: "Outstanding payments" },
    "/accountant/payments": { title: "Record Payment", description: "Process patient payments" },
    "/accountant/refunds": { title: "Refunds", description: "Process refunds" },
    "/accountant/insurance/claims": { title: "Insurance Claims", description: "Manage insurance claims" },
    "/accountant/insurance/policies": { title: "Insurance Policies", description: "Patient coverage" },
    "/accountant/insurance/verification": { title: "Verify Coverage", description: "Check insurance eligibility" },
    "/accountant/expenses": { title: "Expenses", description: "Track clinic expenses" },
    "/accountant/revenue": { title: "Revenue Reports", description: "Revenue by period" },
    "/accountant/patient-balance": { title: "Patient Balances", description: "Outstanding balances" },
    "/accountant/tax-reports": { title: "Tax Reports", description: "Tax preparation" },
    "/accountant/procedures": { title: "Service Prices", description: "Procedure pricing" },
    "/accountant/inventory/valuation": { title: "Inventory Value", description: "Stock valuation" },
    "/accountant/audit-logs": { title: "Audit Trail", description: "Financial transaction history" },
    "/accountant/financial-settings": { title: "Financial Settings", description: "Accounting configuration" },
    "/accountant/support/knowledge": { title: "Knowledge Base", description: "Accounting guides" },
    "/accountant/support/feedback": { title: "Feedback", description: "Send feedback" },
  };

  return baseMeta[pathname] ?? { title: APP_NAME, description: "Accounting Portal" };
};

export default function AccountantTopbar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const meta = getPageMeta(loc.pathname, user?.role);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") ?? "U";

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { count } = await apiGetUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const fetchNotifications = async () => {
    setIsNotificationsLoading(true);
    try {
      const data = await apiGetNotifications();
      setNotifications(data);
      const unread = data.filter((n: Notification) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiMarkAllRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiDeleteNotification(id);
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== id);
        const unread = filtered.filter(n => !n.read).length;
        setUnreadCount(unread);
        return filtered;
      });
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      clear();
      navigate("/login");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/accountant/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setShowNotifications(false);
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    navigate("/accountant/notifications");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <header style={{
      height: 64,
      background: "#ffffff",
      borderBottom: "1px solid #e5eae8",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      flexShrink: 0,
      gap: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      position: "relative",
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap", fontWeight: 500 }}>
          {APP_NAME}
        </span>
        <ChevronRight size={12} color="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>
          {meta.title}
        </span>
        {meta.description && (
          <>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {meta.description}
            </span>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{
          fontSize: 12, color: "#475569", background: "#f8fafc", padding: "6px 14px",
          borderRadius: 100, border: "1px solid #e2e8f0", whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums", fontWeight: 500,
        }}>
          {today}
        </span>

        <div ref={searchRef} style={{ position: "relative" }}>
          {showSearch ? (
            <form onSubmit={handleSearch} style={{
              display: "flex", alignItems: "center", background: "#f8fafc",
              border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 4px 4px 12px",
              width: 280, transition: "all 0.2s ease",
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search invoices, patients, payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none", background: "transparent", padding: "6px 8px",
                  fontSize: 13, width: "100%", outline: "none", color: "#0f172a",
                }}
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                style={{
                  background: "transparent", border: "none", padding: "4px 8px",
                  cursor: "pointer", color: "#94a3b8", borderRadius: 6,
                  display: "flex", alignItems: "center", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
                borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
                cursor: "pointer", color: "#475569", fontSize: 13, fontFamily: "inherit",
                transition: "all .15s", height: 36,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0d9e75"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#0d9e75"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#475569"; }}
            >
              <Search size={14} strokeWidth={2} />
              <span>Search</span>
              <kbd style={{ fontSize: 10, background: "#e2e8f0", padding: "2px 6px", borderRadius: 4, color: "#475569", fontFamily: "inherit" }}>⌘K</kbd>
            </button>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button
            ref={bellRef}
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0",
              background: showNotifications ? "#fff" : "#f8fafc", display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              position: "relative", color: showNotifications ? "#0d9e75" : "#475569",
              transition: "all .15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (!showNotifications) { e.currentTarget.style.borderColor = "#0d9e75"; e.currentTarget.style.color = "#0d9e75"; e.currentTarget.style.background = "#fff"; } }}
            onMouseLeave={(e) => { if (!showNotifications) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "#f8fafc"; } }}
          >
            <Bell size={16} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff" }} />
            )}
          </button>

          {showNotifications && (
            <div
              ref={notificationRef}
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0, width: 380,
                background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)",
                zIndex: 1000, overflow: "hidden", animation: "slideDown 0.2s ease-out",
              }}
            >
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={16} color="#0d9e75" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ background: "#0d9e75", color: "white", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100 }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} style={{ background: "transparent", border: "none", fontSize: 12, color: "#0d9e75", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>
                    Mark all as read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {isNotificationsLoading ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ animation: "spin 1s linear infinite", width: 24, height: 24, margin: "0 auto 12px", border: "2px solid #e2e8f0", borderTopColor: "#0d9e75", borderRadius: "50%" }} />
                    <p style={{ fontSize: 14 }}>Loading notifications...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
                        background: notification.read ? "#fff" : "#f0fdf9", cursor: "pointer",
                        transition: "all 0.2s ease", position: "relative",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = notification.read ? "#fff" : "#f0fdf9"; }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${notification.color || "#0d9e75"}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Bell size={18} color={notification.color || "#0d9e75"} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{notification.title}</p>
                              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, marginBottom: 6 }}>{notification.message}</p>
                              <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={10} />
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", color: "#94a3b8", borderRadius: 4, display: "flex" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 30, background: "#0d9e75", borderRadius: "0 4px 4px 0" }} />
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <Bell size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No notifications</p>
                    <p style={{ fontSize: 12 }}>You're all caught up!</p>
                  </div>
                )}
              </div>

              <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "center" }}>
                <button onClick={handleViewAllNotifications} style={{ background: "transparent", border: "none", fontSize: 12, color: "#0d9e75", cursor: "pointer", fontWeight: 500 }}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 30, background: "#e2e8f0", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0d9e75, #0a7d5d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "white", flexShrink: 0, letterSpacing: "-.01em", boxShadow: "0 4px 6px -1px rgba(13,158,117,0.2)" }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.4, whiteSpace: "nowrap" }}>{user?.fullName}</p>
            <p style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", lineHeight: 1.4 }}>Accountant</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoading}
          title="Sign out"
          style={{
            width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isLoading ? "not-allowed" : "pointer", color: "#64748b",
            opacity: isLoading ? 0.5 : 1, transition: "all .15s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; } }}
          onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#f8fafc"; } }}
        >
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}