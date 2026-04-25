import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Phone, MapPin, Calendar, Heart,
  AlertTriangle, Shield, User, FileText,
  CreditCard, Image, ChevronRight, Clock,
  CheckCircle2, Activity, Mail, Briefcase,
} from "lucide-react";
import {
  apiGetPatient, apiGetPatientHistory,
  apiGetPatientBalance, apiGetPatientFiles,
} from "@/api/patients";
import { formatCurrency } from "@/utils";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  border:"#e5eae8",bg:"#fff",bgMuted:"#f7f9f8",bgPage:"#f0f2f1",
  text:"#111816",muted:"#7a918b",faint:"#a0b4ae",
  teal:"#0d9e75",tealBg:"#e8f7f2",tealText:"#0a7d5d",tealBorder:"#c3e8dc",
  amber:"#f59e0b",amberBg:"#fffbeb",amberText:"#92400e",amberBorder:"#fde68a",
  red:"#e53e3e",redBg:"#fff5f5",redText:"#c53030",redBorder:"#fed7d7",
  blue:"#3b82f6",blueBg:"#eff6ff",blueText:"#1d4ed8",blueBorder:"#bfdbfe",
  purple:"#8b5cf6",purpleBg:"#f5f3ff",purpleText:"#5b21b6",
};

type Tab = "overview"|"history"|"billing"|"files";

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({name,size=60}:{name:string;size?:number}) {
  const colors=["linear-gradient(135deg,#0d9e75,#0a7d5d)","linear-gradient(135deg,#3b82f6,#1d4ed8)","linear-gradient(135deg,#8b5cf6,#5b21b6)","linear-gradient(135deg,#f59e0b,#92400e)"];
  const c=colors[(name?.charCodeAt(0)??0)%colors.length];
  const i=(name??"?").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.33,fontWeight:700,color:"white",flexShrink:0,letterSpacing:"-.01em"}}>{i}</div>;
}

function InfoRow({icon:Icon,label,value}:{icon:any;label:string;value:string|null|undefined}) {
  if(!value)return null;
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
      <Icon size={13} color={C.faint} style={{marginTop:2,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:10,fontWeight:600,color:C.faint,textTransform:"uppercase",letterSpacing:".06em",marginBottom:1}}>{label}</p>
        <p style={{fontSize:13,color:C.text,fontWeight:500}}>{value}</p>
      </div>
    </div>
  );
}

function Section({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <div style={{marginBottom:20}}>
      <p style={{fontSize:11,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>{title}</p>
      {children}
    </div>
  );
}

// ─── Tooth SVG chart ──────────────────────────────────────────────────────────
function DentalChart({chart}:{chart:any[]}) {
  const UPPER=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const LOWER=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
  const condMap:Record<string,{bg:string;text:string;border:string}> = {
    caries:   {bg:"#fde8e8",text:"#9a2020",border:"#f5c2c2"},
    crown:    {bg:"#e8f0fe",text:"#1a56a0",border:"#c2d4f5"},
    rct:      {bg:"#fef3e2",text:"#9a5e00",border:"#f5dcb2"},
    missing:  {bg:"#f5f7f5",text:C.faint,  border:C.border},
    implant:  {bg:"#f5f3ff",text:"#5b21b6",border:"#ddd6fe"},
    filling:  {bg:"#e8f7f2",text:"#0a7d5d",border:"#c3e8dc"},
    fracture: {bg:"#fffbeb",text:"#92400e",border:"#fde68a"},
  };
  const getCondition=(tooth:number)=>{
    const entry=chart?.find(c=>parseInt(c.tooth_number)===tooth);
    return entry?.condition?.toLowerCase();
  };

  const ToothCell=({num}:{num:number})=>{
    const cond=getCondition(num);
    const style=cond?condMap[cond]??{bg:C.bgMuted,text:C.muted,border:C.border}:{bg:"#fff",text:C.faint,border:C.border};
    return (
      <div title={cond?`Tooth ${num}: ${cond}`:`Tooth ${num}`} style={{width:"100%",aspectRatio:"1",borderRadius:3,border:`1px solid ${style.border}`,background:style.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:style.text,cursor:"default",transition:"transform .1s"}} onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.15)")} onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
        {num}
      </div>
    );
  };

  const legendItems=Object.entries(condMap).filter(([k])=>chart?.some(c=>c.condition?.toLowerCase()===k));

  return (
    <div>
      <p style={{fontSize:10,color:C.faint,marginBottom:4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>Upper jaw</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(16,1fr)",gap:2,marginBottom:4}}>
        {UPPER.map(n=><ToothCell key={n} num={n}/>)}
      </div>
      <p style={{fontSize:10,color:C.faint,marginBottom:4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>Lower jaw</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(16,1fr)",gap:2,marginBottom:8}}>
        {LOWER.map(n=><ToothCell key={n} num={n}/>)}
      </div>
      {legendItems.length>0&&(
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {legendItems.map(([cond,s])=>(
            <div key={cond} style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:8,height:8,borderRadius:2,background:s.bg,border:`1px solid ${s.border}`,display:"inline-block"}}/>
              <span style={{fontSize:10,color:C.muted,textTransform:"capitalize"}}>{cond}</span>
            </div>
          ))}
        </div>
      )}
      {!chart?.length&&<p style={{fontSize:12,color:C.faint,textAlign:"center",padding:"8px 0"}}>No dental chart recorded yet</p>}
    </div>
  );
}

// ─── Balance summary cards ────────────────────────────────────────────────────
function BalanceCards({balance}:{balance:any}) {
  if(!balance)return null;
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
      {[
        {label:"Total Billed",  value:formatCurrency(balance.total_billed),   color:C.text},
        {label:"Total Paid",    value:formatCurrency(balance.total_paid),      color:C.tealText},
        {label:"Balance Due",   value:formatCurrency(balance.balance_due),     color:Number(balance.balance_due)>0?C.redText:C.tealText},
      ].map(k=>(
        <div key={k.label} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
          <p style={{fontSize:11,color:C.faint,textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:4}}>{k.label}</p>
          <p style={{fontSize:20,fontWeight:700,color:k.color,letterSpacing:"-.02em"}}>{k.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function SBadge({status}:{status:string}) {
  const map:Record<string,{bg:string;text:string;border:string}> = {
    paid:     {bg:C.tealBg, text:C.tealText,  border:C.tealBorder},
    unpaid:   {bg:C.redBg,  text:C.redText,   border:C.redBorder},
    partial:  {bg:C.amberBg,text:C.amberText, border:C.amberBorder},
    completed:{bg:C.tealBg, text:C.tealText,  border:C.tealBorder},
    scheduled:{bg:C.bgMuted,text:C.muted,     border:C.border},
    confirmed:{bg:C.blueBg, text:C.blueText,  border:C.blueBorder},
  };
  const s=map[status]??{bg:C.bgMuted,text:C.muted,border:C.border};
  return <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,background:s.bg,color:s.text,border:`1px solid ${s.border}`,whiteSpace:"nowrap",textTransform:"capitalize"}}>{status.replace(/_/g," ")}</span>;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AssistantPatientProfilePage() {
  const {id}=useParams();
  const navigate=useNavigate();
  const patientId=Number(id);
  const [tab,setTab]=useState<Tab>("overview");

  const {data:patient,isLoading}=useQuery({queryKey:["patient",patientId],queryFn:()=>apiGetPatient(patientId),enabled:!!patientId});
  const {data:history}=useQuery({queryKey:["patient-history",patientId],queryFn:()=>apiGetPatientHistory(patientId),enabled:tab==="history"});
  const {data:balance}=useQuery({queryKey:["patient-balance",patientId],queryFn:()=>apiGetPatientBalance(patientId),enabled:!!patientId});
  const {data:filesRaw}=useQuery({queryKey:["patient-files",patientId],queryFn:()=>apiGetPatientFiles(patientId),enabled:tab==="files"});

  if(isLoading)return <div style={{padding:"60px 0",textAlign:"center",color:C.faint,fontSize:13}}>Loading patient…</div>;
  if(!patient) return <div style={{padding:"60px 0",textAlign:"center",color:C.faint,fontSize:13}}>Patient not found.</div>;

    const patientResp = patient as any;
  const p = patientResp?.data?.patient ?? patientResp?.patient ?? patientResp;
  const historyData = (history as any)?.data ?? history;
  const balanceData = (balance as any)?.data ?? balance;
  const files:any[] = Array.isArray(filesRaw) ? filesRaw : Array.isArray((filesRaw as any)?.data?.data) ? (filesRaw as any).data.data : Array.isArray((filesRaw as any)?.data) ? (filesRaw as any).data : [];
  const visits:any[] = Array.isArray(historyData?.visits) ? historyData.visits : Array.isArray(historyData?.data) ? historyData.data : Array.isArray(historyData) ? historyData : [];
  const invoices:any[] = Array.isArray(balanceData?.invoices) ? balanceData.invoices : Array.isArray(balanceData?.data) ? balanceData.data : [];

  const tabs:[Tab,string,any][]=[
    ["overview","Overview",User],
    ["history", "Visit History",Activity],
    ["billing", "Billing",CreditCard],
    ["files",   "Files",Image],
  ];

  const age=p.date_of_birth?new Date().getFullYear()-new Date(p.date_of_birth).getFullYear():null;

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .tab-btn:hover{color:${C.text}!important}
        .visit-row:hover{background:${C.bgMuted}!important}
        .inv-row:hover{background:${C.bgMuted}!important}
      `}</style>

      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>

        {/* ── Back ── */}
        <button onClick={()=>navigate("/assistant/patients")} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,width:"fit-content",transition:"color .15s"}} onMouseEnter={e=>(e.currentTarget.style.color=C.text)} onMouseLeave={e=>(e.currentTarget.style.color=C.muted)}>
          <ArrowLeft size={14}/> Back to Patients
        </button>

        {/* ── Profile header ── */}
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          {/* Colour bar */}
          <div style={{height:6,background:`linear-gradient(90deg,${C.teal},${C.blue})`}}/>
          <div style={{padding:"24px",display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
            <Avi name={p.full_name??"?"} size={68}/>
            <div style={{flex:1,minWidth:240}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:6}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:700,color:C.text,letterSpacing:"-.02em",lineHeight:1.15}}>{p.full_name}</h2>
                  <p style={{fontSize:13,color:C.faint,marginTop:3}}>{p.patient_number} {age?`· ${age} years old`:""} {p.gender?`· ${p.gender}`:""}</p>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {p.blood_type&&<span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:100,background:C.redBg,color:C.redText,border:`1px solid ${C.redBorder}`}}>{p.blood_type}</span>}
                  <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:100,background:p.is_active!==false?C.tealBg:C.bgMuted,color:p.is_active!==false?C.tealText:C.muted,border:`1px solid ${p.is_active!==false?C.tealBorder:C.border}`}}>{p.is_active!==false?"Active":"Inactive"}</span>
                </div>
              </div>

              {/* Quick info row */}
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:8}}>
                {[[Phone,p.phone],[Mail,p.email],[MapPin,[p.address,p.city].filter(Boolean).join(", ") || null],[Calendar,p.date_of_birth?new Date(p.date_of_birth).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):null],[Briefcase,p.occupation]].map(([Icon,val],i)=>val&&(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                    <Icon size={12} color={C.faint}/>
                    <span style={{fontSize:12,color:C.muted}}>{val as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts row */}
          {(p.allergies?.length>0||p.medical_conditions?.length>0)&&(
            <div style={{padding:"12px 24px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {p.allergies?.map((a:any)=>(
                <span key={a.id} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:100,background:C.redBg,color:C.redText,border:`1px solid ${C.redBorder}`}}>
                  <AlertTriangle size={10}/> {a.allergen} ({a.severity})
                </span>
              ))}
              {p.medical_conditions?.map((c:any)=>(
                <span key={c.id} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:100,background:C.amberBg,color:C.amberText,border:`1px solid ${C.amberBorder}`}}>
                  <Heart size={10}/> {c.condition_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Balance cards ── */}
        <BalanceCards balance={balance}/>

        {/* ── Tabbed card ── */}
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          {/* Tab bar */}
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.bgMuted,padding:"0 8px"}}>
            {tabs.map(([key,label,Icon])=>{
              const active=tab===key;
              return (
                <button key={key} className="tab-btn" onClick={()=>setTab(key)} style={{display:"flex",alignItems:"center",gap:6,padding:"12px 16px",fontSize:13,fontWeight:active?600:400,color:active?C.teal:C.muted,background:"none",border:"none",cursor:"pointer",borderBottom:active?`2px solid ${C.teal}`:"2px solid transparent",transition:"all .15s",fontFamily:"inherit",marginBottom:-1}}>
                  <Icon size={13}/>{label}
                </button>
              );
            })}
          </div>

          {/* ── OVERVIEW tab ── */}
          {tab==="overview"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
              {/* Left col */}
              <div style={{padding:"20px",borderRight:`1px solid ${C.border}`}}>
                <Section title="Personal Information">
                  <InfoRow icon={Phone}    label="Phone"       value={p.phone}/>
                  <InfoRow icon={Phone}    label="Alt Phone"   value={p.secondary_phone}/>
                  <InfoRow icon={Mail}     label="Email"       value={p.email}/>
                  <InfoRow icon={User}     label="National ID" value={p.national_id}/>
                  <InfoRow icon={MapPin}   label="Address"     value={[p.address,p.city].filter(Boolean).join(", ")||null}/>
                  <InfoRow icon={Briefcase}label="Occupation"  value={p.occupation}/>
                  <InfoRow icon={Calendar} label="Referred by" value={p.referred_by}/>
                </Section>

                {p.notes&&(
                  <Section title="Medical Notes">
                    <p style={{fontSize:13,color:C.text,lineHeight:1.6}}>{p.notes}</p>
                  </Section>
                )}

                {/* Dental chart */}
                <Section title="Dental Chart">
                  <DentalChart chart={p.dental_chart??[]}/>
                </Section>
              </div>

              {/* Right col */}
              <div style={{padding:"20px"}}>
                {/* Emergency contacts */}
                {p.emergency_contacts?.length>0&&(
                  <Section title="Emergency Contacts">
                    {p.emergency_contacts.map((ec:any)=>(
                      <div key={ec.id} style={{padding:"10px 12px",background:C.bgMuted,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8}}>
                        <p style={{fontSize:13,fontWeight:600,color:C.text}}>{ec.full_name} <span style={{fontWeight:400,color:C.muted,fontSize:12}}>({ec.relationship})</span></p>
                        <p style={{fontSize:12,color:C.muted,marginTop:2}}>{ec.phone}</p>
                        {ec.is_primary&&<span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:100,background:C.tealBg,color:C.tealText,border:`1px solid ${C.tealBorder}`,marginTop:4,display:"inline-block"}}>Primary</span>}
                      </div>
                    ))}
                  </Section>
                )}

                {/* Insurance */}
                {p.insurance_policies?.length>0&&(
                  <Section title="Insurance Policies">
                    {p.insurance_policies.map((ins:any)=>(
                      <div key={ins.id} style={{padding:"10px 12px",background:C.bgMuted,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <Shield size={13} color={C.teal}/>
                          <p style={{fontSize:13,fontWeight:600,color:C.text}}>{ins.provider_name}</p>
                          {ins.is_active&&<span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:100,background:C.tealBg,color:C.tealText,border:`1px solid ${C.tealBorder}`}}>Active</span>}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                          {[["Policy #",ins.policy_number],["Coverage",`${ins.coverage_percent}%`],["Annual Limit",ins.annual_limit?formatCurrency(ins.annual_limit):"—"],["Used",ins.used_amount?formatCurrency(ins.used_amount):"$0"]].map(([l,v])=>(
                            <div key={l}>
                              <p style={{fontSize:10,color:C.faint,textTransform:"uppercase",letterSpacing:".04em",fontWeight:600}}>{l}</p>
                              <p style={{fontSize:12,color:C.text,fontWeight:500}}>{v}</p>
                            </div>
                          ))}
                        </div>
                        {ins.expiry_date&&<p style={{fontSize:11,color:C.faint,marginTop:6}}>Expires {new Date(ins.expiry_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>}
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            </div>
          )}

          {/* ── HISTORY tab ── */}
          {tab==="history"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"100px 100px 1.4fr 140px 100px 110px",padding:"9px 18px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`}}>
                {["Date","Time","Diagnosis / Type","Doctor","Value","Status"].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:".07em",textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {visits.length===0&&<div style={{padding:"48px 18px",textAlign:"center"}}><Activity size={28} color={C.border} style={{margin:"0 auto 8px",display:"block"}}/><p style={{fontSize:13,color:C.faint}}>No visit history found</p></div>}
              {visits.map((v:any,i:number)=>(
                <div key={v.id??i} className="visit-row" style={{display:"grid",gridTemplateColumns:"100px 100px 1.4fr 140px 100px 110px",padding:"11px 18px",borderBottom:i<visits.length-1?`1px solid ${C.border}`:"none",alignItems:"center",transition:"background .1s"}}>
                  <span style={{fontSize:12,color:C.text,fontWeight:500}}>{v.scheduled_at?new Date(v.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):"—"}</span>
                  <span style={{fontSize:12,color:C.faint}}>{v.scheduled_at?new Date(v.scheduled_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</span>
                  <div>
                    <p style={{fontSize:13,fontWeight:500,color:C.text}}>{v.diagnosis||v.type?.replace(/_/g," ")||"—"}</p>
                    {v.chief_complaint&&<p style={{fontSize:11,color:C.faint}}>{v.chief_complaint}</p>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#0d9e75,#0a7d5d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"white",flexShrink:0}}>
                      {(v.doctor_name??"D").split(" ").map((n:string)=>n[0]).slice(0,2).join("")}
                    </div>
                    <span style={{fontSize:12,color:C.text}}>{v.doctor_name??"—"}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:C.tealText}}>{v.total_cost?formatCurrency(v.total_cost):"—"}</span>
                  <SBadge status={v.status??"scheduled"}/>
                </div>
              ))}
            </div>
          )}

          {/* ── BILLING tab ── */}
          {tab==="billing"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"130px 100px 110px 110px 110px 100px",padding:"9px 18px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`}}>
                {["Invoice #","Date","Total","Paid","Balance","Status"].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:".07em",textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {invoices.length===0&&<div style={{padding:"48px 18px",textAlign:"center"}}><CreditCard size={28} color={C.border} style={{margin:"0 auto 8px",display:"block"}}/><p style={{fontSize:13,color:C.faint}}>No billing records found</p></div>}
              {invoices.map((inv:any,i:number)=>{
                const bal=Math.max(0,parseFloat(inv.total_amount??0)-parseFloat(inv.paid_amount??0));
                return (
                  <div key={inv.id??i} className="inv-row" style={{display:"grid",gridTemplateColumns:"130px 100px 110px 110px 110px 100px",padding:"11px 18px",borderBottom:i<invoices.length-1?`1px solid ${C.border}`:"none",alignItems:"center",transition:"background .1s"}}>
                    <span style={{fontSize:12,fontWeight:700,color:C.teal,fontFamily:"monospace"}}>{inv.invoice_number}</span>
                    <span style={{fontSize:12,color:C.faint}}>{inv.created_at?new Date(inv.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):"—"}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{formatCurrency(inv.total_amount)}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.tealText}}>{formatCurrency(inv.paid_amount)}</span>
                    <span style={{fontSize:13,fontWeight:700,color:bal>0?C.redText:C.tealText}}>{bal>0?formatCurrency(bal):"—"}</span>
                    <SBadge status={inv.status}/>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FILES tab ── */}
          {tab==="files"&&(
            <div style={{padding:20}}>
              {files.length===0
                ?<div style={{padding:"40px 0",textAlign:"center"}}><FileText size={28} color={C.border} style={{margin:"0 auto 8px",display:"block"}}/><p style={{fontSize:13,color:C.faint}}>No files uploaded yet</p></div>
                :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {files.map((file:any)=>(
                    <a key={file.id} href={file.file_url} target="_blank" rel="noopener noreferrer" style={{display:"block",textDecoration:"none",background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.teal;e.currentTarget.style.boxShadow=`0 0 0 3px ${C.tealBg}`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow="none";}}>
                      <div style={{height:90,background:C.bgMuted,display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${C.border}`}}>
                        <span style={{fontSize:32}}>{file.file_type?.includes("image")?"🖼":"📄"}</span>
                      </div>
                      <div style={{padding:"10px 12px"}}>
                        <p style={{fontSize:11,fontWeight:600,padding:"1px 6px",borderRadius:100,background:C.tealBg,color:C.tealText,border:`1px solid ${C.tealBorder}`,display:"inline-block",marginBottom:4,textTransform:"capitalize"}}>{file.category||"file"}</p>
                        <p style={{fontSize:12,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.file_name}</p>
                        <p style={{fontSize:11,color:C.faint,marginTop:2}}>{file.uploaded_at?new Date(file.uploaded_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—"}</p>
                      </div>
                    </a>
                  ))}
                </div>
              }
            </div>
          )}
        </div>
      </div>
    </>
  );
}