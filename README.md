![Portal Preview](preview.png)

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dental Clinic Portal — Modern Dental Clinic Management</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --teal:#0d9e75;--teal2:#0a7d5d;--teal-light:#e6f7f1;--teal-mid:#5dc9a8;
  --ink:#0f1a14;--ink2:#2d3d35;--muted:#6b7f75;--faint:#a8b8b0;
  --bg:#f5f7f5;--white:#ffffff;--warm:#faf9f6;
  --serif:'Lora',Georgia,serif;--sans:'Bricolage Grotesque',system-ui,sans-serif;
  --r:14px;--r2:22px;
}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);line-height:1.6;overflow-x:hidden}
.hero{min-height:100vh;background:var(--ink);position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px 60px;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,#0d9e7520 0%,transparent 70%),radial-gradient(ellipse 40% 40% at 80% 80%,#0d9e7510 0%,transparent 60%)}
.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(13,158,117,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(13,158,117,.07) 1px,transparent 1px);background-size:48px 48px}
.hero-pill{position:relative;display:inline-flex;align-items:center;gap:8px;background:rgba(13,158,117,.15);border:1px solid rgba(13,158,117,.3);color:var(--teal-mid);font-size:12px;font-weight:500;letter-spacing:.08em;padding:6px 16px;border-radius:100px;margin-bottom:32px}
.hero-pill-dot{width:6px;height:6px;border-radius:50%;background:var(--teal-mid);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.hero h1{position:relative;font-family:var(--serif);font-size:clamp(42px,7vw,84px);font-weight:400;color:#fff;text-align:center;line-height:1.08;max-width:820px;margin-bottom:24px}
.hero h1 em{font-style:italic;color:var(--teal-mid)}
.hero-sub{position:relative;font-size:clamp(15px,2vw,18px);color:rgba(255,255,255,.6);text-align:center;max-width:540px;margin-bottom:48px;font-weight:300;line-height:1.7}
.hero-cta{position:relative;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:72px}
.btn-primary{background:var(--teal);color:#fff;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:500;text-decoration:none;transition:background .2s}
.btn-primary:hover{background:var(--teal2)}
.btn-ghost{background:rgba(255,255,255,.08);color:#fff;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:400;text-decoration:none;border:1px solid rgba(255,255,255,.15);transition:background .2s}
.btn-ghost:hover{background:rgba(255,255,255,.14)}
.hero-mockup{position:relative;width:100%;max-width:900px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:var(--r2);overflow:hidden}
.mockup-bar{background:rgba(255,255,255,.06);padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.08)}
.dot{width:10px;height:10px;border-radius:50%}
.dot.r{background:#ff5f57}.dot.y{background:#febc2e}.dot.g{background:#28c840}
.stats{background:var(--teal);padding:32px 24px}
.stats-inner{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.stat{text-align:center}
.stat-num{font-family:var(--serif);font-size:36px;font-weight:400;color:#fff;font-style:italic}
.stat-label{font-size:13px;color:rgba(255,255,255,.75);margin-top:4px;font-weight:300}
.section{padding:96px 24px;max-width:1100px;margin:0 auto}
.section-tag{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);margin-bottom:16px}
.section-title{font-family:var(--serif);font-size:clamp(32px,4vw,52px);font-weight:400;line-height:1.1;color:var(--ink);margin-bottom:16px}
.section-title em{font-style:italic;color:var(--teal)}
.section-body{font-size:17px;color:var(--muted);max-width:560px;line-height:1.75;font-weight:300}
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:56px}
.feat-card{background:var(--white);border:1px solid #e4ede9;border-radius:var(--r2);padding:28px;transition:box-shadow .2s,transform .2s}
.feat-card:hover{box-shadow:0 12px 40px rgba(13,158,117,.1);transform:translateY(-3px)}
.feat-icon{width:44px;height:44px;border-radius:12px;background:var(--teal-light);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.feat-title{font-size:16px;font-weight:600;color:var(--ink);margin-bottom:8px}
.feat-body{font-size:14px;color:var(--muted);line-height:1.65;font-weight:300}
.split{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;padding:80px 24px}
.split.rev{direction:rtl}.split.rev>*{direction:ltr}
.split-wrap{max-width:1100px;margin:0 auto;width:100%}
.split-content p{font-size:16px;color:var(--muted);line-height:1.75;margin-top:16px;font-weight:300}
.check-list{list-style:none;margin-top:24px;display:flex;flex-direction:column;gap:10px}
.check-list li{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ink2)}
.check-list li::before{content:'';width:18px;height:18px;border-radius:50%;background:var(--teal-light);flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg width='10' height='8' viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4l3 3 5-6' stroke='%230d9e75' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center}
.screen{background:var(--white);border:1px solid #e4ede9;border-radius:var(--r2);overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.1)}
.screen-bar{background:#f5f7f5;padding:8px 14px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #e4ede9}
.screen-body{padding:16px}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.kpi{background:#f9faf9;border:1px solid #e4ede9;border-radius:10px;padding:14px 16px}
.kpi-num{font-size:22px;font-weight:600;color:var(--ink)}
.kpi-num.teal{color:var(--teal)}
.kpi-label{font-size:11px;color:var(--faint);margin-top:2px}
.kpi-change{font-size:11px;color:var(--teal);margin-top:4px}
.sched-item{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #f0f4f2}
.sched-item:last-child{border-bottom:none}
.sched-time{font-size:11px;color:var(--faint);width:44px;flex-shrink:0;text-align:right}
.sched-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.sched-name{font-size:13px;font-weight:500;color:var(--ink);flex:1}
.sched-proc{font-size:11px;color:var(--muted)}
.sched-badge{font-size:10px;padding:2px 8px;border-radius:100px;flex-shrink:0}
.appt-grid{display:grid;grid-template-columns:36px repeat(5,1fr);gap:1px;background:#e4ede9;border-radius:8px;overflow:hidden;font-size:11px}
.appt-cell{background:#fff;padding:4px 6px;min-height:28px;display:flex;align-items:center}
.appt-header{background:#f5f7f5;font-weight:600;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
.appt-time{color:var(--faint);font-size:10px;justify-content:flex-end}
.appt-block{border-radius:4px;padding:5px 8px;font-size:11px;font-weight:500;line-height:1.3;align-items:flex-start;flex-direction:column;min-height:44px}
.appt-block.teal{background:#e6f7f1;color:#0a7d5d}
.appt-block.blue{background:#e8f0fe;color:#1a56a0}
.appt-block.amber{background:#fef3e2;color:#9a5e00}
.appt-block.red{background:#fde8e8;color:#9a2020}
.appt-sub{font-size:10px;font-weight:400;opacity:.7}
.patient-card{display:grid;grid-template-columns:190px 1fr;gap:0;border:1px solid #e4ede9;border-radius:14px;overflow:hidden}
.patient-sidebar{background:#f5f7f5;padding:20px;border-right:1px solid #e4ede9}
.patient-avatar{width:52px;height:52px;border-radius:50%;background:var(--teal-light);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;color:var(--teal);margin-bottom:12px}
.patient-name{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:2px}
.patient-num{font-size:11px;color:var(--faint);margin-bottom:10px}
.patient-tag{display:inline-block;font-size:10px;padding:2px 8px;border-radius:100px;margin-bottom:4px}
.tag-green{background:#e6f7f1;color:#0a7d5d}.tag-amber{background:#fef3e2;color:#9a5e00}.tag-red{background:#fde8e8;color:#9a2020}
.patient-field{margin-bottom:8px}
.patient-label{font-size:10px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em}
.patient-val{font-size:12px;color:var(--ink);font-weight:500}
.patient-main{padding:14px}
.tab-row{display:flex;gap:0;border-bottom:1px solid #e4ede9;margin-bottom:10px}
.tab{font-size:11px;padding:7px 10px;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer}
.tab.active{color:var(--teal);border-bottom-color:var(--teal);font-weight:600}
.tooth-grid{display:grid;grid-template-columns:repeat(16,1fr);gap:2px}
.tooth{width:100%;aspect-ratio:1;border-radius:3px;border:1px solid #e4ede9;display:flex;align-items:center;justify-content:center;font-size:7px;color:var(--faint);background:#fff}
.tooth.caries{background:#fde8e8;border-color:#f5c2c2;color:#9a2020}
.tooth.crown{background:#e8f0fe;border-color:#c2d4f5;color:#1a56a0}
.tooth.missing{background:#f5f7f5;color:var(--faint)}
.tooth.rct{background:#fef3e2;border-color:#f5dcb2;color:#9a5e00}
.tooth-legend{display:flex;gap:12px;margin-top:8px;flex-wrap:wrap}
.legend-item{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--muted)}
.legend-dot{width:8px;height:8px;border-radius:2px}
.invoice-box{border:1px solid #e4ede9;border-radius:12px;overflow:hidden}
.inv-header{background:var(--ink);padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.inv-title{font-family:var(--serif);font-style:italic;font-size:18px;color:#fff}
.inv-num{font-size:11px;color:rgba(255,255,255,.5)}
.inv-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:14px 20px;background:#f9faf9;border-bottom:1px solid #e4ede9}
.inv-meta-item .label{font-size:10px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em}
.inv-meta-item .val{font-size:13px;font-weight:500;color:var(--ink);margin-top:2px}
.inv-table{width:100%;border-collapse:collapse;font-size:12px}
.inv-table th{padding:8px 20px;text-align:left;font-size:10px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e4ede9}
.inv-table td{padding:10px 20px;border-bottom:1px solid #f0f4f2;color:var(--ink2)}
.inv-table td.mono{font-family:monospace;font-size:11px}
.inv-footer{display:flex;justify-content:flex-end;padding:14px 20px;gap:24px;align-items:flex-end}
.inv-total-row .label{font-size:11px;color:var(--muted);text-align:right}
.inv-total-row .val{font-size:20px;font-weight:600;color:var(--teal)}
.pay-badge{display:inline-block;background:var(--teal-light);color:var(--teal2);font-size:11px;font-weight:600;padding:4px 12px;border-radius:100px}
.notif-list{display:flex;flex-direction:column;gap:8px}
.notif{display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:10px;background:#f9faf9;border:1px solid #e4ede9}
.notif-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.notif-icon.teal{background:var(--teal-light)}.notif-icon.amber{background:#fef3e2}.notif-icon.blue{background:#e8f0fe}
.notif-text{flex:1}
.notif-title{font-size:12px;font-weight:600;color:var(--ink);margin-bottom:2px}
.notif-body{font-size:11px;color:var(--muted);line-height:1.4}
.notif-time{font-size:10px;color:var(--faint);flex-shrink:0;margin-top:2px}
.stack-section{background:var(--ink);padding:96px 24px}
.stack-inner{max-width:1100px;margin:0 auto}
.stack-title{font-family:var(--serif);font-size:clamp(32px,4vw,52px);font-weight:400;color:#fff;margin-bottom:8px}
.stack-title em{font-style:italic;color:var(--teal-mid)}
.stack-sub{font-size:16px;color:rgba(255,255,255,.5);margin-bottom:56px;font-weight:300}
.stack-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.stack-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:24px 20px;transition:background .2s}
.stack-card:hover{background:rgba(255,255,255,.08)}
.stack-logo{font-size:28px;margin-bottom:12px}
.stack-name{font-size:15px;font-weight:600;color:#fff;margin-bottom:4px}
.stack-role{font-size:12px;color:rgba(255,255,255,.45);line-height:1.4;font-weight:300}
.stack-badge{display:inline-block;margin-top:10px;font-size:10px;padding:2px 8px;border-radius:100px;background:rgba(13,158,117,.2);color:var(--teal-mid);border:1px solid rgba(13,158,117,.3)}
.quote-section{background:var(--teal-light);padding:80px 24px;text-align:center}
.quote-inner{max-width:700px;margin:0 auto}
.quote-mark{font-family:var(--serif);font-size:72px;color:var(--teal);line-height:.8;margin-bottom:16px;font-style:italic}
.quote-text{font-family:var(--serif);font-size:clamp(22px,3vw,32px);font-weight:400;color:var(--ink);line-height:1.4;font-style:italic;margin-bottom:24px}
.quote-who{font-size:14px;color:var(--muted);font-weight:500}
footer{background:var(--ink);padding:48px 24px;text-align:center}
.footer-logo{font-family:var(--serif);font-style:italic;font-size:28px;color:var(--teal-mid);margin-bottom:12px}
.footer-sub{font-size:13px;color:rgba(255,255,255,.35);font-weight:300}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.hero h1{animation:fadeUp .7s ease .1s both}
.hero-sub{animation:fadeUp .7s ease .25s both}
.hero-cta{animation:fadeUp .7s ease .4s both}
.hero-mockup{animation:fadeUp .9s ease .55s both}
@media(max-width:900px){
  .features-grid{grid-template-columns:1fr 1fr}
  .split{grid-template-columns:1fr;gap:32px}.split.rev{direction:ltr}
  .stats-inner{grid-template-columns:repeat(2,1fr)}
  .stack-grid{grid-template-columns:repeat(3,1fr)}
  .patient-card{grid-template-columns:1fr}.patient-sidebar{border-right:none;border-bottom:1px solid #e4ede9}
  .kpi-row{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:600px){
  .features-grid{grid-template-columns:1fr}
  .stack-grid{grid-template-columns:repeat(2,1fr)}
  .inv-meta{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<!-- HERO -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-grid"></div>
  <div class="hero-pill"><span class="hero-pill-dot"></span>Free for clinics of any size</div>
  <h1>The dental clinic that <em>runs itself</em></h1>
  <p class="hero-sub">Dental Clinic Portal handles appointments, patient records, billing, prescriptions, inventory, and X-rays — so your team can focus entirely on care.</p>
  <div class="hero-cta">
    <a href="#features" class="btn-primary">See what it does</a>
    <a href="#stack" class="btn-ghost">How it's built</a>
  </div>
  <div class="hero-mockup">
    <div class="mockup-bar">
      <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
      <span style="margin-left:8px;font-size:11px;color:rgba(255,255,255,.3)">Dental Clinic Portal.app/dashboard</span>
    </div>
    <div style="background:#fff;padding:16px">
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-num teal">14</div><div class="kpi-label">Patients today</div><div class="kpi-change">↑ 3 from yesterday</div></div>
        <div class="kpi"><div class="kpi-num">$1,840</div><div class="kpi-label">Revenue today</div><div class="kpi-change">↑ 12% this week</div></div>
        <div class="kpi"><div class="kpi-num">3</div><div class="kpi-label">Pending invoices</div><div class="kpi-change" style="color:#e07a00">2 overdue</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#c0392b">2</div><div class="kpi-label">Low stock items</div><div class="kpi-change" style="color:#c0392b">Reorder needed</div></div>
      </div>
      <div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Today's Schedule</div>
      <div class="sched-item"><span class="sched-time">09:00</span><span class="sched-dot" style="background:#0d9e75"></span><span class="sched-name">Amina Hassan</span><span class="sched-proc">Root Canal — Dr. Farah</span><span class="sched-badge" style="background:#e6f7f1;color:#0a7d5d">In progress</span></div>
      <div class="sched-item"><span class="sched-time">09:30</span><span class="sched-dot" style="background:#3b82f6"></span><span class="sched-name">Omar Nuur</span><span class="sched-proc">Scaling — Dr. Cabdi</span><span class="sched-badge" style="background:#e8f0fe;color:#1a56a0">Confirmed</span></div>
      <div class="sched-item"><span class="sched-time">10:15</span><span class="sched-dot" style="background:#f59e0b"></span><span class="sched-name">Hodan Jama</span><span class="sched-proc">Crown Fitting — Dr. Farah</span><span class="sched-badge" style="background:#fef3e2;color:#9a5e00">Waiting</span></div>
      <div class="sched-item"><span class="sched-time">11:00</span><span class="sched-dot" style="background:#e4ede9"></span><span class="sched-name">Mahad Ali</span><span class="sched-proc">Check-up — Dr. Cabdi</span><span class="sched-badge" style="background:#f5f7f5;color:var(--muted)">Scheduled</span></div>
    </div>
  </div>
</section>

<!-- STATS -->
<div class="stats">
  <div class="stats-inner">
    <div class="stat"><div class="stat-num">27</div><div class="stat-label">Database tables — nothing missed</div></div>
    <div class="stat"><div class="stat-num">23</div><div class="stat-label">Dental procedures pre-loaded</div></div>
    <div class="stat"><div class="stat-num">7</div><div class="stat-label">Payment methods supported</div></div>
    <div class="stat"><div class="stat-num">$0</div><div class="stat-label">Monthly cost to get started</div></div>
  </div>
</div>

<!-- FEATURES -->
<div id="features">
<div class="section">
  <div class="section-tag">Everything you need</div>
  <h2 class="section-title">Built for how <em>real clinics work</em></h2>
  <p class="section-body">Not a generic health platform with a dental skin — Dental Clinic Portal was designed from the ground up for dental workflows, with every screen matching how dentists actually think.</p>
  <div class="features-grid">
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#0d9e75" stroke-width="1.5"/><path d="M8 2v4M16 2v4M3 10h18" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="15" r="1.5" fill="#0d9e75"/><circle cx="12" cy="15" r="1.5" fill="#0d9e75"/><circle cx="16" cy="15" r="1.5" fill="#0d9e75"/></svg></div>
      <div class="feat-title">Smart Appointments</div>
      <div class="feat-body">Drag-and-drop calendar. 8 appointment types. Auto-reminders via SMS, email, or WhatsApp. Never a double-booking.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#0d9e75" stroke-width="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/></svg></div>
      <div class="feat-title">Complete Patient Records</div>
      <div class="feat-body">Demographics, allergies, medical conditions, emergency contacts, insurance — everything in one place, always accessible.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C9.5 2 7 4 7 7c0 1.5.4 2.8 1 3.8L9.5 22h5L16 10.8c.6-1 1-2.3 1-3.8 0-3-2.5-5-5-5z" stroke="#0d9e75" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.5 13h5" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/></svg></div>
      <div class="feat-title">Interactive Dental Chart</div>
      <div class="feat-body">Click any tooth to log conditions, surfaces, and severity. Full odontogram per patient. ISO, Universal, and Palmer notation.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#0d9e75" stroke-width="1.5"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/></svg></div>
      <div class="feat-title">Billing & Invoices</div>
      <div class="feat-body">Auto-generate invoices from treatments. Discounts, insurance deductions, 7 payment methods. Print-ready PDFs instantly.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="#0d9e75" stroke-width="1.5"/><path d="M16 3H8v4h8V3zM16 17v4H8v-4" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/></svg></div>
      <div class="feat-title">Inventory Tracking</div>
      <div class="feat-body">Track every supply from gloves to composites. Low-stock alerts. Full movement history. Expiry date monitoring.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/></svg></div>
      <div class="feat-title">Revenue Reports</div>
      <div class="feat-body">Revenue by month, doctor, and procedure. Appointment stats. Expense tracking. Everything for a business review.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#0d9e75" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 22V12h6v10" stroke="#0d9e75" stroke-width="1.5"/></svg></div>
      <div class="feat-title">Multi-Branch Ready</div>
      <div class="feat-body">Open a second or third location without rebuilding anything. Every piece of data is scoped to its clinic from day one.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0d9e75" stroke-width="1.5" stroke-linejoin="round"/></svg></div>
      <div class="feat-title">Full Audit Trail</div>
      <div class="feat-body">Every action logged — who changed what, when, and what it looked like before. Essential for compliance.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#0d9e75" stroke-width="1.5" stroke-linejoin="round"/></svg></div>
      <div class="feat-title">Recall & Reminders</div>
      <div class="feat-body">Track when each patient is due for their 6-month cleaning. Auto-reminders via SMS, email, or WhatsApp.</div>
    </div>
  </div>
</div>
</div>

<!-- PATIENT DETAIL SPLIT -->
<div style="background:var(--warm);padding:40px 0">
<div class="split-wrap" style="padding:0 24px">
<div class="split" style="padding:60px 0">
  <div class="split-content">
    <span class="section-tag">Patient records</span>
    <h2 class="section-title">Every patient. <em>Every detail.</em></h2>
    <p>From first visit to tenth year, Dental Clinic Portal builds a complete picture — allergies, medical history, tooth conditions, treatment notes, X-rays, and every invoice, all in one screen.</p>
    <ul class="check-list">
      <li>Interactive odontogram — click any tooth to annotate</li>
      <li>Allergies and conditions flagged before every procedure</li>
      <li>Full visit history with SOAP notes and CDT codes</li>
      <li>X-rays, consent forms, and lab results stored and linked</li>
      <li>Insurance coverage tracked with remaining annual balance</li>
    </ul>
  </div>
  <div>
    <div class="patient-card screen">
      <div class="patient-sidebar">
        <div class="patient-avatar">AH</div>
        <div class="patient-name">Amina Hassan</div>
        <div class="patient-num">PT-00042</div>
        <span class="patient-tag tag-amber">⚠ Penicillin allergy</span><br>
        <span class="patient-tag tag-green" style="margin-top:4px">Diabetes — managed</span>
        <div style="margin-top:14px">
          <div class="patient-field"><div class="patient-label">Date of birth</div><div class="patient-val">14 Mar 1985 (39)</div></div>
          <div class="patient-field"><div class="patient-label">Phone</div><div class="patient-val">+252 61 000 0042</div></div>
          <div class="patient-field"><div class="patient-label">Insurance</div><div class="patient-val">Somali Health Fund</div></div>
          <div class="patient-field"><div class="patient-label">Last visit</div><div class="patient-val">12 Jan 2025</div></div>
          <div class="patient-field"><div class="patient-label">Balance due</div><div class="patient-val" style="color:#c0392b">$120.00</div></div>
        </div>
      </div>
      <div class="patient-main">
        <div class="tab-row">
          <div class="tab">Overview</div><div class="tab active">Dental Chart</div><div class="tab">History</div><div class="tab">Files</div><div class="tab">Billing</div>
        </div>
        <div style="font-size:10px;color:var(--faint);margin-bottom:4px">Upper jaw</div>
        <div class="tooth-grid">
          <div class="tooth">18</div><div class="tooth missing">17</div><div class="tooth crown">16</div><div class="tooth">15</div>
          <div class="tooth">14</div><div class="tooth caries">13</div><div class="tooth">12</div><div class="tooth">11</div>
          <div class="tooth">21</div><div class="tooth">22</div><div class="tooth rct">23</div><div class="tooth">24</div>
          <div class="tooth">25</div><div class="tooth crown">26</div><div class="tooth">27</div><div class="tooth missing">28</div>
        </div>
        <div style="font-size:10px;color:var(--faint);margin:8px 0 4px">Lower jaw</div>
        <div class="tooth-grid">
          <div class="tooth missing">48</div><div class="tooth">47</div><div class="tooth">46</div><div class="tooth">45</div>
          <div class="tooth caries">44</div><div class="tooth">43</div><div class="tooth">42</div><div class="tooth">41</div>
          <div class="tooth">31</div><div class="tooth">32</div><div class="tooth">33</div><div class="tooth rct">34</div>
          <div class="tooth">35</div><div class="tooth">36</div><div class="tooth">37</div><div class="tooth missing">38</div>
        </div>
        <div class="tooth-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#fde8e8;border:1px solid #f5c2c2"></div>Caries</div>
          <div class="legend-item"><div class="legend-dot" style="background:#e8f0fe;border:1px solid #c2d4f5"></div>Crown</div>
          <div class="legend-item"><div class="legend-dot" style="background:#fef3e2;border:1px solid #f5dcb2"></div>RCT</div>
          <div class="legend-item"><div class="legend-dot" style="background:#f5f7f5;border:1px solid #e4ede9"></div>Missing</div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</div>

<!-- CALENDAR SPLIT -->
<div class="split-wrap" style="padding:0 24px">
<div class="split rev" style="padding:60px 0">
  <div class="split-content">
    <span class="section-tag">Appointments</span>
    <h2 class="section-title">The calendar your <em>team will love</em></h2>
    <p>A clean week view for every chair and doctor. Book in seconds, drag to reschedule, and the right people get notified automatically — no phone tag required.</p>
    <ul class="check-list">
      <li>Week and day views filtered by doctor or room</li>
      <li>Colour-coded by status at a glance</li>
      <li>Auto-reminders sent 24 hours before each visit</li>
      <li>Emergency slots, follow-ups, and consultations all tracked</li>
    </ul>
  </div>
  <div>
    <div class="screen">
      <div class="screen-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span style="font-size:11px;color:var(--muted);margin-left:8px">Week of 15 Jan 2025</span></div>
      <div class="screen-body">
        <div class="appt-grid">
          <div class="appt-cell appt-header appt-time"></div>
          <div class="appt-cell appt-header">Mon 13</div><div class="appt-cell appt-header">Tue 14</div>
          <div class="appt-cell appt-header" style="background:#e6f7f1;color:#0a7d5d">Wed 15</div>
          <div class="appt-cell appt-header">Thu 16</div><div class="appt-cell appt-header">Fri 17</div>
          <div class="appt-cell appt-time">09:00</div>
          <div class="appt-cell appt-block teal">Root Canal<span class="appt-sub">A. Hassan</span></div>
          <div class="appt-cell"></div>
          <div class="appt-cell appt-block blue">Scaling<span class="appt-sub">O. Nuur</span></div>
          <div class="appt-cell appt-block amber">Crown<span class="appt-sub">H. Jama</span></div>
          <div class="appt-cell"></div>
          <div class="appt-cell appt-time">10:00</div>
          <div class="appt-cell"></div>
          <div class="appt-cell appt-block amber">Extraction<span class="appt-sub">M. Ali</span></div>
          <div class="appt-cell appt-block teal">Check-up<span class="appt-sub">F. Warsame</span></div>
          <div class="appt-cell"></div>
          <div class="appt-cell appt-block blue">X-Ray<span class="appt-sub">K. Cali</span></div>
          <div class="appt-cell appt-time">11:00</div>
          <div class="appt-cell appt-block blue">Filling<span class="appt-sub">I. Daud</span></div>
          <div class="appt-cell"></div>
          <div class="appt-cell appt-block red">Emergency<span class="appt-sub">Walk-in</span></div>
          <div class="appt-cell appt-block teal">Whitening<span class="appt-sub">N. Hassan</span></div>
          <div class="appt-cell"></div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>

<!-- INVOICE SPLIT -->
<div style="background:var(--warm);padding:40px 0">
<div class="split-wrap" style="padding:0 24px">
<div class="split" style="padding:60px 0">
  <div class="split-content">
    <span class="section-tag">Billing</span>
    <h2 class="section-title">Invoices that <em>write themselves</em></h2>
    <p>Procedures recorded during treatment automatically become invoice line items. Set discounts, apply insurance, collect payment — and print a professional receipt in one click.</p>
    <ul class="check-list">
      <li>Auto-populated from treatment CDT procedures</li>
      <li>Percent or fixed-amount discounts</li>
      <li>Insurance deduction against tracked annual limits</li>
      <li>Cash, card, mobile money, bank transfer, and more</li>
      <li>Partial payment with outstanding balance tracking</li>
    </ul>
  </div>
  <div>
    <div class="screen">
      <div class="screen-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
      <div class="screen-body" style="padding:0">
        <div class="invoice-box">
          <div class="inv-header"><span class="inv-title">Dental Clinic Portal Invoice</span><span class="inv-num">INV-00217 · 15 Jan 2025</span></div>
          <div class="inv-meta">
            <div class="inv-meta-item"><div class="label">Patient</div><div class="val">Amina Hassan</div></div>
            <div class="inv-meta-item"><div class="label">Doctor</div><div class="val">Dr. Farah</div></div>
            <div class="inv-meta-item"><div class="label">Insurance</div><div class="val">Somali Health Fund</div></div>
          </div>
          <table class="inv-table">
            <thead><tr><th>Procedure</th><th>Code</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>
              <tr><td>Root Canal (Molar)</td><td class="mono">D3330</td><td style="text-align:right">$600.00</td></tr>
              <tr><td>Periapical X-Ray</td><td class="mono">D0220</td><td style="text-align:right">$15.00</td></tr>
              <tr><td>Emergency Exam</td><td class="mono">D9999</td><td style="text-align:right">$50.00</td></tr>
              <tr><td colspan="2" style="color:var(--muted);font-size:11px">Insurance covered (60%)</td><td style="text-align:right;color:#0a7d5d">−$399.00</td></tr>
            </tbody>
          </table>
          <div class="inv-footer">
            <div class="inv-total-row"><div class="label">Patient pays</div><div class="val">$266.00</div></div>
            <span class="pay-badge">Partially paid</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</div>

<!-- NOTIFICATIONS SPLIT -->
<div class="split-wrap" style="padding:0 24px">
<div class="split rev" style="padding:60px 0">
  <div class="split-content">
    <span class="section-tag">Reminders & Notifications</span>
    <h2 class="section-title">Patients who <em>actually show up</em></h2>
    <p>Automatic reminders cut no-shows dramatically. Recall messages bring lapsed patients back. Payment alerts collect outstanding balances — without awkward phone calls.</p>
    <ul class="check-list">
      <li>Appointment reminders sent 24 hours in advance</li>
      <li>6-month recall messages auto-scheduled per patient</li>
      <li>Payment due alerts for outstanding invoices</li>
      <li>Low stock alerts to the right staff member instantly</li>
      <li>SMS, email, WhatsApp, and in-app channels</li>
    </ul>
  </div>
  <div>
    <div class="screen">
      <div class="screen-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span style="font-size:11px;color:var(--muted);margin-left:8px">Notifications</span></div>
      <div class="screen-body">
        <div class="notif-list">
          <div class="notif">
            <div class="notif-icon teal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#0d9e75" stroke-width="1.5"/><path d="M8 2v4M16 2v4M3 10h18" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            <div class="notif-text"><div class="notif-title">Reminder sent</div><div class="notif-body">SMS to Amina Hassan — Root Canal tomorrow 09:00</div></div>
            <div class="notif-time">2 min ago</div>
          </div>
          <div class="notif">
            <div class="notif-icon amber"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 9v4M12 17h.01" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            <div class="notif-text"><div class="notif-title">Low stock — Composite resin A2</div><div class="notif-body">3 units remaining, below minimum of 10</div></div>
            <div class="notif-time">1 hr ago</div>
          </div>
          <div class="notif">
            <div class="notif-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#3b82f6" stroke-width="1.5"/><path d="M12 8v4l3 3" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            <div class="notif-text"><div class="notif-title">Recall due — 6 patients this month</div><div class="notif-body">6 patients overdue for routine cleaning</div></div>
            <div class="notif-time">Today</div>
          </div>
          <div class="notif">
            <div class="notif-icon teal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#0d9e75" stroke-width="1.5"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#0d9e75" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            <div class="notif-text"><div class="notif-title">Payment overdue — INV-00198</div><div class="notif-body">Omar Nuur · $80 outstanding · 14 days overdue</div></div>
            <div class="notif-time">Yesterday</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>

<!-- STACK -->
<div id="stack" class="stack-section">
  <div class="stack-inner">
    <div class="section-tag" style="color:var(--teal-mid)">Under the hood</div>
    <h2 class="stack-title">Built on the <em>best free tools</em></h2>
    <p class="stack-sub">Four world-class platforms. Zero monthly cost. Scales to thousands of patients with no infrastructure changes.</p>
    <div class="stack-grid">
      <div class="stack-card"><div class="stack-logo">🐘</div><div class="stack-name">Neon</div><div class="stack-role">PostgreSQL database. Safe schema branching. 0.5 GB free.</div><span class="stack-badge">Database</span></div>
      <div class="stack-card"><div class="stack-logo">🚂</div><div class="stack-name">Railway</div><div class="stack-role">Node.js API server. Deploys from GitHub automatically.</div><span class="stack-badge">Backend</span></div>
      <div class="stack-card"><div class="stack-logo">▲</div><div class="stack-name">Vercel</div><div class="stack-role">React frontend on a global CDN. Auto-deploys on every push.</div><span class="stack-badge">Frontend</span></div>
      <div class="stack-card"><div class="stack-logo">☁️</div><div class="stack-name">Cloudinary</div><div class="stack-role">X-rays, photos, and PDFs. 25 GB free. Signed secure URLs.</div><span class="stack-badge">Files</span></div>
      <div class="stack-card"><div class="stack-logo">🔐</div><div class="stack-name">JWT Auth</div><div class="stack-role">Secure login built in. 5 staff roles. Full audit logging.</div><span class="stack-badge">Security</span></div>
    </div>
  </div>
</div>

<!-- QUOTE -->
<div class="quote-section">
  <div class="quote-inner">
    <div class="quote-mark">"</div>
    <p class="quote-text">We went from paper appointment books and WhatsApp invoices to a fully digital clinic — in one weekend.</p>
    <div class="quote-who">Dr. Cabdi Farah · Smile Dental Clinic, Hargeisa</div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-logo">Dental Clinic Portal</div>
  <p class="footer-sub">Modern dental clinic management · Built with care · Free to start</p>
  <p class="footer-sub">Powered By eALIF Solutions</p>
  <p style="font-size:12px;color:rgba(255,255,255,.2);margin-top:16px">PostgreSQL · Node.js · React · Cloudinary</p>
</footer>

</body>
</html>