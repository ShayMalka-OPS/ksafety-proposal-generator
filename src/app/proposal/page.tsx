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
} from "@/lib/pricing";
import { calculateHW, buildHWInput, SUBSYSTEM_DEFAULTS } from "@/lib/hw-calculator";
import { getSelectedProductSections } from "@/lib/content-extractor";

const STEPS = [
  { id: 1, label: "Customer Info" },
  { id: 2, label: "Products" },
  { id: 3, label: "Configure" },
  { id: 4, label: "Pricing" },
  { id: 5, label: "Generate" },
];

const DARK_BLUE = "#1A3A5C";
const GOLD      = "#F0A500";
const MID_BLUE  = "#1E6BA8";

const DEFAULT_RETENTION = {
  lpr:  SUBSYSTEM_DEFAULTS.lpr.defaultRetentionDays,
  fr:   SUBSYSTEM_DEFAULTS.fr.defaultRetentionDays,
  va:   SUBSYSTEM_DEFAULTS.va.defaultRetentionDays,
  iot:  SUBSYSTEM_DEFAULTS.iot.defaultRetentionDays,
  cctv: 30,
};

const emptyData: ProposalData = {
  customerName: "",
  city: "",
  country: "",
  contactPerson: "",
  contactEmail: "",
  projectName: "",
  salesPerson: "",
  selectedProducts: [],
  quantities: {},
  kshareТier: "entry",
  servicesPackage: null,
  pricingModel: "annual",
  haMode: false,
  videoBitrateMbps: 4,
  retentionDays: { ...DEFAULT_RETENTION },
};

function fmt(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

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
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
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
        {field("Sales Person (Prepared by)", "salesPerson", "e.g. John Smith")}
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const toggle = (id: string) => {
    const current = data.selectedProducts;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ selectedProducts: next });
  };

  const categories = [
    { key: "platform", label: "Platform & Licenses" },
    { key: "video",    label: "Video & AI Modules" },
    { key: "app",      label: "Mobile Applications" },
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

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const setQty = (id: string, val: number) =>
    onChange({ quantities: { ...data.quantities, [id]: val } });

  const setRetention = (key: keyof ProposalData["retentionDays"], val: number) =>
    onChange({ retentionDays: { ...data.retentionDays, [key]: val } });

  const selected = PRODUCTS.filter((p) => data.selectedProducts.includes(p.id));
  const hasLPR   = data.selectedProducts.includes("lpr");
  const hasFR    = data.selectedProducts.includes("face");
  const hasVA    = data.selectedProducts.includes("analytics");
  const hasIoT   = data.selectedProducts.includes("iot");
  const hasCCTV  = data.selectedProducts.includes("cctv");
  const hasAnyHW = hasLPR || hasFR || hasVA || hasIoT || hasCCTV;

  // Live storage estimate
  const hwInput = buildHWInput(data);
  const hwResult = calculateHW(hwInput);
  const { grandTotalTB } = hwResult.totals;

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Configure Products</h2>
          <p className="text-sm text-gray-500">Set quantities, retention periods, and pricing model.</p>
        </div>
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

      {/* Product quantities */}
      <div className="space-y-4">
        {selected.map((product) => {
          const qty       = data.quantities[product.id] ?? 1;
          const unitPrice = data.pricingModel === "annual" ? product.annualPrice : product.perpetualPrice;
          const lineTotal = product.hasQuantity ? unitPrice * qty : unitPrice;

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

      {/* HW Configuration (retention + HA) */}
      {hasAnyHW && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 space-y-5">
          <h3 className="font-bold text-base" style={{ color: DARK_BLUE }}>
            Infrastructure Configuration
          </h3>

          {/* HA Mode */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange({ haMode: !data.haMode })}
              className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
              style={{ backgroundColor: data.haMode ? GOLD : "#d1d5db" }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: data.haMode ? "translateX(20px)" : "translateX(2px)" }}
              />
            </button>
            <div>
              <div className="text-sm font-semibold" style={{ color: DARK_BLUE }}>High Availability (HA) Mode</div>
              <div className="text-xs text-gray-500">Adds one additional app server for failover (+1 VM)</div>
            </div>
          </div>

          {/* Video bitrate */}
          {hasCCTV && (
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: DARK_BLUE }}>
                Video Bitrate per CCTV Channel (Mbps)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={data.videoBitrateMbps}
                  onChange={(e) => onChange({ videoBitrateMbps: Math.max(1, parseFloat(e.target.value) || 4) })}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <span className="text-xs text-gray-500">Mbps (typical: 4 Mbps for 1080p H.265)</span>
              </div>
            </div>
          )}

          {/* Retention periods */}
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: DARK_BLUE }}>
              Data Retention Periods (days)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hasCCTV && (
                <RetentionInput
                  label="CCTV Video"
                  value={data.retentionDays.cctv}
                  onChange={(v) => setRetention("cctv", v)}
                  hint="30 days typical"
                />
              )}
              {hasLPR && (
                <RetentionInput
                  label="LPR"
                  value={data.retentionDays.lpr}
                  onChange={(v) => setRetention("lpr", v)}
                  hint="90 days default"
                />
              )}
              {hasFR && (
                <RetentionInput
                  label="Face Recognition"
                  value={data.retentionDays.fr}
                  onChange={(v) => setRetention("fr", v)}
                  hint="90 days default"
                />
              )}
              {hasVA && (
                <RetentionInput
                  label="Video Analytics"
                  value={data.retentionDays.va}
                  onChange={(v) => setRetention("va", v)}
                  hint="45 days default"
                />
              )}
              {hasIoT && (
                <RetentionInput
                  label="IoT Sensors"
                  value={data.retentionDays.iot}
                  onChange={(v) => setRetention("iot", v)}
                  hint="90 days default"
                />
              )}
            </div>
          </div>

          {/* Live storage estimate */}
          <div className="rounded-lg p-4 border border-blue-200 bg-white">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: MID_BLUE }}>
              Live Storage Estimate
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {hwResult.totals.imageStorageTB > 0 && (
                <StoragePill label="Image/Object" value={`${round2(hwResult.totals.imageStorageTB)} TB`} />
              )}
              {hwResult.totals.metaStorageTB > 0 && (
                <StoragePill label="Metadata" value={`${round2(hwResult.totals.metaStorageTB)} TB`} />
              )}
              {hwResult.totals.videoStorageTB > 0 && (
                <StoragePill label="Video" value={`${round2(hwResult.totals.videoStorageTB)} TB`} />
              )}
              <StoragePill label="Grand Total" value={`${round2(grandTotalTB)} TB`} bold />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RetentionInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: DARK_BLUE }}>{label}</label>
      <input
        type="number"
        min={1}
        max={365}
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      <div className="text-xs text-gray-400 mt-0.5">{hint}</div>
    </div>
  );
}

function StoragePill({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`text-lg ${bold ? "font-black" : "font-bold"}`}
        style={{ color: bold ? GOLD : DARK_BLUE }}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4({ data }: { data: ProposalData }) {
  const pricing  = calculatePricing(data);
  const hwInput  = buildHWInput(data);
  const hw       = calculateHW(hwInput);

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
                  {item.quantity} {item.unitLabel}{item.quantity !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3 text-right">{fmt(item.annualTotal)}</td>
                <td className="px-4 py-3 text-right">{fmt(item.perpetualTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "rgba(26,58,92,0.05)" }}>
              <td colSpan={2} className="px-4 py-3 font-bold text-right" style={{ color: DARK_BLUE }}>TOTAL</td>
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
            { label: "Annual Subscription", value: pricing.fiveYearAnnual,    note: `${fmt(pricing.annualTotal)} × 5 years`, color: MID_BLUE },
            { label: "Perpetual License",   value: pricing.fiveYearPerpetual, note: `${fmt(pricing.perpetualTotal)} + 4yr support @ ${fmt(pricing.year2SupportAnnual)}/yr`, color: DARK_BLUE },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-sm text-gray-500 mb-1">{item.label} – 5 Years</div>
              <div className="text-3xl font-bold mb-1" style={{ color: item.color }}>{fmt(item.value)}</div>
              <div className="text-xs text-gray-400">{item.note}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * Perpetual: Year 2+ support = 20% of perpetual license per year. Annual is typically lower over 5 years.
        </p>
      </div>

      {/* VM Specs table */}
      <div>
        <h3 className="font-bold text-base mb-3" style={{ color: DARK_BLUE }}>VM Infrastructure Requirements</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr style={{ backgroundColor: MID_BLUE }}>
                {["Group","Server Name","Type","Qty","OS","vCores","RAM (GB)","Local Disk","Storage (GB)","Comments"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-white font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hw.vmSpecs.map((vm, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2 font-medium" style={{ color: DARK_BLUE }}>{vm.group}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{vm.serverName}</td>
                  <td className="px-3 py-2">{vm.vmPhysical}</td>
                  <td className="px-3 py-2 text-center">{vm.amount}</td>
                  <td className="px-3 py-2">{vm.os}</td>
                  <td className="px-3 py-2 text-center">{vm.vCores}</td>
                  <td className="px-3 py-2 text-center">{vm.ramGB}</td>
                  <td className="px-3 py-2 text-center">{vm.localDiskGB} GB</td>
                  <td className="px-3 py-2 text-center">{vm.storageGB > 0 ? `${vm.storageGB} GB` : "—"}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs max-w-xs truncate">{vm.comments}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "rgba(26,58,92,0.06)" }} className="font-bold">
                <td colSpan={3} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>TOTAL</td>
                <td className="px-3 py-2 text-center text-lg" style={{ color: GOLD }}>{hw.totals.totalVMs}</td>
                <td colSpan={6} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage sizing */}
      {hw.subsystemStorage.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-3" style={{ color: DARK_BLUE }}>Storage Sizing Breakdown</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: MID_BLUE }}>
                  {["Subsystem","Sensors/Channels","Retention (days)","Image Storage (TB)","Metadata (TB)","Total (TB)"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-white font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hw.subsystemStorage.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 font-semibold">{s.subsystem}</td>
                    <td className="px-4 py-2 text-center">{s.numSensors}</td>
                    <td className="px-4 py-2 text-center">{s.retentionDays}</td>
                    <td className="px-4 py-2 text-right">{round2(s.totalImageTB)}</td>
                    <td className="px-4 py-2 text-right">{round2(s.totalMetaTB)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{round2(s.totalTB)}</td>
                  </tr>
                ))}
                {hw.videoStorage.channels > 0 && (
                  <tr className="bg-white">
                    <td className="px-4 py-2 font-semibold">CCTV Video</td>
                    <td className="px-4 py-2 text-center">{hw.videoStorage.channels}</td>
                    <td className="px-4 py-2 text-center">{hw.videoStorage.retentionDays}</td>
                    <td className="px-4 py-2 text-right">{round2(hw.videoStorage.videoTB)}</td>
                    <td className="px-4 py-2 text-right">—</td>
                    <td className="px-4 py-2 text-right font-semibold">{round2(hw.videoStorage.videoTB)}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: "rgba(26,58,92,0.06)" }} className="font-bold">
                  <td colSpan={5} className="px-4 py-2 text-right" style={{ color: DARK_BLUE }}>Grand Total</td>
                  <td className="px-4 py-2 text-right text-lg" style={{ color: GOLD }}>
                    {round2(hw.totals.grandTotalTB)} TB
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────

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
  const pricing  = calculatePricing(data);
  const hwInput  = buildHWInput(data);
  const hw       = calculateHW(hwInput);
  const sections = getSelectedProductSections(data.selectedProducts);
  const refNum   = `KSP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr  = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

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
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${data.projectName || "K-Safety-Proposal"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => window.print();

  return (
    <div className="space-y-8">
      {/* Action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Generate Proposal</h2>
          <p className="text-sm text-gray-500">Generate AI summary, then export.</p>
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
            ) : "Generate AI Summary"}
          </button>
          <button
            onClick={exportDocx}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border-2 transition-all hover:opacity-80"
            style={{ borderColor: MID_BLUE, color: MID_BLUE }}
          >
            Export Word (.docx)
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: GOLD, color: DARK_BLUE }}
          >
            Print / PDF
          </button>
        </div>
      </div>

      {/* ── Full Proposal Preview ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:shadow-none" id="proposal-preview">

        {/* ── SECTION 1: Cover / Proposal Information ── */}
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
            {data.contactPerson}{data.contactEmail ? ` · ${data.contactEmail}` : ""}
          </div>
          <div className="text-blue-300 text-sm mt-1">{dateStr}</div>
        </div>

        <div className="p-8 space-y-10">
          {/* Proposal info table */}
          <section>
            <SectionHeading>Section 1 — Proposal Information</SectionHeading>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Customer" value={data.customerName} />
              <InfoRow label="City / Country" value={`${data.city}, ${data.country}`} />
              <InfoRow label="Contact Person" value={data.contactPerson} />
              <InfoRow label="Contact Email" value={data.contactEmail} />
              <InfoRow label="Prepared By" value={data.salesPerson || "Kabatone Sales"} />
              <InfoRow label="Date" value={dateStr} />
              <InfoRow label="Reference No." value={refNum} />
              <InfoRow label="Pricing Model" value={data.pricingModel === "annual" ? "Annual Subscription" : "Perpetual License"} />
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Selected Products</div>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {data.selectedProducts.map((id) => {
                  const p = PRODUCTS.find((x) => x.id === id);
                  return p ? <li key={id}>{p.name}</li> : null;
                })}
              </ul>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="rounded-lg p-4 border" style={{ borderColor: GOLD, backgroundColor: "rgba(240,165,0,0.04)" }}>
                <div className="text-xs text-gray-500">Total Annual Investment</div>
                <div className="text-2xl font-bold mt-1" style={{ color: DARK_BLUE }}>{fmt(pricing.annualTotal)}</div>
                <div className="text-xs text-gray-400">per year</div>
              </div>
              <div className="rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500">Total Perpetual Investment</div>
                <div className="text-2xl font-bold mt-1" style={{ color: MID_BLUE }}>{fmt(pricing.perpetualTotal)}</div>
                <div className="text-xs text-gray-400">one-time license</div>
              </div>
            </div>
          </section>

          {/* ── SECTION 2: Product Descriptions ── */}
          <section>
            <SectionHeading>Section 2 — Product Descriptions</SectionHeading>
            <div className="space-y-8">
              {sections.map((sec) => (
                <div key={sec.title} className="space-y-3">
                  <h4 className="text-base font-bold border-b pb-1" style={{ color: DARK_BLUE, borderColor: GOLD }}>
                    {sec.title}
                    <span className="ml-2 text-sm font-normal text-gray-500">{sec.subtitle}</span>
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{sec.overview}</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {sec.capabilities.map((cap) => (
                      <div key={cap.name} className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-bold mb-0.5" style={{ color: MID_BLUE }}>{cap.name}</div>
                        <div className="text-xs text-gray-600 leading-relaxed">{cap.description}</div>
                      </div>
                    ))}
                  </div>
                  {sec.additionalSections?.map((add) => (
                    <div key={add.heading}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DARK_BLUE }}>
                        {add.heading}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {add.items.map((item) => (
                          <span key={item} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 3: Infrastructure Requirements ── */}
          <section>
            <SectionHeading>Section 3 — Infrastructure Requirements</SectionHeading>

            {/* 3a VM Table */}
            <div className="mb-6">
              <SubHeading>3a. VM Specification</SubHeading>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr style={{ backgroundColor: DARK_BLUE }}>
                      {["Group","Server Name","Type","Amt","OS","vCores","RAM","Local Disk","Storage","Comments"].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-white font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hw.vmSpecs.map((vm, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-1.5 font-medium" style={{ color: MID_BLUE }}>{vm.group}</td>
                        <td className="px-3 py-1.5 font-mono">{vm.serverName}</td>
                        <td className="px-3 py-1.5">{vm.vmPhysical}</td>
                        <td className="px-3 py-1.5 text-center">{vm.amount}</td>
                        <td className="px-3 py-1.5">{vm.os}</td>
                        <td className="px-3 py-1.5 text-center">{vm.vCores}</td>
                        <td className="px-3 py-1.5 text-center">{vm.ramGB} GB</td>
                        <td className="px-3 py-1.5 text-center">{vm.localDiskGB} GB</td>
                        <td className="px-3 py-1.5 text-center">{vm.storageGB > 0 ? `${vm.storageGB} GB` : "—"}</td>
                        <td className="px-3 py-1.5 text-gray-500 max-w-xs">{vm.comments}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: "rgba(26,58,92,0.07)" }} className="font-bold">
                      <td colSpan={3} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>TOTAL</td>
                      <td className="px-3 py-2 text-center" style={{ color: GOLD }}>{hw.totals.totalVMs}</td>
                      <td colSpan={6} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3b Storage breakdown */}
            {(hw.subsystemStorage.length > 0 || hw.videoStorage.channels > 0) && (
              <div className="mb-6">
                <SubHeading>3b. Storage Sizing Breakdown</SubHeading>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: MID_BLUE }}>
                        {["Subsystem","Sensors/Channels","Retention (days)","Image Storage (TB)","Metadata (TB)","Total (TB)"].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-white font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hw.subsystemStorage.map((s, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 font-semibold">{s.subsystem}</td>
                          <td className="px-4 py-2 text-center">{s.numSensors}</td>
                          <td className="px-4 py-2 text-center">{s.retentionDays}</td>
                          <td className="px-4 py-2 text-right">{round2(s.totalImageTB)}</td>
                          <td className="px-4 py-2 text-right">{round2(s.totalMetaTB)}</td>
                          <td className="px-4 py-2 text-right font-semibold">{round2(s.totalTB)}</td>
                        </tr>
                      ))}
                      {hw.videoStorage.channels > 0 && (
                        <tr className="bg-white">
                          <td className="px-4 py-2 font-semibold">CCTV Video</td>
                          <td className="px-4 py-2 text-center">{hw.videoStorage.channels} ch.</td>
                          <td className="px-4 py-2 text-center">{hw.videoStorage.retentionDays}</td>
                          <td className="px-4 py-2 text-right">{round2(hw.videoStorage.videoTB)}</td>
                          <td className="px-4 py-2 text-right">—</td>
                          <td className="px-4 py-2 text-right font-semibold">{round2(hw.videoStorage.videoTB)}</td>
                        </tr>
                      )}
                      <tr style={{ backgroundColor: "rgba(26,58,92,0.06)" }} className="font-bold">
                        <td colSpan={5} className="px-4 py-2 text-right" style={{ color: DARK_BLUE }}>Grand Total</td>
                        <td className="px-4 py-2 text-right text-lg" style={{ color: GOLD }}>
                          {round2(hw.totals.grandTotalTB)} TB
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3c I/O Performance */}
            {(hw.totals.peakImageIOps > 0 || hw.totals.videoThroughputMBps > 0) && (
              <div className="mb-6">
                <SubHeading>3c. I/O Performance Summary</SubHeading>
                <div className="grid md:grid-cols-3 gap-4">
                  <MetricCard label="Peak Image IOPS" value={Math.ceil(hw.totals.peakImageIOps).toLocaleString()} unit="IOPS" />
                  <MetricCard label="Peak Metadata IOPS" value={Math.ceil(hw.totals.peakMetaIOps).toLocaleString()} unit="IOPS" />
                  <MetricCard label="Video Throughput" value={round2(hw.totals.videoThroughputMBps).toString()} unit="MB/s" />
                </div>
              </div>
            )}

            {/* 3d Dell Recommendation */}
            <div>
              <SubHeading>3d. Dell Hardware Recommendation</SubHeading>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: "🖥️", label: "Compute", rec: hw.dellRecommendation.compute, detail: `${hw.dellRecommendation.compute.specs} — Qty: ${hw.dellRecommendation.compute.qty}` },
                  { icon: "💾", label: "Storage", rec: hw.dellRecommendation.storage, detail: `${hw.dellRecommendation.storage.capacity} — Qty: ${hw.dellRecommendation.storage.qty}` },
                  { icon: "🔌", label: "Network", rec: hw.dellRecommendation.network, detail: `${hw.dellRecommendation.network.specs} — Qty: ${hw.dellRecommendation.network.qty}` },
                  { icon: "💻", label: "Operator Workstation", rec: hw.dellRecommendation.workstation, detail: `${hw.dellRecommendation.workstation.specs}\n${hw.dellRecommendation.workstation.note}` },
                ].map(({ icon, label, rec, detail }) => (
                  <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{icon}</span>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</div>
                        <div className="text-sm font-bold" style={{ color: DARK_BLUE }}>{rec.model}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── SECTION 4: Pricing Summary ── */}
          <section>
            <SectionHeading>Section 4 — Pricing Summary</SectionHeading>

            {/* 4a License pricing */}
            <SubHeading>4a. License Pricing</SubHeading>
            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr style={{ backgroundColor: DARK_BLUE }}>
                  <th className="text-left px-3 py-2 text-white">Product</th>
                  <th className="text-center px-3 py-2 text-white">Qty</th>
                  <th className="text-right px-3 py-2 text-white">Unit (Annual)</th>
                  <th className="text-right px-3 py-2 text-white">Annual Total</th>
                  <th className="text-right px-3 py-2 text-white">Perpetual Total</th>
                </tr>
              </thead>
              <tbody>
                {pricing.lineItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <td className="px-3 py-2 border-b border-gray-100">{item.name}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-right">{item.annualUnit > 0 ? fmt(item.annualUnit) : "—"}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-right">{fmt(item.annualTotal)}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-right">{fmt(item.perpetualTotal)}</td>
                  </tr>
                ))}
                <tr className="font-bold" style={{ backgroundColor: "rgba(26,58,92,0.08)" }}>
                  <td colSpan={3} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>TOTAL</td>
                  <td className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>{fmt(pricing.annualTotal)}/yr</td>
                  <td className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>{fmt(pricing.perpetualTotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* 4c 5-Year comparison */}
            <SubHeading>4c. 5-Year Cost Comparison</SubHeading>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Annual Subscription × 5 years</div>
                <div className="text-2xl font-bold" style={{ color: MID_BLUE }}>{fmt(pricing.fiveYearAnnual)}</div>
                <div className="text-xs text-green-600 font-semibold mt-1">
                  Recommended — saves {fmt(pricing.fiveYearPerpetual - pricing.fiveYearAnnual)} vs. perpetual
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Perpetual + 4yr Support</div>
                <div className="text-2xl font-bold" style={{ color: DARK_BLUE }}>{fmt(pricing.fiveYearPerpetual)}</div>
                <div className="text-xs text-gray-400 mt-1">{fmt(pricing.year2SupportAnnual)}/yr support from Year 2</div>
              </div>
            </div>

            {/* 4d Grand Total */}
            <SubHeading>4d. Year 1 Investment</SubHeading>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5 text-center" style={{ backgroundColor: DARK_BLUE }}>
                <div className="text-blue-200 text-sm">Annual Model — Year 1</div>
                <div className="text-3xl font-black text-white mt-2">{fmt(pricing.annualTotal)}</div>
                <div style={{ color: GOLD }} className="text-sm mt-1">per year</div>
              </div>
              <div className="rounded-xl p-5 text-center border-2" style={{ borderColor: DARK_BLUE }}>
                <div className="text-gray-500 text-sm">Perpetual Model — Year 1</div>
                <div className="text-3xl font-black mt-2" style={{ color: DARK_BLUE }}>{fmt(pricing.perpetualTotal)}</div>
                <div className="text-gray-400 text-sm mt-1">one-time license</div>
              </div>
            </div>
          </section>

          {/* ── SECTION 5: Next Steps / Executive Summary ── */}
          <section>
            <SectionHeading>Section 5 — Next Steps</SectionHeading>
            {narrative ? (
              <p className="text-gray-700 leading-relaxed text-sm">{narrative}</p>
            ) : (
              <div className="text-gray-400 text-sm italic py-8 text-center bg-gray-50 rounded-lg">
                Click &quot;Generate AI Summary&quot; above to create a personalised executive summary and next steps.
              </div>
            )}
            {!narrative && (
              <ol className="space-y-2 text-sm text-gray-700 mt-4">
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
            )}
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

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-lg font-bold mb-4 pb-2 border-b-2"
      style={{ color: DARK_BLUE, borderColor: GOLD }}
    >
      {children}
    </h3>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: MID_BLUE }}>
      {children}
    </h4>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-32 flex-shrink-0">{label}:</span>
      <span className="font-semibold text-gray-800">{value || "—"}</span>
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: DARK_BLUE }}>{value}</div>
      <div className="text-xs text-gray-400">{unit}</div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function ProposalPage() {
  const [step, setStep]           = useState(1);
  const [data, setData]           = useState<ProposalData>(emptyData);
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

      {/* Progress */}
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
