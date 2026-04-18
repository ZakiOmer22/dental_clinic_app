import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Search, X, ChevronDown,
  Stethoscope, CheckCircle2, Clock, DollarSign,
  ChevronRight, ClipboardList, Filter,
} from "lucide-react";
import { apiGetTreatments, apiCreateTreatment } from "@/api/treatments";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import { formatCurrency } from "@/utils";
import toast from "react-hot-toast";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  border:"#e5eae8",bg:"#fff",bgMuted:"#f7f9f8",
  text:"#111816",muted:"#7a918b",faint:"#a0b4ae",
  teal:"#0d9e75",tealBg:"#e8f7f2",tealText:"#0a7d5d",tealBorder:"#c3e8dc",
  amber:"#f59e0b",amberBg:"#fffbeb",amberText:"#92400e",amberBorder:"#fde68a",
  red:"#e53e3e",redBg:"#fff5f5",redText:"#c53030",redBorder:"#fed7d7",
  blue:"#3b82f6",blueBg:"#eff6ff",blueText:"#1d4ed8",blueBorder:"#bfdbfe",
  purple:"#8b5cf6",purpleBg:"#f5f3ff",purpleText:"#5b21b6",
};

const CDT_CATS = ["All","Diagnostic","Preventive","Restorative","Endodontics","Surgical","Prosthodontics","Orthodontics","Periodontics","Cosmetic","Emergency","Implants"];
const EMPTY = { patientId:"",diagnosis:"",treatmentNotes:"",followUpDate:"",chiefComplaint:"",clinicalNotes:"" };
const IS:React.CSSProperties = {width:"100%",height:38,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:9,background:C.bg,fontSize:13,color:C.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({name,size=30}:{name:string;size?:number}) {
  const colors=["linear-gradient(135deg,#0d9e75,#0a7d5d)","linear-gradient(135deg,#3b82f6,#1d4ed8)","linear-gradient(135deg,#8b5cf6,#5b21b6)","linear-gradient(135deg,#f59e0b,#92400e)"];
  const c=colors[(name?.charCodeAt(0)??0)%colors.length];
  const i=(name??"?").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:"white",flexShrink:0}}>{i}</div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <div><label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:5}}>{label}</label>{children}</div>;
}
function SubmitBtn({loading,children}:{loading?:boolean;children:React.ReactNode}) {
  return <button type="submit" disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:9,background:loading?"#9ab5ae":C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 2px 8px rgba(13,158,117,.3)"}}>{loading?<><span style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite",display:"inline-block"}}/>Saving…</>:children}</button>;
}
function GhostBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} style={{padding:"9px 16px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:13,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;
}
function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}) {
  if(!open)return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:16,width:"100%",maxWidth:720,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"modalIn .2s cubic-bezier(.22,1,.36,1)",maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text,letterSpacing:"-.01em"}}>{title}</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><X size={14}/></button>
        </div>
        <div style={{padding:20,overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Patient combobox ─────────────────────────────────────────────────────────
function PatientCombo({patients,value,onSelect}:{patients:any[];value:string;onSelect:(id:string)=>void}) {
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const ref=useRef<HTMLDivElement>(null);
  const sel=patients.find(p=>String(p.id)===value);
  const list=patients.filter(p=>!q||p.full_name?.toLowerCase().includes(q.toLowerCase())||p.phone?.includes(q)||p.patient_number?.toLowerCase().includes(q.toLowerCase())).slice(0,50);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <div onClick={()=>setOpen(v=>!v)} style={{...IS,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
        {sel
          ?<div style={{display:"flex",alignItems:"center",gap:8}}><Avi name={sel.full_name} size={22}/><span style={{fontSize:13,color:C.text,fontWeight:500}}>{sel.full_name}</span><span style={{fontSize:11,color:C.faint}}>· {sel.patient_number??sel.phone}</span></div>
          :<span style={{color:C.faint,fontSize:13}}>Search patient by name, phone or ID…</span>
        }
        <ChevronDown size={13} color={C.faint} style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}/>
      </div>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bg,border:`1.5px solid ${C.tealBorder}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:100,overflow:"hidden"}}>
          <div style={{padding:"10px 10px 6px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{position:"relative"}}>
              <Search size={12} style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
              <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Type name, phone or patient number…" style={{...IS,paddingLeft:28,height:34,fontSize:12}}/>
            </div>
          </div>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {list.length===0
              ?<p style={{padding:"16px 12px",textAlign:"center",fontSize:12,color:C.faint}}>No patients found</p>
              :list.map(p=>(
                <div key={p.id} onClick={()=>{onSelect(String(p.id));setOpen(false);setQ("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>(e.currentTarget.style.background=C.bgMuted)} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
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

// ─── CDT procedure picker ─────────────────────────────────────────────────────
function ProcPicker({catalog,selected,onAdd,onRemove,onUpdate}:{
  catalog:any[];selected:any[];
  onAdd:(p:any)=>void;onRemove:(i:number)=>void;
  onUpdate:(i:number,k:string,v:string)=>void;
}) {
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("All");

  const visible=useMemo(()=>catalog.filter(p=>{
    if(cat!=="All"&&p.category!==cat)return false;
    if(q&&!p.name?.toLowerCase().includes(q.toLowerCase())&&!p.cdt_code?.includes(q))return false;
    return true;
  }).slice(0,12),[catalog,q,cat]);

  const total=selected.reduce((a,p)=>a+parseFloat(p.price||0),0);

  return (
    <div>
      {/* Search + category filter */}
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{position:"relative",flex:1}}>
          <Search size={12} style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search CDT code or procedure name…" className="inp" style={{...IS,paddingLeft:28,height:34,fontSize:12}}/>
        </div>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{height:34,padding:"0 10px",border:`1.5px solid ${C.border}`,borderRadius:9,background:C.bg,fontSize:12,color:C.muted,fontFamily:"inherit",cursor:"pointer",outline:"none"}}>
          {CDT_CATS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Catalog grid */}
      <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",maxHeight:200,overflowY:"auto",marginBottom:12}}>
        {visible.length===0&&<p style={{padding:"16px",textAlign:"center",fontSize:12,color:C.faint}}>No procedures found</p>}
        {visible.map((proc:any,i:number)=>{
          const already=selected.some(s=>s.procedureId===proc.id);
          return (
            <div key={proc.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderBottom:i<visible.length-1?`1px solid ${C.border}`:"none",transition:"background .1s",cursor:already?"default":"pointer",background:already?C.tealBg:"transparent"}} onClick={()=>!already&&onAdd(proc)} onMouseEnter={e=>{if(!already)e.currentTarget.style.background=C.bgMuted;}} onMouseLeave={e=>{if(!already)e.currentTarget.style.background="transparent";}}>
              <span style={{fontFamily:"monospace",fontSize:11,color:C.faint,width:48,flexShrink:0}}>{proc.cdt_code}</span>
              <span style={{fontSize:13,fontWeight:500,color:C.text,flex:1}}>{proc.name}</span>
              <span style={{fontSize:11,color:C.muted,flexShrink:0}}>{proc.category}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.tealText,flexShrink:0,minWidth:50,textAlign:"right"}}>{formatCurrency(proc.base_price)}</span>
              {already
                ?<CheckCircle2 size={14} color={C.teal} style={{flexShrink:0}}/>
                :<div style={{width:20,height:20,borderRadius:"50%",border:`1.5px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:C.faint}}><Plus size={11}/></div>
              }
            </div>
          );
        })}
      </div>

      {/* Selected procedures */}
      {selected.length>0&&(
        <div style={{border:`1px solid ${C.tealBorder}`,borderRadius:10,overflow:"hidden"}}>
          <div style={{background:C.tealBg,padding:"8px 12px",borderBottom:`1px solid ${C.tealBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:11,fontWeight:700,color:C.tealText,textTransform:"uppercase",letterSpacing:".06em"}}>{selected.length} procedure{selected.length>1?"s":""} selected</span>
            <span style={{fontSize:12,fontWeight:700,color:C.tealText}}>Total: {formatCurrency(total)}</span>
          </div>
          {selected.map((p:any,i:number)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:i<selected.length-1?`1px solid ${C.tealBorder}`:"none",background:C.bg}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:12,fontWeight:600,color:C.text}}>{p.name}</p>
                <p style={{fontSize:11,color:C.faint}}>{formatCurrency(p.price)}</p>
              </div>
              {/* Tooth number */}
              <input value={p.toothNumber||""} onChange={e=>onUpdate(i,"toothNumber",e.target.value)} placeholder="Tooth #" title="Tooth number" style={{width:64,height:28,padding:"0 8px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,fontFamily:"inherit",outline:"none",background:C.bgMuted}}/>
              {/* Price override */}
              <input value={p.price||""} onChange={e=>onUpdate(i,"price",e.target.value)} placeholder="Price" title="Price" type="number" style={{width:74,height:28,padding:"0 8px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,fontFamily:"inherit",outline:"none",background:C.bgMuted}}/>
              <button onClick={()=>onRemove(i)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.bgMuted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.faint,flexShrink:0,transition:"all .12s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.redBg;e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor=C.redBorder;}} onMouseLeave={e=>{e.currentTarget.style.background=C.bgMuted;e.currentTarget.style.color=C.faint;e.currentTarget.style.borderColor=C.border;}}>
                <Trash2 size={12}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function TreatmentCharts({treatments}:{treatments:any[]}) {
  // Revenue by month
  const months:Record<string,number>={};
  treatments.forEach(t=>{
    if(!t.created_at)return;
    const m=new Date(t.created_at).toLocaleDateString("en",{month:"short"});
    months[m]=(months[m]||0)+parseFloat(t.total_cost||0);
  });
  const keys=Object.keys(months).slice(-6);
  const maxRev=Math.max(...keys.map(k=>months[k]),1);

  // Top procedures
  const procCount:Record<string,number>={};
  treatments.forEach(t=>{t.procedures?.forEach((p:any)=>{const n=p.name||p.procedure_name||"Unknown";procCount[n]=(procCount[n]||0)+1;});});
  const topProcs=Object.entries(procCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxProc=Math.max(...topProcs.map(([,v])=>v),1);

  // Follow-up status
  const withFollowup=treatments.filter(t=>t.follow_up_date).length;
  const completed=treatments.filter(t=>t.is_completed).length;

  return (
    <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr",gap:12}}>
      {/* Revenue trend */}
      <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
        <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12}}>Treatment Value by Month</p>
        {keys.length===0
          ?<p style={{fontSize:11,color:C.faint,textAlign:"center",padding:"12px 0"}}>No data yet</p>
          :<div style={{display:"flex",alignItems:"flex-end",gap:6,height:64}}>
            {keys.map((m,i)=>{
              const isLast=i===keys.length-1;
              return (
                <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{width:"100%",height:`${(months[m]/maxRev)*54}px`,minHeight:4,borderRadius:"3px 3px 0 0",background:isLast?C.teal:"#d4ede5",border:isLast?"none":`1px solid ${C.tealBorder}`}}/>
                  <span style={{fontSize:9,color:isLast?C.tealText:C.faint,fontWeight:isLast?700:400}}>{m}</span>
                </div>
              );
            })}
          </div>
        }
      </div>

      {/* Top procedures */}
      <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
        <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:10}}>Top Procedures</p>
        {topProcs.length===0
          ?<p style={{fontSize:11,color:C.faint,textAlign:"center",padding:"12px 0"}}>No data yet</p>
          :topProcs.map(([name,count],i)=>(
            <div key={name} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:11,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"75%"}}>{name}</span>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,flexShrink:0}}>{count}</span>
              </div>
              <div style={{height:3,background:"#edf1ef",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(count/maxProc)*100}%`,background:[C.teal,C.blue,C.purple,C.amber,C.red][i]||C.teal,borderRadius:2}}/>
              </div>
            </div>
          ))
        }
      </div>

      {/* Quick stats */}
      <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
        <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12}}>Overview</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {label:"Total Treatments",value:treatments.length,color:C.teal},
            {label:"Completed",value:completed,color:C.teal},
            {label:"With Follow-up",value:withFollowup,color:C.amber},
            {label:"Pending",value:treatments.length-completed,color:C.blue},
          ].map(s=>(
            <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:C.bgMuted,borderRadius:8}}>
              <span style={{fontSize:12,color:C.muted}}>{s.label}</span>
              <span style={{fontSize:14,fontWeight:700,color:s.color}}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AssistantTreatmentsPage() {
  const qc  =useQueryClient();
  const user=useAuthStore(s=>s.user);

  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [procs,   setProcs]   = useState<any[]>([]);
  const [procSearch,setProcSearch] = useState("");

  const {data,isLoading}=useQuery({queryKey:["treatments"],queryFn:()=>apiGetTreatments()});
  const {data:patientsRes}=useQuery({queryKey:["patients","select"],queryFn:()=>apiGetPatients({limit:500})});
  const {data:catalogRaw}=useQuery({queryKey:["procedures-catalog"],queryFn:()=>fetch("/data/procedures_catalog.json").then(res=>res.json())});

  const treatments:any[]=data?.data??[];
  const patients:any[]=patientsRes?.data??[];
  const catalog:any[]=Array.isArray(catalogRaw)?catalogRaw:(catalogRaw as any)?.data??[];

  const totalValue=treatments.reduce((a,t)=>a+parseFloat(t.total_cost||0),0);

  const filtered=useMemo(()=>treatments.filter(t=>{
    if(!search)return true;
    const q=search.toLowerCase();
    return t.patient_name?.toLowerCase().includes(q)||t.doctor_name?.toLowerCase().includes(q)||t.diagnosis?.toLowerCase().includes(q);
  }),[treatments,search]);

  const createMut=useMutation({
    mutationFn:apiCreateTreatment,
    onSuccess:()=>{toast.success("Treatment recorded");qc.invalidateQueries({queryKey:["treatments"]});setModal(false);setForm(EMPTY);setProcs([]);},
    onError:(e:any)=>toast.error(e?.response?.data?.error??"Failed"),
  });

  const handleSave=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.patientId||!form.diagnosis){toast.error("Patient and diagnosis required");return;}
    createMut.mutate({patientId:Number(form.patientId),doctorId:user?.id,diagnosis:form.diagnosis,treatmentNotes:form.treatmentNotes,chiefComplaint:form.chiefComplaint,clinicalNotes:form.clinicalNotes,followUpDate:form.followUpDate||null,procedures:procs});
  };

  const addProc=(proc:any)=>{
    if(procs.find(p=>p.procedureId===proc.id))return;
    setProcs(p=>[...p,{procedureId:proc.id,name:proc.name,price:proc.base_price,toothNumber:"",notes:""}]);
  };
  const removeProc=(i:number)=>setProcs(p=>p.filter((_,j)=>j!==i));
  const updateProc=(i:number,k:string,v:string)=>setProcs(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));

  const f=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(p=>({...p,[k]:e.target.value}));

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .tx-row:hover{background:${C.bgMuted}!important}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
      `}</style>

      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.text,letterSpacing:"-.02em"}}>Treatments</h1>
            <p style={{fontSize:13,color:C.faint,marginTop:2}}>{treatments.length} records · {formatCurrency(totalValue)} total value</p>
          </div>
          <button onClick={()=>setModal(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:34,borderRadius:9,background:C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px rgba(13,158,117,.3)",transition:"background .15s"}} onMouseEnter={e=>(e.currentTarget.style.background="#0a8a66")} onMouseLeave={e=>(e.currentTarget.style.background=C.teal)}>
            <Plus size={15}/> Record Treatment
          </button>
        </div>

        {/* ── KPI strip ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"Total Records",   value:treatments.length,              icon:ClipboardList, color:C.teal, sub:"All time"},
            {label:"Total Value",     value:formatCurrency(totalValue),     icon:DollarSign,    color:C.blue, sub:"Procedures billed"},
            {label:"Completed",       value:treatments.filter(t=>t.is_completed).length, icon:CheckCircle2, color:C.teal, sub:"Finished treatments"},
            {label:"Follow-ups Due",  value:treatments.filter(t=>t.follow_up_date&&new Date(t.follow_up_date)>new Date()).length, icon:Clock, color:C.amber, sub:"Upcoming"},
          ].map(k=>(
            <div key={k.label} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
                <span style={{fontSize:11,color:C.muted,fontWeight:500}}>{k.label}</span>
                <div style={{width:28,height:28,borderRadius:7,background:k.color+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><k.icon size={13} color={k.color} strokeWidth={1.8}/></div>
              </div>
              <p style={{fontSize:22,fontWeight:700,color:C.text,letterSpacing:"-.03em",lineHeight:1}}>{k.value}</p>
              <p style={{fontSize:11,color:C.faint,marginTop:4}}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <TreatmentCharts treatments={treatments}/>

        {/* ── Search ── */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{position:"relative",width:300}}>
            <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient, doctor or diagnosis…" className="inp" style={{...IS,paddingLeft:30,height:34}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.faint,display:"flex"}}><X size={13}/></button>}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1.8fr 100px 1.4fr 140px 100px 100px 100px",padding:"9px 18px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`}}>
            {["Patient","Date","Diagnosis","Doctor","Value","Follow-up","Status"].map(h=>(
              <span key={h} style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:".07em",textTransform:"uppercase"}}>{h}</span>
            ))}
          </div>

          {isLoading&&<div style={{padding:"40px 18px",textAlign:"center"}}><div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.teal,animation:"spin .7s linear infinite",margin:"0 auto 8px"}}/><p style={{fontSize:13,color:C.faint}}>Loading…</p></div>}
          {!isLoading&&filtered.length===0&&<div style={{padding:"48px 18px",textAlign:"center"}}><Stethoscope size={30} color={C.border} style={{margin:"0 auto 8px",display:"block"}}/><p style={{fontSize:13,color:C.faint}}>No treatment records found</p></div>}

          {!isLoading&&filtered.map((row:any,i:number)=>(
            <div key={row.id} className="tx-row" style={{display:"grid",gridTemplateColumns:"1.8fr 100px 1.4fr 140px 100px 100px 100px",padding:"11px 18px",borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",alignItems:"center",transition:"background .1s",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <Avi name={row.patient_name??"?"} size={30}/>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.patient_name??"—"}</p>
                  <p style={{fontSize:11,color:C.faint}}>{row.patient_number??""}</p>
                </div>
              </div>
              <span style={{fontSize:12,color:C.faint}}>{row.created_at?new Date(row.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):"—"}</span>
              <span style={{fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.diagnosis??"—"}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Avi name={row.doctor_name??"D"} size={22}/>
                <span style={{fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.doctor_name??"—"}</span>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:C.tealText}}>{formatCurrency(row.total_cost)}</span>
              {row.follow_up_date
                ?<span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:100,background:C.amberBg,color:C.amberText,border:`1px solid ${C.amberBorder}`,whiteSpace:"nowrap"}}>{new Date(row.follow_up_date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                :<span style={{fontSize:12,color:C.faint}}>—</span>
              }
              <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,background:row.is_completed?C.tealBg:C.blueBg,color:row.is_completed?C.tealText:C.blueText,border:`1px solid ${row.is_completed?C.tealBorder:C.blueBorder}`,whiteSpace:"nowrap"}}>
                {row.is_completed?"Completed":"In Progress"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Record Treatment Modal ── */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Record Treatment">
        <form onSubmit={handleSave} style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* 2-col layout */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Patient *"><PatientCombo patients={patients} value={form.patientId} onSelect={id=>setForm(p=>({...p,patientId:id}))}/></Field>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Chief Complaint"><input value={form.chiefComplaint} onChange={f("chiefComplaint")} placeholder="What the patient says hurts…" className="inp" style={IS}/></Field>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Diagnosis *"><input value={form.diagnosis} onChange={f("diagnosis")} placeholder="e.g. Caries on tooth 36, Gingivitis" className="inp" style={IS}/></Field>
            </div>
          </div>

          {/* CDT Procedure picker */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:8}}>Procedures (CDT Codes)</label>
            <ProcPicker catalog={catalog} selected={procs} onAdd={addProc} onRemove={removeProc} onUpdate={updateProc}/>
          </div>

          {/* Clinical notes */}
          <Field label="Clinical Notes (SOAP)">
            <textarea value={form.clinicalNotes} onChange={f("clinicalNotes")} rows={2} placeholder="Subjective / Objective / Assessment / Plan…" className="inp" style={{...IS,height:"auto",padding:"8px 12px",resize:"none",lineHeight:1.5}}/>
          </Field>
          <Field label="Treatment Notes">
            <textarea value={form.treatmentNotes} onChange={f("treatmentNotes")} rows={2} placeholder="Procedure performed, materials used, observations…" className="inp" style={{...IS,height:"auto",padding:"8px 12px",resize:"none",lineHeight:1.5}}/>
          </Field>
          <Field label="Follow-up Date">
            <input type="date" value={form.followUpDate} onChange={f("followUpDate")} className="inp" style={IS}/>
          </Field>

          <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:4}}>
            <GhostBtn onClick={()=>setModal(false)}>Cancel</GhostBtn>
            <SubmitBtn loading={createMut.isPending}><Stethoscope size={14}/> Save Treatment</SubmitBtn>
          </div>
        </form>
      </Modal>
    </>
  );
}