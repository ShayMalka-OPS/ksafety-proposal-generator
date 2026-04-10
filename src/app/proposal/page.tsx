"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ProposalData,
  PRODUCTS,
  KSHARE_PRICING,
  SERVICES_PRICING,
  KShareTier,
  ServicesPackage,
  ProductLine,
  DeploymentType,
  PRODUCT_LINES,
  PRODUCT_LINE_PRODUCTS,
  calculatePricing,
} from "@/lib/pricing";
import {
  DEFAULT_ANNUAL_PRICES,
  PERP_MULTIPLIER,
  getPriceKey,
  isDefaultPrice,
} from "@/lib/default-prices";
import { calculateHW, buildHWInput, SUBSYSTEM_DEFAULTS, VMSpec } from "@/lib/hw-calculator";
import { getSelectedProductSections } from "@/lib/content-extractor";

const STEPS = [
  { id: 1, label: "Product & Deploy" },
  { id: 2, label: "Customer Info" },
  { id: 3, label: "Products" },
  { id: 4, label: "Configure" },
  { id: 5, label: "Pricing" },
  { id: 6, label: "Generate" },
];

const DARK_BLUE = "#1A3A5C";
const GOLD      = "#FFFFFF";
const MID_BLUE  = "#1E6BA8";

const DEFAULT_RETENTION = {
  lpr:  SUBSYSTEM_DEFAULTS.lpr.defaultRetentionDays,
  fr:   SUBSYSTEM_DEFAULTS.fr.defaultRetentionDays,
  va:   SUBSYSTEM_DEFAULTS.va.defaultRetentionDays,
  iot:  SUBSYSTEM_DEFAULTS.iot.defaultRetentionDays,
  cctv: 30,
};

const emptyData: ProposalData = {
  productLine: "ksafety",
  deploymentType: "onprem",
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
  customPrices: {},
  pricingModel: "annual",
  haMode: false,
  discount: 0,
  videoBitrateMbps: 4,
  retentionDays: { ...DEFAULT_RETENTION },
};

function fmt(n: number) { return `$${n.toLocaleString("en-US")}`; }
function round2(n: number) { return Math.round(n * 100) / 100; }

// ─── Step 0 — Product Line & Deployment Type ──────────────────────────────────

function Step0({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const deployOptions: { value: DeploymentType; label: string; desc: string; icon: string }[] = [
    { value: "onprem",  label: "On-Premises",     desc: "Customer-managed servers in their own data centre or server room", icon: "🏢" },
    { value: "cloud",   label: "Cloud (SaaS/IaaS)",desc: "Hosted on AWS / Azure / GCP — Kabatone manages the infrastructure", icon: "☁️" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Product Line & Deployment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose the product line and deployment model. This shapes which modules appear and the infrastructure language in the proposal.
        </p>
      </div>

      {/* Product line */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: MID_BLUE }}>Product Line</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(Object.entries(PRODUCT_LINES) as [ProductLine, typeof PRODUCT_LINES[ProductLine]][]).map(([key, pl]) => {
            const selected = data.productLine === key;
            return (
              <button
                key={key}
                onClick={() => onChange({ productLine: key, selectedProducts: [] })}
                className="text-left p-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: selected ? MID_BLUE : "#e5e7eb",
                  backgroundColor: selected ? "rgba(30,107,168,0.05)" : "white",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pl.icon}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: DARK_BLUE }}>{pl.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{pl.description}</div>
                  </div>
                  {selected && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: MID_BLUE }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deployment type */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: MID_BLUE }}>Deployment Model</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {deployOptions.map((opt) => {
            const selected = data.deploymentType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange({ deploymentType: opt.value })}
                className="text-left p-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: selected ? MID_BLUE : "#e5e7eb",
                  backgroundColor: selected ? "rgba(30,107,168,0.05)" : "white",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: DARK_BLUE }}>{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </div>
                  {selected && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: MID_BLUE }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {data.deploymentType === "cloud" && (
          <div className="mt-3 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "rgba(30,107,168,0.08)", color: MID_BLUE }}>
            <strong>Cloud deployment:</strong> The infrastructure section will describe a managed cloud setup. HW sizing will reflect VM/instance recommendations rather than physical server specs.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const field = (label: string, key: keyof ProposalData, placeholder: string, type = "text") => (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: DARK_BLUE }}>{label}</label>
      <input
        type={type}
        value={(data[key] as string) ?? ""}
        onChange={(e) => onChange({ [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6BA8]"
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

// ─── Step 2 (now Step 3) — Product selection with inline qty + editable price ──

function Step2({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  // Filter products by the selected product line
  const allowedProductIds = PRODUCT_LINE_PRODUCTS[data.productLine];
  const toggle = (id: string) => {
    const next = data.selectedProducts.includes(id)
      ? data.selectedProducts.filter((x) => x !== id)
      : [...data.selectedProducts, id];
    onChange({ selectedProducts: next });
  };

  const setQty = (id: string, val: number) =>
    onChange({ quantities: { ...data.quantities, [id]: Math.max(1, val) } });

  const setCustomPrice = (key: string, raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) return;
    onChange({ customPrices: { ...data.customPrices, [key]: val } });
  };

  const resetPrice = (key: string) => {
    const cp = { ...data.customPrices };
    delete cp[key];
    onChange({ customPrices: cp });
  };

  const getPrice = (key: string) =>
    data.customPrices[key] ?? DEFAULT_ANNUAL_PRICES[key] ?? 0;

  const modified = (key: string) =>
    key in data.customPrices && !isDefaultPrice(key, data.customPrices[key]);

  const categories = [
    { key: "platform", label: "Platform & Licenses" },
    { key: "video",    label: "Video & AI Modules" },
    { key: "app",      label: "Mobile Applications" },
    { key: "services", label: "Professional Services" },
  ].filter((cat) =>
    PRODUCTS.some((p) => p.category === cat.key && allowedProductIds.includes(p.id))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Product Selection & Pricing</h2>
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: DARK_BLUE }}>
          {PRODUCT_LINES[data.productLine].icon} {PRODUCT_LINES[data.productLine].label}
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Select products, set quantities, and optionally adjust unit prices for this proposal.
      </p>

      {categories.map((cat) => {
        const catProducts = PRODUCTS.filter((p) => p.category === cat.key && allowedProductIds.includes(p.id));
        return (
          <div key={cat.key}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: MID_BLUE }}>
              {cat.label}
            </h3>
            <div className="space-y-2">
              {catProducts.map((product) => {
                const selected = data.selectedProducts.includes(product.id);
                const qty      = data.quantities[product.id] ?? 1;

                // Determine the price key & current price for the selected tier/package
                const priceKey =
                  product.id === "kshare"   ? getPriceKey("kshare",   data.kshareТier)        :
                  product.id === "services" ? getPriceKey("services",  undefined, data.servicesPackage ?? undefined) :
                  product.id;
                const currentPrice  = getPrice(priceKey);
                const isModified    = modified(priceKey);
                const defaultPriceVal = DEFAULT_ANNUAL_PRICES[priceKey] ?? 0;

                return (
                  <div
                    key={product.id}
                    className="rounded-xl border-2 overflow-hidden transition-all"
                    style={{ borderColor: selected ? MID_BLUE : "#e5e7eb" }}
                  >
                    {/* Product toggle row */}
                    <button
                      onClick={() => toggle(product.id)}
                      className="w-full text-left p-4 flex items-center gap-3"
                      style={{ backgroundColor: selected ? "rgba(30,107,168,0.04)" : "white" }}
                    >
                      <div
                        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors"
                        style={{
                          borderColor: selected ? MID_BLUE : "#d1d5db",
                          backgroundColor: selected ? MID_BLUE : "white",
                        }}
                      >
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm" style={{ color: DARK_BLUE }}>
                          {product.name}
                        </div>
                        {!selected && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {DEFAULT_ANNUAL_PRICES[product.id] > 0
                              ? `Default: ${fmt(DEFAULT_ANNUAL_PRICES[product.id])}/${product.unitLabel}/yr`
                              : product.id === "kshare" || product.id === "services"
                              ? "Pricing varies by tier/package"
                              : "Included"}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Expanded config when selected */}
                    {selected && (
                      <div
                        className="px-5 pb-5 pt-1 space-y-4 border-t"
                        style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.02)" }}
                      >
                        {/* K-Share tier */}
                        {product.id === "kshare" && (
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-500">Population Tier</label>
                            <select
                              value={data.kshareТier}
                              onChange={(e) => onChange({ kshareТier: e.target.value as KShareTier })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                              {Object.entries(KSHARE_PRICING).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Services package */}
                        {product.id === "services" && (
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-500">Package</label>
                            <div className="grid grid-cols-3 gap-2">
                              {(Object.entries(SERVICES_PRICING) as [ServicesPackage, { label: string; price: number }][]).map(([k, v]) => (
                                <button
                                  key={k}
                                  onClick={() => onChange({ servicesPackage: k })}
                                  className="p-2 rounded-lg border-2 text-left transition-all"
                                  style={{
                                    borderColor: data.servicesPackage === k ? GOLD : "#e5e7eb",
                                    backgroundColor: data.servicesPackage === k ? "rgba(255,255,255,0.06)" : "white",
                                  }}
                                >
                                  <div className="text-xs font-semibold leading-tight" style={{ color: DARK_BLUE }}>{v.label}</div>
                                  <div className="text-xs mt-1 font-bold" style={{ color: MID_BLUE }}>{fmt(v.price)}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity */}
                        {product.hasQuantity && (
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-500">
                              {product.unitLabel.charAt(0).toUpperCase() + product.unitLabel.slice(1)}s
                            </label>
                            <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden w-fit">
                              <button
                                onClick={() => setQty(product.id, qty - 1)}
                                className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 text-sm"
                              >−</button>
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => setQty(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center py-1.5 text-sm border-x border-gray-300 focus:outline-none"
                              />
                              <button
                                onClick={() => setQty(product.id, qty + 1)}
                                className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 text-sm"
                              >+</button>
                            </div>
                          </div>
                        )}

                        {/* Editable unit price */}
                        {(product.id !== "services" || data.servicesPackage) && (
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-500">
                              Unit Price / Year
                              {product.id === "services" && " (one-time)"}
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-gray-400 text-sm select-none">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={currentPrice}
                                  onChange={(e) => setCustomPrice(priceKey, e.target.value)}
                                  title={`Default: ${fmt(defaultPriceVal)}/${product.unitLabel}/yr`}
                                  className="w-32 pl-7 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6BA8] transition-colors"
                                  style={{
                                    borderColor: isModified ? "#f59e0b" : "#d1d5db",
                                    backgroundColor: isModified ? "#fffbeb" : "white",
                                  }}
                                />
                              </div>
                              {isModified ? (
                                <>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                                    style={{ color: "#92400e", backgroundColor: "#fef3c7", borderColor: "#fde68a" }}>
                                    Modified from default
                                  </span>
                                  <button
                                    onClick={() => resetPrice(priceKey)}
                                    className="text-xs hover:underline" style={{ color: MID_BLUE }}
                                  >
                                    Reset to {fmt(defaultPriceVal)}
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Default: {fmt(defaultPriceVal)}/{product.unitLabel}/yr
                                </span>
                              )}
                            </div>
                            {/* Line total preview */}
                            {product.hasQuantity && (
                              <div className="mt-1 text-xs text-gray-500">
                                {qty} × {fmt(currentPrice)} = <strong style={{ color: DARK_BLUE }}>{fmt(currentPrice * qty)}/yr</strong>
                                {" "}· Perpetual: <strong>{fmt(currentPrice * qty * PERP_MULTIPLIER)}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 3 — HW Configuration ───────────────────────────────────────────────

function Step3({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const setRetention = (key: keyof ProposalData["retentionDays"], val: number) =>
    onChange({ retentionDays: { ...data.retentionDays, [key]: Math.max(1, val) } });

  const hasLPR   = data.selectedProducts.includes("lpr");
  const hasFR    = data.selectedProducts.includes("face");
  const hasVA    = data.selectedProducts.includes("analytics");
  const hasIoT   = data.selectedProducts.includes("iot");
  // CCTV is licensing-only — video handled by 3rd party VMS, no HW sizing
  const hasAnyHW = hasLPR || hasFR || hasVA || hasIoT;

  const hwResult = calculateHW(buildHWInput(data));
  const { grandTotalTB } = hwResult.totals;

  return (
    <div className="space-y-6">
      {/* Pricing model toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Configuration</h2>
          <p className="text-sm text-gray-500">Set the pricing model and infrastructure parameters.</p>
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

      {/* HW config */}
      {hasAnyHW ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 space-y-5">
          <h3 className="font-bold text-base" style={{ color: DARK_BLUE }}>Infrastructure Configuration</h3>

          {/* HA toggle */}
          <div className="flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer"
            style={{ borderColor: data.haMode ? MID_BLUE : "#e5e7eb", backgroundColor: data.haMode ? "rgba(30,107,168,0.05)" : "white" }}
            onClick={() => onChange({ haMode: !data.haMode })}>
            <button
              type="button"
              className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0 mt-0.5"
              style={{ backgroundColor: data.haMode ? MID_BLUE : "#d1d5db" }}
              onClick={(e) => { e.stopPropagation(); onChange({ haMode: !data.haMode }); }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: data.haMode ? "translateX(20px)" : "translateX(2px)" }}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: DARK_BLUE }}>High Availability (HA) Mode</div>
              <div className="text-xs text-gray-500 mt-1">Full HA: dual AD, dedicated integration servers, 3-node Elasticsearch cluster, dual web servers</div>
            </div>
            {data.haMode && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: MID_BLUE, color: "white" }}>ON</span>
            )}
          </div>

          {/* Retention periods — CCTV excluded (handled by 3rd party VMS) */}
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: DARK_BLUE }}>Data Retention (days)</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hasLPR  && <RetInput label="LPR"              value={data.retentionDays.lpr}  onChange={(v) => setRetention("lpr",  v)} hint="90d default" />}
              {hasFR   && <RetInput label="Face Recognition" value={data.retentionDays.fr}   onChange={(v) => setRetention("fr",   v)} hint="90d default" />}
              {hasVA   && <RetInput label="Video Analytics"  value={data.retentionDays.va}   onChange={(v) => setRetention("va",   v)} hint="45d default" />}
              {hasIoT  && <RetInput label="IoT Sensors"      value={data.retentionDays.iot}  onChange={(v) => setRetention("iot",  v)} hint="90d default" />}
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
                <StoragePill label="Metadata"     value={`${round2(hwResult.totals.metaStorageTB)} TB`} />
              )}
              <StoragePill label="Grand Total" value={`${round2(grandTotalTB)} TB`} bold />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-400">
          <div className="text-2xl mb-2">🔧</div>
          <p className="text-sm">No server-side products selected — no HW sizing required.</p>
          <p className="text-xs mt-1">Select LPR, Face Recognition, Video Analytics or IoT Sensors to unlock HW configuration.</p>
          <p className="text-xs mt-1 text-gray-400">Note: CCTV video is handled by 3rd-party VMS — no server sizing required for CCTV.</p>
        </div>
      )}
    </div>
  );
}

function RetInput({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: DARK_BLUE }}>{label}</label>
      <input
        type="number" min={1} max={365} value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      <div className="text-xs text-gray-400 mt-0.5">{hint}</div>
    </div>
  );
}

function StoragePill({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-lg ${bold ? "font-black" : "font-bold"}`} style={{ color: bold ? GOLD : DARK_BLUE }}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

// ─── Step 4 — Pricing Summary ─────────────────────────────────────────────────

function Step4({
  data,
  onChange,
  vmRows,
  setVmRows,
}: {
  data: ProposalData;
  onChange: (d: Partial<ProposalData>) => void;
  vmRows: VMSpec[];
  setVmRows: (rows: VMSpec[]) => void;
}) {
  const pricing     = calculatePricing(data);
  const hasModified = pricing.lineItems.some((i) => i.isModified);
  const discount    = data.discount ?? 0;
  const factor      = 1 - discount / 100;
  const discAnn     = Math.round(pricing.annualTotal        * factor);
  const discPerp    = Math.round(pricing.perpetualTotal     * factor);
  const disc5Ann    = Math.round(pricing.fiveYearAnnual     * factor);
  const disc5Per    = Math.round(pricing.fiveYearPerpetual  * factor);
  const discYr2     = Math.round(pricing.year2SupportAnnual * factor);

  const updateRow = (i: number, field: keyof VMSpec, val: string | number) =>
    setVmRows(vmRows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  const deleteRow = (i: number) => setVmRows(vmRows.filter((_, idx) => idx !== i));
  const addRow = () => setVmRows([...vmRows, {
    group: "Custom", serverName: "", vmPhysical: "VM", amount: 1,
    os: "Windows Server 2022", vCores: 8, ramGB: 16,
    localDiskGB: 100, storageGB: 0, comments: "",
  }]);
  const resetRows = () => setVmRows(calculateHW(buildHWInput(data)).vmSpecs);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Pricing Summary</h2>
        <p className="text-sm text-gray-500">
          Pricing model: <strong>{data.pricingModel === "annual" ? "Annual Subscription" : "Perpetual License"}</strong>
          {" — "}change in Step 3.
        </p>
      </div>

      {/* 4a License pricing */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: DARK_BLUE }}>
              <th className="text-left px-4 py-3 text-white font-semibold">Product</th>
              <th className="text-center px-4 py-3 text-white font-semibold">Qty</th>
              <th className="text-right px-4 py-3 text-white font-semibold">Unit Price/yr</th>
              <th className="text-right px-4 py-3 text-white font-semibold">Annual Total</th>
              <th className="text-right px-4 py-3 text-white font-semibold">Perpetual Total</th>
            </tr>
          </thead>
          <tbody>
            {/* License items */}
            {pricing.licenseItems.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 font-medium">
                  {item.name}{item.isModified && <span className="ml-1 text-yellow-600 font-bold text-xs">*</span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {item.quantity} {item.unitLabel}{item.quantity !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={item.isModified ? { backgroundColor: "#fef3c7", color: "#92400e" } : {}}
                  >
                    {fmt(item.annualUnit)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{fmt(item.annualTotal)}</td>
                <td className="px-4 py-3 text-right">{fmt(item.perpetualTotal)}</td>
              </tr>
            ))}
            {/* Subtotal licenses */}
            <tr style={{ backgroundColor: "rgba(26,58,92,0.04)" }}>
              <td colSpan={3} className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider" style={{ color: MID_BLUE }}>
                Subtotal — Licenses
              </td>
              <td className="px-4 py-2 text-right font-bold" style={{ color: MID_BLUE }}>{fmt(pricing.licensesAnnual)}</td>
              <td className="px-4 py-2 text-right font-bold" style={{ color: MID_BLUE }}>{fmt(pricing.licensesPerpetual)}</td>
            </tr>

            {/* Services */}
            {pricing.serviceItems.map((item, i) => (
              <tr key={`svc-${i}`} className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-600">
                  {item.name}{item.isModified && <span className="ml-1 text-yellow-600 font-bold text-xs">*</span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">1</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={item.isModified ? { backgroundColor: "#fef3c7", color: "#92400e" } : {}}
                  >
                    {fmt(item.annualUnit)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{fmt(item.annualTotal)}</td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs italic">(not subject to ×3.5)</td>
              </tr>
            ))}
            {pricing.serviceItems.length > 0 && (
              <tr style={{ backgroundColor: "rgba(26,58,92,0.04)" }}>
                <td colSpan={3} className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider" style={{ color: MID_BLUE }}>
                  Subtotal — Services
                </td>
                <td className="px-4 py-2 text-right font-bold" style={{ color: MID_BLUE }}>{fmt(pricing.servicesTotal)}</td>
                <td className="px-4 py-2 text-right font-bold text-gray-500">{fmt(pricing.servicesTotal)}</td>
              </tr>
            )}

            {/* Grand Total — with inline discount input */}
            <tr style={{ backgroundColor: DARK_BLUE }}>
              <td colSpan={2} className="px-4 py-3 text-right font-black text-white">GRAND TOTAL</td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-white text-xs font-semibold">Discount:</span>
                  <input
                    type="number" min={0} max={100} step={0.5}
                    value={discount}
                    onChange={(e) => onChange({ discount: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                    className="w-14 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)" }}
                  />
                  <span className="text-white text-xs">%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-black text-white text-base">
                {discount > 0 && <div className="text-xs line-through opacity-50">{fmt(pricing.annualTotal)}</div>}
                {fmt(discAnn)}
                <div className="text-xs font-normal opacity-70">/year</div>
              </td>
              <td className="px-4 py-3 text-right font-black text-white text-base">
                {discount > 0 && <div className="text-xs line-through opacity-50">{fmt(pricing.perpetualTotal)}</div>}
                {fmt(discPerp)}
                <div className="text-xs font-normal opacity-70">one-time</div>
              </td>
            </tr>
          </tbody>
        </table>
        {hasModified && (
          <div className="px-4 py-2 text-xs text-yellow-700 bg-yellow-50 border-t border-yellow-100">
            * Price modified from default. These custom prices will be reflected in the exported proposal.
          </div>
        )}
      </div>

      {/* 5-Year Cost Comparison — discounted values */}
      <div className="rounded-xl border-2 p-6 space-y-4" style={{ borderColor: MID_BLUE }}>
        <h3 className="font-black text-base uppercase tracking-wider" style={{ color: DARK_BLUE }}>
          5-Year Total Cost Comparison
          {discount > 0 && <span className="ml-2 text-sm font-normal text-green-600">({discount}% discount applied)</span>}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
            <div className="text-xs text-gray-500 mb-1">Annual Model</div>
            <div className="text-sm text-gray-600">{fmt(discAnn)} × 5 years</div>
            <div className="text-2xl font-black mt-1" style={{ color: MID_BLUE }}>{fmt(disc5Ann)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Perpetual Model</div>
            <div className="text-sm text-gray-600">
              {fmt(discPerp)} + {fmt(discYr2)}/yr support × 4
            </div>
            <div className="text-2xl font-black mt-1" style={{ color: DARK_BLUE }}>{fmt(disc5Per)}</div>
          </div>
        </div>
        {disc5Ann < disc5Per && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "rgba(30,107,168,0.08)", color: DARK_BLUE }}
          >
            <span>💰</span>
            You save <strong style={{ color: MID_BLUE }}>{fmt(disc5Per - disc5Ann)}</strong> over 5 years with the Annual Subscription model.
          </div>
        )}
      </div>

      {/* VM Infrastructure — fully editable */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base" style={{ color: DARK_BLUE }}>VM Infrastructure ({vmRows.length} VMs)</h3>
          <div className="flex gap-2">
            <button onClick={resetRows}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: DARK_BLUE, color: DARK_BLUE }}>
              Reset to Calculated
            </button>
            <button onClick={addRow}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white"
              style={{ backgroundColor: MID_BLUE }}>
              + Add Row
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr style={{ backgroundColor: DARK_BLUE }}>
                {["Server Name","OS","vCores","RAM GB","Local GB","Storage GB","Comments",""].map((h, idx) => (
                  <th key={idx} className="text-left px-2 py-2 text-white font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vmRows.map((vm, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-1">
                    <input value={vm.serverName} onChange={(e) => updateRow(i, "serverName", e.target.value)}
                      className="w-28 border rounded px-1.5 py-0.5 font-mono text-xs focus:outline-none focus:ring-1"
                      style={{ borderColor: "#d1d5db" }} />
                  </td>
                  <td className="px-2 py-1">
                    <input value={vm.os} onChange={(e) => updateRow(i, "os", e.target.value)}
                      className="w-36 border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1"
                      style={{ borderColor: "#d1d5db" }} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={vm.vCores} onChange={(e) => updateRow(i, "vCores", parseInt(e.target.value) || 0)}
                      className="w-12 border rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1"
                      style={{ borderColor: "#d1d5db" }} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={vm.ramGB} onChange={(e) => updateRow(i, "ramGB", parseInt(e.target.value) || 0)}
                      className="w-14 border rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1"
                      style={{ borderColor: "#d1d5db" }} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={vm.localDiskGB} onChange={(e) => updateRow(i, "localDiskGB", parseInt(e.target.value) || 0)}
                      className="w-14 border rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1"
                      style={{ borderColor: "#d1d5db" }} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={vm.storageGB} onChange={(e) => updateRow(i, "storageGB", parseInt(e.target.value) || 0)}
                      className="w-16 border rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1"
                      style={{ borderColor: "#d1d5db" }} />
                  </td>
                  <td className="px-2 py-1">
                    <input value={vm.comments} onChange={(e) => updateRow(i, "comments", e.target.value)}
                      className="w-48 border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1"
                      style={{ borderColor: "#d1d5db" }} />
                  </td>
                  <td className="px-2 py-1">
                    <button onClick={() => deleteRow(i)}
                      className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove row">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5 — Generate ────────────────────────────────────────────────────────

function Step5({
  data,
  narrative,
  setNarrative,
  generating,
  setGenerating,
  savedId,
  setSavedId,
  vmRows,
}: {
  data: ProposalData;
  narrative: string;
  setNarrative: (s: string) => void;
  generating: boolean;
  setGenerating: (b: boolean) => void;
  savedId: string | null;
  setSavedId: (id: string | null) => void;
  vmRows: VMSpec[];
}) {
  const [saving, setSaving]     = useState(false);
  const [currency, setCurrency] = useState("USD");
  const pricing  = calculatePricing(data);
  const sections = getSelectedProductSections(data.selectedProducts);
  const dateStr  = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const refNum   = savedId ?? `KSP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-DRAFT`;

  const fmtCurrency = (usd: number) => {
    const rates: Record<string, number> = { USD: 1,   NIS: 3.7,  MXN: 17.5 };
    const syms:  Record<string, string> = { USD: "$", NIS: "₪",  MXN: "MX$" };
    return `${syms[currency]}${Math.round(usd * rates[currency]).toLocaleString("en-US")}`;
  };

  // Used only for subsystem storage summary (vmSpecs come from vmRows prop)
  const hw = calculateHW(buildHWInput(data));

  // Internal save helper — used by both auto-save and the manual button
  const persistProposal = async (narrativeText: string, existingId: string | null): Promise<string | null> => {
    if (existingId) {
      // Update the existing saved proposal with the latest narrative
      await fetch(`/api/proposals/${existingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative: narrativeText }),
      }).catch(console.error);
      return existingId;
    }
    const res  = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: data, narrative: narrativeText }),
    });
    const json = await res.json();
    return json.id ?? null;
  };

  const generateNarrative = async () => {
    setGenerating(true);
    try {
      const res  = await fetch("/api/generate-proposal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.narrative) {
        setNarrative(json.narrative);
        // Auto-save / update history with the generated narrative
        const id = await persistProposal(json.narrative, savedId);
        if (id && !savedId) setSavedId(id);
      } else {
        alert("Error generating summary: " + (json.error || "Unknown error"));
      }
    } catch { alert("Network error — could not reach the AI service."); }
    finally   { setGenerating(false); }
  };

  const saveToHistory = async () => {
    setSaving(true);
    try {
      const id = await persistProposal(narrative, savedId);
      if (id) {
        if (!savedId) setSavedId(id);
        alert(`Proposal saved as ${id}`);
      } else {
        alert("Save failed — please try again.");
      }
    } catch { alert("Save failed — network error."); }
    finally { setSaving(false); }
  };

  const exportDocx = async () => {
    const res  = await fetch("/api/export-docx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, narrative }) });
    if (!res.ok) { alert("Export failed"); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${data.projectName || "K-Safety-Proposal"}.docx`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const res = await fetch("/api/export-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, narrative }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      alert("PDF export failed: " + (err.error ?? "Unknown error"));
      return;
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${data.projectName || "K-Safety-Proposal"}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Generate Proposal</h2>
          <p className="text-sm text-gray-500">Review the proposal preview, then save and export.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency selector */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-3 py-2 rounded-lg border-2 text-sm font-semibold focus:outline-none cursor-pointer"
            style={{ borderColor: DARK_BLUE, color: DARK_BLUE }}>
            <option value="USD">$ USD</option>
            <option value="NIS">₪ NIS</option>
            <option value="MXN">MX$ MXN</option>
          </select>
          <button onClick={saveToHistory} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border-2 disabled:opacity-60"
            style={{ borderColor: DARK_BLUE, color: DARK_BLUE }}>
            {saving ? "Saving…" : savedId ? `Saved (${savedId})` : "Save to History"}
          </button>
          <button onClick={exportDocx}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border-2"
            style={{ borderColor: DARK_BLUE, color: DARK_BLUE }}>
            Export Word
          </button>
          <button onClick={exportPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm"
            style={{ backgroundColor: GOLD, color: DARK_BLUE }}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Full proposal preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" id="proposal-preview">
        {/* Cover */}
        <div className="p-10 text-center" style={{ backgroundColor: DARK_BLUE }}>
          <div className="inline-block mb-3">
            <Image src="/images/kabatone-logo.png" alt="Kabatone" width={56} height={56} style={{ height: "56px", width: "auto", borderRadius: "10px" }} />
          </div>
          <div className="text-white text-3xl font-bold">KABATONE</div>
          <div className="text-sm tracking-widest mt-1" style={{ color: GOLD }}>SMART CITY SOLUTIONS</div>
          <div className="text-white text-2xl font-semibold mt-6">{data.projectName || "K-Safety Platform Proposal"}</div>
          <div className="text-blue-200 mt-2">Prepared for {data.customerName} — {data.city}, {data.country}</div>
          <div className="text-blue-300 text-sm mt-1">{data.contactPerson}{data.contactEmail ? ` · ${data.contactEmail}` : ""}</div>
          <div className="text-blue-300 text-sm mt-1">{dateStr}</div>
        </div>

        <div className="p-8 space-y-10">
          {/* Section 1 — Proposal Info */}
          <section>
            <SectionHeading>Section 1 — Proposal Information</SectionHeading>
            <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
              <InfoRow label="Customer"      value={data.customerName} />
              <InfoRow label="City/Country"  value={`${data.city}, ${data.country}`} />
              <InfoRow label="Contact"       value={data.contactPerson} />
              <InfoRow label="Prepared by"   value={data.salesPerson || "Kabatone Sales"} />
              <InfoRow label="Date"          value={dateStr} />
              <InfoRow label="Ref No."       value={refNum} />
              <InfoRow label="Product Line"   value={PRODUCT_LINES[data.productLine]?.label ?? data.productLine} />
              <InfoRow label="Deployment"     value={data.deploymentType === "cloud" ? "Cloud (SaaS/IaaS)" : "On-Premises"} />
              <InfoRow label="Model"          value={data.pricingModel === "annual" ? "Annual Subscription" : "Perpetual License"} />
            </div>
            <div className="mt-4">
              {data.pricingModel === "annual" ? (
                <div className="rounded-lg p-4 border" style={{ borderColor: MID_BLUE }}>
                  <div className="text-xs text-gray-500">Annual Investment</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: DARK_BLUE }}>{fmtCurrency(pricing.annualTotal)}</div>
                  <div className="text-xs text-gray-400">per year</div>
                </div>
              ) : (
                <div className="rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500">Perpetual Investment (one-time)</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: MID_BLUE }}>{fmtCurrency(pricing.perpetualTotal)}</div>
                  <div className="text-xs text-gray-400">one-time license + {fmtCurrency(pricing.year2SupportAnnual)}/yr support from Year 2</div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2 — Product Descriptions */}
          <section>
            <SectionHeading>Section 2 — Product Descriptions</SectionHeading>
            {sections.map((sec) => (
              <div key={sec.title} className="mb-6">
                <h4 className="text-base font-bold border-b pb-1 mb-3" style={{ color: DARK_BLUE, borderColor: GOLD }}>
                  {sec.title} <span className="text-sm font-normal text-gray-500 ml-2">{sec.subtitle}</span>
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{sec.overview}</p>
                <div className="grid md:grid-cols-2 gap-2">
                  {sec.capabilities.map((cap) => (
                    <div key={cap.name} className="rounded bg-gray-50 p-2.5">
                      <div className="text-xs font-bold mb-0.5" style={{ color: MID_BLUE }}>{cap.name}</div>
                      <div className="text-xs text-gray-600 leading-relaxed">{cap.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Section 3 — Infrastructure */}
          <section>
            <SectionHeading>
              Section 3 — Infrastructure Requirements
              {data.deploymentType === "cloud" && (
                <span className="ml-3 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  ☁️ Cloud Deployment
                </span>
              )}
            </SectionHeading>
            {data.deploymentType === "cloud" && (
              <div className="rounded-lg px-4 py-3 text-sm mb-4" style={{ backgroundColor: "rgba(30,107,168,0.08)", color: MID_BLUE }}>
                This proposal is for a <strong>cloud-hosted deployment</strong>. The VM specifications below represent the recommended instance sizes
                (e.g., AWS EC2 / Azure VM equivalents). Physical server procurement is not required. Kabatone will coordinate the cloud infrastructure setup.
              </div>
            )}
            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr style={{ backgroundColor: DARK_BLUE }}>
                    {["Group","Server","Type","Qty","OS","vCores","RAM","Local","Storage","Comments"].map(h => (
                      <th key={h} className="text-left px-2 py-2 text-white font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vmRows.map((vm, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-2 py-1.5 font-medium" style={{ color: MID_BLUE }}>{vm.group}</td>
                      <td className="px-2 py-1.5 font-mono">{vm.serverName}</td>
                      <td className="px-2 py-1.5">{vm.vmPhysical}</td>
                      <td className="px-2 py-1.5 text-center">{vm.amount}</td>
                      <td className="px-2 py-1.5">{vm.os}</td>
                      <td className="px-2 py-1.5 text-center">{vm.vCores}</td>
                      <td className="px-2 py-1.5 text-center">{vm.ramGB}GB</td>
                      <td className="px-2 py-1.5 text-center">{vm.localDiskGB}GB</td>
                      <td className="px-2 py-1.5 text-center">{vm.storageGB > 0 ? `${vm.storageGB}GB` : "—"}</td>
                      <td className="px-2 py-1.5 text-gray-500">{vm.comments}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "rgba(26,58,92,0.07)" }} className="font-bold">
                    <td colSpan={3} className="px-2 py-2 text-right" style={{ color: DARK_BLUE }}>TOTAL</td>
                    <td className="px-2 py-2 text-center" style={{ color: GOLD }}>{vmRows.reduce((s, v) => s + v.amount, 0)}</td>
                    <td colSpan={6} />
                  </tr>
                </tbody>
              </table>
            </div>

            {hw.subsystemStorage.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: DARK_BLUE }}>
                      {["Subsystem","Sensors","Retention","Image TB","Meta TB","Total TB"].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-white font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hw.subsystemStorage.map((s, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2 font-semibold">{s.subsystem}</td>
                        <td className="px-3 py-2 text-center">{s.numSensors}</td>
                        <td className="px-3 py-2 text-center">{s.retentionDays}d</td>
                        <td className="px-3 py-2 text-right">{round2(s.totalImageTB)}</td>
                        <td className="px-3 py-2 text-right">{round2(s.totalMetaTB)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{round2(s.totalTB)}</td>
                      </tr>
                    ))}
                    {/* CCTV video excluded — handled by 3rd-party VMS */}
                    <tr style={{ backgroundColor: "rgba(26,58,92,0.06)" }} className="font-bold">
                      <td colSpan={5} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>Grand Total</td>
                      <td className="px-3 py-2 text-right text-lg" style={{ color: GOLD }}>{round2(hw.totals.grandTotalTB)} TB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 4 — Pricing */}
          <section>
            <SectionHeading>Section 4 — Pricing Summary</SectionHeading>
            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr style={{ backgroundColor: DARK_BLUE }}>
                  <th className="text-left px-3 py-2 text-white">Product</th>
                  <th className="text-center px-3 py-2 text-white">Qty</th>
                  <th className="text-right px-3 py-2 text-white">Unit/yr</th>
                  <th className="text-right px-3 py-2 text-white">
                    {data.pricingModel === "annual" ? "Annual Total" : "Perpetual Total"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricing.lineItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <td className="px-3 py-2 border-b border-gray-100">
                      {item.name}{item.isModified && <span className="ml-1 text-yellow-600 text-xs font-bold">*</span>}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-100 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-right">{fmtCurrency(item.annualUnit)}</td>
                    <td className="px-3 py-2 border-b border-gray-100 text-right">
                      {item.isService
                        ? fmtCurrency(item.annualTotal)
                        : data.pricingModel === "annual"
                          ? fmtCurrency(item.annualTotal)
                          : fmtCurrency(item.perpetualTotal)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold" style={{ backgroundColor: "rgba(26,58,92,0.08)" }}>
                  <td colSpan={3} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>GRAND TOTAL</td>
                  <td className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>
                    {data.pricingModel === "annual"
                      ? `${fmtCurrency(pricing.annualTotal)}/yr`
                      : fmtCurrency(pricing.perpetualTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4"
                style={{
                  backgroundColor: pricing.fiveYearAnnual <= pricing.fiveYearPerpetual ? "#eff6ff" : "#fff7ed",
                  border: `1px solid ${pricing.fiveYearAnnual <= pricing.fiveYearPerpetual ? "#bfdbfe" : "#fed7aa"}`,
                }}>
                <div className="text-xs text-gray-500">Annual × 5 years</div>
                <div className="text-xl font-bold mt-1" style={{ color: MID_BLUE }}>{fmtCurrency(pricing.fiveYearAnnual)}</div>
                {pricing.fiveYearAnnual < pricing.fiveYearPerpetual && (
                  <div className="text-xs font-semibold text-green-600 mt-1">
                    Save {fmtCurrency(pricing.fiveYearPerpetual - pricing.fiveYearAnnual)} vs. perpetual
                  </div>
                )}
              </div>
              <div className="rounded-lg p-4"
                style={{
                  backgroundColor: pricing.fiveYearPerpetual < pricing.fiveYearAnnual ? "#eff6ff" : "#f9fafb",
                  border: `1px solid ${pricing.fiveYearPerpetual < pricing.fiveYearAnnual ? "#bfdbfe" : "#e5e7eb"}`,
                }}>
                <div className="text-xs text-gray-500">Perpetual + 4yr support</div>
                <div className="text-xl font-bold mt-1" style={{ color: DARK_BLUE }}>{fmtCurrency(pricing.fiveYearPerpetual)}</div>
                <div className="text-xs text-gray-400 mt-1">{fmtCurrency(pricing.year2SupportAnnual)}/yr from Year 2</div>
                {pricing.fiveYearPerpetual < pricing.fiveYearAnnual && (
                  <div className="text-xs font-semibold text-green-600 mt-1">
                    Save {fmtCurrency(pricing.fiveYearAnnual - pricing.fiveYearPerpetual)} vs. annual
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 5 — Generative AI Summary */}
          <section>
            <SectionHeading>Section 5 — Generative AI Summary</SectionHeading>
            <div className="mb-4">
              <button onClick={generateNarrative} disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60 shadow-sm transition-opacity"
                style={{ backgroundColor: DARK_BLUE, color: "white" }}>
                {generating ? "Generating…" : "✨ Generate AI Summary"}
              </button>
            </div>
            {narrative ? (
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                {narrative.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h4 key={i} className="text-base font-bold mt-5 mb-2 pb-1 border-b"
                        style={{ color: DARK_BLUE, borderColor: "#e5e7eb" }}>
                        {line.replace('## ', '')}
                      </h4>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} className="flex gap-2 ml-2">
                        <span style={{ color: MID_BLUE }} className="flex-shrink-0 font-bold">▸</span>
                        <span>{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  if (line.trim() === '') return null;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            ) : (
              <div className="italic text-gray-400 text-sm py-6 text-center bg-gray-50 rounded-lg">
                No summary generated yet. Click &ldquo;✨ Generate AI Summary&rdquo; below.
              </div>
            )}
          </section>

          <div className="text-center text-xs text-gray-400 pt-4 border-t">
            Kabatone Ltd. · contact@kabatone.com · www.kabatone.com
            <br />This proposal is valid for 30 days from the date above.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{ color: DARK_BLUE, borderColor: GOLD }}>
      {children}
    </h3>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-28 flex-shrink-0 text-xs">{label}:</span>
      <span className="font-semibold text-gray-800 text-xs">{value || "—"}</span>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

function ProposalWizard() {
  const searchParams   = useSearchParams();
  const [step, setStep]               = useState(1);
  const [data, setData]               = useState<ProposalData>(emptyData);
  const [narrative, setNarrative]     = useState("");
  const [generating, setGenerating]   = useState(false);
  const [savedId, setSavedId]         = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [vmRows, setVmRows]           = useState<VMSpec[]>([]);

  // Initialize vmRows when the user reaches the pricing step for the first time
  useEffect(() => {
    if (step === 5 && vmRows.length === 0) {
      setVmRows(calculateHW(buildHWInput(data)).vmSpecs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Pre-fill from history when ?id=PROP-xxx is present
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    setLoading(true);
    fetch(`/api/proposals/${id}`)
      .then((r) => r.json())
      .then((saved) => {
        if (saved.formData) {
          setData({ ...emptyData, ...saved.formData });
          if (saved.narrative) setNarrative(saved.narrative);
          setSavedId(saved.id);
          setStep(6);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams]);

  // Auto-save when the user reaches step 6 for the first time (new proposal only)
  useEffect(() => {
    if (step !== 6 || savedId || loading) return;
    if (!data.customerName || data.selectedProducts.length === 0) return;
    fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: data, narrative: "" }),
    })
      .then((r) => r.json())
      .then((json) => { if (json.id) setSavedId(json.id); })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const update = (partial: Partial<ProposalData>) => setData((d) => ({ ...d, ...partial }));

  const canProceed = () => {
    if (step === 1) return !!(data.productLine && data.deploymentType);
    if (step === 2) return !!(data.customerName && data.city && data.country && data.contactPerson && data.projectName);
    if (step === 3) return data.selectedProducts.length > 0;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
        <div className="text-gray-500 text-sm">Loading proposal…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Progress */}
      <div style={{ backgroundColor: MID_BLUE }} className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-0">
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
                    s.id === step ? { backgroundColor: GOLD, color: DARK_BLUE } :
                    s.id < step   ? { backgroundColor: GOLD, color: DARK_BLUE } :
                                    { backgroundColor: "transparent", border: "2px solid #D0D8E4", color: "rgba(255,255,255,0.45)" }
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
                <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: i < step - 1 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[8px] shadow-sm border border-gray-100 p-8">
            {step === 1 && <Step0 data={data} onChange={update} />}
            {step === 2 && <Step1 data={data} onChange={update} />}
            {step === 3 && <Step2 data={data} onChange={update} />}
            {step === 4 && <Step3 data={data} onChange={update} />}
            {step === 5 && <Step4 data={data} onChange={update} vmRows={vmRows} setVmRows={setVmRows} />}
            {step === 6 && (
              <Step5
                data={data} narrative={narrative} setNarrative={setNarrative}
                generating={generating} setGenerating={setGenerating}
                savedId={savedId} setSavedId={setSavedId}
                vmRows={vmRows}
              />
            )}

            {/* Nav */}
            <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-blue-50"
                  style={{ border: "2px solid #1A3A5C", color: "#1A3A5C" }}>
                  ← Back
                </button>
              ) : (
                <Link href="/" className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-blue-50"
                  style={{ border: "2px solid #1A3A5C", color: "#1A3A5C" }}>
                  ← Home
                </Link>
              )}
              {step < 6 && (
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

export default function ProposalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>}>
      <ProposalWizard />
    </Suspense>
  );
}
