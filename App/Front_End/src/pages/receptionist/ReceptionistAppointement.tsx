import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CalendarDays, Clock, Search,
  ChevronRight, CheckCircle2, XCircle, RefreshCw,
  LayoutGrid, List, Filter, ChevronDown,
  CalendarCheck, Timer, Ban, RotateCcw, X,
} from "lucide-react";
import {
  apiGetAppointments, apiCreateAppointment,
  apiUpdateAppointmentStatus, apiDeleteAppointment,
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
  gray:"#6b7f75",grayBg:"#f4f7f5",
};

const STATUSES = ["scheduled","confirmed","in_progress","completed","cancelled","no_show","rescheduled"];
const TYPES    = ["checkup","follow_up","emergency","procedure","consultation","xray","cleaning","surgery"];
const EMPTY    = { patientId:"",patientLabel:"",date:"",time:"",type:"checkup",notes:"",chiefComplaint:"" };

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
  return <button type="submit" disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:9,background:loading?"#9ab5ae":C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 2px 8px rgba(13,158,117,.3)"}}>{loading?<><span style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite",display:"inline-block"}}/>Saving…</>:children}</button>;
}
function GhostBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} style={{padding:"9px 16px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:13,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;
}

// ─── Patient combobox (searchable dropdown) ───────────────────────────────────
function PatientCombobox({patients,value,onSelect}:{
  patients:any[];value:string;onSelect:(id:string,label:string)=>void;
}) {
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const ref=useRef<HTMLDivElement>(null);
  const selectedPt=patients.find(p=>String(p.id)===value);
  const filtered=patients.filter(p=>
    !q||p.full_name?.toLowerCase().includes(q.toLowerCase())
      ||p.phone?.includes(q)||p.patient_number?.toLowerCase().includes(q.toLowerCase())
  ).slice(0,50);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <div
        onClick={()=>setOpen(v=>!v)}
        style={{...IS,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",height:38,padding:"0 12px"}}
      >
        {selectedPt
          ? <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Avi name={selectedPt.full_name} size={22}/>
              <span style={{fontSize:13,color:C.text,fontWeight:500}}>{selectedPt.full_name}</span>
              <span style={{fontSize:11,color:C.faint}}>·  {selectedPt.patient_number??selectedPt.phone}</span>
            </div>
          : <span style={{color:C.faint,fontSize:13}}>Search patient by name, phone, or ID…</span>
        }
        <ChevronDown size={13} color={C.faint} style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}/>
      </div>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bg,border:`1.5px solid ${C.tealBorder}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:100,overflow:"hidden"}}>
          {/* Search input inside dropdown */}
          <div style={{padding:"10px 10px 6px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{position:"relative"}}>
              <Search size={12} style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
              <input
                autoFocus
                value={q}
                onChange={e=>{setQ(e.target.value)}}
                placeholder="Type name, phone, or patient number…"
                style={{...IS,paddingLeft:28,height:34,fontSize:12}}
              />
            </div>
          </div>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {filtered.length===0
              ? <p style={{padding:"16px 12px",textAlign:"center",fontSize:12,color:C.faint}}>No patients found</p>
              : filtered.map(p=>(
                <div
                  key={p.id}
                  onClick={()=>{onSelect(String(p.id),p.full_name);setOpen(false);setQ("");}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer",transition:"background .1s"}}
                  onMouseEnter={e=>(e.currentTarget.style.background=C.bgMuted)}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                >
                  <Avi name={p.full_name} size={28}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.full_name}</p>
                    <p style={{fontSize:11,color:C.faint}}>{p.patient_number??""} · {p.phone}</p>
                  </div>
                  {String(p.id)===value&&<CheckCircle2 size={13} color={C.teal}/>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status inline select ─────────────────────────────────────────────────────
function StatusSelect({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  const cfg=STATUS_CFG[value]??STATUS_CFG.scheduled;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px 3px 6px",borderRadius:100,background:cfg.bg,border:`1px solid ${cfg.border}`,cursor:"pointer"}}>
      <cfg.icon size={10} color={cfg.text} strokeWidth={2.5}/>
      <select
        value={value}
        onChange={e=>{e.stopPropagation();onChange(e.target.value);}}
        onClick={e=>e.stopPropagation()}
        style={{appearance:"none",WebkitAppearance:"none",background:"transparent",border:"none",outline:"none",fontSize:11,fontWeight:600,color:cfg.text,cursor:"pointer",fontFamily:"inherit",paddingRight:2}}
      >
        {STATUSES.map(s=><option key={s} value={s}>{STATUS_CFG[s]?.label??s}</option>)}
      </select>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}) {
  if(!open)return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:16,width:"100%",maxWidth:520,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"modalIn .2s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text,letterSpacing:"-.01em"}}>{title}</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><X size={14}/></button>
        </div>
        <div style={{padding:20,maxHeight:"80vh",overflowY:"auto"}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Mini donut ───────────────────────────────────────────────────────────────
function MiniDonut({data}:{data:{color:string;value:number;label:string}[]}) {
  const total=data.reduce((s,d)=>s+d.value,0)||1;
  const r=22,cx=28,cy=28,circ=2*Math.PI*r;
  let off=0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <svg width={56} height={56}>
        {data.filter(d=>d.value>0).map((d,i)=>{
          const pct=d.value/total,dash=circ*pct,gap=circ-dash;
          const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={8} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-(off*circ/total)+(circ*0.25)} style={{transform:"rotate(-90deg)",transformOrigin:"center"}}/>;
          off+=d.value;return el;
        })}
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" style={{fontSize:12,fontWeight:700,fill:C.text}}>{total}</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        {data.filter(d=>d.value>0).map(d=>(
          <div key={d.label} style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:d.color,flexShrink:0}}/>
            <span style={{fontSize:11,color:C.muted}}>{d.label}</span>
            <span style={{fontSize:11,fontWeight:700,color:C.text,marginLeft:"auto",paddingLeft:8}}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function TypeBar({appts}:{appts:any[]}) {
  const counts=TYPES.reduce((a,t)=>({...a,[t]:appts.filter(ap=>ap.type===t).length}),{} as Record<string,number>);
  const max=Math.max(...Object.values(counts),1);
  const sorted=Object.entries(counts).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,6);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {sorted.map(([type,count])=>(
        <div key={type}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:11,color:C.text,textTransform:"capitalize"}}>{type.replace(/_/g," ")}</span>
            <span style={{fontSize:11,fontWeight:700,color:C.muted}}>{count}</span>
          </div>
          <div style={{height:4,background:"#edf1ef",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(count/max)*100}%`,background:C.teal,borderRadius:2,transition:"width .4s"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Calendar heatmap (week view) ─────────────────────────────────────────────
function WeekCalendar({appts}:{appts:any[]}) {
  const today=new Date();
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date(today);d.setDate(today.getDate()-today.getDay()+i);return d;
  });
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
      {days.map((day,i)=>{
        const key=day.toISOString().split("T")[0];
        const count=appts.filter(a=>a.scheduled_at?.startsWith(key)).length;
        const isToday=key===today.toISOString().split("T")[0];
        return (
          <div key={i} style={{textAlign:"center"}}>
            <p style={{fontSize:9,color:isToday?C.tealText:C.faint,fontWeight:isToday?700:400,marginBottom:3,textTransform:"uppercase",letterSpacing:".06em"}}>{day.toLocaleDateString("en",{weekday:"short"})}</p>
            <div style={{aspectRatio:"1",borderRadius:8,background:count>0?C.teal+Math.min(count*40+30,255).toString(16).padStart(2,"0"):C.bgMuted,display:"flex",alignItems:"center",justifyContent:"center",border:isToday?`2px solid ${C.teal}`:`1px solid ${C.border}`}}>
              <span style={{fontSize:12,fontWeight:700,color:count>0?"white":C.faint}}>{count||day.getDate()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReceptionistAppointmentsPage() {
  const qc  =useQueryClient();
  const user=useAuthStore(s=>s.user);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [dateFilter,   setDateFilter]   = useState("");
  const [search,       setSearch]       = useState("");
  const [view,         setView]         = useState<"list"|"grid">("list");
  const [modal,        setModal]        = useState(false);
  const [form,         setForm]         = useState(EMPTY);
  const [showFilters,  setShowFilters]  = useState(false);

  const {data,isLoading}=useQuery({queryKey:["appointments",statusFilter],queryFn:()=>apiGetAppointments(statusFilter!=="all"?{status:statusFilter}:{})});
  const {data:patientsRes}=useQuery({queryKey:["patients","select"],queryFn:()=>apiGetPatients({limit:500})});

  const appts:any[]=data?.data??[];
  const patients:any[]=patientsRes?.data??[];

  const filtered=useMemo(()=>appts.filter(a=>{
    if(typeFilter!=="all"&&a.type!==typeFilter)return false;
    if(dateFilter&&!a.scheduled_at?.startsWith(dateFilter))return false;
    if(search){
      const q=search.toLowerCase();
      return a.patient_name?.toLowerCase().includes(q)||a.doctor_name?.toLowerCase().includes(q)||a.type?.includes(q);
    }
    return true;
  }),[appts,typeFilter,dateFilter,search]);

  const createMut=useMutation({
    mutationFn:apiCreateAppointment,
    onSuccess:()=>{toast.success("Appointment scheduled");qc.invalidateQueries({queryKey:["appointments"]});setModal(false);setForm(EMPTY);},
    onError:(e:any)=>toast.error(e?.response?.data?.error??"Failed"),
  });
  const statusMut=useMutation({
    mutationFn:({id,status}:{id:number;status:string})=>apiUpdateAppointmentStatus(id,status),
    onSuccess:()=>{toast.success("Updated");qc.invalidateQueries({queryKey:["appointments"]});},
  });
  const deleteMut=useMutation({
    mutationFn:apiDeleteAppointment,
    onSuccess:()=>{toast.success("Deleted");qc.invalidateQueries({queryKey:["appointments"]});},
  });

  const handleSave=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.patientId||!form.date||!form.time){toast.error("Patient, date and time required");return;}
    createMut.mutate({patientId:Number(form.patientId),doctorId:user?.id,scheduledAt:`${form.date}T${form.time}:00`,type:form.type,notes:form.notes,chiefComplaint:form.chiefComplaint});
  };

  const activeFilters=[typeFilter!=="all"&&`Type: ${typeFilter.replace(/_/g," ")}`,dateFilter&&`Date: ${dateFilter}`,search&&`"${search}"`].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .row-r:hover{background:${C.bgMuted}!important}
        .grid-r:hover{border-color:${C.teal}!important;box-shadow:0 0 0 3px ${C.tealBg}!important}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
        .del:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}
      `}</style>

      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.text,letterSpacing:"-.02em"}}>Appointments</h1>
            <p style={{fontSize:13,color:C.faint,marginTop:2}}>{data?.total??0} total · {appts.filter(a=>["scheduled","confirmed"].includes(a.status)).length} upcoming</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{display:"flex",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden"}}>
              {(["list","grid"] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",background:view===v?C.tealBg:"transparent",border:"none",cursor:"pointer",color:view===v?C.tealText:C.faint,transition:"all .15s"}}>
                  {v==="list"?<List size={14}/>:<LayoutGrid size={14}/>}
                </button>
              ))}
            </div>
            <button onClick={()=>setShowFilters(v=>!v)} style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",height:34,border:`1px solid ${showFilters?C.tealBorder:C.border}`,borderRadius:9,background:showFilters?C.tealBg:C.bg,fontSize:12,fontWeight:500,color:showFilters?C.tealText:C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              <Filter size={13}/> Filters {activeFilters.length>0&&<span style={{background:C.teal,color:"white",borderRadius:"50%",width:16,height:16,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters.length}</span>}
            </button>
            <button onClick={()=>setModal(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:34,borderRadius:9,background:C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px rgba(13,158,117,.3)",transition:"background .15s"}} onMouseEnter={e=>(e.currentTarget.style.background="#0a8a66")} onMouseLeave={e=>(e.currentTarget.style.background=C.teal)}>
              <Plus size={15}/> Schedule
            </button>
          </div>
        </div>

        {/* ── Charts row ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {/* Status donut */}
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12}}>Appointment Status</p>
            <MiniDonut data={[
              {color:C.blue, value:appts.filter(a=>a.status==="confirmed").length,   label:"Confirmed"},
              {color:C.teal, value:appts.filter(a=>a.status==="completed").length,   label:"Completed"},
              {color:C.amber,value:appts.filter(a=>["scheduled","in_progress","rescheduled"].includes(a.status)).length,label:"Pending"},
              {color:C.red,  value:appts.filter(a=>["cancelled","no_show"].includes(a.status)).length,label:"Cancelled"},
            ]}/>
          </div>
          {/* Type breakdown */}
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12}}>By Type</p>
            <TypeBar appts={appts}/>
          </div>
          {/* Week view */}
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12}}>This Week</p>
            <WeekCalendar appts={appts}/>
          </div>
        </div>

        {/* ── Filters panel (collapsible) ── */}
        {showFilters&&(
          <div style={{background:C.bg,border:`1px solid ${C.tealBorder}`,borderRadius:12,padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,animation:"fadeUp .2s ease both"}}>
            <Field label="Filter by Type">
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="inp" style={{...IS,cursor:"pointer"}}>
                <option value="all">All types</option>
                {TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </Field>
            <Field label="Filter by Date">
              <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="inp" style={IS}/>
            </Field>
            <div style={{display:"flex",alignItems:"flex-end"}}>
              <button onClick={()=>{setTypeFilter("all");setDateFilter("");setSearch("");}} style={{height:38,padding:"0 16px",borderRadius:9,border:`1px solid ${C.border}`,background:C.bgMuted,fontSize:12,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* ── Search + status tabs ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{position:"relative",width:280}}>
            <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient, doctor, or type…" className="inp" style={{...IS,paddingLeft:30,height:34}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.faint,display:"flex",alignItems:"center"}}><X size={13}/></button>}
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{value:"all",label:"All"},...STATUSES.map(s=>({value:s,label:STATUS_CFG[s]?.label??s}))].map(t=>{
              const active=statusFilter===t.value;
              const cfg=STATUS_CFG[t.value];
              return (
                <button key={t.value} onClick={()=>setStatusFilter(t.value)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${active?(cfg?.border??C.tealBorder):C.border}`,background:active?(cfg?.bg??C.tealBg):C.bg,color:active?(cfg?.text??C.tealText):C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>
                  {t.label}
                </button>
              );
            })}
          </div>
          {/* Active filter chips */}
          {activeFilters.map((f,i)=>(
            <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:100,background:C.tealBg,color:C.tealText,border:`1px solid ${C.tealBorder}`}}>
              {f}<X size={10} style={{cursor:"pointer"}} onClick={()=>{if(f.startsWith("Type"))setTypeFilter("all");else if(f.startsWith("Date"))setDateFilter("");else setSearch("");}}/>
            </span>
          ))}
        </div>

        {/* ── List view ── */}
        {view==="list"&&(
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"2.2fr 120px 100px 140px 70px 150px 60px",padding:"9px 18px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`}}>
              {["Patient","Date & Time","Type","Doctor","Room","Status",""].map(h=>(
                <span key={h} style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:".07em",textTransform:"uppercase"}}>{h}</span>
              ))}
            </div>
            {isLoading&&<div style={{padding:"40px 18px",textAlign:"center"}}><div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.teal,animation:"spin .7s linear infinite",margin:"0 auto 8px"}}/><p style={{fontSize:13,color:C.faint}}>Loading…</p></div>}
            {!isLoading&&filtered.length===0&&<div style={{padding:"48px 18px",textAlign:"center"}}><CalendarDays size={30} color={C.border} style={{margin:"0 auto 8px",display:"block"}}/><p style={{fontSize:13,color:C.faint}}>No appointments match your filters</p></div>}
            {!isLoading&&filtered.map((row:any,i:number)=>(
              <div key={row.id} className="row-r" style={{display:"grid",gridTemplateColumns:"2.2fr 120px 100px 140px 70px 150px 60px",padding:"11px 18px",borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",alignItems:"center",transition:"background .1s",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Avi name={row.patient_name??"?"} size={32}/>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.patient_name??"—"}</p>
                    <p style={{fontSize:11,color:C.faint}}>{row.chief_complaint??"No complaint noted"}</p>
                  </div>
                </div>
                <div>
                  <p style={{fontSize:12,fontWeight:600,color:C.text}}>{new Date(row.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</p>
                  <p style={{fontSize:11,color:C.faint}}>{new Date(row.scheduled_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</p>
                </div>
                <TypeBadge type={row.type??"—"}/>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <Avi name={row.doctor_name??"D"} size={22}/>
                  <span style={{fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.doctor_name??"—"}</span>
                </div>
                <span style={{fontSize:12,color:C.faint}}>{row.room_name??"—"}</span>
                <StatusSelect value={row.status} onChange={v=>statusMut.mutate({id:row.id,status:v})}/>
                <button className="del" onClick={e=>{e.stopPropagation();if(confirm("Delete?"))deleteMut.mutate(row.id);}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.faint,transition:"all .12s",marginLeft:"auto"}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Grid view ── */}
        {view==="grid"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {isLoading&&[1,2,3,4,5,6].map(i=><div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16,height:140,animation:"fadeUp .4s ease both"}}/>)}
            {!isLoading&&filtered.map((row:any)=>{
              const cfg=STATUS_CFG[row.status]??STATUS_CFG.scheduled;
              return (
                <div key={row.id} className="grid-r" style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16,cursor:"pointer",transition:"all .15s",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:cfg.bg,borderTop:`3px solid ${cfg.text}`}}/>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,paddingTop:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Avi name={row.patient_name??"?"} size={34}/>
                      <div>
                        <p style={{fontSize:13,fontWeight:700,color:C.text}}>{row.patient_name??"—"}</p>
                        <TypeBadge type={row.type??"—"}/>
                      </div>
                    </div>
                    <button className="del" onClick={e=>{e.stopPropagation();if(confirm("Delete?"))deleteMut.mutate(row.id);}} style={{width:24,height:24,borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.faint,transition:"all .12s"}}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                  <div style={{display:"flex",gap:12,marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <CalendarDays size={11} color={C.faint}/>
                      <span style={{fontSize:11,color:C.faint}}>{new Date(row.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <Clock size={11} color={C.faint}/>
                      <span style={{fontSize:11,color:C.faint}}>{new Date(row.scheduled_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,color:C.muted}}>{row.doctor_name??"—"}</span>
                    <StatusSelect value={row.status} onChange={v=>statusMut.mutate({id:row.id,status:v})}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Schedule Modal ── */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Schedule New Appointment">
        <form onSubmit={handleSave} style={{display:"flex",flexDirection:"column",gap:16}}>
          <Field label="Patient *">
            <PatientCombobox patients={patients} value={form.patientId} onSelect={(id,label)=>setForm(p=>({...p,patientId:id,patientLabel:label}))}/>
          </Field>
          <Field label="Appointment Type">
            <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="inp" style={{...IS,cursor:"pointer"}}>
              {TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
            </select>
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Date *"><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="inp" style={IS}/></Field>
            <Field label="Time *"><input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} className="inp" style={IS}/></Field>
          </div>
          <Field label="Chief Complaint">
            <input value={form.chiefComplaint} onChange={e=>setForm(p=>({...p,chiefComplaint:e.target.value}))} placeholder="Reason for visit…" className="inp" style={IS}/>
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Additional notes…" className="inp" style={{...IS,height:"auto",padding:"8px 12px",resize:"none",lineHeight:1.5}}/>
          </Field>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:4}}>
            <GhostBtn onClick={()=>setModal(false)}>Cancel</GhostBtn>
            <SubmitBtn loading={createMut.isPending}><CalendarCheck size={14}/> Schedule</SubmitBtn>
          </div>
        </form>
      </Modal>
    </>
  );
}