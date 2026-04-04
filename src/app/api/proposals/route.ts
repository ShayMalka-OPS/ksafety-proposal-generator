import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { ProposalData, PRODUCTS, calculatePricing } from "@/lib/pricing";

const DATA_PATH = join(process.cwd(), "src", "data", "proposals.json");

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

// ─── File helpers ─────────────────────────────────────────────────────────────

function readAll(): SavedProposal[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as SavedProposal[];
  } catch {
    return [];
  }
}

function writeAll(proposals: SavedProposal[]) {
  const dir = join(process.cwd(), "src", "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(proposals, null, 2), "utf-8");
}

function generateId(existing: SavedProposal[]): string {
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;
  const nums = existing
    .map((p) => {
      const m = p.id.match(new RegExp(`^PROP-${year}-(\\d+)$`));
      return m ? parseInt(m[1]) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length === 0 ? 1 : Math.max(...nums) + 1;
  return prefix + String(next).padStart(3, "0");
}

// ─── GET /api/proposals — list all ───────────────────────────────────────────

export async function GET() {
  const all = readAll();
  // Return without formData for the list view (smaller payload)
  const list = all
    .sort((a, b) => b.dateCreated.localeCompare(a.dateCreated))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ formData: _fd, ...rest }) => rest);
  return NextResponse.json(list);
}

// ─── POST /api/proposals — create ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: { formData: ProposalData; narrative?: string } = await req.json();
    const { formData, narrative = "" } = body;

    const all     = readAll();
    const pricing = calculatePricing(formData);

    const saved: SavedProposal = {
      id: generateId(all),
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

    all.push(saved);
    writeAll(all);

    return NextResponse.json({ id: saved.id, status: "ok" });
  } catch (err) {
    console.error("Save proposal error:", err);
    return NextResponse.json({ error: "Failed to save proposal" }, { status: 500 });
  }
}
