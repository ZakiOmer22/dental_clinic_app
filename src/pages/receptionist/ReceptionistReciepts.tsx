// ReceptionistReceipts.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, ReceiptText, Search,
  CheckCircle2, Clock,
  AlertCircle, Wallet, Download, Filter, X,
  DollarSign, Printer,
} from "lucide-react";
import {
  apiGetInvoices,
  apiGetPayments,
} from "@/api/invoices";
import { apiGetPatients } from "@/api/patients";
import { formatCurrency } from "@/utils";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  border:"#e5eae8",bg:"#ffffff",bgMuted:"#f7f9f8",
  text:"#111816",muted:"#7a918b",faint:"#a0b4ae",
  teal:"#0d9e75",tealBg:"#e8f7f2",tealText:"#0a7d5d",tealBorder:"#c3e8dc",
  amber:"#f59e0b",amberBg:"#fffbeb",amberText:"#92400e",amberBorder:"#fde68a",
  red:"#e53e3e",redBg:"#fff5f5",redText:"#c53030",redBorder:"#fed7d7",
  blue:"#3b82f6",blueBg:"#eff6ff",blueText:"#1d4ed8",blueBorder:"#bfdbfe",
  gray:"#6b7f75",grayBg:"#f4f7f5",
  purple:"#8b5cf6",purpleBg:"#f5f3ff",purpleText:"#5b21b6",purpleBorder:"#e9d5ff",
  green:"#10b981",greenBg:"#f0fdf4",greenText:"#059669",greenBorder:"#d1fae5",
};

// ─── Primitives ───────────────────────────────────────────────────────────────
function Avi({name,size=28}:{name:string;size?:number}) {
  const i=(name??"?").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#0d9e75,#0a7d5d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.37,fontWeight:700,color:"white",flexShrink:0}}>{i}</div>;
}

function StatusBadge({status}:{status:string}) {
  const cfg:Record<string,{bg:string;text:string;border:string;label:string}> = {
    draft: {bg:C.grayBg, text:C.gray, border:C.border, label:"Draft"},
    unpaid: {bg:C.redBg, text:C.redText, border:C.redBorder, label:"Unpaid"},
    partial: {bg:C.amberBg, text:C.amberText, border:C.amberBorder, label:"Partial"},
    paid: {bg:C.greenBg, text:C.greenText, border:C.greenBorder, label:"Paid"},
    void: {bg:C.grayBg, text:C.gray, border:C.border, label:"Void"},
    refunded: {bg:C.blueBg, text:C.blueText, border:C.blueBorder, label:"Refunded"},
  };
  const s=cfg[status]??cfg.draft;
  return <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:100,background:s.bg,color:s.text,border:`1px solid ${s.border}`,whiteSpace:"nowrap"}}>{s.label}</span>;
}

const IS:React.CSSProperties={width:"100%",height:38,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:9,background:C.bg,fontSize:13,color:C.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <div><label style={{display:"block",fontSize:12,fontWeight:600,color:C.muted,marginBottom:5}}>{label}</label>{children}</div>;
}

function GhostBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} style={{padding:"9px 16px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:13,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}) {
  if(!open)return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:16,width:"100%",maxWidth:800,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"modalIn .2s cubic-bezier(.22,1,.36,1)",maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.text}}>{title}</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:C.bgMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><X size={14}/></button>
        </div>
        <div style={{padding:20,overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Receipt Card ────────────────────────────────────────────────────────────
function ReceiptCard({ invoice, patient, onPrint }: {
  invoice: any;
  patient: any;
  onPrint: () => void;
}) {
  const balance = invoice.total_amount - invoice.paid_amount;
  const isFullyPaid = balance <= 0;
  
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        transition: "all 0.2s",
        position: "relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Receipt #{invoice.invoice_number}</p>
          <p style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{new Date(invoice.updated_at || invoice.created_at).toLocaleString()}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Avi name={patient?.full_name || "Unknown"} size={36} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{patient?.full_name || "Unknown Patient"}</p>
          <p style={{ fontSize: 11, color: C.faint }}>{patient?.phone || "No phone"} · {patient?.patient_number || "No ID"}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: C.muted }}>Invoice Total</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{formatCurrency(invoice.total_amount)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: C.muted }}>Amount Paid</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.teal }}>{formatCurrency(invoice.paid_amount)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: C.muted }}>{isFullyPaid ? "Status" : "Balance"}</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: isFullyPaid ? C.green : C.amber }}>
            {isFullyPaid ? "Fully Paid" : formatCurrency(balance)}
          </p>
        </div>
      </div>

      <button
        onClick={onPrint}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: C.bg,
          cursor: "pointer",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.tealBg; e.currentTarget.style.borderColor = C.tealBorder; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border; }}
      >
        <Printer size={14} /> Print Receipt
      </button>
    </div>
  );
}

// ─── Receipt Print Modal ──────────────────────────────────────────────────────
function ReceiptPrintModal({ open, onClose, invoice, patient }: {
  open: boolean;
  onClose: () => void;
  invoice: any;
  patient: any;
}) {
  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const balance = invoice.total_amount - invoice.paid_amount;

  return (
    <Modal open={open} onClose={onClose} title="Receipt Preview">
      <div id="receipt-content" style={{ padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Smile Dental Clinic</h2>
          <p style={{ fontSize: 12, color: C.muted }}>123 Main Street, Hargeisa, Somaliland</p>
          <p style={{ fontSize: 12, color: C.muted }}>Tel: +252 123 456 789 | Email: info@smiledental.so</p>
          <div style={{ marginTop: 12, borderTop: `1px dashed ${C.border}`, paddingTop: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>PAYMENT RECEIPT</h3>
            <p style={{ fontSize: 11 }}>Receipt No: {invoice.invoice_number}</p>
            <p style={{ fontSize: 11 }}>Date: {new Date(invoice.updated_at || invoice.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600 }}>Patient Information:</p>
          <p style={{ fontSize: 12 }}>Name: {patient?.full_name}</p>
          <p style={{ fontSize: 12 }}>Patient ID: {patient?.patient_number}</p>
          <p style={{ fontSize: 12 }}>Phone: {patient?.phone}</p>
          <p style={{ fontSize: 12 }}>Email: {patient?.email || "N/A"}</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600 }}>Invoice Information:</p>
          <p style={{ fontSize: 12 }}>Invoice #: {invoice.invoice_number}</p>
          <p style={{ fontSize: 12 }}>Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
          <p style={{ fontSize: 12 }}>Total Amount: {formatCurrency(invoice.total_amount)}</p>
        </div>

        {invoice?.items && invoice.items.length > 0 && (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: "left", padding: "8px 4px", fontSize: 11 }}>Description</th>
                  <th style={{ textAlign: "center", padding: "8px 4px", fontSize: 11 }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11 }}>Unit Price</th>
                  <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11 }}>Total</th>
                 </tr>
              </thead>
              <tbody>
                {invoice?.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: "6px 4px", fontSize: 11 }}>{item.description}</td>
                    <td style={{ textAlign: "center", padding: "6px 4px", fontSize: 11 }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "6px 4px", fontSize: 11 }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: "right", padding: "6px 4px", fontSize: 11 }}>{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20 }}>
            <span style={{ fontSize: 11 }}>Subtotal:</span>
            <span style={{ fontSize: 11 }}>{formatCurrency(invoice?.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20 }}>
            <span style={{ fontSize: 11 }}>Tax ({invoice?.tax_percent || 5}%):</span>
            <span style={{ fontSize: 11 }}>{formatCurrency(invoice?.tax_amount)}</span>
          </div>
          {invoice?.discount_amount > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 20 }}>
              <span style={{ fontSize: 11 }}>Discount:</span>
              <span style={{ fontSize: 11, color: C.red }}>-{formatCurrency(invoice?.discount_amount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Total Paid:</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>{formatCurrency(invoice.paid_amount)}</span>
          </div>
          {balance > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: C.amber }}>Remaining Balance:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.amber }}>{formatCurrency(balance)}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${C.border}` }}>
          <p style={{ fontSize: 10, color: C.muted }}>Thank you for choosing Smile Dental Clinic</p>
          <p style={{ fontSize: 9, color: C.faint }}>This is a computer-generated receipt. No signature required.</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
        <GhostBtn onClick={onClose}>Close</GhostBtn>
        <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, background: C.teal, border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Printer size={14} /> Print Receipt
        </button>
      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReceptionistReceiptsPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Fetch ALL invoices (both paid and partial)
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => apiGetInvoices({}),
  });

  const { data: patientsRes } = useQuery({
    queryKey: ["patients", "select"],
    queryFn: () => apiGetPatients({ limit: 500 }),
  });

  const invoices: any[] = invoicesData?.data ?? [];
  const patients: any[] = patientsRes?.data ?? [];

  // Filter invoices that have any payment (paid_amount > 0)
  const receipts = useMemo(() => {
    return invoices
      .filter(inv => inv.paid_amount > 0) // Only invoices with payments
      .map(inv => ({
        ...inv,
        patient: patients.find(p => p.id === inv.patient_id),
      }))
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  }, [invoices, patients]);

  // Apply filters
  const filtered = useMemo(() => {
    return receipts.filter(r => {
      if (search) {
        const query = search.toLowerCase();
        return r.invoice_number?.toLowerCase().includes(query) ||
               r.patient?.full_name?.toLowerCase().includes(query) ||
               r.patient?.phone?.includes(query);
      }
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFrom && (r.updated_at || r.created_at) < dateFrom) return false;
      if (dateTo && (r.updated_at || r.created_at) > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [receipts, search, dateFrom, dateTo, statusFilter]);

  // Statistics
  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.paid_amount), 0);
  const fullyPaid = receipts.filter(r => r.status === "paid").length;
  const partialPaid = receipts.filter(r => r.status === "partial").length;

  const handlePrintReceipt = (receipt: any) => {
    setSelectedInvoice(receipt);
    setSelectedPatient(receipt.patient);
    setReceiptModalOpen(true);
  };

  const activeFilters = [
    search && `"${search}"`,
    dateFrom && `From: ${dateFrom}`,
    dateTo && `To: ${dateTo}`,
    statusFilter !== "all" && `Status: ${statusFilter}`,
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .4s ease both"}}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.text,letterSpacing:"-.02em",display:"flex",alignItems:"center",gap:8}}>
              <ReceiptText size={24} color={C.teal}/> Payment Receipts
            </h1>
            <p style={{fontSize:13,color:C.faint,marginTop:2}}>
              {totalReceipts} receipts · Total collected: {formatCurrency(totalAmount)}
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowFilters(v=>!v)} style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",height:34,border:`1px solid ${showFilters?C.tealBorder:C.border}`,borderRadius:9,background:showFilters?C.tealBg:C.bg,fontSize:12,fontWeight:500,color:showFilters?C.tealText:C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              <Filter size={13}/> Filters {activeFilters.length>0&&<span style={{background:C.teal,color:"white",borderRadius:"50%",width:16,height:16,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters.length}</span>}
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
              <span style={{fontSize:11,color:C.muted,fontWeight:500}}>Total Receipts</span>
              <div style={{width:28,height:28,borderRadius:7,background:C.teal+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><ReceiptText size={13} color={C.teal}/></div>
            </div>
            <p style={{fontSize:22,fontWeight:700,color:C.text}}>{totalReceipts}</p>
            <p style={{fontSize:11,color:C.faint,marginTop:4}}>{fullyPaid} paid, {partialPaid} partial</p>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
              <span style={{fontSize:11,color:C.muted,fontWeight:500}}>Total Collected</span>
              <div style={{width:28,height:28,borderRadius:7,background:C.green+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><DollarSign size={13} color={C.green}/></div>
            </div>
            <p style={{fontSize:22,fontWeight:700,color:C.text}}>{formatCurrency(totalAmount)}</p>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
              <span style={{fontSize:11,color:C.muted,fontWeight:500}}>Fully Paid</span>
              <div style={{width:28,height:28,borderRadius:7,background:C.green+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle2 size={13} color={C.green}/></div>
            </div>
            <p style={{fontSize:22,fontWeight:700,color:C.text}}>{fullyPaid}</p>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
              <span style={{fontSize:11,color:C.muted,fontWeight:500}}>Partial Payments</span>
              <div style={{width:28,height:28,borderRadius:7,background:C.amber+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><AlertCircle size={13} color={C.amber}/></div>
            </div>
            <p style={{fontSize:22,fontWeight:700,color:C.text}}>{partialPaid}</p>
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilters&&(
          <div style={{background:C.bg,border:`1px solid ${C.tealBorder}`,borderRadius:12,padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,animation:"fadeUp .2s ease both"}}>
            <Field label="Date from"><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="inp" style={IS}/></Field>
            <Field label="Date to"><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="inp" style={IS}/></Field>
            <Field label="Status">
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="inp" style={{...IS,cursor:"pointer"}}>
                <option value="all">All</option>
                <option value="paid">Fully Paid</option>
                <option value="partial">Partial</option>
              </select>
            </Field>
            <div style={{gridColumn:"span 3",display:"flex",justifyContent:"flex-end"}}>
              <button onClick={()=>{setDateFrom("");setDateTo("");setStatusFilter("all");setSearch("");}} style={{height:38,padding:"0 16px",borderRadius:9,border:`1px solid ${C.border}`,background:C.bgMuted,fontSize:12,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{position:"relative",width:320}}>
            <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.faint}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by receipt #, patient name, or phone…" className="inp" style={{...IS,paddingLeft:30,height:34}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.faint,display:"flex",alignItems:"center"}}><X size={13}/></button>}
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            <button onClick={()=>setStatusFilter("all")} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${statusFilter==="all"?C.tealBorder:C.border}`,background:statusFilter==="all"?C.tealBg:C.bg,color:statusFilter==="all"?C.tealText:C.muted,cursor:"pointer"}}>All ({totalReceipts})</button>
            <button onClick={()=>setStatusFilter("paid")} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${statusFilter==="paid"?C.tealBorder:C.border}`,background:statusFilter==="paid"?C.tealBg:C.bg,color:statusFilter==="paid"?C.tealText:C.muted,cursor:"pointer"}}>Fully Paid ({fullyPaid})</button>
            <button onClick={()=>setStatusFilter("partial")} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${statusFilter==="partial"?C.tealBorder:C.border}`,background:statusFilter==="partial"?C.tealBg:C.bg,color:statusFilter==="partial"?C.tealText:C.muted,cursor:"pointer"}}>Partial ({partialPaid})</button>
          </div>
          {activeFilters.map((f,i)=>(
            <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:100,background:C.tealBg,color:C.tealText,border:`1px solid ${C.tealBorder}`}}>
              {f}<X size={10} style={{cursor:"pointer"}} onClick={()=>{if(f.startsWith("\""))setSearch("");else if(f.startsWith("From"))setDateFrom("");else if(f.startsWith("To"))setDateTo("");else if(f.startsWith("Status"))setStatusFilter("all");}}/>
            </span>
          ))}
        </div>

        {/* ── Receipts Grid ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:12}}>
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16,height:200,animation:"fadeUp .4s ease both"}}/>
          ))}
          
          {!isLoading && filtered.length === 0 && (
            <div style={{gridColumn:"1/-1",background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"60px 20px",textAlign:"center"}}>
              <ReceiptText size={48} color={C.border} style={{margin:"0 auto 16px",display:"block"}}/>
              <h3 style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:8}}>No receipts found</h3>
              <p style={{fontSize:13,color:C.faint}}>{search ? "Try a different search term" : "No payments have been recorded yet"}</p>
            </div>
          )}

          {!isLoading && filtered.map(receipt => (
            <ReceiptCard
              key={receipt.id}
              invoice={receipt}
              patient={receipt.patient}
              onPrint={() => handlePrintReceipt(receipt)}
            />
          ))}
        </div>
      </div>

      {/* Receipt Print Modal */}
      <ReceiptPrintModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        invoice={selectedInvoice}
        patient={selectedPatient}
      />
    </>
  );
}