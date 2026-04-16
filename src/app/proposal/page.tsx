"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import {
  VMS_VENDORS,
  LPR_VENDORS,
  FACE_VENDORS,
  IOT_VENDORS,
  VmsVendorEntry,
  LprVendorEntry,
  FaceVendorEntry,
  IotVendorEntry,
} from "@/lib/pricing";
import { calculateHW, buildHWInput, SUBSYSTEM_DEFAULTS, VMSpec, calculateK1VideoHW } from "@/lib/hw-calculator";

const STEPS = [
  { id: 1, label: "Product & Deploy" },
  { id: 2, label: "Customer Info" },
  { id: 3, label: "Products" },
  { id: 4, label: "Configure" },
  { id: 5, label: "Pricing" },
  { id: 6, label: "Generate" },
];

const DARK_BLUE = "#1A3A5C";
const ACCENT   = "#29ABE2";
const GOLD     = "#F0A500";
const MID_BLUE = "#1E6BA8";

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
  pricingModel: "annual",
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
  cctvVendors: [],
  k1VideoEnabled: false,
  k1VideoChannels: 0,
  k1VideoRetentionDays: 30,
  k1VideoBitrateMbps: 2,
  lprVendors: [],
  faceVendors: [],
  iotVendors: [],
  haMode: false,
  discount: 0,
  videoBitrateMbps: 4,
  retentionDays: { ...DEFAULT_RETENTION },
};

function fmt(n: number) { return `$${n.toLocaleString("en-US")}`; }
function round2(n: number) { return Math.round(n * 100) / 100; }

// ─── Step 0 — Product Line & Deployment Type & Pricing Model ─────────────────

function Step0({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const deployOptions: { value: DeploymentType; label: string; desc: string; icon: string }[] = [
    { value: "onprem",  label: "On-Premises",     desc: "Customer-managed servers in their own data centre or server room", icon: "🏢" },
    { value: "cloud",   label: "Cloud (SaaS/IaaS)",desc: "Hosted on AWS / Azure / GCP — Kabatone manages the infrastructure", icon: "☁️" },
  ];

  const pricingOptions: { value: "annual" | "perpetual"; label: string; desc: string; icon: string }[] = [
    { value: "annual", label: "Annual Subscription", desc: "Recurring annual license fee. Best for municipalities with operating budgets.", icon: "💰" },
    { value: "perpetual", label: "Perpetual License", desc: "One-time purchase + 20% annual support from Year 2.", icon: "🏛️" },
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

      {/* Pricing model */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: MID_BLUE }}>Pricing Model</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {pricingOptions.map((opt) => {
            const selected = data.pricingModel === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange({ pricingModel: opt.value })}
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
      </div>
    </div>
  );
}

// ─── Step 1 — Customer Info ───────────────────────────────────────────────────

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

// ─── Step 2 (now Step 3) — Product selection with vendors & pricing ──────────

function Step2({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const allowedProductIds = PRODUCT_LINE_PRODUCTS[data.productLine];
  // Local string state for price inputs — prevents React controlled-number-input fighting
  const [priceStrings, setPriceStrings] = useState<Record<string, string>>({});

  const toggle = (id: string) => {
    const next = data.selectedProducts.includes(id)
      ? data.selectedProducts.filter((x) => x !== id)
      : [...data.selectedProducts, id];
    onChange({ selectedProducts: next });
  };

  const setQty = (id: string, val: number) =>
    onChange({ quantities: { ...data.quantities, [id]: Math.max(1, val) } });

  const commitPrice = (key: string, raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) return;
    // Always store as annual; in perpetual mode the user typed a perpetual value → convert back
    const annualVal = data.pricingModel === "annual" ? val : val / PERP_MULTIPLIER;
    onChange({ customPrices: { ...data.customPrices, [key]: annualVal } });
  };

  const resetPrice = (key: string) => {
    const cp = { ...data.customPrices };
    delete cp[key];
    onChange({ customPrices: cp });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setPriceStrings((prev) => { const { [key]: _omit, ...rest } = prev; return rest; });
  };

  const getPrice = (key: string) =>
    data.customPrices[key] ?? DEFAULT_ANNUAL_PRICES[key] ?? 0;

  const modified = (key: string) =>
    key in data.customPrices && !isDefaultPrice(key, data.customPrices[key]);

  // CCTV Vendor helpers
  const addCctvVendor = () => {
    onChange({
      cctvVendors: [
        ...(data.cctvVendors ?? []),
        { vendorName: VMS_VENDORS[0], channels: 4, isOther: false },
      ],
    });
  };

  const updateCctvVendor = (i: number, field: keyof VmsVendorEntry, val: VmsVendorEntry[keyof VmsVendorEntry]) => {
    const updated = [...(data.cctvVendors ?? [])];
    updated[i] = { ...updated[i], [field]: val };
    const totalChannels = updated.reduce((s, v) => s + v.channels, 0) + ((data.k1VideoEnabled ?? false) ? (data.k1VideoChannels ?? 0) : 0);
    onChange({ cctvVendors: updated, quantities: { ...data.quantities, cctv: totalChannels } });
  };

  const removeCctvVendor = (i: number) => {
    const updated = (data.cctvVendors ?? []).filter((_, idx) => idx !== i);
    const totalChannels = updated.reduce((s, v) => s + v.channels, 0) + ((data.k1VideoEnabled ?? false) ? (data.k1VideoChannels ?? 0) : 0);
    onChange({ cctvVendors: updated, quantities: { ...data.quantities, cctv: totalChannels } });
  };

  const toggleK1Video = (enabled: boolean) => {
    onChange({ k1VideoEnabled: enabled });
    if (enabled) {
      const totalChannels = (data.cctvVendors ?? []).reduce((s, v) => s + v.channels, 0) + (data.k1VideoChannels ?? 0);
      onChange({ quantities: { ...data.quantities, cctv: totalChannels } });
    }
  };

  const updateK1VideoChannels = (val: number) => {
    onChange({ k1VideoChannels: val });
    const totalChannels = (data.cctvVendors ?? []).reduce((s, v) => s + v.channels, 0) + val;
    onChange({ quantities: { ...data.quantities, cctv: totalChannels } });
  };

  // LPR Vendor helpers
  const addLprVendor = () => {
    onChange({
      lprVendors: [
        ...(data.lprVendors ?? []),
        { vendorName: LPR_VENDORS[0], channels: 2, isOther: false },
      ],
    });
  };

  const updateLprVendor = (i: number, field: keyof LprVendorEntry, val: LprVendorEntry[keyof LprVendorEntry]) => {
    const updated = [...(data.lprVendors ?? [])];
    updated[i] = { ...updated[i], [field]: val };
    const totalChannels = updated.reduce((s, v) => s + v.channels, 0);
    onChange({ lprVendors: updated, quantities: { ...data.quantities, lpr: totalChannels } });
  };

  const removeLprVendor = (i: number) => {
    const updated = (data.lprVendors ?? []).filter((_, idx) => idx !== i);
    const totalChannels = updated.reduce((s, v) => s + v.channels, 0);
    onChange({ lprVendors: updated, quantities: { ...data.quantities, lpr: totalChannels } });
  };

  // Face Recognition Vendor helpers
  const addFaceVendor = () => {
    onChange({
      faceVendors: [
        ...(data.faceVendors ?? []),
        { vendorName: FACE_VENDORS[0], channels: 2, isOther: false },
      ],
    });
  };

  const updateFaceVendor = (i: number, field: keyof FaceVendorEntry, val: FaceVendorEntry[keyof FaceVendorEntry]) => {
    const updated = [...(data.faceVendors ?? [])];
    updated[i] = { ...updated[i], [field]: val };
    const totalChannels = updated.reduce((s, v) => s + v.channels, 0);
    onChange({ faceVendors: updated, quantities: { ...data.quantities, face: totalChannels } });
  };

  const removeFaceVendor = (i: number) => {
    const updated = (data.faceVendors ?? []).filter((_, idx) => idx !== i);
    const totalChannels = updated.reduce((s, v) => s + v.channels, 0);
    onChange({ faceVendors: updated, quantities: { ...data.quantities, face: totalChannels } });
  };

  // IoT Vendor helpers
  const addIotVendor = () => {
    onChange({
      iotVendors: [
        ...(data.iotVendors ?? []),
        { vendorName: IOT_VENDORS[0], units: 10, isOther: false },
      ],
    });
  };

  const updateIotVendor = (i: number, field: keyof IotVendorEntry, val: IotVendorEntry[keyof IotVendorEntry]) => {
    const updated = [...(data.iotVendors ?? [])];
    updated[i] = { ...updated[i], [field]: val };
    const totalUnits = updated.reduce((s, v) => s + v.units, 0);
    onChange({ iotVendors: updated, quantities: { ...data.quantities, iot: totalUnits } });
  };

  const removeIotVendor = (i: number) => {
    const updated = (data.iotVendors ?? []).filter((_, idx) => idx !== i);
    const totalUnits = updated.reduce((s, v) => s + v.units, 0);
    onChange({ iotVendors: updated, quantities: { ...data.quantities, iot: totalUnits } });
  };

  const categories = [
    { key: "platform", label: "Platform & Licenses" },
    { key: "video",    label: "Video & AI Modules" },
    { key: "app",      label: "Mobile Applications" },
    { key: "services", label: "Professional Services" },
  ].filter((cat) =>
    PRODUCTS.some((p) => p.category === cat.key && allowedProductIds.includes(p.id))
  );

  const cctvHasUnsupported = (data.cctvVendors ?? []).some(v => v.isOther);
  const lprHasUnsupported = (data.lprVendors ?? []).some(v => v.isOther);
  const faceHasUnsupported = (data.faceVendors ?? []).some(v => v.isOther);
  const iotHasUnsupported = (data.iotVendors ?? []).some(v => v.isOther);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Product Selection & Pricing</h2>
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: DARK_BLUE }}>
          {PRODUCT_LINES[data.productLine].icon} {PRODUCT_LINES[data.productLine].label}
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Select products, set quantities, configure vendors, and optionally adjust unit prices for this proposal.
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

                const priceKey =
                  product.id === "kshare"   ? getPriceKey("kshare",   data.kshareТier)        :
                  product.id === "services" ? getPriceKey("services",  undefined, data.servicesPackage ?? undefined) :
                  product.id;
                const currentPrice  = getPrice(priceKey);
                const isModified    = modified(priceKey);
                const defaultPriceVal = DEFAULT_ANNUAL_PRICES[priceKey] ?? 0;
                const annualPrice = currentPrice;
                const perpPrice = annualPrice * PERP_MULTIPLIER;

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

                        {/* CCTV vendors */}
                        {product.id === "cctv" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold mb-2 text-gray-500">VMS Vendors (3rd-party integrations)</label>
                              <div className="space-y-2 mb-2">
                                {(data.cctvVendors ?? []).map((entry, i) => (
                                  <div key={i} className="flex items-end gap-2 flex-wrap">
                                    <div className="flex-1 min-w-40">
                                      <label className="block text-xs text-gray-400 mb-1">Vendor</label>
                                      {entry.isOther ? (
                                        <input
                                          type="text" placeholder="Vendor name"
                                          value={entry.vendorName}
                                          onChange={(e) => updateCctvVendor(i, "vendorName", e.target.value)}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        />
                                      ) : (
                                        <select
                                          value={entry.vendorName}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            const isOther = newVal === "Other";
                                            const updatedVendors = [...(data.cctvVendors ?? [])];
                                            updatedVendors[i] = { ...updatedVendors[i], vendorName: isOther ? "" : newVal, isOther };
                                            const totalCh = updatedVendors.reduce((s, v) => s + v.channels, 0) + ((data.k1VideoEnabled ?? false) ? (data.k1VideoChannels ?? 0) : 0);
                                            onChange({ cctvVendors: updatedVendors, quantities: { ...data.quantities, cctv: totalCh } });
                                          }}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        >
                                          {VMS_VENDORS.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                          <option value="Other">Other</option>
                                        </select>
                                      )}
                                    </div>
                                    <div className="w-20">
                                      <label className="block text-xs text-gray-400 mb-1">Channels</label>
                                      <input
                                        type="number" min={1}
                                        value={entry.channels}
                                        onChange={(e) => updateCctvVendor(i, "channels", Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-center"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeCctvVendor(i)}
                                      className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded border border-red-200"
                                    >✕</button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={addCctvVendor}
                                className="text-xs font-semibold px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                              >+ Add Vendor</button>
                            </div>

                            {cctvHasUnsupported && (
                              <div className="rounded-lg px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
                                ⚠️ Unsupported vendor: Note: non-standard integrations may require additional R&D evaluation and cost.
                              </div>
                            )}

                            {/* K1-Video subsection */}
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                              <div className="flex items-center gap-3 mb-2">
                                <button
                                  type="button"
                                  className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
                                  style={{ backgroundColor: (data.k1VideoEnabled ?? false) ? MID_BLUE : "#d1d5db" }}
                                  onClick={() => toggleK1Video(!(data.k1VideoEnabled ?? false))}
                                >
                                  <span
                                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                                    style={{ transform: (data.k1VideoEnabled ?? false) ? "translateX(19px)" : "translateX(2px)" }}
                                  />
                                </button>
                                <div className="flex-1">
                                  <div className="text-xs font-bold" style={{ color: DARK_BLUE }}>K1-Video (VXG Embedded VMS — Kabatone native)</div>
                                  <div className="text-xs text-gray-500">HW sizing calculated in Step 6 Infrastructure.</div>
                                </div>
                              </div>

                              {data.k1VideoEnabled && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 ml-0 pt-2 border-t border-gray-100">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Cameras</label>
                                    <input
                                      type="number" min={1}
                                      value={(data.k1VideoChannels ?? 0)}
                                      onChange={(e) => updateK1VideoChannels(Math.max(1, parseInt(e.target.value) || 1))}
                                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Retention (days)</label>
                                    <input
                                      type="number" min={7} max={365}
                                      value={(data.k1VideoRetentionDays ?? 30)}
                                      onChange={(e) => onChange({ k1VideoRetentionDays: Math.max(7, parseInt(e.target.value) || 30) })}
                                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Bitrate</label>
                                    <select
                                      value={(data.k1VideoBitrateMbps ?? 2)}
                                      onChange={(e) => onChange({ k1VideoBitrateMbps: parseInt(e.target.value) || 2 })}
                                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs"
                                    >
                                      <option value={1}>1 Mbps (SD)</option>
                                      <option value={2}>2 Mbps (HD)</option>
                                      <option value={4}>4 Mbps (Full HD)</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* LPR vendors */}
                        {product.id === "lpr" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold mb-2 text-gray-500">LPR Vendors</label>
                              <div className="space-y-2 mb-2">
                                {(data.lprVendors ?? []).map((entry, i) => (
                                  <div key={i} className="flex items-end gap-2 flex-wrap">
                                    <div className="flex-1 min-w-40">
                                      <label className="block text-xs text-gray-400 mb-1">Vendor</label>
                                      {entry.isOther ? (
                                        <input
                                          type="text" placeholder="Vendor name"
                                          value={entry.vendorName}
                                          onChange={(e) => updateLprVendor(i, "vendorName", e.target.value)}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        />
                                      ) : (
                                        <select
                                          value={entry.vendorName}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            const isOther = newVal === "Other";
                                            const updatedVendors = [...(data.lprVendors ?? [])];
                                            updatedVendors[i] = { ...updatedVendors[i], vendorName: isOther ? "" : newVal, isOther };
                                            const totalCh = updatedVendors.reduce((s, v) => s + v.channels, 0);
                                            onChange({ lprVendors: updatedVendors, quantities: { ...data.quantities, lpr: totalCh } });
                                          }}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        >
                                          {LPR_VENDORS.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                          <option value="Other">Other</option>
                                        </select>
                                      )}
                                    </div>
                                    <div className="w-20">
                                      <label className="block text-xs text-gray-400 mb-1">Channels</label>
                                      <input
                                        type="number" min={1}
                                        value={entry.channels}
                                        onChange={(e) => updateLprVendor(i, "channels", Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-center"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeLprVendor(i)}
                                      className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded border border-red-200"
                                    >✕</button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={addLprVendor}
                                className="text-xs font-semibold px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                              >+ Add Vendor</button>
                            </div>

                            {lprHasUnsupported && (
                              <div className="rounded-lg px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
                                ⚠️ Unsupported vendor: Note: non-standard integrations may require additional R&D evaluation and cost.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Face Recognition vendors */}
                        {product.id === "face" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold mb-2 text-gray-500">Face Recognition Vendors</label>
                              <div className="space-y-2 mb-2">
                                {(data.faceVendors ?? []).map((entry, i) => (
                                  <div key={i} className="flex items-end gap-2 flex-wrap">
                                    <div className="flex-1 min-w-40">
                                      <label className="block text-xs text-gray-400 mb-1">Vendor</label>
                                      {entry.isOther ? (
                                        <input
                                          type="text" placeholder="Vendor name"
                                          value={entry.vendorName}
                                          onChange={(e) => updateFaceVendor(i, "vendorName", e.target.value)}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        />
                                      ) : (
                                        <select
                                          value={entry.vendorName}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            const isOther = newVal === "Other";
                                            const updatedVendors = [...(data.faceVendors ?? [])];
                                            updatedVendors[i] = { ...updatedVendors[i], vendorName: isOther ? "" : newVal, isOther };
                                            const totalCh = updatedVendors.reduce((s, v) => s + v.channels, 0);
                                            onChange({ faceVendors: updatedVendors, quantities: { ...data.quantities, face: totalCh } });
                                          }}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        >
                                          {FACE_VENDORS.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                          <option value="Other">Other</option>
                                        </select>
                                      )}
                                    </div>
                                    <div className="w-20">
                                      <label className="block text-xs text-gray-400 mb-1">Channels</label>
                                      <input
                                        type="number" min={1}
                                        value={entry.channels}
                                        onChange={(e) => updateFaceVendor(i, "channels", Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-center"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeFaceVendor(i)}
                                      className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded border border-red-200"
                                    >✕</button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={addFaceVendor}
                                className="text-xs font-semibold px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                              >+ Add Vendor</button>
                            </div>

                            {faceHasUnsupported && (
                              <div className="rounded-lg px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
                                ⚠️ Unsupported vendor: Note: non-standard integrations may require additional R&D evaluation and cost.
                              </div>
                            )}
                          </div>
                        )}

                        {/* IoT Sensors vendors */}
                        {product.id === "iot" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold mb-2 text-gray-500">IoT Sensor Types</label>
                              <div className="space-y-2 mb-2">
                                {(data.iotVendors ?? []).map((entry, i) => (
                                  <div key={i} className="flex items-end gap-2 flex-wrap">
                                    <div className="flex-1 min-w-40">
                                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                                      {entry.isOther ? (
                                        <input
                                          type="text" placeholder="Sensor type"
                                          value={entry.vendorName}
                                          onChange={(e) => updateIotVendor(i, "vendorName", e.target.value)}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        />
                                      ) : (
                                        <select
                                          value={entry.vendorName}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            const isOther = newVal === "Other";
                                            const updatedVendors = [...(data.iotVendors ?? [])];
                                            updatedVendors[i] = { ...updatedVendors[i], vendorName: isOther ? "" : newVal, isOther };
                                            const totalUnits = updatedVendors.reduce((s, v) => s + v.units, 0);
                                            onChange({ iotVendors: updatedVendors, quantities: { ...data.quantities, iot: totalUnits } });
                                          }}
                                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                                        >
                                          {IOT_VENDORS.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                          <option value="Other">Other</option>
                                        </select>
                                      )}
                                    </div>
                                    <div className="w-20">
                                      <label className="block text-xs text-gray-400 mb-1">Units</label>
                                      <input
                                        type="number" min={1}
                                        value={entry.units}
                                        onChange={(e) => updateIotVendor(i, "units", Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-center"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeIotVendor(i)}
                                      className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded border border-red-200"
                                    >✕</button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={addIotVendor}
                                className="text-xs font-semibold px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                              >+ Add Sensor Type</button>
                            </div>

                            {iotHasUnsupported && (
                              <div className="rounded-lg px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
                                ⚠️ Integration note: Non-standard vendor integrations require additional R&D evaluation and may incur extra costs. Kabatone will provide a separate assessment.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quantity (for products without vendor expansion) */}
                        {product.hasQuantity && !["cctv", "lpr", "face", "iot"].includes(product.id) && (
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
                              Unit Price {data.pricingModel === "annual" ? "/ Year" : "(Perpetual)"}
                              {product.id === "services" && " (one-time)"}
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-gray-400 text-sm select-none">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    priceKey in priceStrings
                                      ? priceStrings[priceKey]
                                      : String(data.pricingModel === "annual" ? annualPrice : Math.round(perpPrice))
                                  }
                                  onChange={(e) => setPriceStrings((prev) => ({ ...prev, [priceKey]: e.target.value }))}
                                  onBlur={(e) => {
                                    commitPrice(priceKey, e.target.value);
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    setPriceStrings((prev) => { const { [priceKey]: _omit, ...rest } = prev; return rest; });
                                  }}
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
                                {data.pricingModel === "annual" ? (
                                  <>
                                    {qty} × {fmt(annualPrice)} = <strong style={{ color: DARK_BLUE }}>{fmt(annualPrice * qty)}/yr</strong>
                                  </>
                                ) : (
                                  <>
                                    {qty} × {fmt(perpPrice)} = <strong style={{ color: DARK_BLUE }}>{fmt(perpPrice * qty)}</strong> (one-time)
                                  </>
                                )}
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

      {(cctvHasUnsupported || lprHasUnsupported || faceHasUnsupported || iotHasUnsupported) && (
        <div className="rounded-lg px-4 py-3 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          ⚠️ Integration note: Non-standard vendor integrations require additional R&D evaluation and may incur extra costs. Kabatone will provide a separate assessment.
        </div>
      )}
    </div>
  );
}

// ─── Step 3 (now Step 4) — HW Configuration ───────────────────────────────────

function Step3({ data, onChange }: { data: ProposalData; onChange: (d: Partial<ProposalData>) => void }) {
  const setRetention = (key: keyof ProposalData["retentionDays"], val: number) =>
    onChange({ retentionDays: { ...data.retentionDays, [key]: Math.max(1, val) } });

  const hasLPR   = data.selectedProducts.includes("lpr");
  const hasFR    = data.selectedProducts.includes("face");
  const hasVA    = data.selectedProducts.includes("analytics");
  const hasIoT   = data.selectedProducts.includes("iot");
  const hasAnyHW = hasLPR || hasFR || hasVA || hasIoT;

  const hwResult = calculateHW(buildHWInput(data));
  const { grandTotalTB } = hwResult.totals;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Infrastructure & Retention Configuration</h2>
        <p className="text-sm text-gray-500">Configure infrastructure options and data retention parameters.</p>
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
              className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0 mt-0.5 overflow-hidden"
              style={{ backgroundColor: data.haMode ? MID_BLUE : "#d1d5db" }}
              onClick={(e) => { e.stopPropagation(); onChange({ haMode: !data.haMode }); }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: data.haMode ? "translateX(22px)" : "translateX(2px)" }}
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

          {/* Retention periods */}
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

// ─── Step 4 (now Step 5) — Pricing Summary ────────────────────────────────────

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

  // Show only the selected pricing model
  const isAnnual = data.pricingModel === "annual";
  const mainTotal = isAnnual ? Math.round(pricing.annualTotal * factor) : Math.round(pricing.perpetualTotal * factor);
  const fiveYearTotal = isAnnual ? Math.round(pricing.fiveYearAnnual * factor) : Math.round(pricing.fiveYearPerpetual * factor);
  const discYr2 = Math.round(pricing.year2SupportAnnual * factor);

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
          {" — "}change in Step 1.
        </p>
      </div>

      {/* 4a License pricing — single model */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: DARK_BLUE }}>
              <th className="text-left px-4 py-3 text-white font-semibold">Product</th>
              <th className="text-center px-4 py-3 text-white font-semibold">Qty</th>
              <th className="text-right px-4 py-3 text-white font-semibold">
                {isAnnual ? "Unit Price/yr" : "Unit Price (Perpetual)"}
              </th>
              <th className="text-right px-4 py-3 text-white font-semibold">
                {isAnnual ? "Annual Total" : "Perpetual Total"}
              </th>
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
                    {isAnnual ? fmt(item.annualUnit) : fmt(item.perpetualUnit ?? item.annualUnit * PERP_MULTIPLIER)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {isAnnual ? fmt(item.annualTotal) : fmt(item.perpetualTotal)}
                </td>
              </tr>
            ))}
            {/* Subtotal licenses */}
            <tr style={{ backgroundColor: "rgba(26,58,92,0.04)" }}>
              <td colSpan={3} className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider" style={{ color: MID_BLUE }}>
                Subtotal — Licenses
              </td>
              <td className="px-4 py-2 text-right font-bold" style={{ color: MID_BLUE }}>
                {isAnnual ? fmt(pricing.licensesAnnual) : fmt(pricing.licensesPerpetual)}
              </td>
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
              </tr>
            ))}
            {pricing.serviceItems.length > 0 && (
              <tr style={{ backgroundColor: "rgba(26,58,92,0.04)" }}>
                <td colSpan={3} className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider" style={{ color: MID_BLUE }}>
                  Subtotal — Services
                </td>
                <td className="px-4 py-2 text-right font-bold" style={{ color: MID_BLUE }}>{fmt(pricing.servicesTotal)}</td>
              </tr>
            )}

            {/* Grand Total */}
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
                {discount > 0 && <div className="text-xs line-through opacity-50">{fmt(isAnnual ? pricing.annualTotal : pricing.perpetualTotal)}</div>}
                {fmt(mainTotal)}
                <div className="text-xs font-normal opacity-70">{isAnnual ? "/year" : "one-time"}</div>
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

      {/* 5-Year Cost Comparison — single model only */}
      <div className="rounded-xl border-2 p-6 space-y-4" style={{ borderColor: MID_BLUE }}>
        <h3 className="font-black text-base uppercase tracking-wider" style={{ color: DARK_BLUE }}>
          5-Year Total Cost ({data.pricingModel === "annual" ? "Annual Model" : "Perpetual Model"})
          {discount > 0 && <span className="ml-2 text-sm font-normal text-green-600">({discount}% discount applied)</span>}
        </h3>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
          {isAnnual ? (
            <>
              <div className="text-xs text-gray-500 mb-1">5-Year Total (Annual × 5)</div>
              <div className="text-sm text-gray-600">{fmt(mainTotal)} × 5 years</div>
              <div className="text-2xl font-black mt-1" style={{ color: MID_BLUE }}>{fmt(fiveYearTotal)}</div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-1">5-Year Total (Perpetual + Support)</div>
              <div className="text-sm text-gray-600">
                {fmt(mainTotal)} + {fmt(discYr2)}/yr support × 4
              </div>
              <div className="text-2xl font-black mt-1" style={{ color: DARK_BLUE }}>{fmt(fiveYearTotal)}</div>
            </>
          )}
        </div>
      </div>

      {/* VM Infrastructure */}
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

      {/* K1-Video HW sizing — shown in Pricing step when K1-Video is enabled */}
      {!!(data.k1VideoEnabled) && (data.k1VideoChannels ?? 0) > 0 && (
        <div>
          <h3 className="font-bold text-base mb-3" style={{ color: DARK_BLUE }}>
            K1-Video HW Requirements (VXG Embedded VMS)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Sizing for {data.k1VideoChannels} camera{(data.k1VideoChannels ?? 0) > 1 ? "s" : ""} @ {data.k1VideoBitrateMbps} Mbps / {data.k1VideoRetentionDays} days retention — {data.deploymentType === "cloud" ? "Cloud (AWS)" : "On-Premises"}
          </p>
          <K1VideoHWTable
            cameras={data.k1VideoChannels ?? 0}
            bitrateMbps={data.k1VideoBitrateMbps ?? 2}
            retentionDays={data.k1VideoRetentionDays ?? 30}
            deploymentType={data.deploymentType}
          />
        </div>
      )}
    </div>
  );
}

// ─── Step 5 (now Step 6) — Generate ──────────────────────────────────────────


// ─── Step 6 static data maps ─────────────────────────────────────────────────

const PRODUCT_LINE_SUBTITLE: Record<string, string> = {
  ksafety:   "An AI-powered Command & Control system for complete security management — cameras, LPR, face recognition, IoT sensors, and access control unified in a single screen.",
  kvideo:    "Enterprise video surveillance platform integrating multi-vendor CCTV, LPR, face recognition, and AI video analytics under one management interface.",
  kdispatch: "First-responder dispatch and field coordination platform connecting the operations centre to mobile units in real time via the K-React app.",
};

const PRODUCT_LINE_OVERVIEW: Record<string, string> = {
  ksafety:   "K-Safety is an intelligent Command & Control platform designed to unify all security systems at a facility under one roof — CCTV cameras, face and license plate recognition, AI-based Video Analytics, panic buttons, alarm systems, and access control. The system manages events in real time, executes smart BPM workflows, and presents a complete operational picture on an interactive GIS map. Built for smart cities, municipalities, and strategic facilities, K-Safety connects every sensor and system, turning fragmented infrastructure into a coordinated, intelligent response capability.",
  kvideo:    "K-Video is a centralised video management solution that integrates multi-vendor CCTV systems, license plate recognition, face recognition, and AI video analytics into a single operational view. Supporting leading VMS platforms including Milestone, HikVision, Genetec, Dahua, ISS, and Digivod, K-Video delivers live monitoring, archive search, and AI-driven alert correlation across the entire camera estate.",
  kdispatch: "K-Dispatch is a real-time field coordination platform that connects the operations centre to first responders in the field. Operators assign and track incidents through a command console while field units receive live dispatch, navigation, and situational awareness via the K-React mobile app. The platform accelerates incident response and ensures complete chain-of-custody for every event.",
};

const PRODUCT_LINE_PILLS: Record<string, string[]> = {
  ksafety:   ["✈ Airports", "⛽ Oil & Gas", "♻ Industrial Facilities", "🔒 Critical Infrastructure", "🏛 Defense Facilities", "🌆 Smart Cities"],
  kvideo:    ["🏙 Smart Cities", "🚦 Traffic Management", "🏫 Campuses & Schools", "🏪 Retail & Malls", "🏭 Industrial Sites", "🛡️ Security Operations"],
  kdispatch: ["🚒 Emergency Services", "👮 Law Enforcement", "🚑 First Responders", "🏙 Smart Cities", "🏛 Government", "🌆 Operations Centres"],
};

const PRODUCT_LINE_USE_CASES: Record<string, { icon: string; title: string; desc: string }[]> = {
  ksafety: [
    { icon: "✈", title: "Airports", desc: "Monitoring terminals, airside areas, entry gates, and warehouses. Integration with LENEL, LPR cameras at gates, and real-time operational dashboards." },
    { icon: "⚡", title: "Oil & Gas Facilities", desc: "Perimeter intrusion detection, integrated gas sensors, emergency force management, and real-time updates to rescue teams." },
    { icon: "🔒", title: "Critical Infrastructure", desc: "Power stations, water, and communication infrastructure — 24/7 monitoring with instant alerts and automated BPM response workflows." },
  ],
  kvideo: [
    { icon: "🚦", title: "City Traffic Management", desc: "Unified monitoring of thousands of cameras across an entire city with AI-powered incident detection, LPR at junctions, and live control-room feeds." },
    { icon: "🏫", title: "Campus & Enterprise Security", desc: "Multi-site video surveillance with face recognition, access control integration, visitor management, and centralised archive search across all locations." },
    { icon: "🏭", title: "Industrial & Perimeter", desc: "24/7 AI intrusion detection, virtual-line crossing alerts, and abandoned-object detection for large industrial and logistics sites." },
  ],
  kdispatch: [
    { icon: "🚒", title: "Emergency Services", desc: "Real-time fire, ambulance, and police dispatch with automated route optimisation, resource tracking, and CAD integration." },
    { icon: "👮", title: "Law Enforcement", desc: "Mobile command for field officers: live incident details, navigation, evidence capture, and two-way communication with the operations centre." },
    { icon: "🌆", title: "Smart City Operations", desc: "Unified city operations centre coordinating multiple agencies with shared situational awareness and automated escalation protocols." },
  ],
};

const WHY_LEFT: Record<string, string[]> = {
  ksafety:   ["Open Architecture — works with all existing equipment", "AI-Native — Video Analytics, NLP, automated insights", "Modular — buy only what you need, expand later", "Proven — dozens of projects worldwide", "NDAA Compliant — meets security & regulatory requirements"],
  kvideo:    ["Open Architecture — any VMS, any camera brand", "AI-Native — real-time video analytics & smart search", "Modular — start small, scale to city-wide", "Proven — large-scale smart city deployments", "Standards-based — ONVIF, RTSP, GB/T 28181"],
  kdispatch: ["Real-Time Dispatch — sub-second alert delivery", "Mobile-First — K-React works on any Android device", "AI-Assisted — automated event classification", "Proven — integrated with leading CAD systems", "Resilient — offline-capable field app"],
};

const WHY_RIGHT: Record<string, string[]> = {
  ksafety:   ["One Platform for all security systems", "Real-Time Command Centre with AI", "Fast Incident Response — automated BPM", "Proven ROI — workforce savings & incident prevention", "Full Support in English + 24×7 SLA option"],
  kvideo:    ["One View for all cameras & sensors", "Live AI Alerts — intrusion, loitering, crowds", "Fast Archive Search — face, plate, event", "Scalable — 10 to 100,000+ channels", "Full Support + 24×7 option"],
  kdispatch: ["One Console for dispatch, map & comms", "K-React — field app with offline support", "Automated Escalation & SLA tracking", "Full Audit Trail for every incident", "24×7 SLA support option"],
};



// Fixed core capabilities shown in every proposal (Step 6)
const CORE_CAPABILITIES = [
  { icon: "🎬", name: "Unified Video Management",          desc: "Centralise all cameras — CCTV, PTZ, body-worn — in one live & archive management console supporting all major VMS vendors." },
  { icon: "🤖", name: "Video Analytics (AI)",              desc: "Real-time AI detection: intrusion, loitering, crowd, abandoned objects, virtual-line crossing, and more — no manual review needed." },
  { icon: "👤", name: "Face & License Plate Recognition",  desc: "Automated FR and LPR against watch-lists with instant operator alerts, integrated directly into the operational picture." },
  { icon: "🚨", name: "Smart Event Management",            desc: "Unified event log with severity levels, SLA tracking, automated escalation, and full audit trail for every incident." },
  { icon: "🗺️", name: "GIS / Live Map",                   desc: "Interactive operational map showing every asset, alert, patrol unit, and camera in real time for complete situational awareness." },
  { icon: "📊", name: "BI & Reports",                     desc: "Pre-built and ad-hoc dashboards, scheduled reports, KPI widgets, and data export for management and compliance needs." },
  { icon: "📡", name: "Panic Buttons / IoT",              desc: "Integrate panic buttons, environmental sensors, and IoT devices — trigger automated BPM workflows on any alert condition." },
  { icon: "📅", name: "Shift & Force Management",         desc: "Plan shifts, manage attendance, track field units, and maintain a full record of who was on duty during any incident." },
  { icon: "✅", name: "Task Management",                  desc: "Assign, track, and close tasks linked to incidents or standard operating procedures with SLA timers and escalation chains." },
  { icon: "🖥️", name: "Sensors Dashboard",               desc: "Live telemetry from all connected sensors displayed in configurable widgets — environmental, intrusion, access, and custom." },
  { icon: "⚙️", name: "BPM / Rules Engine",              desc: "Visual rule builder to define automated responses: alert → notify → escalate → close, fully auditable and configurable." },
];

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
  const dateStr  = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const fmtCurrency = (usd: number) => {
    const rates: Record<string, number> = { USD: 1,   NIS: 3.7,  MXN: 17.5 };
    const syms:  Record<string, string> = { USD: "$", NIS: "₪",  MXN: "MX$" };
    return `${syms[currency]}${Math.round(usd * rates[currency]).toLocaleString("en-US")}`;
  };

  const hw = calculateHW(buildHWInput(data));
  const isAnnual = data.pricingModel === "annual";

  const persistProposal = async (narrativeText: string, existingId: string | null): Promise<string | null> => {
    if (existingId) {
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
    const res  = await fetch("/api/export-docx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, narrative, vmRows }) });
    if (!res.ok) { alert("Export failed"); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${data.projectName || "K-Safety-Proposal"}.docx`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const res = await fetch("/api/export-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, narrative, vmRows }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      alert("PDF export failed: " + (err.error ?? "Unknown error"));
      return;
    }
    const html = await res.text();
    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow pop-ups for this site to export PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* ── Action Bar (unchanged) ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK_BLUE }}>Generate Proposal</h2>
          <p className="text-sm text-gray-500">Review the proposal, then save and export.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* ── Proposal Preview (template layout) ── */}
      <div id="proposal-preview" style={{ fontFamily: "'Inter', Arial, sans-serif", background: "white", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", fontSize: 14, color: "#2D3748", lineHeight: 1.6 }}>

        {/* ── HERO (REQ-01) ── */}
        <div style={{ background: `linear-gradient(135deg, ${DARK_BLUE} 0%, ${MID_BLUE} 100%)`, padding: "36px 48px 28px", position: "relative", overflow: "hidden" }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: "rgba(41,171,226,0.10)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, left: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          {/* Top row: logo + badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, background: ACCENT, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "white" }}>K</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Kabatone</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Smart City Safety Intelligence</div>
              </div>
            </div>
            <div style={{ background: ACCENT, color: "white", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, textAlign: "center" }}>
              Confidential
              <div style={{ display: "block", fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                {data.customerName} × Kabatone · {dateStr}
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ color: "white", fontSize: 36, fontWeight: 900, lineHeight: 1.2, marginBottom: 8, position: "relative" }}>
            {PRODUCT_LINES[data.productLine]?.label ?? "K-Safety"}<br />
            <span style={{ fontSize: 26 }}>{data.projectName || "Intelligent Command & Control Platform"}</span><br />
            <span style={{ fontSize: 20, fontWeight: 600 }}>for {data.city}, {data.country}</span>
          </div>

          {/* Subtitle */}
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, maxWidth: 600, position: "relative" }}>
            {PRODUCT_LINE_SUBTITLE[data.productLine]}
          </div>

          {/* Sector pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20, position: "relative" }}>
            {(PRODUCT_LINE_PILLS[data.productLine] ?? []).map((pill) => (
              <div key={pill} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)", color: "white", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {pill}
              </div>
            ))}
          </div>
        </div>

        {/* ── ACCENT BAND (REQ-02) ── */}
        {(() => {
          const parts: string[] = [];
          (data.cctvVendors ?? []).forEach(v => parts.push(v.vendorName || "VMS"));
          if (data.k1VideoEnabled) parts.push("K1-Video (VXG OEM)");
          (data.lprVendors  ?? []).forEach(v => parts.push(`LPR – ${v.vendorName || "LPR"}`));
          (data.faceVendors ?? []).forEach(v => parts.push(`Face – ${v.vendorName || "FR"}`));
          (data.iotVendors  ?? []).forEach(v => parts.push(v.vendorName || "IoT"));
          if (parts.length === 0) parts.push("Open Architecture", "Full VMS Integration", "IoT", "BI");
          return (
            <div style={{ background: ACCENT, color: "white", textAlign: "center", padding: "10px 48px", fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>
              {parts.join(" · ")}
            </div>
          );
        })()}

        {/* ── CONTENT ── */}
        <div style={{ padding: "32px 48px" }}>

          {/* ── REQ-04: What is K-Safety? ── */}
          <ProposalSectionTitle icon={PRODUCT_LINES[data.productLine]?.icon ?? "🛡️"} text={`What is ${PRODUCT_LINES[data.productLine]?.label ?? "K-Safety"}?`} />
          <p style={{ marginBottom: 16, fontSize: 14, lineHeight: 1.7, color: "#2D3748" }}>
            {PRODUCT_LINE_OVERVIEW[data.productLine]}
          </p>
          {/* Investment callout */}
          <div style={{ borderLeft: `4px solid ${ACCENT}`, background: "#F0F9FF", padding: "12px 20px", borderRadius: "0 8px 8px 0", marginBottom: 28, display: "inline-block", minWidth: 280 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>{isAnnual ? "Annual Investment" : "Perpetual Investment (one-time)"}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: DARK_BLUE, margin: "4px 0" }}>
              {fmtCurrency(isAnnual ? Math.round(pricing.annualTotal * (1 - (data.discount ?? 0) / 100)) : Math.round(pricing.perpetualTotal * (1 - (data.discount ?? 0) / 100)))}
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              {isAnnual ? "per year" : `${fmtCurrency(Math.round(pricing.year2SupportAnnual * (1 - (data.discount ?? 0) / 100)))}/yr support from Year 2`}
              {(data.discount ?? 0) > 0 && <span style={{ marginLeft: 8, color: "#16A34A", fontWeight: 700 }}>{data.discount}% discount applied</span>}
            </div>
          </div>

          {/* ── REQ-05: Core Capabilities (3-col feature cards) ── */}
          <ProposalSectionTitle icon="⚡" text="Core Capabilities" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
            {CORE_CAPABILITIES.map((cap, i) => (
              <div key={i} style={{ background: "#F7F9FC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{cap.icon}</div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: DARK_BLUE, marginBottom: 6 }}>{cap.name}</h4>
                <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{cap.desc}</p>
              </div>
            ))}
          </div>

          {/* ── REQ-06: Use Cases ── */}
          <ProposalSectionTitle icon="🎯" text={`Use Cases — ${PRODUCT_LINES[data.productLine]?.label ?? "K-Safety"}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
            {(PRODUCT_LINE_USE_CASES[data.productLine] ?? []).map((uc, i) => (
              <div key={i} style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${MID_BLUE})`, borderRadius: 10, padding: 18, color: "white", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(41,171,226,0.12)" }} />
                <div style={{ fontSize: 30, marginBottom: 8 }}>{uc.icon}</div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "white" }}>{uc.title}</h4>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{uc.desc}</p>
              </div>
            ))}
          </div>

          {/* ── REQ-07: Divider ── */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${ACCENT}, transparent)`, margin: "20px 0" }} />

          {/* ── REQ-08: Integration Chips ── */}
          {(() => {
            const chips: { label: string; sub?: string; ready: boolean }[] = [];
            (data.cctvVendors ?? []).forEach(v => chips.push({ label: v.vendorName || "VMS", ready: !v.isOther, sub: v.isOther ? "Non-standard — R&D evaluation required" : undefined }));
            if (data.k1VideoEnabled) chips.push({ label: "K1-Video (VXG OEM)", ready: true });
            (data.lprVendors ?? []).forEach(v => chips.push({ label: `LPR – ${v.vendorName || "LPR"}`, ready: !v.isOther, sub: v.isOther ? "Non-standard — R&D evaluation required" : undefined }));
            (data.faceVendors ?? []).forEach(v => chips.push({ label: `Face – ${v.vendorName || "FR"}`, ready: !v.isOther, sub: v.isOther ? "Non-standard — R&D evaluation required" : undefined }));
            (data.iotVendors ?? []).forEach(v => chips.push({ label: v.vendorName || "IoT Sensor", ready: !v.isOther, sub: v.isOther ? "Non-standard — R&D evaluation required" : undefined }));
            if (chips.length === 0) return null;
            return (
              <>
                <ProposalSectionTitle icon="🔗" text="Supported Integrations — Open Architecture" />
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10, display: "flex", gap: 16, alignItems: "center" }}>
                  <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#22C55E", marginRight: 4 }} />Ready</span>
                  <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#F59E0B", marginRight: 4 }} />In Development / Partial</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                  {chips.map((chip, i) => (
                    <div key={i} style={{ background: "white", border: `2px solid ${chip.ready ? "#D6E8F7" : "#FDE68A"}`, color: DARK_BLUE, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: chip.ready ? "#22C55E" : "#F59E0B", flexShrink: 0 }} />
                      <div>
                        <div>{chip.label}</div>
                        {chip.sub && <div style={{ fontSize: 10, color: "#64748B", fontWeight: 400, marginTop: 1 }}>{chip.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: `linear-gradient(90deg, ${ACCENT}, transparent)`, margin: "20px 0" }} />
              </>
            );
          })()}

          {/* ── REQ-09: Pricing Table ── */}
          <ProposalSectionTitle icon="💰" text={`Pricing Summary — ${isAnnual ? "Annual Subscription" : "Perpetual License"}`} />
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28, fontSize: 13 }}>
            <thead>
              <tr style={{ background: DARK_BLUE, color: "white" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, borderRadius: "8px 0 0 0" }}>Component</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700 }}>Unit</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700 }}>{isAnnual ? "Annual Price" : "Perpetual Price"}</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, borderRadius: "0 8px 0 0" }}>{isAnnual ? "Annual Total" : "Perpetual Total"}</th>
              </tr>
            </thead>
            <tbody>
              {/* Platform & Licenses */}
              {pricing.licenseItems.length > 0 && (
                <tr><td colSpan={4} style={{ background: "#D6E8F7", color: DARK_BLUE, fontWeight: 700, fontSize: 12, padding: "6px 14px" }}>Platform &amp; Licenses</td></tr>
              )}
              {pricing.licenseItems.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F7F9FC" }}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0" }}>
                    {item.name}{item.isModified && <span style={{ marginLeft: 4, color: "#B45309", fontWeight: 700, fontSize: 11 }}>*</span>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                    {item.quantity > 1 ? `${item.quantity} ${item.unitLabel}s` : `per ${item.unitLabel}`}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", textAlign: "right" }}>
                    <span style={item.isModified ? { background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 4 } : {}}>
                      {isAnnual ? fmtCurrency(item.annualUnit) : fmtCurrency(item.perpetualUnit ?? item.annualUnit * PERP_MULTIPLIER)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", textAlign: "right", color: DARK_BLUE, fontWeight: 700 }}>
                    {isAnnual ? fmtCurrency(item.annualTotal) : fmtCurrency(item.perpetualTotal)}
                  </td>
                </tr>
              ))}

              {/* Services */}
              {pricing.serviceItems.length > 0 && (
                <tr><td colSpan={4} style={{ background: "#D6E8F7", color: DARK_BLUE, fontWeight: 700, fontSize: 12, padding: "6px 14px" }}>Professional Services (one-time)</td></tr>
              )}
              {pricing.serviceItems.map((item, i) => (
                <tr key={`svc-${i}`} style={{ background: "white" }}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0" }}>
                    {item.name}{item.isModified && <span style={{ marginLeft: 4, color: "#B45309", fontWeight: 700, fontSize: 11 }}>*</span>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>Project</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", textAlign: "right" }}>
                    <span style={item.isModified ? { background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 4 } : {}}>
                      {fmtCurrency(item.annualUnit)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", textAlign: "right", color: DARK_BLUE, fontWeight: 700 }}>
                    {fmtCurrency(item.annualTotal)}
                  </td>
                </tr>
              ))}

              {/* Discount row */}
              {(data.discount ?? 0) > 0 && (
                <tr style={{ background: "#FEFCE8" }}>
                  <td colSpan={3} style={{ padding: "8px 14px", color: "#92400E", fontWeight: 700, fontStyle: "italic" }}>Discount ({data.discount}%)</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", color: "#16A34A", fontWeight: 700 }}>
                    −{fmtCurrency(isAnnual ? Math.round(pricing.annualTotal * (data.discount ?? 0) / 100) : Math.round(pricing.perpetualTotal * (data.discount ?? 0) / 100))}
                  </td>
                </tr>
              )}

              {/* Grand Total */}
              <tr style={{ background: DARK_BLUE }}>
                <td colSpan={2} style={{ padding: "12px 14px", color: "white", fontWeight: 900, textAlign: "right", fontSize: 15 }}>GRAND TOTAL</td>
                <td colSpan={2} style={{ padding: "12px 14px", color: "white", fontWeight: 900, textAlign: "right", fontSize: 18 }}>
                  {fmtCurrency(isAnnual
                    ? Math.round(pricing.annualTotal * (1 - (data.discount ?? 0) / 100))
                    : Math.round(pricing.perpetualTotal * (1 - (data.discount ?? 0) / 100)))}
                  <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8, marginLeft: 6 }}>{isAnnual ? "/year" : "one-time"}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 5-year note */}
          <div style={{ marginBottom: 28, padding: "10px 16px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE", display: "inline-block" }}>
            {isAnnual ? (
              <><span style={{ fontSize: 13, color: "#64748B" }}>5-Year Total (annual × 5): </span>
                <strong style={{ color: MID_BLUE, fontSize: 16 }}>{fmtCurrency(Math.round(pricing.fiveYearAnnual * (1 - (data.discount ?? 0) / 100)))}</strong></>
            ) : (
              <><span style={{ fontSize: 13, color: "#64748B" }}>5-Year Total (perpetual + 4yr support): </span>
                <strong style={{ color: DARK_BLUE, fontSize: 16 }}>{fmtCurrency(Math.round(pricing.fiveYearPerpetual * (1 - (data.discount ?? 0) / 100)))}</strong></>
            )}
          </div>
          {pricing.lineItems.some(i => i.isModified) && (
            <div style={{ marginBottom: 28, fontSize: 12, color: "#B45309" }}>* Price modified from default.</div>
          )}

          {/* ── REQ-10: Business Model Box ── */}
          <ProposalSectionTitle icon="📋" text="Business Model" />
          <div style={{ maxWidth: 560, border: `2px solid ${ACCENT}`, borderRadius: 10, padding: 20, background: "linear-gradient(135deg, #F0F9FF, #E0F3FF)", marginBottom: 28 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: MID_BLUE, marginBottom: 10 }}>
              {isAnnual ? "💰 Annual Subscription Model" : "🏛️ Perpetual License Model — Recommended for Strategic Facilities"}
            </h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {(isAnnual ? [
                "Recurring annual fee — predictable budget",
                "Includes version updates, support & maintenance",
                "SLA 8×5 standard (upgrade to 24×7 available)",
                data.deploymentType === "cloud" ? "☁️ Cloud-hosted by Kabatone" : "🏢 On-premises — installed in customer data centre",
              ] : [
                "One-time payment for a perpetual license",
                `Annual maintenance from Year 2: 20% of perpetual (${fmtCurrency(pricing.year2SupportAnnual)}/yr)`,
                "Includes version updates, support & maintenance",
                "SLA 8×5 standard (upgrade to 24×7 available)",
                data.deploymentType === "cloud" ? "☁️ Cloud-hosted by Kabatone" : "🏢 On-premises — full data control",
              ]).map((item, i) => (
                <li key={i} style={{ padding: "5px 0", borderBottom: "1px dashed #E2E8F0", fontSize: 13, color: "#2D3748" }}>
                  <span style={{ color: ACCENT, fontWeight: 700, marginRight: 6 }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── REQ-11: HW Infrastructure ── */}
          <ProposalSectionTitle icon="💻" text="HW Infrastructure Requirements" />
          {data.deploymentType === "cloud" && (
            <div style={{ background: "rgba(30,107,168,0.08)", color: MID_BLUE, padding: "10px 16px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
              ☁️ <strong>Cloud deployment</strong> — specs below represent AWS EC2 / Azure VM equivalents. Physical server procurement not required. Kabatone coordinates cloud infrastructure setup.
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: DARK_BLUE }}>
                  {["Service / Server", "Instances", "vCPU", "RAM GB", "HDD GB"].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-white font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vmRows.map((vm, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 font-semibold" style={{ color: DARK_BLUE }}>{vm.serverName}</td>
                    <td className="px-3 py-2 text-center">{vm.amount}</td>
                    <td className="px-3 py-2 text-center">{vm.vCores}</td>
                    <td className="px-3 py-2 text-center">{vm.ramGB}</td>
                    <td className="px-3 py-2 text-center">{vm.storageGB > 0 ? vm.storageGB : vm.localDiskGB}</td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ backgroundColor: "rgba(26,58,92,0.07)" }} className="font-bold">
                  <td colSpan={2} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>
                    TOTAL ({vmRows.reduce((s, v) => s + v.amount, 0)} servers)
                  </td>
                  <td className="px-3 py-2 text-center" style={{ color: MID_BLUE }}>
                    {vmRows.reduce((s, v) => s + v.vCores * v.amount, 0)}
                  </td>
                  <td className="px-3 py-2 text-center" style={{ color: MID_BLUE }}>
                    {vmRows.reduce((s, v) => s + v.ramGB * v.amount, 0)}
                  </td>
                  <td className="px-3 py-2 text-center" style={{ color: MID_BLUE }}>
                    {vmRows.reduce((s, v) => s + (v.storageGB > 0 ? v.storageGB : v.localDiskGB) * v.amount, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* K1-Video HW table (conditional) */}
          {!!(data.k1VideoEnabled) && (data.k1VideoChannels ?? 0) > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: DARK_BLUE, marginBottom: 8 }}>K1-Video HW Requirements (VXG Embedded VMS)</h4>
              <K1VideoHWTable
                cameras={data.k1VideoChannels ?? 0}
                bitrateMbps={data.k1VideoBitrateMbps ?? 2}
                retentionDays={data.k1VideoRetentionDays ?? 30}
                deploymentType={data.deploymentType}
              />
            </div>
          )}

          {/* Storage summary pill */}
          {hw.totals.grandTotalTB > 0 && (
            <div style={{ marginBottom: 28, padding: "8px 16px", background: "#F0F9FF", borderRadius: 20, border: `1px solid ${ACCENT}`, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>💾</span>
              <span style={{ color: "#64748B" }}>Total Storage Requirement:</span>
              <strong style={{ color: DARK_BLUE }}>{round2(hw.totals.grandTotalTB)} TB</strong>
            </div>
          )}

          {/* ── REQ-12: Why K-Safety? ── */}
          <ProposalSectionTitle icon="⭐" text={`Why ${PRODUCT_LINES[data.productLine]?.label ?? "K-Safety"}?`} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div style={{ background: "#F7F9FC", borderRadius: 10, padding: 18 }}>
              {(WHY_LEFT[data.productLine] ?? []).map((item, i) => (
                <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#2D3748" }}>
                  <span style={{ color: ACCENT, fontWeight: 700 }}>✓ </span>{item}
                </p>
              ))}
            </div>
            <div style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${MID_BLUE})`, borderRadius: 10, padding: 18, color: "white" }}>
              {(WHY_RIGHT[data.productLine] ?? []).map((item, i) => (
                <p key={i} style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <span style={{ opacity: 0.7 }}>▪ </span>{item}
                </p>
              ))}
            </div>
          </div>

          {/* ── REQ-13: AI Executive Summary ── */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${ACCENT}, transparent)`, margin: "20px 0" }} />
          <ProposalSectionTitle icon="✨" text="AI Executive Summary" />
          <div style={{ marginBottom: 16 }}>
            <button onClick={generateNarrative} disabled={generating}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, background: DARK_BLUE, color: "white", border: "none", cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.6 : 1 }}>
              {generating ? "Generating…" : "✨ Generate AI Summary"}
            </button>
          </div>
          {narrative ? (
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.75 }}>
              {narrative.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return (
                  <h4 key={i} style={{ fontSize: 15, fontWeight: 700, color: DARK_BLUE, marginTop: 20, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid #E5E7EB` }}>
                    {line.replace("## ", "")}
                  </h4>
                );
                if (line.startsWith("- ")) return (
                  <div key={i} style={{ display: "flex", gap: 8, marginLeft: 8, marginBottom: 4 }}>
                    <span style={{ color: MID_BLUE, fontWeight: 700, flexShrink: 0 }}>▸</span>
                    <span>{line.replace("- ", "")}</span>
                  </div>
                );
                if (line.trim() === "") return null;
                return <p key={i} style={{ marginBottom: 8 }}>{line}</p>;
              })}
            </div>
          ) : (
            <div style={{ fontStyle: "italic", color: "#94A3B8", fontSize: 13, padding: "24px 0", textAlign: "center", background: "#F8FAFC", borderRadius: 8 }}>
              Click &ldquo;✨ Generate AI Summary&rdquo; to create a personalised executive narrative for this customer.
            </div>
          )}
        </div>

        {/* ── REQ-14: CTA Footer ── */}
        <div style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${MID_BLUE})`, padding: "28px 48px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 24 }}>
          <div>
            <h3 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
              Ready to start with {data.projectName || "K-Safety"}?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              Contact Kabatone for next steps, timeline, and contract. Valid 30 days from {dateStr}.
            </p>
            <p style={{ marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
              🌐 www.kabatone.com &nbsp;|&nbsp; ✉ info@kabatone.com
              {data.salesPerson && <span> &nbsp;|&nbsp; Your contact: {data.salesPerson}</span>}
            </p>
          </div>
          <a href="mailto:info@kabatone.com" style={{ background: ACCENT, color: "white", padding: "14px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", display: "block", textAlign: "center" }}>
            ✉ Contact Us
          </a>
        </div>

      </div>
    </div>
  );
}


function ProposalSectionTitle({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1A3A5C", marginBottom: 16, paddingBottom: 8, borderBottom: "3px solid #29ABE2", display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {text}
    </div>
  );
}

// K1-Video HW Table helper
function K1VideoHWTable({ cameras, bitrateMbps, retentionDays, deploymentType }: { cameras: number; bitrateMbps: number; retentionDays: number; deploymentType: DeploymentType }) {
  const hwResult = calculateK1VideoHW({ cameras, bitrateMbps, retentionDays, deploymentType });
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: DARK_BLUE }}>
            {["Service", "Instances", "vCPU", "RAM GB", "HDD GB"].map(h => (
              <th key={h} className="text-left px-3 py-2 text-white font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hwResult.serviceRows.map((spec, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2">{spec.service}</td>
              <td className="px-3 py-2 text-center">{spec.instances}</td>
              <td className="px-3 py-2 text-center">{spec.vCPU}</td>
              <td className="px-3 py-2 text-center">{spec.ramGB}</td>
              <td className="px-3 py-2 text-center">{spec.hddGB}</td>
            </tr>
          ))}
          <tr style={{ backgroundColor: "rgba(26,58,92,0.07)" }} className="font-bold">
            <td colSpan={2} className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>TOTAL (+ {Math.round(hwResult.overheadPct * 100)}% overhead)</td>
            <td className="px-3 py-2 text-center" style={{ color: MID_BLUE }}>{hwResult.finalVCPU}</td>
            <td className="px-3 py-2 text-center" style={{ color: MID_BLUE }}>{hwResult.finalRAM}</td>
            <td className="px-3 py-2 text-center" style={{ color: MID_BLUE }}>{hwResult.finalHDD}</td>
          </tr>
        </tbody>
      </table>
      <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
        <strong>Nodes:</strong> {hwResult.nodes.count}× {hwResult.nodes.spec} &nbsp;|&nbsp;
        <strong>Video:</strong> {round2(hwResult.videoTB)} TB &nbsp;|&nbsp;
        <strong>Archive:</strong> {round2(hwResult.archiveTB)} TB &nbsp;|&nbsp;
        <strong>RAID/Redundancy:</strong> {round2(hwResult.raidOrRedundancyTB)} TB &nbsp;|&nbsp;
        <strong>Total Storage:</strong> {round2(hwResult.totalStorageTB)} TB
      </div>
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

  // Pre-fill salesPerson with the logged-in user's name on first load
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((me) => {
        if (me?.name) {
          setData((d) => ({ ...d, salesPerson: d.salesPerson || me.name }));
        }
      })
      .catch(() => {});
  }, []);

  // Initialize vmRows when reaching step 5
  useEffect(() => {
    if (step === 5 && vmRows.length === 0) {
      setVmRows(calculateHW(buildHWInput(data)).vmSpecs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Pre-fill from history
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

  // Auto-save when reaching step 6
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
    if (step === 1) return !!(data.productLine && data.deploymentType && data.pricingModel);
    if (step === 2) return !!(data.customerName && data.city && data.country && data.contactPerson && data.projectName);
    if (step === 3) {
      const hasProducts = data.selectedProducts.length > 0;
      const cctvOk = !data.selectedProducts.includes("cctv") || (data.cctvVendors ?? []).length > 0 || (data.k1VideoEnabled ?? false);
      return hasProducts && cctvOk;
    }
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
