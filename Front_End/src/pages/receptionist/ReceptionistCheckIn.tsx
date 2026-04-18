// ReceptionistCheckIn.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CalendarDays, Clock, Search,
  ChevronRight, CheckCircle2, XCircle, RefreshCw,
  LayoutGrid, List, Filter, ChevronDown,
  CalendarCheck, Timer, Ban, RotateCcw, X,
  UserCheck, User, Phone, Mail, MapPin, AlertCircle,
  ChevronLeft, TrendingUp, QrCode, Camera,
} from "lucide-react";
import {
  apiGetAppointments, apiCreateAppointment, apiDeleteAppointment,
} from "@/api/appointments";
import { apiGetPatients } from "@/api/patients";
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

const STATUSES = ["scheduled","confirmed","in_progress","completed","cancelled","no_show","rescheduled"];
const TYPES    = ["checkup","follow_up","emergency","procedure","consultation","xray","cleaning","surgery"];

const STATUS_CFG:Record<string,{bg:string;text:string;border:string;label:string;icon:any}> = {
  scheduled:   {bg:C.grayBg, text:C.gray,      border:C.border,       label:"Scheduled",   icon:Clock},
  confirmed:   {bg:C.blueBg, text:C.blueText,  border:C.blueBorder,   label:"Confirmed",   icon:CheckCircle2},
  in_progress: {bg:C.amberBg,text:C.amberText, border:C.amberBorder,  label:"In Progress", icon:RefreshCw},
  completed:   {bg:C.tealBg, text:C.tealText,  border:C.tealBorder,   label:"Completed",   icon:CheckCircle2},
  cancelled:   {bg:C.redBg,  text:C.redText,   border:C.redBorder,    label:"Cancelled",   icon:XCircle},
  no_show:     {bg:C.redBg,  text:C.redText,   border:C.redBorder,    label:"No Show",     icon:Ban},
  rescheduled: {bg:C.amberBg,text:C.amberText, border:C.amberBorder,  label:"Rescheduled", icon:RotateCcw},
};

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({name,size=30}:{name:string;size?:number}) {
  const i=(name??"?").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#0d9e75,#0a7d5d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.37,fontWeight:700,color:"white",flexShrink:0}}>{i}</div>;
}

function Badge({status}:{status:string}) {
  const cfg=STATUS_CFG[status]??{bg:C.grayBg,text:C.gray,border:C.border,label:status,icon:Clock};
  return <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:100,background:cfg.bg,color:cfg.text,border:`1px solid ${cfg.border}`,whiteSpace:"nowrap"}}>{cfg.label}</span>;
}

function TypeBadge({type}:{type:string}) {
  return <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,background:C.blueBg,color:C.blueText,border:`1px solid ${C.blueBorder}`,whiteSpace:"nowrap",textTransform:"capitalize"}}>{type?.replace(/_/g," ")}</span>;
}

const IS={width:"100%",height:38,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:9,background:C.bg,fontSize:13,color:C.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box" as const};

function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <div><label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:5}}>{label}</label>{children}</div>;
}

function SubmitBtn({loading,children}:{loading?:boolean;children:React.ReactNode}) {
  return <button type="submit" disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:9,background:loading?"#9ab5ae":C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 2px 8px rgba(13,158,117,.3)"}}>{loading?<><span style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite",display:"inline-block"}}/>Checking in…</>:children}</button>;
}

function GhostBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} style={{padding:"9px 16px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:13,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;
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

// ─── Check-in Card ───────────────────────────────────────────────────────────
function CheckInCard({ appointment, onCheckIn, onReschedule, onNoShow }: {
  appointment: any;
  onCheckIn: (apt: any) => void;
  onReschedule: (apt: any) => void;
  onNoShow: (apt: any) => void;
}) {
  const time = new Date(appointment.scheduled_at).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit"
  });
  
  const isLate = () => {
    const aptTime = new Date(appointment.scheduled_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - aptTime.getTime()) / 60000;
    return diffMinutes > 15 && appointment.status !== "completed";
  };

  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 16,
      transition: "all 0.2s",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
    onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
    >
      {isLate() && (
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          background: C.red,
          color: "white",
          fontSize: 10,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: "0 0 0 8px",
        }}>
          Late
        </div>
      )}
      
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <Avi name={appointment.patient_name} size={48}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <h3 style={{fontSize:16,fontWeight:700,color:C.text}}>{appointment.patient_name}</h3>
            <Badge status={appointment.status}/>
          </div>
          
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <Clock size={12} color={C.muted}/>
              <span style={{fontSize:12,color:C.text}}>{time}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <TypeBadge type={appointment.type}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <User size={12} color={C.muted}/>
              <span style={{fontSize:12,color:C.muted}}>Dr. {appointment.doctor_name}</span>
            </div>
          </div>
          
          {appointment.chief_complaint && (
            <p style={{fontSize:12,color:C.faint,marginBottom:12}}>
              {appointment.chief_complaint}
            </p>
          )}
          
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button
              onClick={() => onCheckIn(appointment)}
              disabled={appointment.status === "in_progress" || appointment.status === "completed"}
              style={{
                display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
                borderRadius:8,background:appointment.status === "in_progress" || appointment.status === "completed" ? C.grayBg : C.teal,
                border:"none",color:appointment.status === "in_progress" || appointment.status === "completed" ? C.muted : "white",
                fontSize:12,fontWeight:600,cursor:appointment.status === "in_progress" || appointment.status === "completed" ? "not-allowed" : "pointer",
                fontFamily:"inherit"
              }}
            >
              <UserCheck size={14}/> Check In
            </button>
            <button
              onClick={() => onReschedule(appointment)}
              disabled={appointment.status === "completed"}
              style={{
                display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
                borderRadius:8,background:C.bgMuted,border:`1px solid ${C.border}`,
                fontSize:12,fontWeight:500,color:C.text,cursor:"pointer",fontFamily:"inherit"
              }}
            >
              <RotateCcw size={14}/> Reschedule
            </button>
            <button
              onClick={() => onNoShow(appointment)}
              disabled={appointment.status === "completed"}
              style={{
                display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
                borderRadius:8,background:C.redBg,border:`1px solid ${C.redBorder}`,
                fontSize:12,fontWeight:500,color:C.red,cursor:"pointer",fontFamily:"inherit"
              }}
            >
              <Ban size={14}/> No Show
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Details Modal ───────────────────────────────────────────────────
function PatientDetailsModal({ open, onClose, patient, appointment, onCheckIn }: {
  open: boolean;
  onClose: () => void;
  patient: any;
  appointment: any;
  onCheckIn: (apt: any) => void;
}) {
  if (!open || !patient) return null;

  const handleCheckIn = () => {
    onCheckIn(appointment);
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:16,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"modalIn .2s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text}}>Patient Details</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><X size={14}/></button>
        </div>
        
        <div style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
            <Avi name={patient.full_name} size={64}/>
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:C.text}}>{patient.full_name}</h2>
              <p style={{fontSize:12,color:C.muted}}>Patient ID: {patient.patient_number || "N/A"}</p>
            </div>
          </div>
          
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.bgMuted,borderRadius:8}}>
              <Phone size={14} color={C.teal}/>
              <span style={{fontSize:13,color:C.text}}>{patient.phone || "No phone"}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.bgMuted,borderRadius:8}}>
              <Mail size={14} color={C.teal}/>
              <span style={{fontSize:13,color:C.text}}>{patient.email || "No email"}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.bgMuted,borderRadius:8}}>
              <MapPin size={14} color={C.teal}/>
              <span style={{fontSize:13,color:C.text}}>{patient.address || "No address"}</span>
            </div>
          </div>
          
          <div style={{marginTop:20,paddingTop:20,borderTop:`1px solid ${C.border}`}}>
            <h4 style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:8}}>Appointment Details</h4>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <TypeBadge type={appointment.type}/>
              <Badge status={appointment.status}/>
              <span style={{fontSize:12,color:C.muted}}>
                {new Date(appointment.scheduled_at).toLocaleString()}
              </span>
            </div>
            {appointment.chief_complaint && (
              <p style={{fontSize:12,color:C.faint,marginTop:8}}>
                <strong>Chief Complaint:</strong> {appointment.chief_complaint}
              </p>
            )}
          </div>
          
          <div style={{display:"flex",gap:8,marginTop:20}}>
            <button
              onClick={handleCheckIn}
              disabled={appointment.status === "in_progress" || appointment.status === "completed"}
              style={{
                flex:1,padding:"10px",borderRadius:8,background:appointment.status === "in_progress" || appointment.status === "completed" ? C.grayBg : C.teal,
                border:"none",color:appointment.status === "in_progress" || appointment.status === "completed" ? C.muted : "white",
                fontSize:13,fontWeight:600,cursor:appointment.status === "in_progress" || appointment.status === "completed" ? "not-allowed" : "pointer",
                fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6
              }}
            >
              <UserCheck size={16}/> Confirm Check-in
            </button>
            <GhostBtn onClick={onClose}>Close</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Modal ────────────────────────────────────────────────────────
function RescheduleModal({ open, onClose, appointment, onReschedule, isLoading }: {
  open: boolean;
  onClose: () => void;
  appointment: any;
  onReschedule: (date: string, time: string) => void;
  isLoading: boolean;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please select both date and time");
      return;
    }
    onReschedule(date, time);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:16,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"modalIn .2s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text}}>Reschedule Appointment</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><X size={14}/></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding:20}}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:5}}>New Date *</label>
            <input
              type="date"
              value={date}
              onChange={e=>setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={IS}
            />
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:5}}>New Time *</label>
            <input
              type="time"
              value={time}
              onChange={e=>setTime(e.target.value)}
              style={IS}
            />
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <GhostBtn onClick={onClose}>Cancel</GhostBtn>
            <SubmitBtn loading={isLoading}>Confirm Reschedule</SubmitBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReceptionistCheckIn() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch appointments for today
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["appointments", "checkin", selectedDate.toISOString().split("T")[0]],
    queryFn: () => apiGetAppointments({ 
      date: selectedDate.toISOString().split("T")[0] 
    }),
  });

  const { data: patientsRes } = useQuery({
    queryKey: ["patients", "select"],
    queryFn: () => apiGetPatients({ limit: 500 }),
  });

  const appts: any[] = data?.data ?? [];
  const patients: any[] = patientsRes?.data ?? [];

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appts;
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patient_name?.toLowerCase().includes(query) ||
        apt.patient_number?.toLowerCase().includes(query) ||
        apt.phone?.includes(query)
      );
    }
    
    // Sort by time (earliest first)
    return filtered.sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  }, [appts, statusFilter, searchQuery]);

  // Statistics
  const totalToday = appts.length;
  const checkedIn = appts.filter(a => a.status === "in_progress").length;
  const completed = appts.filter(a => a.status === "completed").length;
  const noShows = appts.filter(a => a.status === "no_show").length;
  const waitingToCheckIn = appts.filter(a => ["scheduled", "confirmed"].includes(a.status)).length;

  // Mutations
  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      fetch(`/api/appointments/${id}/update-status`, {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to update status");
        return res.json();
      }),
    onSuccess: () => {
      toast.success("Status updated successfully");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setDetailsModalOpen(false);
      setRescheduleModalOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to update"),
  });

  const handleCheckIn = (appointment: any) => {
    // Find patient details
    const patient = patients.find(p => p.id === appointment.patient_id);
    setSelectedAppointment(appointment);
    setSelectedPatient(patient);
    setDetailsModalOpen(true);
  };

  const confirmCheckIn = (appointment: any) => {
    updateMut.mutate({ id: appointment.id, status: "in_progress" });
  };

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const confirmReschedule = (date: string, time: string) => {
    if (selectedAppointment) {
      // This would typically call an API to reschedule
      // For now, we just update the status to rescheduled
      updateMut.mutate({ id: selectedAppointment.id, status: "rescheduled" });
      toast.success(`Appointment rescheduled to ${date} at ${time}`);
    }
  };

  const handleNoShow = (appointment: any) => {
    if (confirm("Mark this appointment as no-show?")) {
      updateMut.mutate({ id: appointment.id, status: "no_show" });
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Quick check-in from search (if no appointment found)
  const handleQuickCheckIn = () => {
    toast.error("Please search for an existing appointment first");
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.text,letterSpacing:"-.02em",display:"flex",alignItems:"center",gap:8}}>
              <UserCheck size={24} color={C.teal}/> Patient Check-in
            </h1>
            <p style={{fontSize:13,color:C.faint,marginTop:2}}>
              Manage patient check-ins and track attendance
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button
              onClick={() => refetch()}
              style={{
                display:"flex",alignItems:"center",gap:6,padding:"0 14px",height:34,
                borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,
                fontSize:12,fontWeight:500,color:C.muted,cursor:"pointer"
              }}
            >
              <RefreshCw size={13}/> Refresh
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <CalendarDays size={14} color={C.teal}/>
              <span style={{fontSize:12,color:C.muted}}>Total Today</span>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{totalToday}</p>
          </div>
          
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <UserCheck size={14} color={C.blue}/>
              <span style={{fontSize:12,color:C.muted}}>Checked In</span>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{checkedIn}</p>
          </div>
          
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <CheckCircle2 size={14} color={C.green}/>
              <span style={{fontSize:12,color:C.muted}}>Completed</span>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{completed}</p>
          </div>
          
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Clock size={14} color={C.amber}/>
              <span style={{fontSize:12,color:C.muted}}>Waiting</span>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{waitingToCheckIn}</p>
          </div>
          
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Ban size={14} color={C.red}/>
              <span style={{fontSize:12,color:C.muted}}>No Shows</span>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:C.text}}>{noShows}</p>
          </div>
        </div>

        {/* ── Date Navigation ── */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,
          padding:"12px 16px"
        }}>
          <button
            onClick={() => handleDateChange(-1)}
            style={{
              display:"flex",alignItems:"center",gap:6,padding:"6px 12px",
              borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,
              cursor:"pointer",color:C.text,fontSize:12
            }}
          >
            <ChevronLeft size={14}/> Previous Day
          </button>
          
          <div style={{display:"flex",gap:8}}>
            <button
              onClick={() => setSelectedDate(new Date())}
              style={{
                padding:"6px 16px",borderRadius:8,background:isToday ? C.tealBg : C.bg,
                border:`1px solid ${isToday ? C.tealBorder : C.border}`,cursor:"pointer",
                color:isToday ? C.tealText : C.text,fontSize:12,fontWeight:isToday ? 600 : 400
              }}
            >
              Today
            </button>
            <div style={{
              padding:"6px 16px",background:C.bg,border:`1px solid ${C.border}`,
              borderRadius:8,fontSize:13,color:C.text
            }}>
              {selectedDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          
          <button
            onClick={() => handleDateChange(1)}
            style={{
              display:"flex",alignItems:"center",gap:6,padding:"6px 12px",
              borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,
              cursor:"pointer",color:C.text,fontSize:12
            }}
          >
            Next Day <ChevronRight size={14}/>
          </button>
        </div>

        {/* ── Search and Filters ── */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:1,minWidth:250}}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by patient name, ID, or phone..."
            />
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{value:"all",label:"All"},...STATUSES.map(s=>({value:s,label:STATUS_CFG[s]?.label??s}))].map(t=>{
              const active=statusFilter===t.value;
              const cfg=STATUS_CFG[t.value];
              return (
                <button 
                  key={t.value} 
                  onClick={()=>setStatusFilter(t.value)} 
                  style={{
                    padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,
                    border:`1px solid ${active?(cfg?.border??C.tealBorder):C.border}`,
                    background:active?(cfg?.bg??C.tealBg):C.bg,
                    color:active?(cfg?.text??C.tealText):C.muted,
                    cursor:"pointer",fontFamily:"inherit",transition:"all .12s"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Appointments List ── */}
        <div>
          {isLoading ? (
            <div style={{padding:"40px 18px",textAlign:"center"}}>
              <div style={{
                width:22,height:22,borderRadius:"50%",
                border:`2px solid ${C.border}`,borderTopColor:C.teal,
                animation:"spin .7s linear infinite",margin:"0 auto 8px"
              }}/>
              <p style={{fontSize:13,color:C.faint}}>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div style={{
              background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,
              padding:"60px 20px",textAlign:"center"
            }}>
              <UserCheck size={48} color={C.border} style={{margin:"0 auto 16px",display:"block"}}/>
              <h3 style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:8}}>No appointments found</h3>
              <p style={{fontSize:13,color:C.faint}}>
                {searchQuery ? "Try a different search term" : "No appointments scheduled for this day"}
              </p>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))",gap:12}}>
              {filteredAppointments.map(apt => (
                <CheckInCard
                  key={apt.id}
                  appointment={apt}
                  onCheckIn={handleCheckIn}
                  onReschedule={handleReschedule}
                  onNoShow={handleNoShow}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {!isLoading && filteredAppointments.length > 0 && (
          <div style={{
            background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,
            padding:"16px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12
          }}>
            <div>
              <span style={{fontSize:12,color:C.muted}}>Check-in Progress</span>
              <div style={{marginTop:8,width:200,height:6,background:C.bgMuted,borderRadius:3,overflow:"hidden"}}>
                <div style={{
                  width:`${totalToday > 0 ? ((checkedIn + completed) / totalToday) * 100 : 0}%`,
                  height:"100%",background:C.teal,borderRadius:3,transition:"width .3s"
                }}/>
              </div>
            </div>
            <div>
              <span style={{fontSize:12,color:C.muted}}>Checked In: <strong style={{color:C.text}}>{checkedIn}</strong></span>
            </div>
            <div>
              <span style={{fontSize:12,color:C.muted}}>Completed: <strong style={{color:C.text}}>{completed}</strong></span>
            </div>
            <div>
              <span style={{fontSize:12,color:C.muted}}>Remaining: <strong style={{color:C.text}}>{waitingToCheckIn}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        patient={selectedPatient}
        appointment={selectedAppointment}
        onCheckIn={confirmCheckIn}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        open={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        appointment={selectedAppointment}
        onReschedule={confirmReschedule}
        isLoading={updateMut.isPending}
      />
    </>
  );
}