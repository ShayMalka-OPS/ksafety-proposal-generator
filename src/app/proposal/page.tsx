"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ProposalData,
  PRODUCTS,
  KSHARE_PRICING,
  SERVICES_PRICING,
  KShareTier,
  ServicesPackage,
  calculatePricing,
  calculateHardware,
} from "@/lib/pricing";

const STEPS = [
  { id: 1, label: "Customer Info" },
  { id: 2, label: "Products" },
  { id: 3, label: "Configure" },
  { id: 4, label: "Pricing" },
  { id: 5, label: "Generate" },
];

const DARK_BLUE = "#1A3A5C";
const GOLD = "#F0A500";
const MID_BLUE = "#1E6BA8";

const emptyData: ProposalData = {
  customerName: "",
  city: "",
  country: "",
  contactPerson: "",
  contactEmail: "",
  projectName: "",
  selectedProducts: [],
  quantities: {},
  kshareТier: "entry",
  servicesPackage: null,
  pricingModel: "annual",
};

function fmt(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

// ---------- Step components ----------

function Step1({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const field = (label: string, key: keyof ProposalData, placeholder: string, type = "text") => (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: DARK_BLUE }}>
        {label}
      </label>
      <input
        type={type}
        value={(data[key] as string) ?? ""}
        onChange={(e) => onChange({ [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ ["--tw-ring-color" as string]: MID_BLUE }}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Customer Information</h2>
      <p className="text-sm text-gray-500">Enter the details of the customer and project.</p>
      <div className="grid md:grid-cols-2 gap-5">
        {field("Customer / Organization Name *", "customerName", "e.g. City of Tel Aviv")}
        {field("City *", "city", "e.g. Tel Aviv")}
        {field("Country *", "country", "e.g. Israel")}
        {field("Contact Person *", "contactPerson", "e.g. David Cohen")}
        {field("Contact Email", "contactEmail", "e.g. d.cohen@telaviv.gov.il", "email")}
        {field("Project Name *", "projectName", "e.g. Tel Aviv Smart Safety Platform")}
      </div>
    </div>
  );
}

function Step2({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const toggle = (id: string) => {
    const current = data.selectedProducts;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ selectedProducts: next });
  };

  const categories = [
    { key: "platform", label: "Platform & Licenses" },
    { key: "video", label: "Video & AI Modules" },
    { key: "app", label: "Mobile Applications" },
    { key: "services", label: "Professional Services" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Product Selection</h2>
      <p className="text-sm text-gray-500">Select the products and modules to include in this proposal.</p>
      {categories.map((cat) => (
        <div key={cat.key}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: MID_BLUE }}>
            {cat.label}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {PRODUCTS.filter((p) => p.category === cat.key).map((product) => {
              const selected = data.selectedProducts.includes(product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => toggle(product.id)}
                  className="text-left p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: selected ? GOLD : "#e5e7eb",
                    backgroundColor: selected ? "rgba(240,165,0,0.05)" : "white",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2"
                      style={{
                        borderColor: selected ? GOLD : "#d1d5db",
                        backgroundColor: selected ? GOLD : "white",
                      }}
                    >
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: DARK_BLUE }}>
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {product.annualPrice > 0
                          ? `${fmt(product.annualPrice)}/${product.unitLabel}/yr`
                          : "Pricing varies"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Step3({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const setQty = (id: string, val: number) => {
    onChange({ quantities: { ...data.quantities, [id]: val } });
  };

  const selected = PRODUCTS.filter((p) => data.selectedProducts.includes(p.id));

  if (selected.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">📦</div>
        <p>No products selected. Go back and select at least one product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Configure Products</h2>
          <p className="text-sm text-gray-500">Set quantities and choose your pricing model.</p>
        </div>
        {/* Pricing model toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100">
          {(["annual", "perpetual"] as const).map((model) => (
            <button
              key={model}
              onClick={() => onChange({ pricingModel: model })}
              className="px-4 py-2 rounded-md text-sm font-semibold transition-all capitalize"
              style={
                data.pricingModel === model
                  ? { backgroundColor: DARK_BLUE, color: "white" }
                  : { color: "#6b7280" }
              }
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {selected.map((product) => {
          const qty = data.quantities[product.id] ?? (product.hasQuantity ? 1 : 1);
          const unitPrice =
            data.pricingModel === "annual" ? product.annualPrice : product.perpetualPrice;
          const lineTotal = product.hasQuantity ? unitPrice * qty : unitPrice;

          // Special cases
          if (product.id === "kshare") {
            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold" style={{ color: DARK_BLUE }}>{product.name}</div>
                </div>
                <select
                  value={data.kshareТier}
                  onChange={(e) => onChange({ kshareТier: e.target.value as KShareTier })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(KSHARE_PRICING).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <div className="mt-2 text-right text-sm font-semibold" style={{ color: MID_BLUE }}>
                  {KSHARE_PRICING[data.kshareТier].price === 0
                    ? "Included"
                    : `${fmt(KSHARE_PRICING[data.kshareТier].price)}/year`}
                </div>
              </div>
            );
          }

          if (product.id === "services") {
            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="font-semibold mb-3" style={{ color: DARK_BLUE }}>{product.name}</div>
                <div className="grid md:grid-cols-3 gap-3">
                  {(Object.entries(SERVICES_PRICING) as [ServicesPackage, { label: string; price: number }][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => onChange({ servicesPackage: k })}
                      className="p-3 rounded-lg border-2 text-left transition-all"
                      style={{
                        borderColor: data.servicesPackage === k ? GOLD : "#e5e7eb",
                        backgroundColor: data.servicesPackage === k ? "rgba(240,165,0,0.05)" : "white",
                      }}
                    >
                      <div className="text-xs font-semibold" style={{ color: DARK_BLUE }}>{v.label}</div>
                      <div className="text-sm mt-1 font-bold" style={{ color: MID_BLUE }}>{fmt(v.price)}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // Standard product
          return (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold" style={{ color: DARK_BLUE }}>{product.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {fmt(unitPrice)} per {product.unitLabel}
                    {data.pricingModel === "perpetual" ? " (one-time)" : "/year"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {product.hasQuantity && (
                    <>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQty(product.id, Math.max(1, qty - 1))}
                          className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm"
                        >−</button>
                        <input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) => setQty(product.id, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center py-2 text-sm border-x border-gray-300 focus:outline-none"
                        />
                        <button
                          onClick={() => setQty(product.id, qty + 1)}
                          className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm"
                        >+</button>
                      </div>
                      <div className="text-xs text-gray-400">{product.unitLabel}s</div>
                    </>
                  )}
                  <div className="text-right min-w-[100px]">
                    <div className="font-bold text-lg" style={{ color: DARK_BLUE }}>
                      {fmt(lineTotal)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {data.pricingModel === "annual" ? "/year" : "one-time"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step4({ data }: { data: ProposalData }) {
  const pricing = calculatePricing(data);
  const hw = calculateHardware(data);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Pricing Summary</h2>
        <p className="text-sm text-gray-500">Full pricing breakdown for {data.customerName || "the customer"}.</p>
      </div>

      {/* Pricing table */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: DARK_BLUE }}>
              <th className="text-left px-4 py-3 text-white font-semibold">Product</th>
              <th className="text-center px-4 py-3 text-white font-semibold">Qty</th>
              <th className="text-right px-4 py-3 text-white font-semibold">Annual Total</th>
              <th className="text-right px-4 py-3 text-white font-semibold">Perpetual Total</th>
            </tr>
          </thead>
          <tbody>
            {pricing.lineItems.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {item.quantity} {item.unitLabel}
                  {item.quantity !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3 text-right">{fmt(item.annualTotal)}</td>
                <td className="px-4 py-3 text-right">{fmt(item.perpetualTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "rgba(26,58,92,0.05)" }}>
              <td colSpan={2} className="px-4 py-3 font-bold text-right" style={{ color: DARK_BLUE }}>
                TOTAL
              </td>
              <td className="px-4 py-3 text-right font-bold text-lg" style={{ color: DARK_BLUE }}>
                {fmt(pricing.annualTotal)}
                <div className="text-xs font-normal text-gray-400">/year</div>
              </td>
              <td className="px-4 py-3 text-right font-bold text-lg" style={{ color: DARK_BLUE }}>
                {fmt(pricing.perpetualTotal)}
                <div className="text-xs font-normal text-gray-400">one-time</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5-year comparison */}
      <div>
        <h3 className="font-bold text-base mb-3" style={{ color: DARK_BLUE }}>5-Year Cost Comparison</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              label: "Annual Subscription",
              value: pricing.fiveYearAnnual,
              note: `${fmt(pricing.annualTotal)} × 5 years`,
              color: MID_BLUE,
            },
            {
              label: "Perpetual License",
              value: pricing.fiveYearPerpetual,
              note: `${fmt(pricing.perpetualTotal)} + 4yr support @ ${fmt(pricing.year2SupportAnnual)}/yr`,
              color: DARK_BLUE,
            },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-sm text-gray-500 mb-1">{item.label} – 5 Years</div>
              <div className="text-3xl font-bold mb-1" style={{ color: item.color }}>
                {fmt(item.value)}
              </div>
              <div className="text-xs text-gray-400">{item.note}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * Perpetual: Year 2+ support = 20% of perpetual license per year. Annual is typically lower over 5 years.
        </p>
      </div>

      {/* HW Infrastructure */}
      <div>
        <h3 className="font-bold text-base mb-3" style={{ color: DARK_BLUE }}>Hardware Infrastructure Requirements</h3>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: MID_BLUE }}>
                <th className="text-left px-4 py-3 text-white font-semibold">Server / Component</th>
                <th className="text-center px-4 py-3 text-white font-semibold">Qty</th>
                <th className="text-left px-4 py-3 text-white font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {hw.servers.map((sv, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2.5 font-medium">{sv.name}</td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: DARK_BLUE }}>
                    {sv.qty}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{sv.notes}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-3" style={{ color: DARK_BLUE }}>Total Servers</td>
                <td className="px-4 py-3 text-center text-xl" style={{ color: GOLD }}>{hw.total}</td>
                <td className="px-4 py-3 text-xs text-gray-400">Minimum hardware footprint</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Step5({
  data,
  narrative,
  setNarrative,
  generating,
  setGenerating,
}: {
  data: ProposalData;
  narrative: string;
  setNarrative: (s: string) => void;
  generating: boolean;
  setGenerating: (b: boolean) => void;
}) {
  const pricing = calculatePricing(data);

  const generateNarrative = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.narrative) setNarrative(json.narrative);
      else alert("Error generating narrative: " + (json.error || "Unknown error"));
    } catch {
      alert("Network error. Check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const exportDocx = async () => {
    const res = await fetch("/api/export-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, narrative }),
    });
    if (!res.ok) { alert("Export failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.projectName || "K-Safety-Proposal"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Generate Proposal</h2>
          <p className="text-sm text-gray-500">Generate the AI executive summary, then export.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={generateNarrative}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-60"
            style={{ backgroundColor: DARK_BLUE, color: "white" }}
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>🤖 Generate AI Summary</>
            )}
          </button>
          <button
            onClick={exportDocx}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border-2 transition-all hover:opacity-80"
            style={{ borderColor: MID_BLUE, color: MID_BLUE }}
          >
            📝 Export Word (.docx)
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: GOLD, color: DARK_BLUE }}
          >
            📄 Print / PDF
          </button>
        </div>
      </div>

      {/* Proposal preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:shadow-none" id="proposal-preview">
        {/* Cover */}
        <div className="p-10 text-center" style={{ backgroundColor: DARK_BLUE }}>
          <div
            className="inline-block w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl mb-4"
            style={{ backgroundColor: GOLD, color: DARK_BLUE }}
          >
            K
          </div>
          <div className="text-white text-3xl font-bold">KABATONE</div>
          <div className="text-sm tracking-widest mt-1" style={{ color: GOLD }}>SMART CITY SOLUTIONS</div>
          <div className="text-white text-2xl font-semibold mt-8">{data.projectName || "K-Safety Platform Proposal"}</div>
          <div className="text-blue-200 mt-2">
            Prepared for {data.customerName} — {data.city}, {data.country}
          </div>
          <div className="text-blue-300 text-sm mt-1">
            {data.contactPerson} · {data.contactEmail}
          </div>
          <div className="text-blue-300 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Executive Summary */}
          <section>
            <h3 className="text-lg font-bold mb-3 pb-2 border-b-2" style={{ color: DARK_BLUE, borderColor: GOLD }}>
              Executive Summary
            </h3>
            {narrative ? (
              <p className="text-gray-700 leading-relaxed text-sm">{narrative}</p>
            ) : (
              <div className="text-gray-400 text-sm italic py-4 text-center bg-gray-50 rounded-lg">
                Click &quot;Generate AI Summary&quot; above to create a personalized executive summary for this proposal.
              </div>
            )}
          </section>

          {/* Pricing */}
          <section>
            <h3 className="text-lg font-bold mb-3 pb-2 border-b-2" style={{ color: DARK_BLUE, borderColor: GOLD }}>
              Pricing Summary
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: DARK_BLUE }}>
                  <th className="text-left px-3 py-2 text-white">Product</th>
                  <th className="text-center px-3 py-2 text-white">Qty</th>
                  <th className="text-right px-3 py-2 text-white">Annual</th>
                  <th className="text-right px-3 py-2 text-white">Perpetual</th>
                </tr>
              </thead>
              <tbody>
                {pricing.lineItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <td className="px-3 py-2 border-b border-gray-100">{item.name}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-center text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-100 text-right">{fmt(item.annualTotal)}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-right">{fmt(item.perpetualTotal)}</td>
                  </tr>
                ))}
                <tr className="font-bold" style={{ backgroundColor: "rgba(26,58,92,0.08)" }}>
                  <td colSpan={2} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>TOTAL</td>
                  <td className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>{fmt(pricing.annualTotal)}/yr</td>
                  <td className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>{fmt(pricing.perpetualTotal)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 5-Year TCO */}
          <section>
            <h3 className="text-lg font-bold mb-3 pb-2 border-b-2" style={{ color: DARK_BLUE, borderColor: GOLD }}>
              5-Year Cost Comparison
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Annual Subscription × 5</div>
                <div className="text-2xl font-bold mt-1" style={{ color: MID_BLUE }}>{fmt(pricing.fiveYearAnnual)}</div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(26,58,92,0.08)" }}>
                <div className="text-sm text-gray-500">Perpetual + 4yr Support</div>
                <div className="text-2xl font-bold mt-1" style={{ color: DARK_BLUE }}>{fmt(pricing.fiveYearPerpetual)}</div>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section>
            <h3 className="text-lg font-bold mb-3 pb-2 border-b-2" style={{ color: DARK_BLUE, borderColor: GOLD }}>
              Next Steps
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              {[
                "Review this proposal with your technical and procurement teams.",
                "Schedule a live demonstration of the K-Safety platform.",
                "Confirm final scope and quantities with your Kabatone account executive.",
                "Proceed with a Proof of Concept (POC) if required.",
                "Sign the agreement and kick off the implementation project.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: GOLD }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t">
            Kabatone Ltd. · contact@kabatone.com · www.kabatone.com
            <br />
            This proposal is valid for 30 days from the date above.
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Wizard ----------

export default function ProposalPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProposalData>(emptyData);
  const [narrative, setNarrative] = useState("");
  const [generating, setGenerating] = useState(false);

  const update = (partial: Partial<ProposalData>) => setData((d) => ({ ...d, ...partial }));

  const canProceed = () => {
    if (step === 1) return data.customerName && data.city && data.country && data.contactPerson && data.projectName;
    if (step === 2) return data.selectedProducts.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header style={{ backgroundColor: DARK_BLUE }} className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: GOLD }}
          >
            K
          </div>
          <div>
            <div className="text-white font-bold tracking-wide">KABATONE</div>
            <div className="text-xs" style={{ color: GOLD }}>SMART CITY SOLUTIONS</div>
          </div>
        </Link>
        <div className="text-white text-sm opacity-80">Proposal Generator</div>
      </header>

      {/* Progress bar */}
      <div style={{ backgroundColor: MID_BLUE }} className="px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  onClick={() => s.id < step && setStep(s.id)}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                  disabled={s.id > step}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={
                      s.id === step
                        ? { backgroundColor: GOLD, color: DARK_BLUE }
                        : s.id < step
                        ? { backgroundColor: "rgba(240,165,0,0.5)", color: "white" }
                        : { backgroundColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }
                    }
                  >
                    {s.id < step ? "✓" : s.id}
                  </div>
                  <span
                    className="text-xs whitespace-nowrap hidden sm:block"
                    style={{ color: s.id === step ? GOLD : s.id < step ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)" }}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2"
                    style={{ backgroundColor: i < step - 1 ? "rgba(240,165,0,0.5)" : "rgba(255,255,255,0.2)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {step === 1 && <Step1 data={data} onChange={update} />}
            {step === 2 && <Step2 data={data} onChange={update} />}
            {step === 3 && <Step3 data={data} onChange={update} />}
            {step === 4 && <Step4 data={data} />}
            {step === 5 && (
              <Step5
                data={data}
                narrative={narrative}
                setNarrative={setNarrative}
                generating={generating}
                setGenerating={setGenerating}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
              ) : (
                <Link
                  href="/"
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  ← Home
                </Link>
              )}
              {step < 5 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: canProceed() ? GOLD : "#e5e7eb", color: canProceed() ? DARK_BLUE : "#9ca3af" }}
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
