import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  Packer,
} from "docx";
import { ProposalData, calculatePricing, calculateHardware } from "@/lib/pricing";

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export async function POST(req: NextRequest) {
  try {
    const { data, narrative }: { data: ProposalData; narrative: string } = await req.json();
    const pricing = calculatePricing(data);
    const hw = calculateHardware(data);

    const darkBlue = "1A3A5C";

    const headerCell = (text: string) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { type: ShadingType.SOLID, color: darkBlue },
      });

    const dataCell = (text: string, bold = false) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold, size: 20 })],
          }),
        ],
      });

    const doc = new Document({
      sections: [
        {
          children: [
            // Cover
            new Paragraph({
              children: [new TextRun({ text: "KABATONE", bold: true, size: 48, color: darkBlue })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "K-Safety Smart City Platform", size: 28, color: "555555" })],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "", spacing: { before: 400 } }),
            new Paragraph({
              children: [new TextRun({ text: data.projectName || "Project Proposal", bold: true, size: 40, color: darkBlue })],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [new TextRun({ text: `Prepared for: ${data.customerName} – ${data.city}, ${data.country}`, size: 24 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Contact: ${data.contactPerson} | ${data.contactEmail}`, size: 20, color: "666666" })],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [new TextRun({ text: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), size: 20, color: "666666" })],
              alignment: AlignmentType.CENTER,
            }),

            // Executive Summary
            new Paragraph({ text: "", spacing: { before: 600 } }),
            new Paragraph({
              text: "Executive Summary",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: narrative || "See full proposal for details.", size: 22 })],
              spacing: { after: 400 },
            }),

            // Pricing Table
            new Paragraph({
              text: "Pricing Summary",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    headerCell("Product"),
                    headerCell("Qty"),
                    headerCell("Unit"),
                    headerCell("Annual (per unit)"),
                    headerCell("Annual Total"),
                    headerCell("Perpetual Total"),
                  ],
                }),
                ...pricing.lineItems.map(
                  (item) =>
                    new TableRow({
                      children: [
                        dataCell(item.name),
                        dataCell(item.quantity.toString(), false),
                        dataCell(item.unitLabel),
                        dataCell(fmt(item.annualUnit)),
                        dataCell(fmt(item.annualTotal)),
                        dataCell(fmt(item.perpetualTotal)),
                      ],
                    })
                ),
                new TableRow({
                  children: [
                    new TableCell({
                      columnSpan: 4,
                      children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true, size: 22 })] })],
                    }),
                    dataCell(fmt(pricing.annualTotal), true),
                    dataCell(fmt(pricing.perpetualTotal), true),
                  ],
                }),
              ],
            }),

            // 5-year TCO
            new Paragraph({
              text: "5-Year Cost Comparison",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Table({
              width: { size: 60, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [headerCell("Model"), headerCell("5-Year Total Cost")],
                }),
                new TableRow({
                  children: [dataCell("Annual Subscription (×5)"), dataCell(fmt(pricing.fiveYearAnnual))],
                }),
                new TableRow({
                  children: [dataCell("Perpetual + 4 years support"), dataCell(fmt(pricing.fiveYearPerpetual))],
                }),
              ],
            }),

            // HW Infrastructure
            new Paragraph({
              text: "Hardware Infrastructure Requirements",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [headerCell("Server / Component"), headerCell("Quantity"), headerCell("Notes")],
                }),
                ...hw.servers.map(
                  (sv) =>
                    new TableRow({
                      children: [dataCell(sv.name), dataCell(sv.qty.toString()), dataCell(sv.notes)],
                    })
                ),
                new TableRow({
                  children: [
                    new TableCell({
                      columnSpan: 1,
                      children: [new Paragraph({ children: [new TextRun({ text: "Total Servers", bold: true })] })],
                    }),
                    dataCell(hw.total.toString(), true),
                    dataCell(""),
                  ],
                }),
              ],
            }),

            // Next Steps
            new Paragraph({
              text: "Next Steps",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            ...[
              "Review this proposal and share it with your technical and procurement teams.",
              "Schedule a live demonstration of the K-Safety platform.",
              "Confirm final scope and quantities with your Kabatone account executive.",
              "Proceed with a Proof of Concept (POC) agreement if required.",
              "Sign the agreement and kick off the implementation project.",
            ].map(
              (step, i) =>
                new Paragraph({
                  children: [new TextRun({ text: `${i + 1}. ${step}`, size: 22 })],
                  spacing: { after: 100 },
                })
            ),

            new Paragraph({ text: "", spacing: { before: 400 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Kabatone Ltd. · contact@kabatone.com · www.kabatone.com",
                  size: 18,
                  color: "888888",
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${data.projectName || "K-Safety-Proposal"}.docx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export document" }, { status: 500 });
  }
}
