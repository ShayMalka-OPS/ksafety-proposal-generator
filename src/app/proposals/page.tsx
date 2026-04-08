"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const DARK_BLUE = "#1A3A5C";
const GOLD      = "#F0A500";
const MID_BLUE  = "#1E6BA8";

type ProposalStatus = "Draft" | "Sent" | "Won" | "Lost";

interface ProposalRow {
  id: string;
  customerName: string;
  city: string;
  country: string;
  dateCreated: string;
  products: string[];
  pricingModel: "annual" | "perpetual";
  annualTotal: number;
  perpetualTotal: number;
  status: ProposalStatus;
}

const STATUS_COLORS: Record<ProposalStatus, { bg: string; text: string; border: string }> = {
  Draft: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  Sent:  { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  Won:   { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  Lost:  { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
};

function fmt(n: number) { return `$${n.toLocaleString("en-US")}`; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

function DashboardStats({ proposals }: { proposals: ProposalRow[] }) {
  const total    = proposals.length;
  const won      = proposals.filter((p) => p.status === "Won").length;
  const sent     = proposals.filter((p) => p.status === "Sent").length;
  const pipeline = proposals
    .filter((p) => p.status !== "Lost")
    .reduce((s, p) => s + p.annualTotal, 0);

  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

  const stats = [
    { label: "Total Proposals", value: total.toString(),      sub: "all time" },
    { label: "Won",             value: `${won}`,              sub: `${winRate}% win rate` },
    { label: "Sent / Active",   value: `${sent}`,             sub: "awaiting decision" },
    { label: "Pipeline Value",  value: fmt(pipeline),         sub: "annual (excl. Lost)" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-[8px] border border-gray-200 p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
          <div className="text-2xl font-black" style={{ color: DARK_BLUE }}>{s.value}</div>
          <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Status badge / dropdown ──────────────────────────────────────────────────

function StatusBadge({
  id,
  status,
  onUpdate,
}: {
  id: string;
  status: ProposalStatus;
  onUpdate: (id: string, status: ProposalStatus) => void;
}) {
  const c = STATUS_COLORS[status];
  return (
    <select
      value={status}
      onChange={(e) => onUpdate(id, e.target.value as ProposalStatus)}
      className="text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      {(["Draft", "Sent", "Won", "Lost"] as ProposalStatus[]).map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteModal({
  proposal,
  onConfirm,
  onCancel,
}: {
  proposal: ProposalRow;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[8px] shadow-xl p-8 max-w-sm w-full mx-4">
        <h3 className="text-lg font-bold mb-2" style={{ color: DARK_BLUE }}>Delete Proposal?</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{proposal.id}</strong> for <strong>{proposal.customerName}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-blue-50"
            style={{ border: "2px solid #1A3A5C", color: "#1A3A5C" }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#E74C3C" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const [proposals, setProposals]     = useState<ProposalRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProposalRow | null>(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "All">("All");
  const [exporting, setExporting]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/proposals");
      const data = await res.json();
      setProposals(Array.isArray(data) ? data : []);
    } catch { setProposals([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: ProposalStatus) => {
    setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const deleteProposal = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/proposals/${deleteTarget.id}`, { method: "DELETE" });
    setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const exportDocx = async (id: string) => {
    setExporting(id);
    try {
      const full = await fetch(`/api/proposals/${id}`).then((r) => r.json());
      const res  = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: full.formData, narrative: full.narrative ?? "" }),
      });
      if (!res.ok) { alert("Export failed"); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `${full.formData?.projectName || id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Export error."); }
    finally { setExporting(null); }
  };

  // Filter
  const visible = proposals.filter((p) => {
    const matchSearch =
      !search ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black" style={{ color: DARK_BLUE }}>Proposal History</h1>
              <p className="text-sm text-gray-500 mt-1">View, edit, and manage all your K-Safety proposals.</p>
            </div>
            <Link
              href="/proposal"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: GOLD, color: DARK_BLUE }}
            >
              + New Proposal
            </Link>
          </div>

          {/* Dashboard stats */}
          <DashboardStats proposals={proposals} />

          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="Search by customer, city, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-48 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6BA8]"
            />
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              {(["All", "Draft", "Sent", "Won", "Lost"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={
                    statusFilter === s
                      ? { backgroundColor: DARK_BLUE, color: "white" }
                      : { color: "#6b7280" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[8px] border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-gray-400 text-sm">Loading proposals…</div>
            ) : visible.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-4xl mb-3">📋</div>
                <div className="text-gray-400 text-sm">
                  {proposals.length === 0
                    ? "No proposals yet. Create your first one!"
                    : "No proposals match your filters."}
                </div>
                {proposals.length === 0 && (
                  <Link
                    href="/proposal"
                    className="inline-block mt-4 px-6 py-2.5 rounded-lg font-semibold text-sm"
                    style={{ backgroundColor: GOLD, color: DARK_BLUE }}
                  >
                    Create First Proposal →
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: DARK_BLUE }}>
                      {["ID", "Customer", "City", "Date", "Products", "Model", "Annual Total", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-white font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold" style={{ color: MID_BLUE }}>{p.id}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: DARK_BLUE }}>
                          {p.customerName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.city}, {p.country}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {fmtDate(p.dateCreated)}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {p.products.join(", ")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={
                              p.pricingModel === "annual"
                                ? { backgroundColor: "#eff6ff", color: "#1e40af" }
                                : { backgroundColor: "#faf5ff", color: "#6b21a8" }
                            }
                          >
                            {p.pricingModel === "annual" ? "Annual" : "Perpetual"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: DARK_BLUE }}>
                          {fmt(p.annualTotal)}
                          <div className="text-xs font-normal text-gray-400">/year</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge id={p.id} status={p.status} onUpdate={updateStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            {/* View / Edit */}
                            <Link
                              href={`/proposal?id=${p.id}`}
                              className="px-2 py-1 text-xs rounded-md font-semibold border transition-all hover:opacity-80"
                              style={{ borderColor: MID_BLUE, color: MID_BLUE }}
                              title="View / Edit"
                            >
                              ✏ Edit
                            </Link>
                            {/* Export */}
                            <button
                              onClick={() => exportDocx(p.id)}
                              disabled={exporting === p.id}
                              className="px-2 py-1 text-xs rounded-md font-semibold border transition-all hover:opacity-80 disabled:opacity-50"
                              style={{ borderColor: MID_BLUE, color: MID_BLUE }}
                              title="Export Word document"
                            >
                              {exporting === p.id ? "…" : "⬇ Word"}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="px-2 py-1 text-xs rounded-md font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                              title="Delete"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {visible.length > 0 && (
            <div className="mt-3 text-xs text-gray-400 text-right">
              Showing {visible.length} of {proposals.length} proposals
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          proposal={deleteTarget}
          onConfirm={deleteProposal}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
