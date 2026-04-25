import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Bell, Search, ChevronRight, X, Clock, Calendar, AlertCircle, DollarSign, FileText, UserPlus, Activity } from "lucide-react";
import { apiLogout } from "@/api/auth";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";
import { APP_NAME } from "../APP_NAME";
import apiClient from "@/api/client";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/":              { title: "Dashboard",     description: "Overview & today's activity" },
  "/patients":      { title: "Patients",      description: "Manage patient records" },
  "/appointments":  { title: "Appointments",  description: "Calendar & scheduling" },
  "/treatments":    { title: "Treatments",    description: "Clinical notes & procedures" },
  "/billing":       { title: "Billing",       description: "Invoices & payments" },
  "/expenses":      { title: "Expenses",      description: "Clinic operating costs" },
  "/prescriptions": { title: "Prescriptions", description: "Medication records" },
  "/lab-orders":    { title: "Lab Orders",    description: "Crown, denture & lab work" },
  "/consent-forms": { title: "Consent Forms", description: "Signed patient consents" },
  "/referrals":     { title: "Referrals",     description: "Specialist referrals" },
  "/inventory":     { title: "Inventory",     description: "Stock levels & alerts" },
  "/notifications": { title: "Notifications", description: "Reminders & alerts" },
  "/reports":       { title: "Reports",       description: "Revenue & analytics" },
  "/staff":         { title: "Staff",         description: "User management" },
  "/settings":      { title: "Settings",      description: "Clinic configuration" },
};

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  is_read: boolean;
  created_at: string;
  patient_id?: number;
}

// Helper to get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'appointment_reminder':
    case 'appointment':
      return Calendar;
    case 'payment_due':
    case 'payment':
      return DollarSign;
    case 'follow_up':
    case 'recare':
      return Activity;
    case 'system':
      return AlertCircle;
    case 'lab':
    case 'lab_order':
      return FileText;
    case 'patient':
      return UserPlus;
    default:
      return Bell;
  }
};

// Helper to get color based on notification type
const getNotificationColor = (type: string) => {
  switch (type) {
    case 'appointment_reminder':
    case 'appointment':
      return "#3b82f6";
    case 'payment_due':
    case 'payment':
      return "#0d9e75";
    case 'follow_up':
    case 'recare':
      return "#8b5cf6";
    case 'system':
      return "#f59e0b";
    case 'lab':
    case 'lab_order':
      return "#ec4899";
    default:
      return "#64748b";
  }
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function SuperAdminTopbar() {
  const loc      = useLocation();
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const clear    = useAuthStore((s) => s.clear);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const meta  = PAGE_META[loc.pathname] ?? { title: APP_NAME, description: "" };
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  // Fetch unread count periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 200000); // Every 200 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Click outside to close
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

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

    const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/api/v1/notifications/unread-count');
      setUnreadCount(response.data?.data?.count ?? response.data?.count ?? 0);
    } catch (error) {
      console.debug("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await apiClient.get('/api/v1/notifications', {
        params: { limit: 20 }
      });
      
      const data = response.data?.data || response.data || [];
      setNotifications(data);
      
      const unread = data.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      clear();
      navigate("/login");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const markAsRead = async (id: number) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, is_read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // Revert on error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    );
    setUnreadCount(0);
    
    try {
      await apiClient.patch('/notifications/read-all');
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const wasUnread = !notifications.find(n => n.id === id)?.is_read;
    
    // Optimistic update
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      fetchNotifications();
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // TODO: Implement global search
      console.log("Searching for:", searchQuery);
      setShowSearch(false);
      setSearchQuery("");
      toast.success(`Searching for "${searchQuery}"`);
    }
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

      {/* Left: breadcrumb */}
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

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{
          fontSize: 12, color: "#475569", background: "#f8fafc", padding: "6px 14px",
          borderRadius: 100, border: "1px solid #e2e8f0", whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums", fontWeight: 500,
        }}>
          {today}
        </span>

        {/* Search */}
        <div ref={searchRef} style={{ position: "relative" }}>
          {showSearch ? (
            <div style={{
              display: "flex", alignItems: "center", background: "#f8fafc",
              border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 4px 4px 12px",
              width: 280, transition: "all 0.2s ease",
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search patients, appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                style={{
                  border: "none", background: "transparent", padding: "6px 8px",
                  fontSize: 13, width: "100%", outline: "none", color: "#0f172a",
                }}
              />
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                style={{
                  background: "transparent", border: "none", padding: "4px 8px",
                  cursor: "pointer", color: "#94a3b8", borderRadius: 6,
                  display: "flex", alignItems: "center", transition: "all 0.2s ease",
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
                borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
                cursor: "pointer", color: "#475569", fontSize: 13, height: 36,
              }}
            >
              <Search size={14} strokeWidth={2} />
              <span>Search</span>
              <kbd style={{
                fontSize: 10, background: "#e2e8f0", padding: "2px 6px",
                borderRadius: 4, color: "#475569",
              }}>⌘K</kbd>
            </button>
          )}
        </div>

        {/* Notifications bell */}
        <div style={{ position: "relative" }}>
          <button
            ref={bellRef}
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0",
              background: showNotifications ? "#fff" : "#f8fafc", display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              position: "relative", color: showNotifications ? "#0d9e75" : "#475569",
              flexShrink: 0,
            }}
          >
            <Bell size={16} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 5, right: 5, width: 8, height: 8,
                borderRadius: "50%", background: "#ef4444", border: "2px solid #fff",
              }} />
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div
              ref={notificationRef}
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0, width: 380,
                background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                zIndex: 1000, overflow: "hidden", animation: "slideDown 0.2s ease-out",
              }}
            >
              {/* Header */}
              <div style={{
                padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#f8fafc",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={16} color="#0d9e75" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{
                      background: "#0d9e75", color: "white", fontSize: 11,
                      fontWeight: 600, padding: "2px 8px", borderRadius: 100,
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: "transparent", border: "none", fontSize: 12,
                      color: "#0d9e75", cursor: "pointer", padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {loadingNotifications ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      border: "2px solid #e2e8f0", borderTopColor: "#0d9e75",
                      animation: "spin 0.7s linear infinite", margin: "0 auto 12px",
                    }} />
                    <p style={{ fontSize: 13 }}>Loading notifications...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const Icon = getNotificationIcon(notif.type);
                    const color = getNotificationColor(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        style={{
                          padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
                          background: notif.is_read ? "#fff" : "#f0fdf9",
                          cursor: "pointer", position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: `${color}10`, display: "flex",
                            alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Icon size={18} color={color} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: "flex", alignItems: "flex-start",
                              justifyContent: "space-between", gap: 8,
                            }}>
                              <div>
                                <p style={{
                                  fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4,
                                }}>
                                  {notif.title}
                                </p>
                                <p style={{
                                  fontSize: 12, color: "#475569", lineHeight: 1.5, marginBottom: 6,
                                }}>
                                  {notif.message}
                                </p>
                                <span style={{
                                  fontSize: 11, color: "#94a3b8", display: "flex",
                                  alignItems: "center", gap: 4,
                                }}>
                                  <Clock size={10} />
                                  {formatRelativeTime(notif.created_at)}
                                </span>
                              </div>
                              <button
                                onClick={(e) => deleteNotification(notif.id, e)}
                                style={{
                                  background: "transparent", border: "none", padding: 4,
                                  cursor: "pointer", color: "#94a3b8", borderRadius: 4,
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {!notif.is_read && (
                          <span style={{
                            position: "absolute", left: 0, top: "50%",
                            transform: "translateY(-50%)", width: 3, height: 30,
                            background: "#0d9e75", borderRadius: "0 4px 4px 0",
                          }} />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{
                    padding: "40px 20px", textAlign: "center", color: "#94a3b8",
                  }}>
                    <Bell size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                      No notifications
                    </p>
                    <p style={{ fontSize: 12 }}>
                      You're all caught up!
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{
                  padding: "12px 20px", borderTop: "1px solid #e2e8f0",
                  background: "#f8fafc", textAlign: "center",
                }}>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/notifications");
                    }}
                    style={{
                      background: "transparent", border: "none", fontSize: 12,
                      color: "#0d9e75", cursor: "pointer", fontWeight: 500,
                      padding: "4px 12px", borderRadius: 6,
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 30, background: "#e2e8f0", flexShrink: 0 }} />

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #0d9e75, #0a7d5d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: "white", flexShrink: 0,
            boxShadow: "0 4px 6px -1px rgba(13,158,117,0.2)",
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.4, whiteSpace: "nowrap" }}>
              {user?.fullName || "User"}
            </p>
            <p style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", lineHeight: 1.4 }}>
              {user?.role || "Staff"}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0",
            background: "#f8fafc", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "#64748b",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#fecaca";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.background = "#f8fafc";
          }}
        >
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}