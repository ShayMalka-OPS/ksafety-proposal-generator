import { NextRequest, NextResponse } from "next/server";
import type { SavedProposal } from "../route";
import { getProposalsCollection } from "@/lib/mongodb";

// Never cache this route — always query MongoDB for live data
export const dynamic = "force-dynamic";

// ─── GET /api/proposals/[id] ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const col  = await getProposalsCollection();
    const item = await col.findOne({ id: params.id }, { projection: { _id: 0 } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error("GET proposal error:", err);
    return NextResponse.json({ error: "Failed to load proposal" }, { status: 500 });
  }
}

// ─── PATCH /api/proposals/[id] — update status or full record ────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const col  = await getProposalsCollection();

    // id and _id are immutable — strip them before writing to MongoDB
    const updates = { ...(body as Partial<SavedProposal> & { _id?: unknown }) };
    delete (updates as Record<string, unknown>).id;
    delete (updates as Record<string, unknown>)._id;

    const result = await col.updateOne(
      { id: params.id },
      { $set: updates }
    );

    if (result.matchedCount === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH proposal error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ─── DELETE /api/proposals/[id] ──────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const col    = await getProposalsCollection();
    const result = await col.deleteOne({ id: params.id });

    if (result.deletedCount === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE proposal error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}