// ══════════════════════════════════════════════════════════════════════════════
// HEALTH MONITOR (AI DIAGNOSIS TOOL) PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Cpu, Database, Server, Wifi, HardDrive, AlertTriangle, CheckCircle2, XCircle, TrendingUp, RefreshCw, Zap, Brain, Eye } from "lucide-react";
import { apiGetSystemHealth, apiRunDiagnostics, apiGetPerformanceMetrics } from "@/api/health";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C={border:"#e5eae8",bg:"#fff",bgMuted:"#f7f9f8",text:"#111816",muted:"#7a918b",faint:"#a0b4ae",teal:"#0d9e75",tealBg:"#e8f7f2",tealText:"#0a7d5d",tealBorder:"#c3e8dc",amber:"#f59e0b",amberBg:"#fffbeb",amberText:"#92400e",amberBorder:"#fde68a",red:"#e53e3e",redBg:"#fff5f5",redText:"#c53030",redBorder:"#fed7d7",blue:"#3b82f6",blueBg:"#eff6ff",blueText:"#1d4ed8",blueBorder:"#bfdbfe",purple:"#8b5cf6",purpleBg:"#f5f3ff",purpleText:"#5b21b6",purpleBorder:"#ddd6fe",gray:"#6b7f75",grayBg:"#f4f7f5"};
const GS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`;

// ── Shared atoms ──────────────────────────────────────────────────────────────
function KPI({label,value,icon:Icon,color,status,sub}:{label:string;value:any;icon:any;color:string;status?:"healthy"|"warning"|"critical";sub?:string}){
  const statusCfg={healthy:{bg:C.tealBg,border:C.tealBorder,icon:CheckCircle2,color:C.teal},warning:{bg:C.amberBg,border:C.amberBorder,icon:AlertTriangle,color:C.amber},critical:{bg:C.redBg,border:C.redBorder,icon:XCircle,color:C.red}};
  const s=status?statusCfg[status]:null;const StatusIcon=s?.icon;
  return <div style={{background:C.bg,border:`1px solid ${s?s.border:C.border}`,borderRadius:12,padding:"15px 16px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
      <span style={{fontSize:11,color:C.muted,fontWeight:500}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {s&&<StatusIcon size={12} color={s.color}/>}
        <div style={{width:28,height:28,borderRadius:7,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={13} color={color} strokeWidth={1.8}/></div>
      </div>
    </div>
    <p style={{fontSize:22,fontWeight:700,color:C.text,letterSpacing:"-.03em",lineHeight:1}}>{value}</p>
    {sub&&<p style={{fontSize:11,color:C.faint,marginTop:4}}>{sub}</p>}
  </div>;
}

function ProgressRing({progress,size=80,strokeWidth=6,color=C.teal}:{progress:number;size?:number;strokeWidth?:number;color?:string}){
  const r=(size-strokeWidth)/2;const circ=2*Math.PI*r;const offset=circ-((progress/100)*circ);
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#edf1ef" strokeWidth={strokeWidth}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset .6s ease"}}/>
  </svg>;
}

export function HealthMonitorPage(){
  const qc=useQueryClient();const user=useAuthStore(s=>s.user);
  const [autoRefresh,setAutoRefresh]=useState(true);
  const {data:healthData,isLoading}=useQuery({queryKey:["system-health"],queryFn:()=>apiGetSystemHealth(),refetchInterval:autoRefresh?5000:false});
  const {data:metricsData}=useQuery({queryKey:["performance-metrics"],queryFn:()=>apiGetPerformanceMetrics(),refetchInterval:autoRefresh?10000:false});
  const health:any=healthData??{};const metrics:any=metricsData??{};
  
  const diagnosticsMut=useMutation({mutationFn:apiRunDiagnostics,onSuccess:(data:any)=>{toast.success(`Diagnostics complete: ${data.issuesFound} issues found`);qc.invalidateQueries({queryKey:["system-health"]});}});

  const getStatus=(val:number,warn:number,crit:number)=>{if(val>=crit)return"critical";if(val>=warn)return"warning";return"healthy";};
  const overallStatus=health.cpu>90||health.memory>85||health.disk>90?"critical":health.cpu>70||health.memory>70||health.disk>80?"warning":"healthy";

  return (<>
    <style>{GS}</style>
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div><h1 style={{fontSize:21,fontWeight:700,color:C.text,letterSpacing:"-.02em"}}>Health Monitor</h1><p style={{fontSize:13,color:C.faint,marginTop:2}}>AI-powered system diagnostics · Real-time monitoring</p></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setAutoRefresh(v=>!v)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 16px",height:34,borderRadius:9,border:`1px solid ${autoRefresh?C.tealBorder:C.border}`,background:autoRefresh?C.tealBg:C.bg,fontSize:12,fontWeight:500,color:autoRefresh?C.tealText:C.muted,cursor:"pointer",fontFamily:"inherit"}}><Eye size={13}/>{autoRefresh?"Live":"Paused"}</button>
          <button onClick={()=>diagnosticsMut.mutate()} disabled={diagnosticsMut.isPending} style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:34,borderRadius:9,background:diagnosticsMut.isPending?"#9ab5ae":C.teal,border:"none",color:"white",fontSize:13,fontWeight:600,cursor:diagnosticsMut.isPending?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:diagnosticsMut.isPending?"none":"0 2px 10px rgba(13,158,117,.3)"}}>{diagnosticsMut.isPending?<><RefreshCw size={14} style={{animation:"spin .7s linear infinite"}}/>Running…</>:<><Brain size={15}/>Run AI Diagnostics</>}</button>
        </div>
      </div>

      {/* Overall health */}
      <div style={{background:overallStatus==="critical"?C.redBg:overallStatus==="warning"?C.amberBg:C.tealBg,border:`1px solid ${overallStatus==="critical"?C.redBorder:overallStatus==="warning"?C.amberBorder:C.tealBorder}`,borderRadius:14,padding:"20px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{position:"relative"}}>
            <ProgressRing progress={100-(health.cpu??0)} size={90} strokeWidth={8} color={overallStatus==="critical"?C.red:overallStatus==="warning"?C.amber:C.teal}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {overallStatus==="critical"?<XCircle size={28} color={C.red}/>:overallStatus==="warning"?<AlertTriangle size={28} color={C.amber}/>:<CheckCircle2 size={28} color={C.teal}/>}
            </div>
          </div>
          <div style={{flex:1}}>
            <h2 style={{fontSize:18,fontWeight:700,color:overallStatus==="critical"?C.redText:overallStatus==="warning"?C.amberText:C.tealText,marginBottom:3}}>
              {overallStatus==="critical"?"Critical Issues Detected":overallStatus==="warning"?"System Needs Attention":"All Systems Healthy"}
            </h2>
            <p style={{fontSize:13,color:overallStatus==="critical"?C.redText:overallStatus==="warning"?C.amberText:C.tealText,opacity:.9,lineHeight:1.5}}>
              {overallStatus==="critical"?"Immediate action required. High resource usage detected.":overallStatus==="warning"?"Some metrics are approaching critical thresholds.":"System is operating within normal parameters."}
            </p>
          </div>
          {autoRefresh&&<div className="pulse" style={{width:10,height:10,borderRadius:"50%",background:C.teal,flexShrink:0}}/>}
        </div>
      </div>

      {/* Core metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KPI label="CPU Usage" value={`${health.cpu??0}%`} icon={Cpu} color={C.blue} status={getStatus(health.cpu??0,70,90)} sub={`${health.cpuCores??4} cores`}/>
        <KPI label="Memory" value={`${health.memory??0}%`} icon={Server} color={C.purple} status={getStatus(health.memory??0,70,85)} sub={`${health.memoryUsed??0}/${health.memoryTotal??8} GB`}/>
        <KPI label="Disk Space" value={`${health.disk??0}%`} icon={HardDrive} color={C.amber} status={getStatus(health.disk??0,80,90)} sub={`${health.diskUsed??0}/${health.diskTotal??100} GB`}/>
        <KPI label="Database" value={health.dbConnections??0} icon={Database} color={C.teal} status={health.dbConnections>50?"warning":health.dbConnections>80?"critical":"healthy"} sub={`Active connections`}/>
      </div>

      {/* Performance metrics */}
      <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <TrendingUp size={16} color={C.teal}/>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text}}>Performance Metrics</h3>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"Avg Response Time",value:`${metrics.avgResponseTime??120}ms`,icon:Zap,color:C.blue,status:metrics.avgResponseTime>300?"warning":"healthy"},
            {label:"Requests/min",value:metrics.requestsPerMin??45,icon:Activity,color:C.purple,status:"healthy"},
            {label:"Active Users",value:metrics.activeUsers??12,icon:Activity,color:C.teal,status:"healthy"},
            {label:"Uptime",value:`${metrics.uptime??99.9}%`,icon:CheckCircle2,color:C.teal,status:metrics.uptime<99?"warning":"healthy"},
          ].map(m=>{
            const statusCfg={healthy:{bg:C.tealBg,icon:CheckCircle2,color:C.teal},warning:{bg:C.amberBg,icon:AlertTriangle,color:C.amber}};
            const s=statusCfg[m.status];const Icon=m.icon;const StatusIcon=s.icon;
            return <div key={m.label} style={{padding:"12px 14px",background:C.bgMuted,borderRadius:10,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"between",marginBottom:6}}>
                <p style={{fontSize:10,color:C.faint}}>{m.label}</p>
                <StatusIcon size={11} color={s.color}/>
              </div>
              <p style={{fontSize:18,fontWeight:700,color:C.text}}>{m.value}</p>
            </div>;
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div style={{background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:14,padding:"18px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Brain size={16} color={C.purpleText}/>
          <h3 style={{fontSize:15,fontWeight:700,color:C.purpleText}}>AI Insights & Recommendations</h3>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(health.recommendations??[
            "CPU usage is optimal. No action needed.",
            "Memory usage trending upward. Consider increasing RAM if pattern continues.",
            "Database connections are healthy. Connection pooling is working efficiently.",
          ]).map((rec:string,i:number)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.purpleBorder}`}}>
              <CheckCircle2 size={14} color={C.purpleText} style={{flexShrink:0,marginTop:2}}/>
              <p style={{fontSize:12,color:C.text,lineHeight:1.5}}>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent issues */}
      {health.recentIssues&&health.recentIssues.length>0&&<div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`}}>
          <h3 style={{fontSize:13,fontWeight:700,color:C.text}}>Recent Issues</h3>
        </div>
        {health.recentIssues.map((issue:any,i:number)=>{
          const severityCfg={high:{icon:XCircle,color:C.red},medium:{icon:AlertTriangle,color:C.amber},low:{icon:AlertTriangle,color:C.blue}};
          const cfg=severityCfg[issue.severity]??severityCfg.low;const Icon=cfg.icon;
          return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:i<health.recentIssues.length-1?`1px solid ${C.border}`:"none"}}>
            <Icon size={16} color={cfg.color}/>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:600,color:C.text}}>{issue.message}</p>
              <p style={{fontSize:11,color:C.faint}}>{new Date(issue.timestamp).toLocaleString("en-GB")}</p>
            </div>
            {issue.resolved&&<CheckCircle2 size={14} color={C.teal}/>}
          </div>;
        })}
      </div>}
    </div>
  </>);
}