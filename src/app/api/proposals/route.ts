import { NextRequest, NextResponse } from "next/server";
import { ProposalData, PRODUCTS, calculatePricing } from "@/lib/pricing";
import { getProposalsCollection } from "@/lib/mongodb";

// Never cache this route — always query MongoDB for live data
export const dynamic = "force-dynamic";

export interface SavedProposal {
  id: string;
  customerName: string;
  city: string;
  country: string;
  dateCreated: string;       // ISO string
  products: string[];        // human-readable product names
  pricingModel: "annual" | "perpetual";
  annualTotal: number;
  perpetualTotal: number;
  status: "Draft" | "Sent" | "Won" | "Lost";
  formData: ProposalData;
  narrative: string;
}

// ─── ID generator ─────────────────────────────────────────────────────────────

async function generateId(): Promise<string> {
  const col = await getProposalsCollection();
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;

  // Find the highest existing ID for this year
  const latest = await col
    .find({ id: { $regex: `^PROP-${year}-` } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  let next = 1;
  if (latest.length > 0) {
    const m = latest[0].id.match(new RegExp(`^PROP-${year}-(\\d+)$`));
    if (m) next = parseInt(m[1]) + 1;
  }
  return prefix + String(next).padStart(3, "0");
}

// ─── GET /api/proposals — list all ───────────────────────────────────────────

export async function GET() {
  try {
    const col = await getProposalsCollection();
    const all = await col
      .find({}, { projection: { _id: 0, formData: 0 } })
      .sort({ dateCreated: -1 })
      .toArray() as Omit<SavedProposal, "formData">[];
    return NextResponse.json(all);
  } catch (err) {
    console.error("GET proposals error:", err);
    return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
  }
}

// ─── POST /api/proposals — create ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: { formData: ProposalData; narrative?: string } = await req.json();
    const { formData, narrative = "" } = body;

    const col     = await getProposalsCollection();
    const pricing = calculatePricing(formData);

    const saved: SavedProposal = {
      id: await generateId(),
      customerName: formData.customerName,
      city: formData.city,
      country: formData.country,
      dateCreated: new Date().toISOString(),
      products: formData.selectedProducts
        .map((id) => PRODUCTS.find((p) => p.id === id)?.name ?? id)
        .filter(Boolean),
      pricingModel: formData.pricingModel,
      annualTotal: pricing.annualTotal,
      perpetualTotal: pricing.perpetualTotal,
      status: "Draft",
      formData,
      narrative,
    };

    await col.insertOne(saved);

    return NextResponse.json({ id: saved.id, status: "ok" });
  } catch (err) {
    console.error("Save proposal error:", err);
    return NextResponse.json({ error: "Failed to save proposal" }, { status: 500 });
  }
}
