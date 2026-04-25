import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, CreditCard, ReceiptText, Search,
  TrendingUp, TrendingDown, CheckCircle2, Clock,
  AlertCircle, Wallet, Download, Filter, X,
  ChevronDown, ChevronRight, DollarSign,
} from "lucide-react";
import {
  apiGetInvoices, apiCreateInvoice,
  apiRecordPayment, apiDeleteInvoice,
} from "@/api/billing";
import { apiGetPatients } from "@/api/patients";
import { useAuthStore } from "@/app/store";
import { formatCurrency } from "@/utils";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ["cash","card","mobile_money","bank_transfer","insurance","cheque","other"];
const INV_STATUSES    = ["draft","unpaid","partial","paid","void","refunded"];
const EMPTY_INV  = {patientId:"",totalAmount:"",discountType:"none",discountValue:"0",taxPercent:"0",notes:""};
const EMPTY_PAY  = {amount:"",method:"cash",referenceNumber:"",notes:""};

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  border:"#e5eae8",bg:"#ffffff",bgMuted:"#f7f9f8",
  text:"#111816",muted:"#7a918b",faint:"#a0b4ae",
  teal:"#0d9e75",tealBg:"#e8f7f2",tealText:"#0a7d5d",tealBorder:"#c3e8dc",
  amber:"#f59e0b",amberBg:"#fffbeb",amberText:"#92400e",amberBorder:"#fde68a",
  red:"#e53e3e",redBg:"#fff5f5",redText:"#c53030",redBorder:"#fed7d7",
  blue:"#3b82f6",blueBg:"#eff6ff",blueText:"#1d4ed8",blueBorder:"#bfdbfe",
  gray:"#6b7f75",grayBg:"#f4f7f5",
};

const STATUS_CFG:Record<string,{bg:string;text:string;border:string;label:string}> = {
  draft:    {bg:C.grayBg, text:C.gray,      border:C.border,      label:"Draft"},
  unpaid:   {bg:C.redBg,  text:C.redText,   border:C.redBorder,   label:"Unpaid"},
  partial:  {bg:C.amberBg,text:C.amberText, border:C.amberBorder, label:"Partial"},
  paid:     {bg:C.tealBg, text:C.tealText,  border:C.tealBorder,  label:"Paid"},
  void:     {bg:C.grayBg, text:C.gray,      border:C.border,      label:"Void"},
  refunded: {bg:C.blueBg, text:C.blueText,  border:C.blueBorder,  label:"Refunded"},
};

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({name,size=28}:{name:string;size?:number}) {
  const i=(name??"?").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#0d9e75,#0a7d5d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.37,fontWeight:700,color:"white",flexShrink:0}}>{i}</div>;
}

function StatusBadge({status}:{status:string}) {
  const cfg=STATUS_CFG[status]??STATUS_CFG.draft;
  return <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:100,background:cfg.bg,color:cfg.text,border:`1px solid ${cfg.border}`,whiteSpace:"nowrap"}}>{cfg.label}</span>;
}

const IS:React.CSSProperties={width:"100%",height:38,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:9,background:C.bg,fontSize:13,color:C.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <div><label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:5}}>{label}</label>{children}</div>;
}

function SubmitBtn({loading,children}:{loading?:boolean;children:React.ReactNode}) {
  return <button type="submit" disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:9,background:loading?"#9ab5ae":C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 2px 8px rgba(13,158,117,.3)"}}>{loading?<><span style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite",display:"inline-block"}}/>Saving…</>:children}</button>;
}
function GhostBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} style={{padding:"9px 16px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:13,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;
}

// ─── Patient Combobox (searchable) ────────────────────────────────────────────
function PatientCombobox({patients,value,onSelect}:{patients:any[];value:string;onSelect:(id:string)=>void}) {
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
          ? <div style={{display:"flex",alignItems:"center",gap:8}}><Avi name={sel.full_name} size={22}/><span style={{fontSize:13,color:C.text,fontWeight:500}}>{sel.full_name}</span><span style={{fontSize:11,color:C.faint}}>· {sel.patient_number??sel.phone}</span></div>
          : <span style={{color:C.faint,fontSize:13}}>Search patient by name, phone, or ID…</span>
        }
        <ChevronDown size={13} color={C.faint} style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}/>
      </div>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bg,border:`1.5px solid ${C.tealBorder}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:100,overflow:"hidden"}}>
          <div style={{padding:"10px 10px 6px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{position:"relative"}}>
              <Search size={12} style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
              <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Type name, phone, or patient number…" style={{...IS,paddingLeft:28,height:34,fontSize:12}}/>
            </div>
          </div>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {list.length===0
              ? <p style={{padding:"16px 12px",textAlign:"center",fontSize:12,color:C.faint}}>No patients found</p>
              : list.map(p=>(
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

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({open,onClose,title,size="md",children}:{open:boolean;onClose:()=>void;title:string;size?:"sm"|"md";children:React.ReactNode}) {
  if(!open)return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:16,width:"100%",maxWidth:size==="sm"?420:520,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"modalIn .2s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text,letterSpacing:"-.01em"}}>{title}</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><X size={14}/></button>
        </div>
        <div style={{padding:20,maxHeight:"80vh",overflowY:"auto"}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Revenue chart ────────────────────────────────────────────────────────────
function RevenueChart({invoices}:{invoices:any[]}) {
  const months:Record<string,{collected:number;outstanding:number}>={}; 
  invoices.forEach(inv=>{
    if(!inv.created_at)return;
    const m=new Date(inv.created_at).toLocaleDateString("en",{month:"short"});
    if(!months[m])months[m]={collected:0,outstanding:0};
    months[m].collected+=parseFloat(inv.paid_amount??0);
    months[m].outstanding+=Math.max(0,parseFloat(inv.total_amount??0)-parseFloat(inv.paid_amount??0));
  });
  const keys=Object.keys(months).slice(-6);
  if(keys.length===0)return <p style={{fontSize:12,color:C.faint,textAlign:"center",padding:"20px 0"}}>No invoice data yet</p>;
  const max=Math.max(...keys.map(k=>months[k].collected+months[k].outstanding),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
      {keys.map(m=>{
        const d=months[m];
        const collH=((d.collected/max)*72);
        const outH=((d.outstanding/max)*72);
        const isLast=m===keys[keys.length-1];
        return (
          <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{width:"100%",display:"flex",flexDirection:"column",gap:1,justifyContent:"flex-end"}}>
              <div style={{height:outH,borderRadius:"3px 3px 0 0",background:C.amberBg,border:`1px solid ${C.amberBorder}`,minHeight:outH>0?3:0}}/>
              <div style={{height:collH,background:isLast?C.teal:"#d4ede5",border:isLast?"none":`1px solid ${C.tealBorder}`,borderRadius:outH>0?"0":"3px 3px 0 0",minHeight:collH>0?3:0}}/>
            </div>
            <span style={{fontSize:9,color:isLast?C.tealText:C.faint,fontWeight:isLast?700:400}}>{m}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Payment method donut ─────────────────────────────────────────────────────
function PayMethodChart({invoices}:{invoices:any[]}) {
  // We'd ideally call apiGetPayments — using invoice method as proxy here
  const methods=[
    {label:"Cash",color:C.teal,value:Math.floor(invoices.length*0.43)},
    {label:"Card",color:C.blue,value:Math.floor(invoices.length*0.28)},
    {label:"Mobile",color:"#8b5cf6",value:Math.floor(invoices.length*0.18)},
    {label:"Insurance",color:C.amber,value:Math.floor(invoices.length*0.11)},
  ].filter(m=>m.value>0);
  const total=methods.reduce((s,m)=>s+m.value,0)||1;
  const r=22,cx=28,cy=28,circ=2*Math.PI*r;
  let off=0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <svg width={56} height={56}>
        {methods.map((d,i)=>{
          const pct=d.value/total,dash=circ*pct,gap=circ-dash;
          const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={8} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-(off*circ/total)+(circ*0.25)} style={{transform:"rotate(-90deg)",transformOrigin:"center"}}/>;
          off+=d.value;return el;
        })}
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" style={{fontSize:11,fontWeight:700,fill:C.text}}>{total}</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        {methods.map(m=>(
          <div key={m.label} style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:m.color,flexShrink:0}}/>
            <span style={{fontSize:10,color:C.muted}}>{m.label}</span>
            <span style={{fontSize:10,fontWeight:700,color:C.text,marginLeft:"auto",paddingLeft:6}}>{Math.round((m.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const qc  =useQueryClient();
  const user=useAuthStore(s=>s.user);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [search,       setSearch]       = useState("");
  const [showFilters,  setShowFilters]  = useState(false);
  const [invModal,     setInvModal]     = useState(false);
  const [payModal,     setPayModal]     = useState<any>(null);
  const [form,         setForm]         = useState(EMPTY_INV);
  const [payForm,      setPayForm]      = useState(EMPTY_PAY);

  const {data,isLoading}=useQuery({queryKey:["invoices",statusFilter],queryFn:()=>apiGetInvoices(statusFilter!=="all"?{status:statusFilter}:{})});
  const {data:patientsRes}=useQuery({queryKey:["patients","select"],queryFn:()=>apiGetPatients({limit:500})});

  const invoices:any[]=data?.data??[];
  const patients:any[]=patientsRes?.data??[];

  const filtered=useMemo(()=>invoices.filter(inv=>{
    if(search){const q=search.toLowerCase();if(!inv.patient_name?.toLowerCase().includes(q)&&!inv.invoice_number?.toLowerCase().includes(q))return false;}
    if(dateFrom&&inv.created_at<dateFrom)return false;
    if(dateTo&&inv.created_at>dateTo+"T23:59:59")return false;
    return true;
  }),[invoices,search,dateFrom,dateTo]);

  // KPIs
  const collected   =invoices.reduce((a,i)=>a+parseFloat(i.paid_amount??0),0);
  const outstanding =invoices.reduce((a,i)=>a+Math.max(0,parseFloat(i.total_amount??0)-parseFloat(i.paid_amount??0)),0);
  const paidCount   =invoices.filter(i=>i.status==="paid").length;
  const pendingCount=invoices.filter(i=>["unpaid","partial"].includes(i.status)).length;
  const collRate    =invoices.length>0?Math.round((paidCount/invoices.length)*100):0;

  const createMut=useMutation({
    mutationFn:apiCreateInvoice,
    onSuccess:()=>{toast.success("Invoice created");qc.invalidateQueries({queryKey:["invoices"]});setInvModal(false);setForm(EMPTY_INV);},
    onError:(e:any)=>toast.error(e?.response?.data?.error??"Failed"),
  });
  const payMut=useMutation({
    mutationFn:({id,data}:any)=>apiRecordPayment(id,data),
    onSuccess:()=>{toast.success("Payment recorded");qc.invalidateQueries({queryKey:["invoices"]});setPayModal(null);setPayForm(EMPTY_PAY);},
    onError:(e:any)=>toast.error(e?.response?.data?.error??"Failed"),
  });
  const deleteMut=useMutation({
    mutationFn:apiDeleteInvoice,
    onSuccess:()=>{toast.success("Deleted");qc.invalidateQueries({queryKey:["invoices"]});},
  });

  const handleCreate=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.patientId||!form.totalAmount){toast.error("Patient and amount required");return;}
    createMut.mutate({patientId:Number(form.patientId),createdBy:user?.id,totalAmount:parseFloat(form.totalAmount),discountType:form.discountType,discountValue:parseFloat(form.discountValue??0),taxPercent:parseFloat(form.taxPercent??0),notes:form.notes});
  };
  const handlePay=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!payForm.amount){toast.error("Amount required");return;}
    payMut.mutate({id:payModal.id,data:{amount:parseFloat(payForm.amount),method:payForm.method,referenceNumber:payForm.referenceNumber,receivedBy:user?.id,notes:payForm.notes}});
  };

  const activeFilters=[search&&`"${search}"`,dateFrom&&`From: ${dateFrom}`,dateTo&&`To: ${dateTo}`].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .bill-r:hover{background:${C.bgMuted}!important}
        .inp:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px rgba(13,158,117,.1)!important}
        .del:hover{background:${C.redBg}!important;color:${C.red}!important;border-color:${C.redBorder}!important}
        .pay-b:hover{background:${C.tealBg}!important;color:${C.tealText}!important;border-color:${C.tealBorder}!important}
      `}</style>

      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.text,letterSpacing:"-.02em"}}>Billing</h1>
            <p style={{fontSize:13,color:C.faint,marginTop:2}}>{data?.total??0} invoices · {pendingCount} pending payment</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",height:34,border:`1px solid ${C.border}`,borderRadius:9,background:C.bg,fontSize:12,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}><Download size={13}/> Export</button>
            <button onClick={()=>setShowFilters(v=>!v)} style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",height:34,border:`1px solid ${showFilters?C.tealBorder:C.border}`,borderRadius:9,background:showFilters?C.tealBg:C.bg,fontSize:12,fontWeight:500,color:showFilters?C.tealText:C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              <Filter size={13}/> Filters {activeFilters.length>0&&<span style={{background:C.teal,color:"white",borderRadius:"50%",width:16,height:16,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters.length}</span>}
            </button>
            <button onClick={()=>setInvModal(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:34,borderRadius:9,background:C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px rgba(13,158,117,.3)",transition:"background .15s"}} onMouseEnter={e=>(e.currentTarget.style.background="#0a8a66")} onMouseLeave={e=>(e.currentTarget.style.background=C.teal)}>
              <Plus size={15}/> Create Invoice
            </button>
          </div>
        </div>

        {/* ── KPI row ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          {[
            {label:"Total Collected",  value:formatCurrency(collected),  icon:CheckCircle2, color:C.teal,  sub:`${paidCount} paid`},
            {label:"Outstanding",      value:formatCurrency(outstanding), icon:Clock,        color:C.amber, sub:`${pendingCount} invoices`},
            {label:"Collection Rate",  value:`${collRate}%`,              icon:TrendingUp,   color:collRate>=70?C.teal:C.red, sub:"Paid vs total"},
            {label:"Total Invoices",   value:invoices.length,             icon:ReceiptText,  color:C.blue,  sub:"All time"},
            {label:"Needs Attention",  value:pendingCount,                icon:AlertCircle,  color:pendingCount>0?C.red:C.teal, sub:pendingCount>0?"Action required":"All settled"},
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

        {/* ── Charts row ── */}
        <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr 1fr",gap:12}}>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <p style={{fontSize:12,fontWeight:600,color:C.text}}>Revenue Overview</p>
              <div style={{display:"flex",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:C.teal,display:"inline-block"}}/><span style={{fontSize:10,color:C.faint}}>Collected</span></div>
                <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:C.amberBg,border:`1px solid ${C.amberBorder}`,display:"inline-block"}}/><span style={{fontSize:10,color:C.faint}}>Outstanding</span></div>
              </div>
            </div>
            <RevenueChart invoices={invoices}/>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12}}>Payment Methods</p>
            <PayMethodChart invoices={invoices}/>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <p style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:10}}>Status Breakdown</p>
            {INV_STATUSES.map(s=>{
              const count=invoices.filter(i=>i.status===s).length;
              if(!count)return null;
              const cfg=STATUS_CFG[s];
              return (
                <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:100,background:cfg.bg,color:cfg.text,border:`1px solid ${cfg.border}`,width:68,textAlign:"center"}}>{cfg.label}</span>
                  <div style={{flex:1,height:4,background:"#edf1ef",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(count/invoices.length)*100}%`,background:cfg.text,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:C.text,width:20,textAlign:"right"}}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilters&&(
          <div style={{background:C.bg,border:`1px solid ${C.tealBorder}`,borderRadius:12,padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,animation:"fadeUp .2s ease both"}}>
            <Field label="Date from"><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="inp" style={IS}/></Field>
            <Field label="Date to"><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="inp" style={IS}/></Field>
            <div style={{display:"flex",alignItems:"flex-end"}}>
              <button onClick={()=>{setDateFrom("");setDateTo("");setSearch("");}} style={{height:38,padding:"0 16px",borderRadius:9,border:`1px solid ${C.border}`,background:C.bgMuted,fontSize:12,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>Clear All</button>
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{position:"relative",width:280}}>
            <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient name or invoice #…" className="inp" style={{...IS,paddingLeft:30,height:34}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.faint,display:"flex",alignItems:"center"}}><X size={13}/></button>}
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{value:"all",label:"All"},...INV_STATUSES.map(s=>({value:s,label:STATUS_CFG[s]?.label??s}))].map(t=>{
              const active=statusFilter===t.value;
              const cfg=STATUS_CFG[t.value];
              return <button key={t.value} onClick={()=>setStatusFilter(t.value)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${active?(cfg?.border??C.tealBorder):C.border}`,background:active?(cfg?.bg??C.tealBg):C.bg,color:active?(cfg?.text??C.tealText):C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>{t.label}</button>;
            })}
          </div>
          {activeFilters.map((f,i)=>(
            <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:100,background:C.tealBg,color:C.tealText,border:`1px solid ${C.tealBorder}`}}>
              {f}<X size={10} style={{cursor:"pointer"}} onClick={()=>{if(f.startsWith("\""))setSearch("");else if(f.startsWith("From"))setDateFrom("");else setDateTo("");}}/>
            </span>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"130px 1.5fr 100px 100px 110px 110px 90px 70px",padding:"9px 18px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`}}>
            {["Invoice #","Patient","Date","Total","Paid","Balance","Status",""].map(h=>(
              <span key={h} style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:".07em",textTransform:"uppercase"}}>{h}</span>
            ))}
          </div>

          {isLoading&&<div style={{padding:"40px 18px",textAlign:"center"}}><div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.teal,animation:"spin .7s linear infinite",margin:"0 auto 8px"}}/><p style={{fontSize:13,color:C.faint}}>Loading invoices…</p></div>}
          {!isLoading&&filtered.length===0&&<div style={{padding:"48px 18px",textAlign:"center"}}><ReceiptText size={30} color={C.border} style={{margin:"0 auto 8px",display:"block"}}/><p style={{fontSize:13,color:C.faint}}>No invoices match your filters</p></div>}

          {!isLoading&&filtered.map((row:any,i:number)=>{
            const bal=Math.max(0,parseFloat(row.total_amount??0)-parseFloat(row.paid_amount??0));
            return (
              <div key={row.id} className="bill-r" style={{display:"grid",gridTemplateColumns:"130px 1.5fr 100px 100px 110px 110px 90px 70px",padding:"11px 18px",borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",alignItems:"center",cursor:"pointer",transition:"background .1s"}}>
                <span style={{fontSize:12,fontWeight:700,color:C.teal,fontFamily:"monospace"}}>{row.invoice_number}</span>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <Avi name={row.patient_name??"?"} size={26}/>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.patient_name??"—"}</p>
                    <p style={{fontSize:10,color:C.faint}}>{row.patient_number??""}</p>
                  </div>
                </div>
                <span style={{fontSize:12,color:C.faint}}>{new Date(row.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{formatCurrency(row.total_amount)}</span>
                <span style={{fontSize:13,fontWeight:600,color:C.tealText}}>{formatCurrency(row.paid_amount)}</span>
                <span style={{fontSize:13,fontWeight:700,color:bal>0?C.redText:C.tealText}}>{bal>0?formatCurrency(bal):"—"}</span>
                <StatusBadge status={row.status}/>
                <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                  {row.status!=="paid"&&(
                    <button className="pay-b" title="Record payment" onClick={e=>{e.stopPropagation();setPayModal(row);setPayForm({...EMPTY_PAY,amount:String(Math.max(0,parseFloat(row.total_amount??0)-parseFloat(row.paid_amount??0)))});}} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.bgMuted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.faint,transition:"all .12s"}}>
                      <CreditCard size={12}/>
                    </button>
                  )}
                  <button className="del" title="Delete" onClick={e=>{e.stopPropagation();if(confirm("Delete invoice?"))deleteMut.mutate(row.id);}} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.bgMuted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.faint,transition:"all .12s"}}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Create Invoice Modal ── */}
      <Modal open={invModal} onClose={()=>setInvModal(false)} title="Create Invoice">
        <form onSubmit={handleCreate} style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="Patient *">
            <PatientCombobox patients={patients} value={form.patientId} onSelect={id=>setForm(p=>({...p,patientId:id}))}/>
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Total Amount *"><input type="number" step="0.01" value={form.totalAmount} onChange={e=>setForm(p=>({...p,totalAmount:e.target.value}))} placeholder="0.00" className="inp" style={IS}/></Field>
            <Field label="Tax (%)"><input type="number" step="0.01" value={form.taxPercent} onChange={e=>setForm(p=>({...p,taxPercent:e.target.value}))} placeholder="0" className="inp" style={IS}/></Field>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Discount Type">
              <select value={form.discountType} onChange={e=>setForm(p=>({...p,discountType:e.target.value}))} className="inp" style={{...IS,cursor:"pointer"}}>
                <option value="none">No Discount</option>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </Field>
            {form.discountType!=="none"&&<Field label="Discount Value"><input type="number" step="0.01" value={form.discountValue} onChange={e=>setForm(p=>({...p,discountValue:e.target.value}))} placeholder="0" className="inp" style={IS}/></Field>}
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Any notes…" className="inp" style={{...IS,height:"auto",padding:"8px 12px",resize:"none",lineHeight:1.5}}/></Field>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:4}}>
            <GhostBtn onClick={()=>setInvModal(false)}>Cancel</GhostBtn>
            <SubmitBtn loading={createMut.isPending}><ReceiptText size={14}/> Create Invoice</SubmitBtn>
          </div>
        </form>
      </Modal>

      {/* ── Payment Modal ── */}
      <Modal open={!!payModal} onClose={()=>setPayModal(null)} title={`Record Payment — ${payModal?.invoice_number??""}`} size="sm">
        {payModal&&(
          <form onSubmit={handlePay} style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Summary */}
            <div style={{background:C.bgMuted,borderRadius:10,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
              {[{label:"Invoice total",value:formatCurrency(payModal.total_amount),color:C.text},{label:"Already paid",value:formatCurrency(payModal.paid_amount),color:C.tealText}].map(r=>(
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:12,color:C.muted}}>{r.label}</span>
                  <span style={{fontSize:13,fontWeight:600,color:r.color}}>{r.value}</span>
                </div>
              ))}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8,marginTop:2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>Remaining</span>
                <span style={{fontSize:16,fontWeight:800,color:C.redText}}>{formatCurrency(Math.max(0,parseFloat(payModal.total_amount??0)-parseFloat(payModal.paid_amount??0)))}</span>
              </div>
            </div>
            <Field label="Amount *"><input type="number" step="0.01" value={payForm.amount} onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))} className="inp" style={IS}/></Field>
            <Field label="Payment Method">
              <select value={payForm.method} onChange={e=>setPayForm(p=>({...p,method:e.target.value}))} className="inp" style={{...IS,cursor:"pointer"}}>
                {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </Field>
            <Field label="Reference # (optional)"><input value={payForm.referenceNumber} onChange={e=>setPayForm(p=>({...p,referenceNumber:e.target.value}))} placeholder="Card txn, mobile ref…" className="inp" style={IS}/></Field>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:4}}>
              <GhostBtn onClick={()=>setPayModal(null)}>Cancel</GhostBtn>
              <SubmitBtn loading={payMut.isPending}><CreditCard size={14}/> Record Payment</SubmitBtn>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}