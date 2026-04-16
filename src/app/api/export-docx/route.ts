import { NextRequest, NextResponse } from "next/server";
import {
  Document, Paragraph, Table, TableRow, TableCell, TextRun,
  AlignmentType, WidthType, ShadingType, Packer,
  PageBreak, BorderStyle, Header, Footer, TableLayoutType,
} from "docx";
import { ProposalData, calculatePricing } from "@/lib/pricing";
import { calculateHW, buildHWInput, VMSpec, calculateK1VideoHW } from "@/lib/hw-calculator";

// ─── Brand colours ─────────────────────────────────────────────────────────────
const C_DARK_BLUE = "1A3A5C";
const C_MID_BLUE  = "1E6BA8";
const C_ACCENT    = "29ABE2";
const C_GOLD      = "F0A500";
const C_WHITE     = "FFFFFF";
const C_LIGHT     = "D6E8F7";
const C_GRAY      = "64748B";

const PERP_MULTIPLIER = 3.5;

// ─── Static data ──────────────────────────────────────────────────────────────

const PRODUCT_LINES: Record<string, { label: string }> = {
  ksafety:   { label: "K-Safety"   },
  kvideo:    { label: "K-Video"    },
  kdispatch: { label: "K-Dispatch" },
};

const PRODUCT_LINE_SUBTITLE: Record<string, string> = {
  ksafety:   "An AI-powered Command & Control system for complete security management — cameras, LPR, face recognition, IoT sensors, and access control unified in a single screen.",
  kvideo:    "Enterprise video surveillance platform integrating multi-vendor CCTV, LPR, face recognition, and AI video analytics under one management interface.",
  kdispatch: "First-responder dispatch and field coordination platform connecting the operations centre to mobile units in real time via the K-React app.",
};

const PRODUCT_LINE_OVERVIEW: Record<string, string> = {
  ksafety:   "K-Safety is an intelligent Command & Control platform designed to unify all security systems at a facility under one roof — CCTV cameras, face and license plate recognition, AI-based Video Analytics, panic buttons, alarm systems, and access control. The system manages events in real time, executes smart BPM workflows, and presents a complete operational picture on an interactive GIS map.",
  kvideo:    "K-Video is a centralised video management solution that integrates multi-vendor CCTV systems, license plate recognition, face recognition, and AI video analytics into a single operational view. Supporting leading VMS platforms including Milestone, HikVision, Genetec, Dahua, ISS, and Digivod.",
  kdispatch: "K-Dispatch is a real-time field coordination platform that connects the operations centre to first responders in the field. Operators assign and track incidents through a command console while field units receive live dispatch, navigation, and situational awareness via the K-React mobile app.",
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
  ksafety:   ["One Platform for all security systems", "Real-Time Command Centre with AI", "Fast Incident Response — automated BPM", "Proven ROI — workforce savings & incident prevention", "Full Support in English + 24x7 SLA option"],
  kvideo:    ["One View for all cameras & sensors", "Live AI Alerts — intrusion, loitering, crowds", "Fast Archive Search — face, plate, event", "Scalable — 10 to 100,000+ channels", "Full Support + 24x7 option"],
  kdispatch: ["One Console for dispatch, map & comms", "K-React — field app with offline support", "Automated Escalation & SLA tracking", "Full Audit Trail for every incident", "24x7 SLA support option"],
};

const CORE_CAPABILITIES = [
  { name: "Unified Video Management",         desc: "Centralise all cameras in one live & archive management console supporting all major VMS vendors." },
  { name: "Video Analytics (AI)",             desc: "Real-time AI detection: intrusion, loitering, crowd, abandoned objects, and virtual-line crossing." },
  { name: "Face & License Plate Recognition", desc: "Automated FR and LPR against watch-lists with instant operator alerts integrated into the operational picture." },
  { name: "Smart Event Management",           desc: "Unified event log with severity levels, SLA tracking, automated escalation, and full audit trail." },
  { name: "GIS / Live Map",                   desc: "Interactive operational map showing every asset, alert, patrol unit, and camera in real time." },
  { name: "BI & Reports",                     desc: "Pre-built and ad-hoc dashboards, scheduled reports, KPI widgets, and data export." },
  { name: "Panic Buttons / IoT",              desc: "Integrate panic buttons, environmental sensors, and IoT devices — trigger automated BPM workflows on any alert." },
  { name: "Shift & Force Management",         desc: "Plan shifts, manage attendance, track field units, and maintain full incident duty records." },
  { name: "Task Management",                  desc: "Assign, track, and close tasks linked to incidents or SOPs with SLA timers and escalation chains." },
  { name: "Sensors Dashboard",               desc: "Live telemetry from all connected sensors in configurable widgets — environmental, intrusion, access, and custom." },
  { name: "BPM / Rules Engine",              desc: "Visual rule builder to define automated responses: alert -> notify -> escalate -> close, fully auditable." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function hCell(text: string, bg = C_DARK_BLUE, colspan = 1): TableCell {
  return new TableCell({
    columnSpan: colspan,
    shading: { type: ShadingType.SOLID, color: bg },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: C_WHITE, size: 18 })],
        spacing: { before: 60, after: 60 },
      }),
    ],
  });
}

function hCellLeft(text: string, bg = C_DARK_BLUE, colspan = 1): TableCell {
  return new TableCell({
    columnSpan: colspan,
    shading: { type: ShadingType.SOLID, color: bg },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text, bold: true, color: C_WHITE, size: 18 })],
        spacing: { before: 60, after: 60 },
      }),
    ],
  });
}

function catCell(text: string, colspan = 4): TableCell {
  return new TableCell({
    columnSpan: colspan,
    shading: { type: ShadingType.SOLID, color: C_LIGHT },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18, color: C_DARK_BLUE })],
        spacing: { before: 40, after: 40 },
      }),
    ],
  });
}

function dCell(text: string, opts: { bold?: boolean; right?: boolean; center?: boolean; color?: string; bg?: string; size?: number } = {}): TableCell {
  return new TableCell({
    shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
    children: [
      new Paragraph({
        alignment: opts.right ? AlignmentType.RIGHT : opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts.bold ?? false, size: opts.size ?? 18, color: opts.color ?? "222222" })],
        spacing: { before: 40, after: 40 },
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: C_DARK_BLUE })],
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C_GOLD, space: 4 } },
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: C_MID_BLUE })],
    spacing: { before: 240, after: 100 },
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: "374151" })],
    spacing: { before: 40, after: 100 },
    indent: { left: 0 },
  });
}

function bullet(text: string, color = "222222"): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 20, color })],
    spacing: { before: 40, after: 40 },
  });
}

function checkItem(text: string, color = C_WHITE): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `✓  ${text}`, size: 20, color })],
    spacing: { before: 40, after: 40 },
  });
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { data, narrative, vmRows: vmRowsIn }: { data: ProposalData; narrative: string; vmRows?: VMSpec[] } = await req.json();

    const pricing  = calculatePricing(data);
    const hw       = calculateHW(buildHWInput(data));
    const vmRows: VMSpec[] = (vmRowsIn && vmRowsIn.length > 0) ? vmRowsIn : hw.vmSpecs;

    const isAnnual = data.pricingModel === "annual";
    const pl       = data.productLine ?? "ksafety";
    const plLabel  = PRODUCT_LINES[pl]?.label ?? "K-Safety";
    const dateStr  = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Vendor list
    const vendors: string[] = [];
    (data.cctvVendors ?? []).forEach(v => { if (v.vendorName && !v.isOther) vendors.push(v.vendorName); });
    if (data.k1VideoEnabled) vendors.push("K1-Video (VXG OEM)");
    (data.lprVendors ?? []).forEach(v => { if (v.vendorName && !v.isOther) vendors.push(`LPR – ${v.vendorName}`); });
    (data.faceVendors ?? []).forEach(v => { if (v.vendorName && !v.isOther) vendors.push(`Face – ${v.vendorName}`); });

    // ── Header / Footer ──────────────────────────────────────────────────────
    const docHeader = new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: "KABATONE", bold: true, size: 22, color: C_DARK_BLUE }),
            new TextRun({ text: "  ·  Smart City Solutions  ·  ", size: 20, color: C_GRAY }),
            new TextRun({ text: "www.kabatone.com", size: 20, color: C_MID_BLUE }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C_GOLD, space: 4 } },
          spacing: { after: 100 },
        }),
      ],
    });

    const docFooter = new Footer({
      children: [
        new Paragraph({
          children: [new TextRun({ text: `${data.projectName || `${plLabel} Proposal`}  ·  ${dateStr}  ·  CONFIDENTIAL`, size: 18, color: C_GRAY })],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C_GOLD, space: 4 } },
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
        }),
      ],
    });

    // ── COVER PAGE ─────────────────────────────────────────────────────────
    const cover: (Paragraph | Table)[] = [
      new Paragraph({
        children: [new TextRun({ text: "KABATONE", bold: true, size: 80, color: C_DARK_BLUE })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 500, after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "SMART CITY SOLUTIONS", bold: true, size: 28, color: C_GOLD })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: PRODUCT_LINE_SUBTITLE[pl] ?? "", size: 22, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.projectName || `${plLabel} Platform Proposal`, bold: true, size: 52, color: C_DARK_BLUE })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: C_ACCENT, space: 6 },
        },
      }),
      new Paragraph({ text: "", spacing: { after: 120 } }),
      new Paragraph({
        children: [new TextRun({ text: `Prepared for: ${data.customerName}`, size: 26, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${data.city}, ${data.country}`, size: 24, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Contact: ${data.contactPerson}${data.contactEmail ? ` · ${data.contactEmail}` : ""}`, size: 22, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Prepared by: ${data.salesPerson || "Kabatone Sales Team"}  ·  ${dateStr}`, size: 22, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      ...(vendors.length > 0 ? [
        new Paragraph({ text: "", spacing: { after: 100 } }),
        new Paragraph({
          children: [new TextRun({ text: `Integrated Vendors: ${vendors.join(" · ")}`, size: 20, color: C_MID_BLUE })],
          alignment: AlignmentType.CENTER,
        }),
      ] : []),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...(PRODUCT_LINE_PILLS[pl] ?? []).map((_pill) =>
        new Paragraph({
          children: [],
          spacing: { before: 0, after: 0 },
        }) // Sector pills as spacer
      ).slice(0, 0), // skip pills in docx cover, handled in info section
      new Paragraph({ text: "", spacing: { after: 600 } }),
    ];

    // ── SECTION 1 — WHAT IS K-SAFETY? ─────────────────────────────────────
    const section1: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading(`What is ${plLabel}?`),
      bodyText(PRODUCT_LINE_OVERVIEW[pl] ?? ""),

      // Investment callout
      new Paragraph({ text: "", spacing: { after: 80 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "EBF5FA" },
                borders: {
                  left: { style: BorderStyle.SINGLE, size: 12, color: C_ACCENT },
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "TOTAL INVESTMENT", bold: true, size: 18, color: C_MID_BLUE })],
                    spacing: { before: 80, after: 40 },
                  }),
                  new Paragraph({
                    children: [new TextRun({
                      text: isAnnual ? `${fmt(pricing.annualTotal)} / year` : `${fmt(pricing.perpetualTotal)} (perpetual)`,
                      bold: true, size: 36, color: C_DARK_BLUE,
                    })],
                    spacing: { after: 40 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: `${data.customerName} · ${data.city}, ${data.country} · ${isAnnual ? "Annual Subscription" : "Perpetual License"}`, size: 18, color: C_GRAY })],
                    spacing: { after: 80 },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Sector pills
      new Paragraph({ text: "", spacing: { after: 100 } }),
      new Paragraph({
        children: [new TextRun({ text: "Sectors: ", bold: true, size: 20, color: C_DARK_BLUE }),
          new TextRun({ text: (PRODUCT_LINE_PILLS[pl] ?? []).join("  ·  "), size: 20, color: C_MID_BLUE })],
        spacing: { after: 200 },
      }),
    ];

    // ── SECTION 2 — CORE CAPABILITIES ─────────────────────────────────────
    const section2: (Paragraph | Table)[] = [
      sectionHeading("Core Capabilities"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCellLeft("Capability", C_DARK_BLUE), hCellLeft("Description", C_DARK_BLUE)] }),
          ...CORE_CAPABILITIES.map((cap, i) =>
            new TableRow({
              children: [
                dCell(cap.name, { bold: true, color: C_DARK_BLUE, bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                dCell(cap.desc, { bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
              ],
            })
          ),
        ],
      }),
    ];

    // ── SECTION 3 — USE CASES ─────────────────────────────────────────────
    const useCases = PRODUCT_LINE_USE_CASES[pl] ?? [];
    const section3: (Paragraph | Table)[] = [
      new Paragraph({ text: "", spacing: { after: 160 } }),
      sectionHeading(`Use Cases — ${plLabel}`),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCell("Use Case", C_DARK_BLUE), hCell("Description", C_DARK_BLUE)] }),
          ...useCases.map((uc, i) =>
            new TableRow({
              children: [
                dCell(`${uc.icon}  ${uc.title}`, { bold: true, color: C_DARK_BLUE, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                dCell(uc.desc, { bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
              ],
            })
          ),
        ],
      }),
    ];

    // ── SECTION 4 — PRICING SUMMARY ───────────────────────────────────────
    const hasModified = pricing.lineItems.some(i => i.isModified);
    const section4: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading(`Pricing Summary — ${isAnnual ? "Annual Subscription" : "Perpetual License"}`),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCellLeft("Component"), hCellLeft("Unit"), hCell("Unit Price"), hCell("Total")] }),

          // Platform & Licenses cat-row
          ...(pricing.licenseItems.length > 0 ? [
            new TableRow({ children: [catCell("Platform & Licenses", 4)] }),
            ...pricing.licenseItems.map((item, i) =>
              new TableRow({
                children: [
                  dCell(item.name + (item.isModified ? " *" : ""), { bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                  dCell(item.quantity > 1 ? `${item.quantity} ${item.unitLabel}s` : `per ${item.unitLabel}`, { color: C_GRAY, bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                  dCell(isAnnual ? fmt(item.annualUnit) : fmt(item.perpetualUnit ?? item.annualUnit * PERP_MULTIPLIER), { right: true, bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                  dCell(isAnnual ? fmt(item.annualTotal) : fmt(item.perpetualTotal), { right: true, bold: true, color: C_DARK_BLUE, bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                ],
              })
            ),
          ] : []),

          // Services cat-row
          ...(pricing.serviceItems.length > 0 ? [
            new TableRow({ children: [catCell("Professional Services (one-time)", 4)] }),
            ...pricing.serviceItems.map((item, i) =>
              new TableRow({
                children: [
                  dCell(item.name + (item.isModified ? " *" : ""), { bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                  dCell("Project", { color: C_GRAY, bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                  dCell(fmt(item.annualUnit), { right: true, bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                  dCell(fmt(item.annualTotal), { right: true, bold: true, color: C_DARK_BLUE, bg: i % 2 === 0 ? "FFFFFF" : "F7F9FC" }),
                ],
              })
            ),
          ] : []),

          // Discount row
          ...((data.discount ?? 0) > 0 ? [
            new TableRow({
              children: [
                new TableCell({ columnSpan: 3, children: [new Paragraph({ children: [new TextRun({ text: `Discount (${data.discount}%)`, bold: true, size: 18, color: "16A34A" })], spacing: { before: 40, after: 40 } })] }),
                dCell(`-${fmt(Math.round(pricing.annualTotal / (1 - (data.discount ?? 0) / 100) - pricing.annualTotal))}`, { right: true, bold: true, color: "16A34A" }),
              ],
            }),
          ] : []),

          // Grand total
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 3,
                shading: { type: ShadingType.SOLID, color: C_DARK_BLUE },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 22, color: C_WHITE })], spacing: { before: 60, after: 60 } })],
              }),
              new TableCell({
                shading: { type: ShadingType.SOLID, color: C_DARK_BLUE },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: isAnnual ? `${fmt(pricing.annualTotal)} / yr` : fmt(pricing.perpetualTotal), bold: true, size: 24, color: C_GOLD })], spacing: { before: 60, after: 60 } })],
              }),
            ],
          }),
        ],
      }),
      ...(hasModified ? [new Paragraph({ children: [new TextRun({ text: "* Price modified from default by the sales representative for this proposal.", size: 18, color: C_GRAY, italics: true })], spacing: { before: 80, after: 80 } })] : []),

      // Business model
      subHeading("Business Model"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCell("Annual Subscription", C_MID_BLUE), hCell("Perpetual License", C_DARK_BLUE)] }),
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "EBF5FA" },
                children: [
                  checkItem(`${fmt(pricing.annualTotal)} / year`, C_DARK_BLUE),
                  checkItem("All updates & support included", C_DARK_BLUE),
                  checkItem("Lower upfront cost", C_DARK_BLUE),
                  checkItem(`5-year total: ${fmt(pricing.fiveYearAnnual)}`, C_DARK_BLUE),
                ],
              }),
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "E8EDF3" },
                children: [
                  checkItem(`${fmt(pricing.perpetualTotal)} one-time`, C_DARK_BLUE),
                  checkItem(`${fmt(pricing.year2SupportAnnual)} / yr support from Year 2`, C_DARK_BLUE),
                  checkItem("Asset ownership", C_DARK_BLUE),
                  checkItem(`5-year total: ${fmt(pricing.fiveYearPerpetual)}`, C_DARK_BLUE),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    // ── SECTION 5 — HW INFRASTRUCTURE ────────────────────────────────────
    const totalServers = vmRows.reduce((s, v) => s + v.amount, 0);
    const totalVCPU    = vmRows.reduce((s, v) => s + v.vCores * v.amount, 0);
    const totalRAM     = vmRows.reduce((s, v) => s + v.ramGB * v.amount, 0);
    const totalHDD     = vmRows.reduce((s, v) => s + (v.storageGB > 0 ? v.storageGB : v.localDiskGB) * v.amount, 0);

    const section5: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("HW Infrastructure Requirements"),
      ...(data.deploymentType === "cloud" ? [
        new Paragraph({
          children: [new TextRun({ text: "Cloud deployment — specs below represent AWS EC2 / Azure VM equivalents. Physical server procurement not required.", size: 18, color: C_MID_BLUE })],
          spacing: { before: 40, after: 100 },
        }),
      ] : []),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCellLeft("Service / Server"), hCell("Instances"), hCell("vCPU"), hCell("RAM GB"), hCell("HDD GB")] }),
          ...vmRows.map((vm, i) =>
            new TableRow({
              children: [
                dCell(vm.serverName, { bold: true, color: C_DARK_BLUE, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                dCell(vm.amount.toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                dCell(vm.vCores.toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                dCell(vm.ramGB.toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                dCell((vm.storageGB > 0 ? vm.storageGB : vm.localDiskGB).toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
              ],
            })
          ),
          // Total row
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                shading: { type: ShadingType.SOLID, color: "EBF0F5" },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `TOTAL (${totalServers} servers)`, bold: true, size: 18, color: C_DARK_BLUE })], spacing: { before: 60, after: 60 } })],
              }),
              dCell(totalVCPU.toString(), { center: true, bold: true, color: C_MID_BLUE, bg: "EBF0F5" }),
              dCell(totalRAM.toString(), { center: true, bold: true, color: C_MID_BLUE, bg: "EBF0F5" }),
              dCell(totalHDD.toString(), { center: true, bold: true, color: C_MID_BLUE, bg: "EBF0F5" }),
            ],
          }),
        ],
      }),
    ];

    // K1-Video HW section
    if (data.k1VideoEnabled && (data.k1VideoChannels ?? 0) > 0) {
      const k1 = calculateK1VideoHW({
        cameras: data.k1VideoChannels ?? 0,
        bitrateMbps: data.k1VideoBitrateMbps ?? 2,
        retentionDays: data.k1VideoRetentionDays ?? 30,
        deploymentType: data.deploymentType === "cloud" ? "cloud" : "onprem",
      });
      section5.push(
        subHeading("K1-Video HW Requirements (VXG Embedded VMS)"),
        new Paragraph({
          children: [new TextRun({
            text: `Sizing for ${data.k1VideoChannels} cameras @ ${data.k1VideoBitrateMbps} Mbps / ${data.k1VideoRetentionDays} days — ${data.deploymentType === "cloud" ? "Cloud (AWS)" : "On-Premises"}`,
            size: 18, color: C_GRAY,
          })],
          spacing: { before: 40, after: 80 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [hCellLeft("Service"), hCell("Instances"), hCell("vCPU"), hCell("RAM GB"), hCell("HDD GB")] }),
            ...k1.serviceRows.map((r, i) =>
              new TableRow({
                children: [
                  dCell(r.service, { bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                  dCell(r.instances.toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                  dCell(r.vCPU.toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                  dCell(r.ramGB.toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                  dCell(r.hddGB.toString(), { center: true, bg: i % 2 === 0 ? "FFFFFF" : "F0F7FF" }),
                ],
              })
            ),
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 2,
                  shading: { type: ShadingType.SOLID, color: "EBF0F5" },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `TOTAL (+${Math.round(k1.overheadPct * 100)}% overhead)`, bold: true, size: 18, color: C_DARK_BLUE })], spacing: { before: 60, after: 60 } })],
                }),
                dCell(k1.finalVCPU.toString(), { center: true, bold: true, color: C_MID_BLUE, bg: "EBF0F5" }),
                dCell(k1.finalRAM.toString(), { center: true, bold: true, color: C_MID_BLUE, bg: "EBF0F5" }),
                dCell(k1.finalHDD.toString(), { center: true, bold: true, color: C_MID_BLUE, bg: "EBF0F5" }),
              ],
            }),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Storage — Video: ${round2(k1.videoTB)} TB  |  Archive: ${round2(k1.archiveTB)} TB  |  Total: ${round2(k1.totalStorageTB)} TB`, size: 18, color: C_GRAY })],
          spacing: { before: 80, after: 80 },
        })
      );
    }

    if (hw.totals.grandTotalTB > 0) {
      section5.push(
        new Paragraph({
          children: [new TextRun({ text: `Total Storage Requirement: ${round2(hw.totals.grandTotalTB)} TB`, bold: true, size: 20, color: C_DARK_BLUE })],
          spacing: { before: 80, after: 160 },
        })
      );
    }

    // ── SECTION 6 — WHY K-SAFETY? ─────────────────────────────────────────
    const section6: (Paragraph | Table)[] = [
      sectionHeading(`Why ${plLabel}?`),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCell("Technical Strengths", C_MID_BLUE), hCell("Business Value", C_DARK_BLUE)] }),
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "F7F9FC" },
                children: (WHY_LEFT[pl] ?? []).map(item => bullet(`✓  ${item}`, C_DARK_BLUE)),
              }),
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "EBF0F5" },
                children: (WHY_RIGHT[pl] ?? []).map(item => bullet(`▪  ${item}`, C_MID_BLUE)),
              }),
            ],
          }),
        ],
      }),
    ];

    // ── SECTION 7 — EXECUTIVE SUMMARY ─────────────────────────────────────
    const section7: (Paragraph | Table)[] = [
      new Paragraph({ text: "", spacing: { after: 200 } }),
      sectionHeading("Executive Summary & Next Steps"),
    ];

    if (narrative) {
      const paras = narrative.split("\n\n");
      section7.push(...paras.map(p => bodyText(p.replace(/\n/g, " "))));
    } else {
      const defaultSteps = [
        "Review this proposal with your technical and procurement teams.",
        `Schedule a live demonstration of the ${plLabel} platform.`,
        "Confirm final scope and quantities with your Kabatone account executive.",
        "Proceed with a Proof of Concept (POC) agreement if required.",
        "Sign the agreement and kick off the implementation project.",
      ];
      section7.push(...defaultSteps.map((s, i) => bullet(`${i + 1}.  ${s}`)));
    }

    section7.push(
      new Paragraph({ text: "", spacing: { before: 400 } }),
      new Paragraph({
        children: [new TextRun({ text: "Kabatone Ltd.  ·  contact@kabatone.com  ·  www.kabatone.com", size: 18, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: C_GOLD, space: 4 } },
        spacing: { before: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "This proposal is valid for 30 days from the date issued.", size: 18, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
      }),
    );

    // ── Assemble document ────────────────────────────────────────────────────
    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 20 } },
        },
      },
      sections: [
        {
          headers: { default: docHeader },
          footers: { default: docFooter },
          children: [
            ...cover,
            ...section1,
            ...section2,
            ...section3,
            ...section4,
            ...section5,
            ...section6,
            ...section7,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${(data.projectName || `${plLabel}-Proposal`).replace(/[^a-zA-Z0-9-_]/g, "_")}.docx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export document: " + String(error) }, { status: 500 });
  }
}
