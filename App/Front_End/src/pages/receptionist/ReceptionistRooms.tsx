// ReceptionistRooms.tsx - Fixed with proper imports
import { useState, useMemo } from "react";  // ← Already imported, just use useMemo directly
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CalendarDays, Clock, Search,
  ChevronRight, CheckCircle2, XCircle, RefreshCw,
  LayoutGrid, List, Filter, ChevronDown,
  CalendarCheck, Timer, Ban, RotateCcw, X,
  Armchair, Sofa, Stethoscope, Activity,
  Edit2, Eye, Power, PowerOff, AlertCircle,
  Wrench, Droplet, Thermometer, Syringe,
  ChevronLeft, TrendingUp, User, Phone, Mail,
  Building2, MapPin, BedDouble,
} from "lucide-react";
import {
  apiGetRooms,
  apiCreateRoom,
  apiUpdateRoom,
  apiDeleteRoom,
} from "@/api/rooms";
import { apiGetAppointments } from "@/api/appointments";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  border:"#e5eae8",bg:"#ffffff",bgMuted:"#f7f9f8",bgPage:"#f0f2f1",
  text:"#111816",muted:"#7a918b",faint:"#a0b4ae",
  teal:"#0d9e75",tealBg:"#e8f7f2",tealText:"#0a7d5d",tealBorder:"#c3e8dc",
  amber:"#f59e0b",amberBg:"#fffbeb",amberText:"#92400e",amberBorder:"#fde68a",
  red:"#e53e3e",redBg:"#fff5f5",redText:"#c53030",redBorder:"#fed7d7",
  blue:"#3b82f6",blueBg:"#eff6ff",blueText:"#1d4ed8",blueBorder:"#bfdbfe",
  purple:"#8b5cf6",purpleBg:"#f5f3ff",purpleText:"#5b21b6",
  green:"#10b981",greenBg:"#f0fdf4",greenText:"#059669",greenBorder:"#d1fae5",
  gray:"#6b7f75",grayBg:"#f4f7f5",
};

const ROOM_TYPES = [
  "dental_chair", "consultation", "xray", "surgery", 
  "lab", "sterilization", "waiting", "storage", "office"
];

const ROOM_TYPE_LABELS: Record<string, string> = {
  dental_chair: "Dental Chair",
  consultation: "Consultation Room",
  xray: "X-Ray Room",
  surgery: "Surgery Suite",
  lab: "Laboratory",
  sterilization: "Sterilization",
  waiting: "Waiting Area",
  storage: "Storage Room",
  office: "Office",
};

const ROOM_TYPE_ICONS: Record<string, any> = {
  dental_chair: Armchair,
  consultation: Sofa,
  xray: Activity,
  surgery: Stethoscope,
  lab: Syringe,
  sterilization: Droplet,
  waiting: User,
  storage: Building2,
  office: Building2,
};

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({name,size=30}:{name:string;size?:number}) {
  const i=(name??"?").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#0d9e75,#0a7d5d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.37,fontWeight:700,color:"white",flexShrink:0}}>{i}</div>;
}

function StatusBadge({available}:{available:boolean}) {
  return available ? (
    <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:100,background:C.greenBg,color:C.greenText,border:`1px solid ${C.greenBorder}`,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
      <CheckCircle2 size={10}/> Available
    </span>
  ) : (
    <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:100,background:C.redBg,color:C.redText,border:`1px solid ${C.redBorder}`,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
      <XCircle size={10}/> Occupied
    </span>
  );
}

const IS={width:"100%",height:38,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:9,background:C.bg,fontSize:13,color:C.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box" as const};

function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <div><label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:5}}>{label}</label>{children}</div>;
}

function SubmitBtn({loading,children}:{loading?:boolean;children:React.ReactNode}) {
  return <button type="submit" disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:9,background:loading?"#9ab5ae":C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 2px 8px rgba(13,158,117,.3)"}}>{loading?<><span style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite",display:"inline-block"}}/>Saving…</>:children}</button>;
}

function GhostBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} style={{padding:"9px 16px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:13,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({open,onClose,title,children,size="medium"}:{
  open:boolean;
  onClose:()=>void;
  title:string;
  children:React.ReactNode;
  size?: "small" | "medium" | "large";
}) {
  if(!open)return null;
  const width = size === "small" ? 400 : size === "large" ? 800 : 520;
  
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:16,width:"100%",maxWidth:width,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"modalIn .2s cubic-bezier(.22,1,.36,1)",maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text}}>{title}</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><X size={14}/></button>
        </div>
        <div style={{padding:20,overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Search Input ────────────────────────────────────────────────────────────
function SearchInput({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder:string}) {
  return (
    <div style={{position:"relative",width:"100%"}}>
      <Search size={16} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{...IS,paddingLeft:36,height:42,fontSize:14}}
      />
      {value && (
        <button onClick={()=>onChange("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.faint}}>
          <X size={14}/>
        </button>
      )}
    </div>
  );
}

// ─── Room Card ───────────────────────────────────────────────────────────────
function RoomCard({ room, currentAppointment, onToggleStatus, onEdit, onDelete }: {
  room: any;
  currentAppointment: any;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = ROOM_TYPE_ICONS[room.type] || Armchair;
  const isAvailable = room.is_available;

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${isAvailable ? C.border : C.redBorder}`,
        borderRadius: 12,
        padding: 16,
        transition: "all 0.2s",
        position: "relative",
        cursor: "pointer",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: isAvailable ? C.green : C.red,
        borderRadius: "12px 12px 0 0",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: isAvailable ? C.tealBg : C.redBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Icon size={24} color={isAvailable ? C.teal : C.red} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{room.name}</h3>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{ROOM_TYPE_LABELS[room.type] || room.type}</p>
          </div>
        </div>
        <StatusBadge available={isAvailable} />
      </div>

      <div style={{ marginBottom: 12 }}>
        {room.floor && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <MapPin size={12} color={C.muted} />
            <span style={{ fontSize: 12, color: C.text }}>Floor: {room.floor}</span>
          </div>
        )}
        {room.notes && (
          <p style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>{room.notes}</p>
        )}
      </div>

      {currentAppointment && !isAvailable && (
        <div style={{
          background: C.blueBg,
          padding: "10px",
          borderRadius: 8,
          marginBottom: 12,
          border: `1px solid ${C.blueBorder}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Clock size={12} color={C.blue} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.blueText }}>Current Appointment</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{currentAppointment.patient_name}</p>
          <p style={{ fontSize: 10, color: C.muted }}>Dr. {currentAppointment.doctor_name}</p>
          <p style={{ fontSize: 10, color: C.muted }}>{new Date(currentAppointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onToggleStatus}
          style={{
            flex: 1,
            padding: "6px",
            borderRadius: 8,
            background: isAvailable ? C.amberBg : C.greenBg,
            border: `1px solid ${isAvailable ? C.amberBorder : C.greenBorder}`,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            color: isAvailable ? C.amberText : C.greenText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {isAvailable ? <PowerOff size={12} /> : <Power size={12} />}
          {isAvailable ? "Mark Occupied" : "Mark Available"}
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.bg,
            cursor: "pointer",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Edit2 size={12} /> Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.bg,
            cursor: "pointer",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: C.red,
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Room Form Modal ─────────────────────────────────────────────────────────
function RoomFormModal({ open, onClose, room, onSave, isLoading }: {
  open: boolean;
  onClose: () => void;
  room: any;
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    name: room?.name || "",
    type: room?.type || "dental_chair",
    floor: room?.floor || "",
    notes: room?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Room name is required");
      return;
    }
    onSave(form);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={room ? "Edit Room" : "Add New Room"} size="medium">
      <form onSubmit={handleSubmit}>
        <Field label="Room Name *">
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Chair 1, Consultation Room A, X-Ray Room"
            style={IS}
          />
        </Field>

        <Field label="Room Type">
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            style={{ ...IS, cursor: "pointer" }}
          >
            {ROOM_TYPES.map(type => (
              <option key={type} value={type}>{ROOM_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </Field>

        <Field label="Floor/Location">
          <input
            type="text"
            value={form.floor}
            onChange={e => setForm({ ...form, floor: e.target.value })}
            placeholder="e.g., Ground Floor, 2nd Floor, Building A"
            style={IS}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes about this room..."
            style={{ ...IS, height: "auto", padding: "8px 12px", resize: "none" }}
          />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <SubmitBtn loading={isLoading}>
            {room ? "Update Room" : "Create Room"}
          </SubmitBtn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Room Details Modal ─────────────────────────────────────────────────────
function RoomDetailsModal({ open, onClose, room, appointments, onEdit }: {
  open: boolean;
  onClose: () => void;
  room: any;
  appointments: any[];
  onEdit: () => void;
}) {
  if (!open || !room) return null;

  const todayAppointments = appointments.filter(apt => 
    apt.room_id === room.id && 
    new Date(apt.scheduled_at).toDateString() === new Date().toDateString()
  ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const upcomingAppointments = appointments.filter(apt => 
    apt.room_id === room.id && 
    new Date(apt.scheduled_at) > new Date()
  ).slice(0, 5);

  const Icon = ROOM_TYPE_ICONS[room.type] || Armchair;

  return (
    <Modal open={open} onClose={onClose} title="Room Details" size="large">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: room.is_available ? C.tealBg : C.redBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Icon size={32} color={room.is_available ? C.teal : C.red} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{room.name}</h2>
              <button
                onClick={onEdit}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 12 }}
              >
                <Edit2 size={12} /> Edit Room
              </button>
            </div>
            <p style={{ fontSize: 13, color: C.muted }}>{ROOM_TYPE_LABELS[room.type]}</p>
            {room.floor && <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>Floor: {room.floor}</p>}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>Current Status</h3>
          <div style={{
            padding: "12px",
            borderRadius: 8,
            background: room.is_available ? C.greenBg : C.redBg,
            border: `1px solid ${room.is_available ? C.greenBorder : C.redBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            {room.is_available ? <CheckCircle2 size={20} color={C.green} /> : <XCircle size={20} color={C.red} />}
            <span style={{ fontSize: 13, fontWeight: 600, color: room.is_available ? C.greenText : C.redText }}>
              {room.is_available ? "Available - Ready for use" : "Occupied - Currently in use"}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarDays size={14} /> Today's Schedule
          </h3>
          {todayAppointments.length === 0 ? (
            <p style={{ fontSize: 13, color: C.faint, textAlign: "center", padding: 20 }}>No appointments scheduled today</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayAppointments.map((apt, idx) => (
                <div key={idx} style={{ padding: "12px", background: C.bgMuted, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{apt.patient_name}</p>
                    <span style={{ fontSize: 11, color: C.muted }}>{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.muted }}>Dr. {apt.doctor_name}</p>
                  {apt.chief_complaint && <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{apt.chief_complaint}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {upcomingAppointments.length > 0 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} /> Upcoming Appointments
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingAppointments.map((apt, idx) => (
                <div key={idx} style={{ padding: "12px", background: C.bgMuted, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{apt.patient_name}</p>
                    <span style={{ fontSize: 11, color: C.muted }}>{new Date(apt.scheduled_at).toLocaleDateString()} at {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.muted }}>Dr. {apt.doctor_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.notes && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>Notes</h3>
            <p style={{ fontSize: 12, color: C.muted }}>{room.notes}</p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <GhostBtn onClick={onClose}>Close</GhostBtn>
        </div>
      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReceptionistRoomsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch rooms
  const { data: roomsResponse, isLoading, error } = useQuery({
    queryKey: ["rooms", "all"],
    queryFn: apiGetRooms,
  });

  // Fetch appointments to check occupancy
  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () => apiGetAppointments({ date: new Date().toISOString().split("T")[0] }),
  });

  // Ensure rooms is always an array - FIX: Use useMemo with proper syntax
  const allRooms: any[] = useMemo(() => {
    if (!roomsResponse) return [];
    if (Array.isArray(roomsResponse)) return roomsResponse;
    if (roomsResponse.data && Array.isArray(roomsResponse.data)) return roomsResponse.data;
    if (roomsResponse.rows && Array.isArray(roomsResponse.rows)) return roomsResponse.rows;
    return [];
  }, [roomsResponse]);

  const allAppointments: any[] = appointmentsData?.data ?? [];

  // Filter rooms
  const filteredRooms = useMemo(() => {
    let filtered = allRooms;
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(r => r.type === typeFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.is_available === (statusFilter === "available"));
    }
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(query) ||
        r.type?.toLowerCase().includes(query) ||
        r.floor?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allRooms, typeFilter, statusFilter, search]);

  // Get current appointment for a room
  const getCurrentAppointment = (roomId: number) => {
    return allAppointments.find(apt => 
      apt.room_id === roomId && 
      new Date(apt.scheduled_at).toDateString() === new Date().toDateString() &&
      apt.status === 'in_progress'
    );
  };

  // Get all appointments for a room
  const getRoomAppointments = (roomId: number) => {
    return allAppointments.filter(apt => apt.room_id === roomId);
  };

  // Statistics
  const totalRooms = allRooms.length;
  const availableRooms = allRooms.filter(r => r.is_available).length;
  const occupiedRooms = allRooms.filter(r => !r.is_available).length;
  const dentalChairs = allRooms.filter(r => r.type === "dental_chair").length;
  const consultationRooms = allRooms.filter(r => r.type === "consultation").length;

  // Mutations
  const createMut = useMutation({
    mutationFn: apiCreateRoom,
    onSuccess: () => {
      toast.success("Room created successfully");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      setModal(false);
      setEditingRoom(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to create room"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) => apiUpdateRoom(id, data),
    onSuccess: () => {
      toast.success("Room updated successfully");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      setModal(false);
      setEditingRoom(null);
      setDetailsModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to update room"),
  });

  const deleteMut = useMutation({
    mutationFn: apiDeleteRoom,
    onSuccess: () => {
      toast.success("Room deleted successfully");
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to delete room"),
  });

  const handleSaveRoom = (formData: any) => {
    if (editingRoom) {
      updateMut.mutate({ id: editingRoom.id, ...formData });
    } else {
      createMut.mutate(formData);
    }
  };

  const handleToggleStatus = (room: any) => {
    updateMut.mutate({ 
      id: room.id, 
      name: room.name,
      type: room.type,
      floor: room.floor,
      is_available: !room.is_available,
      notes: room.notes
    });
  };

  const handleEditRoom = (room: any) => {
    setEditingRoom(room);
    setModal(true);
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setModal(true);
  };

  const handleViewRoom = (room: any) => {
    setSelectedRoom(room);
    setDetailsModal(true);
  };

  const activeFilters = [
    typeFilter !== "all" && `Type: ${ROOM_TYPE_LABELS[typeFilter]}`,
    statusFilter !== "all" && `Status: ${statusFilter === "available" ? "Available" : "Occupied"}`,
    search && `"${search}"`,
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .room-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.05)}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.text,letterSpacing:"-.02em",display:"flex",alignItems:"center",gap:8}}>
              <Armchair size={24} color={C.teal}/> Rooms & Chairs
            </h1>
            <p style={{fontSize:13,color:C.faint,marginTop:2}}>
              Manage dental chairs, consultation rooms, and facility availability
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{display:"flex",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden"}}>
              {(["grid","list"] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",background:view===v?C.tealBg:"transparent",border:"none",cursor:"pointer",color:view===v?C.tealText:C.faint,transition:"all .15s"}}>
                  {v==="grid"?<LayoutGrid size={14}/>:<List size={14}/>}
                </button>
              ))}
            </div>
            <button onClick={()=>setShowFilters(v=>!v)} style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",height:34,border:`1px solid ${showFilters?C.tealBorder:C.border}`,borderRadius:9,background:showFilters?C.tealBg:C.bg,fontSize:12,fontWeight:500,color:showFilters?C.tealText:C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              <Filter size={13}/> Filters {activeFilters.length>0&&<span style={{background:C.teal,color:"white",borderRadius:"50%",width:16,height:16,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters.length}</span>}
            </button>
            <button onClick={handleAddRoom} style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:34,borderRadius:9,background:C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px rgba(13,158,117,.3)"}}>
              <Plus size={15}/> Add Room
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><Armchair size={14} color={C.teal}/><span style={{fontSize:12,color:C.muted}}>Total Rooms</span></div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{totalRooms}</p>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><CheckCircle2 size={14} color={C.green}/><span style={{fontSize:12,color:C.muted}}>Available</span></div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{availableRooms}</p>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><XCircle size={14} color={C.red}/><span style={{fontSize:12,color:C.muted}}>Occupied</span></div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{occupiedRooms}</p>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><Armchair size={14} color={C.blue}/><span style={{fontSize:12,color:C.muted}}>Dental Chairs</span></div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{dentalChairs}</p>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><Sofa size={14} color={C.purple}/><span style={{fontSize:12,color:C.muted}}>Consultation</span></div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{consultationRooms}</p>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters&&(
          <div style={{background:C.bg,border:`1px solid ${C.tealBorder}`,borderRadius:12,padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,animation:"fadeUp .2s ease both"}}>
            <Field label="Room Type">
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="inp" style={{...IS,cursor:"pointer"}}>
                <option value="all">All Types</option>
                {ROOM_TYPES.map(t=><option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="inp" style={{...IS,cursor:"pointer"}}>
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </Field>
            <div style={{display:"flex",alignItems:"flex-end"}}>
              <button onClick={()=>{setTypeFilter("all");setStatusFilter("all");setSearch("");}} style={{height:38,padding:"0 16px",borderRadius:9,border:`1px solid ${C.border}`,background:C.bgMuted,fontSize:12,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:250}}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by room name, type, or floor..."
            />
          </div>
          <div style={{display:"flex",gap:4}}>
            <span style={{fontSize:12,color:C.muted,padding:"0 8px"}}>
              {filteredRooms.length} rooms found
            </span>
          </div>
          {activeFilters.map((f,i)=>(
            <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:100,background:C.tealBg,color:C.tealText,border:`1px solid ${C.tealBorder}`}}>
              {f}<X size={10} style={{cursor:"pointer"}} onClick={()=>{if(f.startsWith("Type"))setTypeFilter("all");else if(f.startsWith("Status"))setStatusFilter("all");else setSearch("");}}/>
            </span>
          ))}
        </div>

        {/* Grid View */}
        {view === "grid" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:12}}>
            {isLoading ? Array.from({ length: 6 }).map((_, i) => (<div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16,height:260,animation:"fadeUp .4s ease both"}}/>))
              : filteredRooms.length === 0 ? (
                <div style={{gridColumn:"1/-1",background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"60px 20px",textAlign:"center"}}>
                  <Armchair size={48} color={C.border} style={{margin:"0 auto 16px",display:"block"}}/>
                  <h3 style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:8}}>No rooms found</h3>
                  <p style={{fontSize:13,color:C.faint}}>{search ? "Try a different search term" : "Click 'Add Room' to create your first room"}</p>
                </div>
              ) : filteredRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  currentAppointment={getCurrentAppointment(room.id)}
                  onToggleStatus={() => handleToggleStatus(room)}
                  onEdit={() => handleEditRoom(room)}
                  onDelete={() => {
                    if (confirm(`Delete ${room.name}?`)) deleteMut.mutate(room.id);
                  }}
                />
              ))}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
            <div style={{
              display:"grid",gridTemplateColumns:"60px 2fr 1.5fr 100px 100px 80px",
              padding:"12px 18px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`
            }}>
              {["","Room Name","Type","Floor","Status",""].map(h=>(
                <span key={h} style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:".07em",textTransform:"uppercase"}}>{h}</span>
              ))}
            </div>
            {isLoading ? (
              <div style={{padding:"40px 18px",textAlign:"center"}}><div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.teal,animation:"spin .7s linear infinite",margin:"0 auto 8px"}}/><p style={{fontSize:13,color:C.faint}}>Loading...</p></div>
            ) : filteredRooms.length === 0 ? (
              <div style={{padding:"48px 18px",textAlign:"center"}}><Armchair size={30} color={C.border} style={{margin:"0 auto 8px",display:"block"}}/><p style={{fontSize:13,color:C.faint}}>No rooms found</p></div>
            ) : (
              filteredRooms.map((room, i) => {
                const Icon = ROOM_TYPE_ICONS[room.type] || Armchair;
                return (
                  <div
                    key={room.id}
                    onClick={() => handleViewRoom(room)}
                    style={{
                      display:"grid",gridTemplateColumns:"60px 2fr 1.5fr 100px 100px 80px",
                      padding:"12px 18px",borderBottom:i<filteredRooms.length-1?`1px solid ${C.border}`:"none",
                      alignItems:"center",transition:"background .1s",cursor:"pointer"
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bgMuted}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <div style={{width:36,height:36,borderRadius:8,background:room.is_available?C.tealBg:C.redBg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Icon size={18} color={room.is_available?C.teal:C.red}/>
                    </div>
                    <div>
                      <p style={{fontSize:13,fontWeight:600,color:C.text}}>{room.name}</p>
                      {room.notes && <p style={{fontSize:10,color:C.faint}}>{room.notes.substring(0,40)}</p>}
                    </div>
                    <span style={{fontSize:12,color:C.muted}}>{ROOM_TYPE_LABELS[room.type]}</span>
                    <span style={{fontSize:12,color:C.muted}}>{room.floor || "—"}</span>
                    <StatusBadge available={room.is_available}/>
                    <div style={{display:"flex",gap:4}}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditRoom(room); }}
                        style={{width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}
                      >
                        <Edit2 size={12}/>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${room.name}?`)) deleteMut.mutate(room.id); }}
                        style={{width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}
                      >
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Room Form Modal */}
      <RoomFormModal
        open={modal}
        onClose={() => {
          setModal(false);
          setEditingRoom(null);
        }}
        room={editingRoom}
        onSave={handleSaveRoom}
        isLoading={createMut.isPending || updateMut.isPending}
      />

      {/* Room Details Modal */}
      <RoomDetailsModal
        open={detailsModal}
        onClose={() => setDetailsModal(false)}
        room={selectedRoom}
        appointments={getRoomAppointments(selectedRoom?.id)}
        onEdit={() => {
          setDetailsModal(false);
          handleEditRoom(selectedRoom);
        }}
      />
    </>
  );
}