// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon, Building2, Bell, Palette, Globe, Key,
  Database, Mail, Check, Users, Calendar, Clock, MapPin, Phone,
  Mail as MailIcon, DollarSign, Shield, HardDrive, Plus, Trash2,
  Edit, X, Save, Moon, Sun, Monitor, Languages
} from "lucide-react";
import {
  apiGetRooms,
  apiUpdateRoom,
  apiDeleteRoom
} from "@/api/rooms";
import { apiGetClinic, apiUpdateClinic } from "@/api/settings";
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

const GS = `@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}.sec-card:hover{border-color:${C.tealBorder}!important}.room-row:hover{background:${C.bgMuted}!important}.del-btn:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}`;

// ── Shared atoms ──────────────────────────────────────────────────────────────
function F({ label, req, desc, children }: { label: string; req?: boolean; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
        {label}
        {req && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {desc && <p style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>{desc}</p>}
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

function IBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={danger ? "del-btn" : ""}
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
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0
        }}>
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
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [activeTab, setActiveTab] = useState("clinic");
  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [roomForm, setRoomForm] = useState({ name: "", type: "treatment", capacity: "", equipment: "" });

  // Fetch clinic settings
  const { data: clinicData, isLoading: clinicLoading } = useQuery({
    queryKey: ["settings", "clinic"],
    queryFn: () => apiGetClinic()
  });

  // Fetch rooms
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiGetRooms()
  });

  const clinic = clinicData?.data ?? clinicData ?? {};
  const rooms: any[] = roomsData?.data ?? roomsData ?? [];

  const [form, setForm] = useState({
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    timezone: "UTC",
    currency: "USD",
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    lowStockAlerts: true,
    theme: "light",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    allowOnlineBooking: true,
    autoConfirmBookings: false,
    requireDeposit: false,
    depositAmount: "",
  });

  // Update form when clinic data loads
  useEffect(() => {
    if (clinic) {
      setForm(prev => ({
        ...prev,
        clinicName: clinic.name || "",
        clinicAddress: clinic.address || "",
        clinicPhone: clinic.phone || "",
        clinicEmail: clinic.email || "",
        workingHoursStart: clinic.working_hours_start || "09:00",
        workingHoursEnd: clinic.working_hours_end || "17:00",
        timezone: clinic.timezone || "UTC",
        currency: clinic.currency || "USD",
      }));
    }
  }, [clinic]);

  const updateMut = useMutation({
    mutationFn: (data: any) => apiUpdateClinic(data),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings", "clinic"] });
    },
    onError: () => toast.error("Failed to save")
  });

  const createRoomMut = useMutation({
    mutationFn: (data: any) => apiCreateRoom(data),
    onSuccess: () => {
      toast.success("Room added");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      setRoomModal(false);
      setRoomForm({ name: "", type: "treatment", capacity: "", equipment: "" });
    },
    onError: () => toast.error("Failed to add room")
  });

  const updateRoomMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiUpdateRoom(id, data),
    onSuccess: () => {
      toast.success("Room updated");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      setRoomModal(false);
      setEditingRoom(null);
      setRoomForm({ name: "", type: "treatment", capacity: "", equipment: "" });
    },
    onError: () => toast.error("Failed to update room")
  });

  const deleteRoomMut = useMutation({
    mutationFn: (id: number) => apiDeleteRoom(id),
    onSuccess: () => {
      toast.success("Room deleted");
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => toast.error("Failed to delete room")
  });

  const handleSave = () => {
    updateMut.mutate({
      name: form.clinicName,
      address: form.clinicAddress,
      phone: form.clinicPhone,
      email: form.clinicEmail,
      working_hours_start: form.workingHoursStart,
      working_hours_end: form.workingHoursEnd,
      timezone: form.timezone,
      currency: form.currency
    });
  };

  const handleRoomSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name) {
      toast.error("Room name required");
      return;
    }

    const data = {
      name: roomForm.name,
      type: roomForm.type,
      capacity: roomForm.capacity ? parseInt(roomForm.capacity) : 1,
      equipment: roomForm.equipment
    };

    if (editingRoom) {
      updateRoomMut.mutate({ id: editingRoom.id, data });
    } else {
      createRoomMut.mutate(data);
    }
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const ft = (k: string, v: boolean) => setForm(p => ({ ...p, [k]: v }));

  const tabs = [
    { id: "clinic", label: "Clinic Info", icon: Building2, color: C.teal },
    { id: "rooms", label: "Rooms & Facilities", icon: Calendar, color: C.blue },
    { id: "notifications", label: "Notifications", icon: Bell, color: C.purple },
    { id: "appearance", label: "Appearance", icon: Palette, color: C.amber },
    { id: "booking", label: "Online Booking", icon: Globe, color: C.green },
  ];

  const roomTypes = [
    { value: "treatment", label: "Treatment Room", icon: Calendar },
    { value: "surgery", label: "Surgery Suite", icon: Shield },
    { value: "xray", label: "X-Ray Room", icon: Camera },
    { value: "consultation", label: "Consultation", icon: Users },
    { value: "sterilization", label: "Sterilization", icon: HardDrive },
  ];

  return (
    <>
      <style>{GS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease both" }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Settings</h1>
          <p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>Manage your clinic configuration and preferences</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
          {/* Tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tabs.map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${active ? t.color + "40" : C.border}`,
                    background: active ? t.color + "10" : C.bg,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? t.color : C.muted,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    transition: "all .15s"
                  }}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
            {/* Clinic Info Tab */}
            {activeTab === "clinic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Clinic Information</h3>
                  <p style={{ fontSize: 12, color: C.faint }}>Basic details about your dental practice</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1/-1" }}>
                    <F label="Clinic Name" req>
                      <input
                        value={form.clinicName}
                        onChange={f("clinicName")}
                        placeholder="Smile Dental Clinic"
                        className="inp"
                        style={IS}
                      />
                    </F>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <F label="Address">
                      <input
                        value={form.clinicAddress}
                        onChange={f("clinicAddress")}
                        placeholder="123 Main Street, City"
                        className="inp"
                        style={IS}
                      />
                    </F>
                  </div>
                  <F label="Phone">
                    <input
                      type="tel"
                      value={form.clinicPhone}
                      onChange={f("clinicPhone")}
                      placeholder="+252 61 234 5678"
                      className="inp"
                      style={IS}
                    />
                  </F>
                  <F label="Email">
                    <input
                      type="email"
                      value={form.clinicEmail}
                      onChange={f("clinicEmail")}
                      placeholder="info@clinic.com"
                      className="inp"
                      style={IS}
                    />
                  </F>
                  <F label="Working Hours Start">
                    <input
                      type="time"
                      value={form.workingHoursStart}
                      onChange={f("workingHoursStart")}
                      className="inp"
                      style={IS}
                    />
                  </F>
                  <F label="Working Hours End">
                    <input
                      type="time"
                      value={form.workingHoursEnd}
                      onChange={f("workingHoursEnd")}
                      className="inp"
                      style={IS}
                    />
                  </F>
                  <F label="Timezone">
                    <select value={form.timezone} onChange={f("timezone")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                      <option value="UTC">UTC</option>
                      <option value="Africa/Nairobi">East Africa Time (Nairobi)</option>
                      <option value="Africa/Mogadishu">East Africa Time (Mogadishu)</option>
                      <option value="America/New_York">Eastern Time (New York)</option>
                      <option value="Europe/London">GMT (London)</option>
                    </select>
                  </F>
                  <F label="Currency">
                    <select value={form.currency} onChange={f("currency")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SOS">SOS (Sh)</option>
                    </select>
                  </F>
                </div>
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === "rooms" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Rooms & Facilities</h3>
                    <p style={{ fontSize: 12, color: C.faint }}>Manage treatment rooms and facilities</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomForm({ name: "", type: "treatment", capacity: "", equipment: "" });
                      setRoomModal(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: C.teal,
                      border: "none",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <Plus size={14} />
                    Add Room
                  </button>
                </div>

                {roomsLoading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: C.faint }}>Loading rooms...</div>
                ) : rooms.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: C.faint, background: C.bgMuted, borderRadius: 10 }}>
                    <Building2 size={24} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                    <p>No rooms added yet</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {rooms.map((room: any) => (
                      <div
                        key={room.id}
                        className="room-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: C.bg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 10
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: C.blue + "18",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <Calendar size={16} color={C.blue} />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{room.name}</p>
                            <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                              <span style={{ fontSize: 11, color: C.faint }}>Type: {room.type}</span>
                              {room.capacity && (
                                <span style={{ fontSize: 11, color: C.faint }}>Capacity: {room.capacity}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <IBtn
                            onClick={() => {
                              setEditingRoom(room);
                              setRoomForm({
                                name: room.name,
                                type: room.type,
                                capacity: room.capacity?.toString() || "",
                                equipment: room.equipment || ""
                              });
                              setRoomModal(true);
                            }}
                            title="Edit room"
                          >
                            <Edit size={12} />
                          </IBtn>
                          <IBtn
                            danger
                            onClick={() => {
                              if (confirm("Delete this room?")) deleteRoomMut.mutate(room.id);
                            }}
                            title="Delete room"
                          >
                            <Trash2 size={12} />
                          </IBtn>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Notification Preferences</h3>
                  <p style={{ fontSize: 12, color: C.faint }}>Configure how and when you receive alerts</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email", icon: MailIcon },
                    { key: "smsNotifications", label: "SMS Notifications", desc: "Receive notifications via text message", icon: Phone },
                    { key: "appointmentReminders", label: "Appointment Reminders", desc: "Send automatic reminders to patients", icon: Clock },
                    { key: "lowStockAlerts", label: "Low Stock Alerts", desc: "Alert when inventory items are running low", icon: HardDrive },
                  ].map(n => {
                    const Icon = n.icon;
                    return (
                      <div key={n.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: C.bgMuted, borderRadius: 10, border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Icon size={16} color={C.muted} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{n.label}</p>
                            <p style={{ fontSize: 11, color: C.faint }}>{n.desc}</p>
                          </div>
                        </div>
                        <Toggle checked={form[n.key as keyof typeof form] as boolean} onChange={v => ft(n.key, v)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Appearance Settings</h3>
                  <p style={{ fontSize: 12, color: C.faint }}>Customize how the system looks and feels</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <F label="Theme">
                    <select value={form.theme} onChange={f("theme")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                      <option value="light">🌞 Light</option>
                      <option value="dark">🌙 Dark</option>
                      <option value="auto">⚙️ Auto</option>
                    </select>
                  </F>
                  <F label="Language">
                    <select value={form.language} onChange={f("language")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                      <option value="en">🇬🇧 English</option>
                      <option value="so">🇸🇴 Somali</option>
                      <option value="ar">🇸🇦 Arabic</option>
                    </select>
                  </F>
                  <F label="Date Format">
                    <select value={form.dateFormat} onChange={f("dateFormat")} className="inp" style={{ ...IS, cursor: "pointer" }}>
                      <option value="DD/MM/YYYY">31/12/2024</option>
                      <option value="MM/DD/YYYY">12/31/2024</option>
                      <option value="YYYY-MM-DD">2024-12-31</option>
                    </select>
                  </F>
                </div>
              </div>
            )}

            {/* Booking Tab */}
            {activeTab === "booking" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Online Booking</h3>
                  <p style={{ fontSize: 12, color: C.faint }}>Configure patient self-booking options</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { key: "allowOnlineBooking", label: "Allow Online Booking", desc: "Enable patients to book appointments online" },
                    { key: "autoConfirmBookings", label: "Auto-Confirm Bookings", desc: "Automatically confirm online bookings without review" },
                    { key: "requireDeposit", label: "Require Deposit", desc: "Require payment deposit for online bookings" },
                  ].map(n => (
                    <div key={n.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: C.bgMuted, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{n.label}</p>
                        <p style={{ fontSize: 11, color: C.faint }}>{n.desc}</p>
                      </div>
                      <Toggle checked={form[n.key as keyof typeof form] as boolean} onChange={v => ft(n.key, v)} />
                    </div>
                  ))}
                  {form.requireDeposit && (
                    <F label="Deposit Amount" desc="Amount required to confirm booking">
                      <input
                        type="number"
                        step="0.01"
                        value={form.depositAmount}
                        onChange={f("depositAmount")}
                        placeholder="0.00"
                        className="inp"
                        style={IS}
                      />
                    </F>
                  )}
                </div>
              </div>
            )}

            {/* Save button */}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, marginTop: 12, borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={handleSave}
                disabled={updateMut.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 9,
                  background: updateMut.isPending ? "#9ab5ae" : C.teal,
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: updateMut.isPending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: updateMut.isPending ? "none" : "0 2px 8px rgba(13,158,117,.3)"
                }}
              >
                {updateMut.isPending ? <>Saving…</> : <><Save size={14} />Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Room Modal */}
      <Modal open={roomModal} onClose={() => setRoomModal(false)} title={editingRoom ? "Edit Room" : "Add New Room"} size="sm">
        <form onSubmit={handleRoomSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <F label="Room Name" req>
            <input
              value={roomForm.name}
              onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Treatment Room 1"
              className="inp"
              style={IS}
            />
          </F>
          <F label="Room Type">
            <select
              value={roomForm.type}
              onChange={e => setRoomForm(p => ({ ...p, type: e.target.value }))}
              className="inp"
              style={{ ...IS, cursor: "pointer" }}
            >
              {roomTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </F>
          <F label="Capacity">
            <input
              type="number"
              min="1"
              value={roomForm.capacity}
              onChange={e => setRoomForm(p => ({ ...p, capacity: e.target.value }))}
              placeholder="1"
              className="inp"
              style={IS}
            />
          </F>
          <F label="Equipment / Notes">
            <textarea
              value={roomForm.equipment}
              onChange={e => setRoomForm(p => ({ ...p, equipment: e.target.value }))}
              placeholder="List major equipment in this room..."
              rows={3}
              className="inp"
              style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none" }}
            />
          </F>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => setRoomModal(false)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bg,
                fontSize: 12,
                fontWeight: 500,
                color: C.muted,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRoomMut.isPending || updateRoomMut.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: C.teal,
                border: "none",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {(createRoomMut.isPending || updateRoomMut.isPending) ? "Saving..." : editingRoom ? "Update Room" : "Add Room"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// Missing icon components
function Camera(props: any) {
  return (
    <svg
      {...props}
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}