import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import type { SavedProposal } from "../route";
import { getDataPath } from "@/lib/data-path";

function readAll(): SavedProposal[] {
  const path = getDataPath();
  try {
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, "utf-8")) as SavedProposal[];
  } catch { return []; }
}

function writeAll(proposals: SavedProposal[]) {
  writeFileSync(getDataPath(), JSON.stringify(proposals, null, 2), "utf-8");
}

// ─── GET /api/proposals/[id] ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const all  = readAll();
  const item = all.find((p) => p.id === params.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

// ─── PATCH /api/proposals/[id] — update status or full record ────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body  = await req.json();
    const all   = readAll();
    const idx   = all.findIndex((p) => p.id === params.id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    all[idx] = { ...all[idx], ...body, id: params.id }; // id is immutable
    writeAll(all);
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
  const all     = readAll();
  const filtered = all.filter((p) => p.id !== params.id);
  if (filtered.length === all.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  writeAll(filtered);
  return NextResponse.json({ ok: true });
}
