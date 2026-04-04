import { NextRequest, NextResponse } from "next/server";
import {
  Document, Paragraph, Table, TableRow, TableCell, TextRun,
  HeadingLevel, AlignmentType, WidthType, ShadingType, Packer,
  PageBreak, BorderStyle, Header, Footer, TableLayoutType,
} from "docx";
import { ProposalData, PRODUCTS, calculatePricing } from "@/lib/pricing";
import { calculateHW, buildHWInput } from "@/lib/hw-calculator";
import { getSelectedProductSections } from "@/lib/content-extractor";

// ─── Brand colours ─────────────────────────────────────────────────────────────
const C_DARK_BLUE = "1A3A5C";
const C_MID_BLUE  = "1E6BA8";
const C_GOLD      = "F0A500";
const C_WHITE     = "FFFFFF";
const C_LIGHT     = "F4F6F9";
const C_GRAY      = "666666";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
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

function dCell(text: string, opts: { bold?: boolean; right?: boolean; center?: boolean; color?: string; bg?: string } = {}): TableCell {
  return new TableCell({
    shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
    children: [
      new Paragraph({
        alignment: opts.right ? AlignmentType.RIGHT : opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            size: 18,
            color: opts.color ?? "000000",
          }),
        ],
        spacing: { before: 40, after: 40 },
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: C_DARK_BLUE })],
    spacing: { before: 400, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: C_GOLD, space: 4 },
    },
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
    children: [new TextRun({ text, size: 20, color: "222222" })],
    spacing: { before: 40, after: 80 },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 20 })],
    spacing: { before: 40, after: 40 },
  });
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { data, narrative }: { data: ProposalData; narrative: string } = await req.json();

    const pricing  = calculatePricing(data);
    const hwInput  = buildHWInput(data);
    const hw       = calculateHW(hwInput);
    const sections = getSelectedProductSections(data.selectedProducts);

    const refNum  = `KSP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

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
          children: [
            new TextRun({ text: `${data.projectName || "K-Safety Proposal"}  ·  ${refNum}  ·  ${dateStr}`, size: 18, color: C_GRAY }),
          ],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C_GOLD, space: 4 } },
          spacing: { before: 100 },
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

    // ────────────────────────────────────────────────────────────────────────
    // SECTION 1 — PROPOSAL INFORMATION
    // ────────────────────────────────────────────────────────────────────────
    const section1: (Paragraph | Table)[] = [
      // Cover title block
      new Paragraph({
        children: [new TextRun({ text: "KABATONE", bold: true, size: 72, color: C_DARK_BLUE })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Smart City Solutions", size: 36, color: C_GOLD })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.projectName || "K-Safety Solution Proposal", bold: true, size: 52, color: C_DARK_BLUE })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Prepared for: ${data.customerName} — ${data.city}, ${data.country}`, size: 26, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Contact: ${data.contactPerson}${data.contactEmail ? ` · ${data.contactEmail}` : ""}`, size: 22, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Prepared by: ${data.salesPerson || "Kabatone Sales Team"}`, size: 22, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: dateStr, size: 22, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),

      // Proposal info table
      sectionHeading("Section 1 — Proposal Information"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCell("Proposal Details", C_DARK_BLUE, 2)] }),
          new TableRow({ children: [dCell("Customer / Organization", { bold: true }), dCell(data.customerName)] }),
          new TableRow({ children: [dCell("City / Country", { bold: true }), dCell(`${data.city}, ${data.country}`)] }),
          new TableRow({ children: [dCell("Contact Person", { bold: true }), dCell(data.contactPerson)] }),
          new TableRow({ children: [dCell("Contact Email", { bold: true }), dCell(data.contactEmail)] }),
          new TableRow({ children: [dCell("Prepared By", { bold: true }), dCell(data.salesPerson || "Kabatone Sales Team")] }),
          new TableRow({ children: [dCell("Proposal Date", { bold: true }), dCell(dateStr)] }),
          new TableRow({ children: [dCell("Reference Number", { bold: true }), dCell(refNum)] }),
          new TableRow({ children: [dCell("Pricing Model", { bold: true }), dCell(data.pricingModel === "annual" ? "Annual Subscription" : "Perpetual License")] }),
          new TableRow({ children: [dCell("Total Annual Investment", { bold: true }), dCell(fmt(pricing.annualTotal) + " / year", { color: C_DARK_BLUE, bold: true })] }),
          new TableRow({ children: [dCell("Total Perpetual Investment", { bold: true }), dCell(fmt(pricing.perpetualTotal) + " one-time", { color: C_MID_BLUE, bold: true })] }),
        ],
      }),
      subHeading("Selected Products"),
      ...data.selectedProducts.map((id) => {
        const p = PRODUCTS.find((x) => x.id === id);
        return bullet(p ? p.name : id);
      }),
    ];

    // ────────────────────────────────────────────────────────────────────────
    // SECTION 2 — PRODUCT DESCRIPTIONS
    // ────────────────────────────────────────────────────────────────────────
    const section2: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("Section 2 — Product Descriptions"),
    ];

    for (const sec of sections) {
      section2.push(
        new Paragraph({
          children: [
            new TextRun({ text: sec.title, bold: true, size: 30, color: C_DARK_BLUE }),
            new TextRun({ text: "  " + sec.subtitle, size: 22, color: C_GRAY }),
          ],
          spacing: { before: 300, after: 120 },
        }),
        bodyText(sec.overview),
        subHeading("Core Capabilities"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [hCell("Capability", C_MID_BLUE), hCell("Description", C_MID_BLUE)] }),
            ...sec.capabilities.map((cap) =>
              new TableRow({
                children: [
                  dCell(cap.name, { bold: true, color: C_DARK_BLUE }),
                  dCell(cap.description),
                ],
              })
            ),
          ],
        }),
        ...(sec.additionalSections?.flatMap((add) => [
          subHeading(add.heading),
          ...add.items.map((item) => bullet(item)),
        ]) ?? []),
        ...(sec.licensingNotes ? [
          subHeading("Licensing"),
          bodyText(sec.licensingNotes),
        ] : []),
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // SECTION 3 — INFRASTRUCTURE REQUIREMENTS
    // ────────────────────────────────────────────────────────────────────────
    const section3: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("Section 3 — Infrastructure Requirements"),
      subHeading("3a. VM Specification"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              hCell("Group"), hCell("Server Name"), hCell("Type"),
              hCell("Amt"), hCell("OS"), hCell("vCores"),
              hCell("RAM"), hCell("Local Disk"), hCell("Storage"), hCell("Comments"),
            ],
          }),
          ...hw.vmSpecs.map((vm) =>
            new TableRow({
              children: [
                dCell(vm.group, { bold: true, color: C_MID_BLUE }),
                dCell(vm.serverName, { bold: true }),
                dCell(vm.vmPhysical, { center: true }),
                dCell(vm.amount.toString(), { center: true }),
                dCell(vm.os),
                dCell(vm.vCores.toString(), { center: true }),
                dCell(vm.ramGB + " GB", { center: true }),
                dCell(vm.localDiskGB + " GB", { center: true }),
                dCell(vm.storageGB > 0 ? vm.storageGB + " GB" : "—", { center: true }),
                dCell(vm.comments),
              ],
            })
          ),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 3,
                shading: { type: ShadingType.SOLID, color: C_LIGHT },
                children: [new Paragraph({ children: [new TextRun({ text: "TOTAL VMs", bold: true, size: 20, color: C_DARK_BLUE })], alignment: AlignmentType.RIGHT })],
              }),
              dCell(hw.totals.totalVMs.toString(), { bold: true, center: true, color: C_DARK_BLUE }),
              new TableCell({ columnSpan: 6, children: [new Paragraph({ text: "" })] }),
            ],
          }),
        ],
      }),
    ];

    // 3b Storage
    if (hw.subsystemStorage.length > 0 || hw.videoStorage.channels > 0) {
      section3.push(
        subHeading("3b. Storage Sizing Breakdown"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                hCell("Subsystem"), hCell("Sensors/Channels"),
                hCell("Retention (days)"), hCell("Image Storage (TB)"),
                hCell("Metadata (TB)"), hCell("Total (TB)"),
              ],
            }),
            ...hw.subsystemStorage.map((s) =>
              new TableRow({
                children: [
                  dCell(s.subsystem, { bold: true }),
                  dCell(s.numSensors.toString(), { center: true }),
                  dCell(s.retentionDays.toString(), { center: true }),
                  dCell(round2(s.totalImageTB).toString(), { right: true }),
                  dCell(round2(s.totalMetaTB).toString(), { right: true }),
                  dCell(round2(s.totalTB).toString(), { right: true, bold: true }),
                ],
              })
            ),
            ...(hw.videoStorage.channels > 0 ? [
              new TableRow({
                children: [
                  dCell("CCTV Video", { bold: true }),
                  dCell(`${hw.videoStorage.channels} ch.`, { center: true }),
                  dCell(hw.videoStorage.retentionDays.toString(), { center: true }),
                  dCell(round2(hw.videoStorage.videoTB).toString(), { right: true }),
                  dCell("—", { center: true }),
                  dCell(round2(hw.videoStorage.videoTB).toString(), { right: true, bold: true }),
                ],
              }),
            ] : []),
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 5,
                  shading: { type: ShadingType.SOLID, color: C_LIGHT },
                  children: [new Paragraph({ children: [new TextRun({ text: "Grand Total", bold: true, size: 20, color: C_DARK_BLUE })], alignment: AlignmentType.RIGHT })],
                }),
                dCell(round2(hw.totals.grandTotalTB) + " TB", { bold: true, right: true, color: C_DARK_BLUE }),
              ],
            }),
          ],
        })
      );
    }

    // 3c I/O Performance
    if (hw.totals.peakImageIOps > 0 || hw.totals.videoThroughputMBps > 0) {
      section3.push(
        subHeading("3c. I/O Performance Summary"),
        new Table({
          width: { size: 80, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [hCell("Metric"), hCell("Value")] }),
            new TableRow({ children: [dCell("Peak Image IOPS", { bold: true }), dCell(Math.ceil(hw.totals.peakImageIOps).toLocaleString() + " IOPS")] }),
            new TableRow({ children: [dCell("Peak Metadata IOPS", { bold: true }), dCell(Math.ceil(hw.totals.peakMetaIOps).toLocaleString() + " IOPS")] }),
            new TableRow({ children: [dCell("Video Throughput", { bold: true }), dCell(round2(hw.totals.videoThroughputMBps) + " MB/s")] }),
          ],
        })
      );
    }

    // 3d Dell Recommendation
    const dell = hw.dellRecommendation;
    section3.push(
      subHeading("3d. Dell Hardware Recommendation"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCell("Component"), hCell("Model"), hCell("Specification"), hCell("Qty")] }),
          new TableRow({ children: [dCell("Compute Server", { bold: true }), dCell(dell.compute.model, { bold: true, color: C_MID_BLUE }), dCell(dell.compute.specs), dCell(dell.compute.qty.toString(), { center: true })] }),
          new TableRow({ children: [dCell("Storage Array", { bold: true }), dCell(dell.storage.model, { bold: true, color: C_MID_BLUE }), dCell(dell.storage.capacity), dCell(dell.storage.qty.toString(), { center: true })] }),
          new TableRow({ children: [dCell("Network Switch", { bold: true }), dCell(dell.network.model, { bold: true, color: C_MID_BLUE }), dCell(dell.network.specs), dCell(dell.network.qty.toString(), { center: true })] }),
          new TableRow({ children: [dCell("Operator Workstation", { bold: true }), dCell(dell.workstation.model, { bold: true, color: C_MID_BLUE }), dCell(dell.workstation.specs + "\n" + dell.workstation.note), dCell("Per operator", { center: true })] }),
        ],
      })
    );

    const hasModified = pricing.lineItems.some((i) => i.isModified);

    // ────────────────────────────────────────────────────────────────────────
    // SECTION 4 — PRICING SUMMARY
    // ────────────────────────────────────────────────────────────────────────
    const section4: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("Section 4 — Pricing Summary"),
      subHeading("4a. License & Services Pricing"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              hCell("Product"), hCell("Qty"), hCell("Unit"),
              hCell("Unit Price (Annual)"), hCell("Annual Total"), hCell("Perpetual Total"),
            ],
          }),
          // License rows
          ...pricing.licenseItems.map((item) =>
            new TableRow({
              children: [
                dCell(item.name + (item.isModified ? " *" : "")),
                dCell(item.quantity.toString(), { center: true }),
                dCell(item.unitLabel),
                dCell(item.annualUnit > 0 ? fmt(item.annualUnit) : "—", { right: true }),
                dCell(fmt(item.annualTotal), { right: true }),
                dCell(fmt(item.perpetualTotal), { right: true }),
              ],
            })
          ),
          // Subtotal licenses
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 4,
                shading: { type: ShadingType.SOLID, color: C_LIGHT },
                children: [new Paragraph({ children: [new TextRun({ text: "Subtotal — Licenses", bold: true, size: 20, color: C_MID_BLUE })], alignment: AlignmentType.RIGHT })],
              }),
              dCell(fmt(pricing.licensesAnnual) + "/yr", { bold: true, right: true, color: C_MID_BLUE }),
              dCell(fmt(pricing.licensesPerpetual), { bold: true, right: true, color: C_MID_BLUE }),
            ],
          }),
          // Service rows
          ...pricing.serviceItems.map((item) =>
            new TableRow({
              children: [
                dCell(item.name + (item.isModified ? " *" : "")),
                dCell("1", { center: true }),
                dCell(item.unitLabel),
                dCell(fmt(item.annualUnit), { right: true }),
                dCell(fmt(item.annualTotal), { right: true }),
                dCell("(one-time)", { right: true, color: C_GRAY }),
              ],
            })
          ),
          // Grand Total
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 4,
                shading: { type: ShadingType.SOLID, color: C_DARK_BLUE },
                children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 22, color: C_WHITE })], alignment: AlignmentType.RIGHT })],
              }),
              dCell(fmt(pricing.annualTotal) + "/yr", { bold: true, right: true, color: C_DARK_BLUE }),
              dCell(fmt(pricing.perpetualTotal), { bold: true, right: true, color: C_DARK_BLUE }),
            ],
          }),
        ],
      }),
      ...(hasModified ? [
        new Paragraph({
          children: [new TextRun({ text: "* Price modified from default by the sales representative for this proposal.", size: 18, color: C_GRAY, italics: true })],
          spacing: { before: 80, after: 80 },
        }),
      ] : []),

      subHeading("4c. 5-Year Cost Comparison"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCell("Model"), hCell("Calculation"), hCell("5-Year Total")] }),
          new TableRow({
            children: [
              dCell("Annual Subscription ×5", { bold: true }),
              dCell(`${fmt(pricing.annualTotal)} × 5 years`),
              dCell(fmt(pricing.fiveYearAnnual), { bold: true, right: true, color: C_MID_BLUE }),
            ],
          }),
          new TableRow({
            children: [
              dCell("Perpetual + 4yr Support", { bold: true }),
              dCell(`${fmt(pricing.perpetualTotal)} + ${fmt(pricing.year2SupportAnnual)}/yr × 4`),
              dCell(fmt(pricing.fiveYearPerpetual), { bold: true, right: true }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                shading: { type: ShadingType.SOLID, color: C_LIGHT },
                children: [new Paragraph({ children: [new TextRun({ text: "Annual savings over 5 years", bold: true, size: 20, color: C_DARK_BLUE })], alignment: AlignmentType.RIGHT })],
              }),
              dCell(fmt(pricing.fiveYearPerpetual - pricing.fiveYearAnnual), { bold: true, right: true, color: "007020" }),
            ],
          }),
        ],
      }),

      subHeading("4d. Year 1 Investment"),
      new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [hCell("Pricing Model"), hCell("Year 1 Investment")] }),
          new TableRow({
            children: [
              dCell("Annual Subscription — Year 1", { bold: true }),
              dCell(fmt(pricing.annualTotal) + " per year", { bold: true, right: true, color: C_MID_BLUE }),
            ],
          }),
          new TableRow({
            children: [
              dCell("Perpetual License — Year 1 (one-time)", { bold: true }),
              dCell(fmt(pricing.perpetualTotal) + " one-time", { bold: true, right: true, color: C_DARK_BLUE }),
            ],
          }),
        ],
      }),
    ];

    // ────────────────────────────────────────────────────────────────────────
    // SECTION 5 — NEXT STEPS
    // ────────────────────────────────────────────────────────────────────────
    const section5: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("Section 5 — Next Steps"),
    ];

    if (narrative) {
      section5.push(bodyText(narrative));
    } else {
      const defaultSteps = [
        "Review this proposal with your technical and procurement teams.",
        "Schedule a live demonstration of the K-Safety platform.",
        "Confirm final scope and quantities with your Kabatone account executive.",
        "Proceed with a Proof of Concept (POC) agreement if required.",
        "Sign the agreement and kick off the implementation project.",
      ];
      section5.push(...defaultSteps.map((s, i) => bullet(`${i + 1}. ${s}`)));
    }

    section5.push(
      new Paragraph({ text: "", spacing: { before: 400 } }),
      new Paragraph({
        children: [
          new TextRun({ text: "Kabatone Ltd.  ·  contact@kabatone.com  ·  www.kabatone.com", size: 18, color: C_GRAY }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: C_GOLD, space: 4 } },
        spacing: { before: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "This proposal is valid for 30 days from the date issued.", size: 18, color: C_GRAY })],
        alignment: AlignmentType.CENTER,
      }),
    );

    // ── Assemble document ───────────────────────────────────────────────────
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 20 },
          },
        },
      },
      sections: [
        {
          headers: { default: docHeader },
          footers: { default: docFooter },
          children: [
            ...section1,
            ...section2,
            ...section3,
            ...section4,
            ...section5,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${(data.projectName || "K-Safety-Proposal").replace(/[^a-zA-Z0-9-_]/g, "_")}.docx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export document" }, { status: 500 });
  }
}
