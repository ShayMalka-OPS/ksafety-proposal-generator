import { NextRequest, NextResponse } from "next/server";
import { ProposalData, calculatePricing } from "@/lib/pricing";
import { calculateHW, buildHWInput } from "@/lib/hw-calculator";
import { getSelectedProductSections } from "@/lib/content-extractor";

export const maxDuration = 60;

// ─── Brand colours ─────────────────────────────────────────────────────────────
const DARK_BLUE = "#1A3A5C";
const MID_BLUE  = "#1E6BA8";
const GOLD      = "#F0A500";

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── Build self-contained HTML proposal ──────────────────────────────────────

function buildHtml(data: ProposalData, narrative: string): string {
  const pricing  = calculatePricing(data);
  const hw       = calculateHW(buildHWInput(data));
  const sections = getSelectedProductSections(data.selectedProducts);
  const dateStr  = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const refNum   = `KSP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const vmRows = hw.vmSpecs.map((vm, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="color:${MID_BLUE};font-weight:600">${vm.group}</td>
      <td style="font-family:monospace">${vm.serverName}</td>
      <td style="text-align:center">${vm.vmPhysical}</td>
      <td style="text-align:center">${vm.amount}</td>
      <td>${vm.os}</td>
      <td style="text-align:center">${vm.vCores}</td>
      <td style="text-align:center">${vm.ramGB} GB</td>
      <td style="text-align:center">${vm.localDiskGB} GB</td>
      <td style="text-align:center">${vm.storageGB > 0 ? vm.storageGB + " GB" : "—"}</td>
      <td style="color:#555;font-size:11px">${vm.comments}</td>
    </tr>`).join("");

  const isAnnual = data.pricingModel === "annual";
  const lineRows = pricing.lineItems.map((item, i) => {
    const total = item.isService
      ? fmt(item.annualTotal)
      : isAnnual ? fmt(item.annualTotal) : fmt(item.perpetualTotal);
    return `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td>${item.name}${item.isModified ? ' <span style="color:#b45309;font-weight:700;font-size:11px">*</span>' : ""}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td>${item.unitLabel}</td>
      <td style="text-align:right">${item.annualUnit > 0 ? fmt(item.annualUnit) : "—"}</td>
      <td style="text-align:right">${total}</td>
    </tr>`;
  }).join("");

  const productSections = sections.map(sec => `
    <div style="margin-bottom:24px">
      <h4 style="color:${DARK_BLUE};border-bottom:2px solid ${GOLD};padding-bottom:4px;margin-bottom:8px">
        ${sec.title} <span style="color:#666;font-weight:400;font-size:13px">${sec.subtitle}</span>
      </h4>
      <p style="color:#444;line-height:1.6;margin-bottom:12px">${sec.overview}</p>
      <table style="width:100%;border-collapse:collapse">
        ${sec.capabilities.map((cap, i) => `
          <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
            <td style="padding:6px 10px;font-weight:600;color:${MID_BLUE};width:30%">${cap.name}</td>
            <td style="padding:6px 10px;color:#444">${cap.description}</td>
          </tr>`).join("")}
      </table>
    </div>`).join("");

  const storageRows = hw.subsystemStorage.map((s, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="font-weight:600">${s.subsystem}</td>
      <td style="text-align:center">${s.numSensors}</td>
      <td style="text-align:center">${s.retentionDays}d</td>
      <td style="text-align:right">${round2(s.totalImageTB)}</td>
      <td style="text-align:right">${round2(s.totalMetaTB)}</td>
      <td style="text-align:right;font-weight:600">${round2(s.totalTB)}</td>
    </tr>`).join("");


  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${data.projectName || "K-Safety Proposal"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 13px; color: #222; background: #fff; }
  .page { max-width: 900px; margin: 0 auto; padding: 0; }

  /* Cover */
  .cover { background: linear-gradient(135deg,${DARK_BLUE} 0%,${MID_BLUE} 100%); color:#fff; padding:60px 48px; text-align:center; page-break-after:always; }
  .cover .logo { display:inline-block; width:56px; height:56px; background:${GOLD}; color:${DARK_BLUE}; font-size:28px; font-weight:900; border-radius:12px; line-height:56px; margin-bottom:12px; }
  .cover h1 { font-size:32px; font-weight:900; letter-spacing:2px; }
  .cover .tagline { color:${GOLD}; letter-spacing:3px; font-size:11px; margin-top:4px; }
  .cover h2 { font-size:22px; font-weight:600; margin-top:32px; }
  .cover p  { color:rgba(255,255,255,0.75); margin-top:6px; font-size:13px; }

  /* Sections */
  .content { padding: 36px 48px; }
  .section-heading { font-size:18px; font-weight:800; color:${DARK_BLUE}; border-bottom:2px solid ${GOLD}; padding-bottom:6px; margin:32px 0 16px; }
  .sub-heading { font-size:14px; font-weight:700; color:${MID_BLUE}; margin:20px 0 8px; }

  /* Tables */
  table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; }
  th { background:${DARK_BLUE}; color:#fff; padding:7px 10px; text-align:left; font-size:11px; }
  td { padding:6px 10px; border-bottom:1px solid #eee; vertical-align:top; }
  .table-mid th { background:${MID_BLUE}; }
  .table-gold th { background:${GOLD}; color:${DARK_BLUE}; }
  .total-row td { background:${DARK_BLUE}; color:#fff; font-weight:700; padding:8px 10px; }
  .subtotal-row td { background:rgba(26,58,92,0.06); font-weight:600; color:${MID_BLUE}; }

  /* 5-year cards */
  .cards { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0; }
  .card { border-radius:8px; padding:16px; }
  .card-annual { background:#eff6ff; border:1px solid #bfdbfe; }
  .card-perp   { background:#f9fafb; border:1px solid #e5e7eb; }
  .card-winner { background:#ecfdf5; border:1px solid #6ee7b7; }
  .card-label  { font-size:11px; color:#666; }
  .card-amount { font-size:22px; font-weight:900; margin:4px 0; }
  .card-save   { font-size:11px; font-weight:700; color:#16a34a; }

  /* Info grid */
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
  .info-row  { display:flex; gap:8px; font-size:12px; }
  .info-label{ color:#888; width:120px; flex-shrink:0; }
  .info-value{ font-weight:600; color:#222; }

  /* Footer */
  .footer { text-align:center; font-size:11px; color:#888; margin-top:40px; padding-top:16px; border-top:1px solid #e5e7eb; }

  @page { margin: 14mm 12mm; size: A4; }
  @media print {
    .cover { page-break-after: always; }
    .section { page-break-inside: avoid; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="no-print" style="position:fixed;top:12px;right:16px;z-index:999;display:flex;gap:8px">
  <button onclick="window.print()" style="background:${DARK_BLUE};color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer">
    🖨️ Print / Save as PDF
  </button>
  <button onclick="window.close()" style="background:#e5e7eb;color:#222;border:none;padding:10px 16px;border-radius:6px;font-size:13px;cursor:pointer">
    ✕ Close
  </button>
</div>
<div class="page">

  <!-- COVER -->
  <div class="cover">
    <div class="logo">K</div>
    <h1>KABATONE</h1>
    <div class="tagline">SMART CITY SOLUTIONS</div>
    <h2>${data.projectName || "K-Safety Platform Proposal"}</h2>
    <p>Prepared for ${data.customerName} — ${data.city}, ${data.country}</p>
    <p>${data.contactPerson}${data.contactEmail ? ` · ${data.contactEmail}` : ""}</p>
    <p style="margin-top:4px">${dateStr}</p>
  </div>

  <div class="content">

    <!-- SECTION 1 -->
    <div class="section">
      <div class="section-heading">Section 1 — Proposal Information</div>
      <div class="info-grid">
        <div class="info-row"><span class="info-label">Customer:</span><span class="info-value">${data.customerName}</span></div>
        <div class="info-row"><span class="info-label">City / Country:</span><span class="info-value">${data.city}, ${data.country}</span></div>
        <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${data.contactPerson}</span></div>
        <div class="info-row"><span class="info-label">Prepared by:</span><span class="info-value">${data.salesPerson || "Kabatone Sales"}</span></div>
        <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${dateStr}</span></div>
        <div class="info-row"><span class="info-label">Ref No.:</span><span class="info-value">${refNum}</span></div>
        <div class="info-row"><span class="info-label">Pricing Model:</span><span class="info-value">${data.pricingModel === "annual" ? "Annual Subscription" : "Perpetual License"}</span></div>
        <div class="info-row"><span class="info-label">Annual Total:</span><span class="info-value" style="color:${DARK_BLUE}">${fmt(pricing.annualTotal)} / year</span></div>
        <div class="info-row"><span class="info-label">Perpetual Total:</span><span class="info-value" style="color:${MID_BLUE}">${fmt(pricing.perpetualTotal)} one-time</span></div>
      </div>
    </div>

    <!-- SECTION 2 -->
    <div class="section">
      <div class="section-heading">Section 2 — Product Descriptions</div>
      ${productSections}
    </div>

    <!-- SECTION 3 -->
    <div class="section">
      <div class="section-heading">Section 3 — Infrastructure Requirements</div>
      <div class="sub-heading">3a. VM Specification</div>
      <table>
        <thead><tr><th>Group</th><th>Server</th><th>Type</th><th>Qty</th><th>OS</th><th>vCores</th><th>RAM</th><th>C: Drive</th><th>Storage</th><th>Comments</th></tr></thead>
        <tbody>
          ${vmRows}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">TOTAL VMs</td>
            <td style="text-align:center;color:${GOLD}">${hw.totals.totalVMs}</td>
            <td colspan="6"></td>
          </tr>
        </tbody>
      </table>

      ${hw.subsystemStorage.length > 0 ? `
      <div class="sub-heading">3b. Storage Sizing Breakdown</div>
      <table class="table-mid">
        <thead><tr><th>Subsystem</th><th>Sensors</th><th>Retention</th><th>Image TB</th><th>Meta TB</th><th>Total TB</th></tr></thead>
        <tbody>
          ${storageRows}
          <tr style="background:rgba(26,58,92,0.06);font-weight:700">
            <td colspan="5" style="text-align:right;color:${DARK_BLUE}">Grand Total</td>
            <td style="text-align:right;color:${GOLD}">${round2(hw.totals.grandTotalTB)} TB</td>
          </tr>
        </tbody>
      </table>` : ""}
    </div>

    <!-- SECTION 4 -->
    <div class="section">
      <div class="section-heading">Section 4 — Pricing Summary</div>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Unit</th><th style="text-align:right">Unit/yr</th><th style="text-align:right">${isAnnual ? "Annual Total" : "Perpetual Total"}</th></tr></thead>
        <tbody>
          ${lineRows}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">GRAND TOTAL</td>
            <td></td>
            <td style="text-align:right">${isAnnual ? `${fmt(pricing.annualTotal)}/yr` : fmt(pricing.perpetualTotal)}</td>
          </tr>
        </tbody>
      </table>

      <div class="sub-heading">5-Year Cost Projection</div>
      <div class="cards" style="grid-template-columns:1fr">
        <div class="card card-winner">
          <div class="card-label">${isAnnual ? "Annual × 5 years" : "Perpetual + 4yr annual support"}</div>
          <div class="card-amount" style="color:${isAnnual ? MID_BLUE : DARK_BLUE}">${isAnnual ? fmt(pricing.fiveYearAnnual) : fmt(pricing.fiveYearPerpetual)}</div>
          ${isAnnual
            ? `<div style="font-size:11px;color:#555;margin-top:2px">${fmt(pricing.annualTotal)}/yr × 5 years</div>`
            : `<div style="font-size:11px;color:#555;margin-top:2px">${fmt(pricing.year2SupportAnnual)}/yr from Year 2</div>`
          }
        </div>
      </div>
    </div>

    <!-- SECTION 5 -->
    <div class="section">
      <div class="section-heading">Section 5 — Executive Summary &amp; Next Steps</div>
      ${narrative
        ? `<p style="line-height:1.7;color:#333">${narrative.replace(/\n\n/g, "</p><p style='line-height:1.7;color:#333;margin-top:12px'>").replace(/\n/g, "<br/>")}</p>`
        : `<ol style="padding-left:20px;color:#444;line-height:2">
            <li>Review this proposal with your technical and procurement teams.</li>
            <li>Schedule a live demonstration of the K-Safety platform.</li>
            <li>Confirm final scope and quantities with your Kabatone account executive.</li>
            <li>Proceed with a Proof of Concept (POC) agreement if required.</li>
            <li>Sign the agreement and kick off the implementation project.</li>
           </ol>`
      }
    </div>

    <div class="footer">
      Kabatone Ltd. · contact@kabatone.com · www.kabatone.com<br/>
      This proposal is valid for 30 days from the date above. · Ref: ${refNum}
    </div>

  </div>
</div>
</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { data, narrative }: { data: ProposalData; narrative: string } = await req.json();
    const html = buildHtml(data, narrative ?? "");
    // Return the HTML — the client opens it in a new window and triggers window.print()
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
