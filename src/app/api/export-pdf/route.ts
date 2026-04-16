import { NextRequest, NextResponse } from "next/server";
import { ProposalData, calculatePricing } from "@/lib/pricing";
import { calculateHW, buildHWInput, VMSpec, calculateK1VideoHW } from "@/lib/hw-calculator";

export const maxDuration = 60;

// ─── Brand colours ─────────────────────────────────────────────────────────────
const DARK_BLUE = "#1A3A5C";
const MID_BLUE  = "#1E6BA8";
const ACCENT    = "#29ABE2";
const GOLD      = "#F0A500";
const PERP_MULTIPLIER = 3.5;

function fmt(n: number, sym = "$") {
  return `${sym}${Math.round(n).toLocaleString("en-US")}`;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── Static data (mirrors page.tsx) ──────────────────────────────────────────

const PRODUCT_LINES: Record<string, { label: string; icon: string }> = {
  ksafety:   { label: "K-Safety",   icon: "🛡️" },
  kvideo:    { label: "K-Video",    icon: "🎥" },
  kdispatch: { label: "K-Dispatch", icon: "🚒" },
};

const PRODUCT_LINE_SUBTITLE: Record<string, string> = {
  ksafety:   "An AI-powered Command & Control system for complete security management — cameras, LPR, face recognition, IoT sensors, and access control unified in a single screen.",
  kvideo:    "Enterprise video surveillance platform integrating multi-vendor CCTV, LPR, face recognition, and AI video analytics under one management interface.",
  kdispatch: "First-responder dispatch and field coordination platform connecting the operations centre to mobile units in real time via the K-React app.",
};

const PRODUCT_LINE_OVERVIEW: Record<string, string> = {
  ksafety:   "K-Safety is an intelligent Command & Control platform designed to unify all security systems at a facility under one roof — CCTV cameras, face and license plate recognition, AI-based Video Analytics, panic buttons, alarm systems, and access control. The system manages events in real time, executes smart BPM workflows, and presents a complete operational picture on an interactive GIS map. Built for smart cities, municipalities, and strategic facilities, K-Safety connects every sensor and system, turning fragmented infrastructure into a coordinated, intelligent response capability.",
  kvideo:    "K-Video is a centralised video management solution that integrates multi-vendor CCTV systems, license plate recognition, face recognition, and AI video analytics into a single operational view. Supporting leading VMS platforms including Milestone, HikVision, Genetec, Dahua, ISS, and Digivod, K-Video delivers live monitoring, archive search, and AI-driven alert correlation across the entire camera estate.",
  kdispatch: "K-Dispatch is a real-time field coordination platform that connects the operations centre to first responders in the field. Operators assign and track incidents through a command console while field units receive live dispatch, navigation, and situational awareness via the K-React mobile app. The platform accelerates incident response and ensures complete chain-of-custody for every event.",
};

const PRODUCT_LINE_PILLS: Record<string, string[]> = {
  ksafety:   ["Airports", "Oil & Gas", "Industrial Facilities", "Critical Infrastructure", "Defense Facilities", "Smart Cities"],
  kvideo:    ["Smart Cities", "Traffic Management", "Campuses & Schools", "Retail & Malls", "Industrial Sites", "Security Operations"],
  kdispatch: ["Emergency Services", "Law Enforcement", "First Responders", "Smart Cities", "Government", "Operations Centres"],
};

const PRODUCT_LINE_USE_CASES: Record<string, { icon: string; title: string; desc: string }[]> = {
  ksafety: [
    { icon: "✈", title: "Airports", desc: "Monitoring terminals, airside areas, entry gates, and warehouses. Integration with LENEL, LPR cameras at gates, and real-time operational dashboards." },
    { icon: "⚡", title: "Oil & Gas Facilities", desc: "Perimeter intrusion detection, integrated gas sensors, emergency force management, and real-time updates to rescue teams." },
    { icon: "🔒", title: "Critical Infrastructure", desc: "Power stations, water, and communication infrastructure — 24/7 monitoring with instant alerts and automated BPM response workflows." },
  ],
  kvideo: [
    { icon: "🚦", title: "City Traffic Management", desc: "Unified monitoring of thousands of cameras across an entire city with AI-powered incident detection, LPR at junctions, and live control-room feeds." },
    { icon: "🏫", title: "Campus & Enterprise Security", desc: "Multi-site video surveillance with face recognition, access control integration, visitor management, and centralised archive search across all locations." },
    { icon: "🏭", title: "Industrial & Perimeter", desc: "24/7 AI intrusion detection, virtual-line crossing alerts, and abandoned-object detection for large industrial and logistics sites." },
  ],
  kdispatch: [
    { icon: "🚒", title: "Emergency Services", desc: "Real-time fire, ambulance, and police dispatch with automated route optimisation, resource tracking, and CAD integration." },
    { icon: "👮", title: "Law Enforcement", desc: "Mobile command for field officers: live incident details, navigation, evidence capture, and two-way communication with the operations centre." },
    { icon: "🌆", title: "Smart City Operations", desc: "Unified city operations centre coordinating multiple agencies with shared situational awareness and automated escalation protocols." },
  ],
};

const WHY_LEFT: Record<string, string[]> = {
  ksafety:   ["Open Architecture — works with all existing equipment", "AI-Native — Video Analytics, NLP, automated insights", "Modular — buy only what you need, expand later", "Proven — dozens of projects worldwide", "NDAA Compliant — meets security & regulatory requirements"],
  kvideo:    ["Open Architecture — any VMS, any camera brand", "AI-Native — real-time video analytics & smart search", "Modular — start small, scale to city-wide", "Proven — large-scale smart city deployments", "Standards-based — ONVIF, RTSP, GB/T 28181"],
  kdispatch: ["Real-Time Dispatch — sub-second alert delivery", "Mobile-First — K-React works on any Android device", "AI-Assisted — automated event classification", "Proven — integrated with leading CAD systems", "Resilient — offline-capable field app"],
};

const WHY_RIGHT: Record<string, string[]> = {
  ksafety:   ["One Platform for all security systems", "Real-Time Command Centre with AI", "Fast Incident Response — automated BPM", "Proven ROI — workforce savings & incident prevention", "Full Support in English + 24×7 SLA option"],
  kvideo:    ["One View for all cameras & sensors", "Live AI Alerts — intrusion, loitering, crowds", "Fast Archive Search — face, plate, event", "Scalable — 10 to 100,000+ channels", "Full Support + 24×7 option"],
  kdispatch: ["One Console for dispatch, map & comms", "K-React — field app with offline support", "Automated Escalation & SLA tracking", "Full Audit Trail for every incident", "24×7 SLA support option"],
};

const CORE_CAPABILITIES = [
  { icon: "🎬", name: "Unified Video Management",         desc: "Centralise all cameras in one live & archive management console supporting all major VMS vendors." },
  { icon: "🤖", name: "Video Analytics (AI)",             desc: "Real-time AI detection: intrusion, loitering, crowd, abandoned objects, and virtual-line crossing." },
  { icon: "👤", name: "Face & License Plate Recognition", desc: "Automated FR and LPR against watch-lists with instant operator alerts integrated into the operational picture." },
  { icon: "🚨", name: "Smart Event Management",           desc: "Unified event log with severity levels, SLA tracking, automated escalation, and full audit trail." },
  { icon: "🗺️", name: "GIS / Live Map",                  desc: "Interactive operational map showing every asset, alert, patrol unit, and camera in real time." },
  { icon: "📊", name: "BI & Reports",                    desc: "Pre-built and ad-hoc dashboards, scheduled reports, KPI widgets, and data export." },
  { icon: "📡", name: "Panic Buttons / IoT",             desc: "Integrate panic buttons, environmental sensors, and IoT devices — trigger automated BPM workflows on any alert." },
  { icon: "📅", name: "Shift & Force Management",        desc: "Plan shifts, manage attendance, track field units, and maintain full incident duty records." },
  { icon: "✅", name: "Task Management",                 desc: "Assign, track, and close tasks linked to incidents or SOPs with SLA timers and escalation chains." },
  { icon: "🖥️", name: "Sensors Dashboard",              desc: "Live telemetry from all connected sensors in configurable widgets — environmental, intrusion, access, and custom." },
  { icon: "⚙️", name: "BPM / Rules Engine",             desc: "Visual rule builder to define automated responses: alert → notify → escalate → close, fully auditable." },
];

// ─── Build HTML ───────────────────────────────────────────────────────────────

function buildHtml(data: ProposalData, narrative: string, vmRowsIn: VMSpec[]): string {
  const pricing  = calculatePricing(data);
  const hw       = calculateHW(buildHWInput(data));
  // Use client-provided vmRows (user-edited) if available, else fall back to computed
  const vmRows: VMSpec[] = vmRowsIn.length > 0 ? vmRowsIn : hw.vmSpecs;

  const isAnnual  = data.pricingModel === "annual";
  const pl        = data.productLine ?? "ksafety";
  const plLabel   = PRODUCT_LINES[pl]?.label ?? "K-Safety";
  const dateStr   = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Build vendor list for accent band
  const vendors: string[] = [];
  (data.cctvVendors ?? []).forEach(v => { if (v.vendorName && !v.isOther) vendors.push(v.vendorName); });
  if (data.k1VideoEnabled) vendors.push("K1-Video (VXG OEM)");
  (data.lprVendors ?? []).forEach(v => { if (v.vendorName && !v.isOther) vendors.push(`LPR – ${v.vendorName}`); });
  (data.faceVendors ?? []).forEach(v => { if (v.vendorName && !v.isOther) vendors.push(`Face – ${v.vendorName}`); });
  (data.iotVendors ?? []).forEach(v => { if (v.vendorName && !v.isOther) vendors.push(v.vendorName); });

  // Integration chips
  const chips: { label: string; sub?: string; ready: boolean }[] = [];
  (data.cctvVendors ?? []).forEach(v => chips.push({ label: v.vendorName || "VMS", ready: !v.isOther, sub: v.isOther ? "Non-standard — R&D evaluation required" : undefined }));
  if (data.k1VideoEnabled) chips.push({ label: "K1-Video (VXG OEM)", ready: true });
  (data.lprVendors ?? []).forEach(v => chips.push({ label: `LPR – ${v.vendorName || "LPR"}`, ready: !v.isOther }));
  (data.faceVendors ?? []).forEach(v => chips.push({ label: `Face – ${v.vendorName || "FR"}`, ready: !v.isOther }));
  (data.iotVendors ?? []).forEach(v => chips.push({ label: v.vendorName || "IoT Sensor", ready: !v.isOther }));

  // Pricing rows
  const licenseRows = pricing.licenseItems.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#F7F9FC"}">
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0">${item.name}${item.isModified ? ' <span style="color:#b45309;font-weight:700;font-size:11px">*</span>' : ""}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0;color:#64748B">${item.quantity > 1 ? `${item.quantity} ${item.unitLabel}s` : `per ${item.unitLabel}`}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0;text-align:right">${isAnnual ? fmt(item.annualUnit) : fmt(item.perpetualUnit ?? item.annualUnit * PERP_MULTIPLIER)}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:700;color:${DARK_BLUE}">${isAnnual ? fmt(item.annualTotal) : fmt(item.perpetualTotal)}</td>
    </tr>`).join("");

  const serviceRows = pricing.serviceItems.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#F7F9FC"}">
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0">${item.name}${item.isModified ? ' <span style="color:#b45309;font-weight:700;font-size:11px">*</span>' : ""}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0;color:#64748B">Project</td>
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0;text-align:right">${fmt(item.annualUnit)}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:700;color:${DARK_BLUE}">${fmt(item.annualTotal)}</td>
    </tr>`).join("");

  // HW table rows (K1-Video style: Service / Instances / vCPU / RAM GB / HDD GB)
  const totalServers = vmRows.reduce((s, v) => s + v.amount, 0);
  const totalVCPU    = vmRows.reduce((s, v) => s + v.vCores * v.amount, 0);
  const totalRAM     = vmRows.reduce((s, v) => s + v.ramGB * v.amount, 0);
  const totalHDD     = vmRows.reduce((s, v) => s + (v.storageGB > 0 ? v.storageGB : v.localDiskGB) * v.amount, 0);

  const hwRows = vmRows.map((vm, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#F7F9FC"}">
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-weight:600;color:${DARK_BLUE}">${vm.serverName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${vm.amount}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${vm.vCores}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${vm.ramGB}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${vm.storageGB > 0 ? vm.storageGB : vm.localDiskGB}</td>
    </tr>`).join("");

  // K1-Video HW rows
  let k1VideoSection = "";
  if (data.k1VideoEnabled && (data.k1VideoChannels ?? 0) > 0) {
    const k1 = calculateK1VideoHW({
      cameras: data.k1VideoChannels ?? 0,
      bitrateMbps: data.k1VideoBitrateMbps ?? 2,
      retentionDays: data.k1VideoRetentionDays ?? 30,
      deploymentType: data.deploymentType === "cloud" ? "cloud" : "onprem",
    });
    const k1Rows = k1.serviceRows.map((r, i) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#F7F9FC"}">
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0">${r.service}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${r.instances}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${r.vCPU}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${r.ramGB}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center">${r.hddGB}</td>
      </tr>`).join("");

    k1VideoSection = `
      <h4 style="font-size:13px;font-weight:700;color:${DARK_BLUE};margin:16px 0 8px">K1-Video HW Requirements (VXG Embedded VMS)</h4>
      <p style="font-size:11px;color:#64748B;margin-bottom:8px">
        Sizing for ${data.k1VideoChannels} cameras @ ${data.k1VideoBitrateMbps} Mbps / ${data.k1VideoRetentionDays} days — ${data.deploymentType === "cloud" ? "Cloud (AWS)" : "On-Premises"}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px">
        <thead>
          <tr style="background:${DARK_BLUE};color:white">
            <th style="padding:8px 12px;text-align:left;font-weight:700">Service</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700">Instances</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700">vCPU</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700">RAM GB</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700">HDD GB</th>
          </tr>
        </thead>
        <tbody>
          ${k1Rows}
          <tr style="background:rgba(26,58,92,0.07);font-weight:700">
            <td colspan="2" style="padding:8px 12px;text-align:right;color:${DARK_BLUE}">TOTAL (+${Math.round(k1.overheadPct * 100)}% overhead)</td>
            <td style="padding:8px 12px;text-align:center;color:${MID_BLUE}">${k1.finalVCPU}</td>
            <td style="padding:8px 12px;text-align:center;color:${MID_BLUE}">${k1.finalRAM}</td>
            <td style="padding:8px 12px;text-align:center;color:${MID_BLUE}">${k1.finalHDD}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:11px;color:#64748B;background:#F8FAFC;padding:6px 12px;border-radius:6px">
        <strong>Nodes:</strong> ${k1.nodes.count}× ${k1.nodes.spec} &nbsp;|&nbsp;
        <strong>Video:</strong> ${round2(k1.videoTB)} TB &nbsp;|&nbsp;
        <strong>Archive:</strong> ${round2(k1.archiveTB)} TB &nbsp;|&nbsp;
        <strong>Total Storage:</strong> ${round2(k1.totalStorageTB)} TB
      </p>`;
  }

  // Use cases HTML
  const useCases = (PRODUCT_LINE_USE_CASES[pl] ?? []).map(uc => `
    <div style="background:linear-gradient(135deg,${DARK_BLUE},${MID_BLUE});border-radius:10px;padding:18px;color:white;flex:1">
      <div style="font-size:26px;margin-bottom:8px">${uc.icon}</div>
      <h4 style="font-size:14px;font-weight:700;color:white;margin:0 0 6px">${uc.title}</h4>
      <p style="font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5;margin:0">${uc.desc}</p>
    </div>`).join("");

  // Cap cards (3 per row)
  const capRows: string[] = [];
  for (let i = 0; i < CORE_CAPABILITIES.length; i += 3) {
    const cols = CORE_CAPABILITIES.slice(i, i + 3).map(cap => `
      <td style="width:33%;vertical-align:top;padding:0 6px">
        <div style="background:#F7F9FC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;height:100%">
          <div style="font-size:24px;margin-bottom:6px">${cap.icon}</div>
          <h4 style="font-size:13px;font-weight:700;color:${DARK_BLUE};margin:0 0 4px">${cap.name}</h4>
          <p style="font-size:11px;color:#64748B;line-height:1.5;margin:0">${cap.desc}</p>
        </div>
      </td>`).join("");
    capRows.push(`<tr>${cols}</tr>`);
  }

  const chipsHtml = chips.length > 0 ? chips.map(c => `
    <span style="display:inline-flex;align-items:center;gap:5px;background:white;border:2px solid ${c.ready ? "#D6E8F7" : "#FDE68A"};color:${DARK_BLUE};padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;margin:4px 4px 4px 0">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.ready ? "#22C55E" : "#F59E0B"}"></span>
      ${c.label}
    </span>`).join("") : "";

  const whyLeftItems  = (WHY_LEFT[pl]  ?? []).map(i => `<li style="font-size:13px;line-height:1.9;color:#2D3748"><span style="color:${ACCENT};font-weight:700">✓ </span>${i}</li>`).join("");
  const whyRightItems = (WHY_RIGHT[pl] ?? []).map(i => `<li style="font-size:13px;line-height:1.9;color:rgba(255,255,255,0.9)"><span style="opacity:0.7">▪ </span>${i}</li>`).join("");

  const pillsHtml = (PRODUCT_LINE_PILLS[pl] ?? []).map(p =>
    `<span style="display:inline-block;background:rgba(255,255,255,0.15);color:white;padding:4px 12px;border-radius:20px;font-size:11px;margin:3px 3px 0 0;border:1px solid rgba(255,255,255,0.3)">${p}</span>`
  ).join("");

  const discountRow = (data.discount ?? 0) > 0 ? `
    <tr>
      <td colspan="3" style="padding:9px 12px;border-bottom:1px solid #E2E8F0;color:#16A34A;font-weight:700">Discount (${data.discount}%)</td>
      <td style="padding:9px 12px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:700;color:#16A34A">
        −${isAnnual ? fmt(pricing.annualTotal / (1 - (data.discount ?? 0) / 100) - pricing.annualTotal) : fmt(pricing.perpetualTotal / (1 - (data.discount ?? 0) / 100) - pricing.perpetualTotal)}
      </td>
    </tr>` : "";

  const narrativeHtml = narrative
    ? narrative.replace(/\n\n/g, "</p><p style='line-height:1.7;color:#334155;margin:12px 0'>").replace(/\n/g, "<br/>")
    : `<ol style="padding-left:20px;color:#444;line-height:2">
        <li>Review this proposal with your technical and procurement teams.</li>
        <li>Schedule a live demonstration of the ${plLabel} platform.</li>
        <li>Confirm final scope and quantities with your Kabatone account executive.</li>
        <li>Proceed with a Proof of Concept (POC) agreement if required.</li>
        <li>Sign the agreement and kick off the implementation project.</li>
       </ol>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${data.projectName || `${plLabel} Proposal`}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:"Segoe UI",Arial,sans-serif; font-size:13px; color:#222; background:#fff; }
  .page { max-width:920px; margin:0 auto; }
  @page { margin:12mm 10mm; size:A4; }
  @media print {
    .no-print { display:none !important; }
    .page-break { page-break-before:always; }
  }
</style>
</head>
<body>

<div class="no-print" style="position:fixed;top:12px;right:16px;z-index:999;display:flex;gap:8px">
  <button onclick="window.print()" style="background:${DARK_BLUE};color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer">
    🖨️ Print / Save as PDF
  </button>
  <button onclick="window.close()" style="background:#e5e7eb;color:#222;border:none;padding:10px 16px;border-radius:6px;font-size:13px;cursor:pointer">✕ Close</button>
</div>

<div class="page">

<!-- ── HERO ── -->
<div style="background:linear-gradient(135deg,${DARK_BLUE} 0%,${MID_BLUE} 60%,${ACCENT} 100%);padding:40px 48px 32px;position:relative;overflow:hidden">
  <div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,0.05)"></div>
  <div style="position:absolute;bottom:-40px;left:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>
  <div style="position:relative;z-index:1">
    <div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:20px">
      <div style="background:${GOLD};color:${DARK_BLUE};font-size:24px;font-weight:900;width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">K</div>
      <div>
        <div style="font-size:22px;font-weight:900;color:white;letter-spacing:1px">KABATONE</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:3px">SMART CITY SOLUTIONS</div>
      </div>
      <div style="margin-left:auto;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);padding:6px 14px;border-radius:20px;font-size:11px;color:rgba(255,255,255,0.9);text-align:right">
        <div style="font-weight:700;color:${GOLD}">CONFIDENTIAL</div>
        <div>${data.customerName} — ${dateStr}</div>
      </div>
    </div>
    <div style="font-size:28px;font-weight:900;color:white;margin-bottom:6px">${data.projectName || `${plLabel} Platform Proposal`}</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-bottom:16px;max-width:600px">${PRODUCT_LINE_SUBTITLE[pl] ?? ""}</div>
    <div>${pillsHtml}</div>
  </div>
</div>

<!-- ── ACCENT BAND ── -->
${vendors.length > 0 ? `
<div style="background:${ACCENT};padding:10px 48px;font-size:12px;font-weight:600;color:white">
  Integrated Vendors &amp; Technologies: ${vendors.join(" &nbsp;·&nbsp; ")}
</div>` : ""}

<!-- ── CONTENT ── -->
<div style="padding:32px 48px">

  <!-- What is K-Safety? -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
    <span style="font-size:22px">${PRODUCT_LINES[pl]?.icon ?? "🛡️"}</span>
    <h2 style="font-size:16px;font-weight:800;color:${DARK_BLUE}">What is ${plLabel}?</h2>
  </div>
  <p style="font-size:13px;color:#374151;line-height:1.7;margin-bottom:16px">${PRODUCT_LINE_OVERVIEW[pl] ?? ""}</p>
  <div style="border-left:4px solid ${ACCENT};background:rgba(41,171,226,0.06);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:28px">
    <div style="font-size:11px;color:#64748B;font-weight:600;margin-bottom:4px">TOTAL INVESTMENT</div>
    <div style="font-size:20px;font-weight:900;color:${DARK_BLUE}">
      ${isAnnual ? fmt(pricing.annualTotal) + " / year" : fmt(pricing.perpetualTotal) + " (perpetual)"}
    </div>
    <div style="font-size:12px;color:#64748B;margin-top:3px">
      ${data.customerName} · ${data.city}, ${data.country} · ${isAnnual ? "Annual Subscription" : "Perpetual License"}
    </div>
  </div>

  <!-- Core Capabilities -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">⚡</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">Core Capabilities</h2>
  </div>
  <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-bottom:20px">
    ${capRows.join("")}
  </table>

  <!-- Use Cases -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">🎯</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">Use Cases — ${plLabel}</h2>
  </div>
  <div style="display:flex;gap:16px;margin-bottom:24px">
    ${useCases}
  </div>

  <!-- Divider -->
  <div style="height:1px;background:linear-gradient(90deg,${ACCENT},transparent);margin:4px 0 20px"></div>

  <!-- Integration Chips -->
  ${chips.length > 0 ? `
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
    <span style="font-size:18px">🔗</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">Supported Integrations — Open Architecture</h2>
  </div>
  <div style="display:flex;align-items:center;gap:14px;font-size:11px;color:#64748B;margin-bottom:8px">
    <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22C55E;margin-right:4px"></span>Ready</span>
    <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F59E0B;margin-right:4px"></span>In Development / Partial</span>
  </div>
  <div style="margin-bottom:24px">${chipsHtml}</div>
  <div style="height:1px;background:linear-gradient(90deg,${ACCENT},transparent);margin:0 0 20px"></div>` : ""}

  <!-- Pricing Table -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">💰</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">Pricing Summary — ${isAnnual ? "Annual Subscription" : "Perpetual License"}</h2>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px">
    <thead>
      <tr style="background:${DARK_BLUE};color:white">
        <th style="padding:10px 12px;text-align:left;font-weight:700;border-radius:8px 0 0 0">Component</th>
        <th style="padding:10px 12px;text-align:left;font-weight:700">Unit</th>
        <th style="padding:10px 12px;text-align:right;font-weight:700">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;font-weight:700;border-radius:0 8px 0 0">Total</th>
      </tr>
    </thead>
    <tbody>
      ${pricing.licenseItems.length > 0 ? `<tr><td colspan="4" style="background:#D6E8F7;color:${DARK_BLUE};font-weight:700;font-size:11px;padding:6px 12px">Platform &amp; Licenses</td></tr>` : ""}
      ${licenseRows}
      ${pricing.serviceItems.length > 0 ? `<tr><td colspan="4" style="background:#D6E8F7;color:${DARK_BLUE};font-weight:700;font-size:11px;padding:6px 12px">Professional Services (one-time)</td></tr>` : ""}
      ${serviceRows}
      ${discountRow}
      <tr style="background:${DARK_BLUE};color:white">
        <td colspan="3" style="padding:10px 12px;font-weight:700;font-size:14px">GRAND TOTAL</td>
        <td style="padding:10px 12px;text-align:right;font-weight:900;font-size:16px;color:${GOLD}">
          ${isAnnual ? fmt(pricing.annualTotal) + " / yr" : fmt(pricing.perpetualTotal)}
        </td>
      </tr>
      ${!isAnnual ? `
      <tr style="background:rgba(26,58,92,0.05)">
        <td colspan="3" style="padding:8px 12px;color:#64748B;font-size:12px">Support from Year 2 (20% of perpetual/yr)</td>
        <td style="padding:8px 12px;text-align:right;color:#64748B;font-size:12px">${fmt(pricing.year2SupportAnnual)} / yr</td>
      </tr>` : ""}
    </tbody>
  </table>

  <!-- Business Model Box -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">📋</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">Business Model</h2>
  </div>
  <div style="background:linear-gradient(135deg,${DARK_BLUE},${MID_BLUE});border-radius:12px;padding:20px 24px;color:white;margin-bottom:24px">
    <div style="display:flex;gap:32px">
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700;color:${GOLD};margin-bottom:8px;letter-spacing:1px">ANNUAL SUBSCRIPTION</div>
        <ul style="list-style:none;padding:0">
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ ${fmt(pricing.annualTotal)} / year</li>
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ All updates &amp; support included</li>
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ Lower upfront cost</li>
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ 5-year total: ${fmt(pricing.fiveYearAnnual)}</li>
        </ul>
      </div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700;color:${GOLD};margin-bottom:8px;letter-spacing:1px">PERPETUAL LICENSE</div>
        <ul style="list-style:none;padding:0">
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ ${fmt(pricing.perpetualTotal)} one-time</li>
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ ${fmt(pricing.year2SupportAnnual)} / yr support from Year 2</li>
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ Asset ownership</li>
          <li style="font-size:12px;line-height:1.9;color:rgba(255,255,255,0.9)">✓ 5-year total: ${fmt(pricing.fiveYearPerpetual)}</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- HW Infrastructure -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
    <span style="font-size:18px">💻</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">HW Infrastructure Requirements</h2>
  </div>
  ${data.deploymentType === "cloud" ? `
  <div style="background:rgba(30,107,168,0.08);color:${MID_BLUE};padding:10px 16px;border-radius:8px;font-size:12px;margin-bottom:10px">
    ☁️ <strong>Cloud deployment</strong> — specs below represent AWS EC2 / Azure VM equivalents.
  </div>` : ""}
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px">
    <thead>
      <tr style="background:${DARK_BLUE};color:white">
        <th style="padding:8px 12px;text-align:left;font-weight:700">Service / Server</th>
        <th style="padding:8px 12px;text-align:center;font-weight:700">Instances</th>
        <th style="padding:8px 12px;text-align:center;font-weight:700">vCPU</th>
        <th style="padding:8px 12px;text-align:center;font-weight:700">RAM GB</th>
        <th style="padding:8px 12px;text-align:center;font-weight:700">HDD GB</th>
      </tr>
    </thead>
    <tbody>
      ${hwRows}
      <tr style="background:rgba(26,58,92,0.07);font-weight:700">
        <td colspan="2" style="padding:8px 12px;text-align:right;color:${DARK_BLUE}">TOTAL (${totalServers} servers)</td>
        <td style="padding:8px 12px;text-align:center;color:${MID_BLUE}">${totalVCPU}</td>
        <td style="padding:8px 12px;text-align:center;color:${MID_BLUE}">${totalRAM}</td>
        <td style="padding:8px 12px;text-align:center;color:${MID_BLUE}">${totalHDD}</td>
      </tr>
    </tbody>
  </table>
  ${k1VideoSection}
  ${hw.totals.grandTotalTB > 0 ? `
  <div style="display:inline-flex;align-items:center;gap:8px;background:#F0F9FF;border-radius:20px;border:1px solid ${ACCENT};padding:7px 16px;font-size:12px;margin-bottom:24px">
    <span style="color:${ACCENT};font-weight:700">💾</span>
    <span style="color:#64748B">Total Storage:</span>
    <strong style="color:${DARK_BLUE}">${round2(hw.totals.grandTotalTB)} TB</strong>
  </div>` : `<div style="margin-bottom:24px"></div>`}

  <!-- Why K-Safety? -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">⭐</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">Why ${plLabel}?</h2>
  </div>
  <div style="display:flex;gap:16px;margin-bottom:28px">
    <div style="flex:1;background:#F7F9FC;border-radius:10px;padding:18px">
      <ul style="list-style:none;padding:0">${whyLeftItems}</ul>
    </div>
    <div style="flex:1;background:linear-gradient(135deg,${DARK_BLUE},${MID_BLUE});border-radius:10px;padding:18px;color:white">
      <ul style="list-style:none;padding:0">${whyRightItems}</ul>
    </div>
  </div>

  <!-- AI Executive Summary / Next Steps -->
  <div style="height:1px;background:linear-gradient(90deg,${ACCENT},transparent);margin:0 0 20px"></div>
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">✨</span>
    <h2 style="font-size:15px;font-weight:800;color:${DARK_BLUE}">Executive Summary &amp; Next Steps</h2>
  </div>
  <div style="background:#F8FAFF;border-radius:10px;padding:20px 24px;border:1px solid #E2E8F0;margin-bottom:0">
    <p style="line-height:1.7;color:#334155;margin:0">${narrativeHtml}</p>
  </div>

</div><!-- /content -->

<!-- ── CTA FOOTER ── -->
<div style="background:linear-gradient(135deg,${DARK_BLUE},${MID_BLUE});padding:28px 48px;color:white;margin-top:0">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:16px;font-weight:800;color:white;margin-bottom:4px">${data.projectName || plLabel + " Platform"}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.75)">Prepared by ${data.salesPerson || "Kabatone Sales"} · ${data.city}, ${data.country}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:rgba(255,255,255,0.75)">📞 ${data.contactPerson}${data.contactEmail ? ` · ${data.contactEmail}` : ""}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px">contact@kabatone.com · www.kabatone.com</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px">Proposal valid for 30 days · ${dateStr}</div>
    </div>
  </div>
</div>

</div><!-- /page -->
</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { data, narrative, vmRows }: { data: ProposalData; narrative: string; vmRows?: VMSpec[] } = await req.json();
    const html = buildHtml(data, narrative ?? "", vmRows ?? []);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal HTML: " + String(error) },
      { status: 500 }
    );
  }
}
