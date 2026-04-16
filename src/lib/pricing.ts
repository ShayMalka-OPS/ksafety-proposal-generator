import {
  DEFAULT_ANNUAL_PRICES,
  PERP_MULTIPLIER,
  SUPPORT_PCT,
  getPriceKey,
} from "./default-prices";

export interface ProductConfig {
  id: string;
  name: string;
  category: "platform" | "video" | "app" | "services";
  unitLabel: string;
  annualPrice: number;   // default — use customPrices to override
  perpetualPrice: number;
  description: string;
  hasQuantity: boolean;
}

export const PRODUCTS: ProductConfig[] = [
  {
    id: "core",
    name: "K-Safety Core Platform",
    category: "platform",
    unitLabel: "instance",
    annualPrice: 5000,
    perpetualPrice: 17500,
    description:
      "Complete smart city safety platform including Event Management, Task Management, BPM/RBE, Shift Management, Lists, Organizations, Users/Groups, Reports/BI, Sensors Dashboard, and GIS/Map.",
    hasQuantity: false,
  },
  {
    id: "cctv",
    name: "CCTV Video Channels",
    category: "video",
    unitLabel: "channel",
    annualPrice: 100,
    perpetualPrice: 350,
    description:
      "Full HD video surveillance channels integrated with the K-Safety platform, enabling live monitoring, recording, and AI-driven event correlation.",
    hasQuantity: true,
  },
  {
    id: "lpr",
    name: "LPR – License Plate Recognition",
    category: "video",
    unitLabel: "channel",
    annualPrice: 500,
    perpetualPrice: 1750,
    description:
      "Automated license plate recognition for traffic monitoring, access control, and law enforcement support with real-time alerts and historical search.",
    hasQuantity: true,
  },
  {
    id: "face",
    name: "Face Recognition",
    category: "video",
    unitLabel: "channel",
    annualPrice: 625,
    perpetualPrice: 2188,
    description:
      "AI-powered facial recognition for identifying persons of interest, access control, and crowd analytics with watchlist management.",
    hasQuantity: true,
  },
  {
    id: "analytics",
    name: "Video Analytics (AI)",
    category: "video",
    unitLabel: "channel",
    annualPrice: 556,
    perpetualPrice: 1946,
    description:
      "Advanced AI video analytics including intrusion detection, loitering, crowd density, abandoned objects, and behavioral analysis.",
    hasQuantity: true,
  },
  {
    id: "users",
    name: "User Licenses",
    category: "platform",
    unitLabel: "user",
    annualPrice: 100,
    perpetualPrice: 350,
    description:
      "Named user licenses for operators, supervisors, and administrators accessing the K-Safety platform.",
    hasQuantity: true,
  },
  {
    id: "iot",
    name: "IoT Sensors",
    category: "platform",
    unitLabel: "sensor",
    annualPrice: 5,
    perpetualPrice: 18,
    description:
      "Integration licenses for IoT sensors including environmental monitors, gunshot detectors, panic buttons, and smart city sensors.",
    hasQuantity: true,
  },
  {
    id: "kshare",
    name: "K-Share Mobile App",
    category: "app",
    unitLabel: "tier",
    annualPrice: 0,
    perpetualPrice: 0,
    description:
      "Citizen-facing mobile application for incident reporting, real-time alerts, and community engagement with the city's safety operations center.",
    hasQuantity: false,
  },
  {
    id: "kreact",
    name: "K-React First Responder App",
    category: "app",
    unitLabel: "unit",
    annualPrice: 50,
    perpetualPrice: 175,
    description:
      "Mobile application for first responders providing real-time dispatch, incident details, navigation, and two-way communication with the operations center.",
    hasQuantity: true,
  },
  {
    id: "services",
    name: "Professional Services",
    category: "services",
    unitLabel: "package",
    annualPrice: 0,
    perpetualPrice: 0,
    description:
      "Expert installation, configuration, training, and go-live support by Kabatone certified engineers.",
    hasQuantity: false,
  },
];

export type KShareTier = "entry" | "small" | "medium" | "large" | "mega";
export type ServicesPackage = "installation" | "training" | "full";

export const KSHARE_PRICING: Record<KShareTier, { label: string; price: number }> = {
  entry:  { label: "Entry (up to 50K population) – Included", price: 0 },
  small:  { label: "Small (50K–100K population)",            price: 10000 },
  medium: { label: "Medium (100K–500K population)",          price: 20000 },
  large:  { label: "Large (500K–1M population)",             price: 35000 },
  mega:   { label: "Mega (1M+ population)",                  price: 50000 },
};

export const SERVICES_PRICING: Record<ServicesPackage, { label: string; price: number }> = {
  installation: { label: "Installation & Setup (2 weeks)",         price: 10000 },
  training:     { label: "Training & Implementation (1 week)",     price: 2250  },
  full:         { label: "Full Implementation (1 month)",          price: 15000 },
};

export type ProductLine = "ksafety" | "kvideo" | "kdispatch";
export type DeploymentType = "onprem" | "cloud";

export const PRODUCT_LINES: Record<ProductLine, { label: string; description: string; icon: string }> = {
  ksafety:   { label: "K-Safety",   description: "Command & Control platform — full smart city safety suite", icon: "🛡️" },
  kvideo:    { label: "K-Video",    description: "Video surveillance, LPR, face recognition & AI analytics",  icon: "📹" },
  kdispatch: { label: "K-Dispatch", description: "First-responder dispatch, K-React mobile & CAD integration", icon: "🚨" },
};

// ─── v1.7.0 Vendor types ──────────────────────────────────────────────────────

/** Supported CCTV/VMS vendors. "other" means user entered a custom name. */
export const VMS_VENDORS = [
  "Milestone",
  "HikVision",
  "Genetec",
  "Dahua",
  "ISS (SecureOS)",
  "Digivod",
] as const;

export type VmsVendorId = typeof VMS_VENDORS[number] | "other";

export interface VmsVendorEntry {
  vendorName: string;  // one of VMS_VENDORS or custom text if "other"
  channels: number;
  isOther: boolean;
}

/** Supported LPR vendors */
export const LPR_VENDORS = [
  "Nerosoft",
  "Milestone",
] as const;

export type LprVendorId = typeof LPR_VENDORS[number] | "other";

export interface LprVendorEntry {
  vendorName: string;
  channels: number;
  isOther: boolean;
}

/** Supported Face Recognition vendors */
export const FACE_VENDORS = [
  "Corsight",
  "SAFR",
] as const;

export type FaceVendorId = typeof FACE_VENDORS[number] | "other";

export interface FaceVendorEntry {
  vendorName: string;
  channels: number;
  isOther: boolean;
}

/** IoT sensor types */
export const IOT_VENDORS = [
  "AVL – Motorola",
  "AVL – Hytera",
  "Panic Buttons",
  "Access Control",
  "Fire Alarm (Telefire)",
  "Traffic Lights (YSB)",
  "Smart Light (Tondo)",
  "Alarm System (PIMA)",
  "Alarm System (RISCO)",
] as const;

export type IotVendorId = typeof IOT_VENDORS[number] | "other";

export interface IotVendorEntry {
  vendorName: string;
  units: number;
  isOther: boolean;
}

// ─── ProposalData ─────────────────────────────────────────────────────────────

export interface ProposalData {
  // Step 1 — Product line, deployment type & pricing model (moved here in v1.7.0)
  productLine: ProductLine;
  deploymentType: DeploymentType;
  pricingModel: "annual" | "perpetual";   // moved from Step 3 to Step 1 in v1.7.0

  // Step 2 — Customer Info
  customerName: string;
  city: string;
  country: string;
  contactPerson: string;
  contactEmail: string;
  projectName: string;
  salesPerson: string;

  // Step 3 — Products, quantities & custom prices
  selectedProducts: string[];
  quantities: Record<string, number>;
  kshareТier: KShareTier;
  servicesPackage: ServicesPackage | null;
  /** Per-product price overrides. Key = getPriceKey(productId, tier, package). */
  customPrices: Record<string, number>;

  // v1.7.0 — Vendor selections per module (optional for backward compat with pre-1.7 saved proposals)
  cctvVendors?: VmsVendorEntry[];         // CCTV 3rd-party VMS vendors
  k1VideoEnabled?: boolean;              // K1-Video (VXG OEM embedded VMS)
  k1VideoChannels?: number;
  k1VideoRetentionDays?: number;
  k1VideoBitrateMbps?: number;
  lprVendors?: LprVendorEntry[];         // LPR integration vendors
  faceVendors?: FaceVendorEntry[];       // Face Recognition vendors
  iotVendors?: IotVendorEntry[];         // IoT sensor types

  // Step 4 — HW configuration
  haMode: boolean;
  videoBitrateMbps: number;
  retentionDays: {
    lpr: number;
    fr: number;
    va: number;
    iot: number;
    cctv: number;
  };

  // Step 5 — Discount
  discount?: number;   // percentage 0–100, applied to licence total

  // Step 6 — Generated content
  aiNarrative?: string;
}

// ─── Line item with modification flag ────────────────────────────────────────

export interface LineItem {
  name: string;
  quantity: number;
  unitLabel: string;
  annualUnit: number;
  perpetualUnit: number;
  annualTotal: number;
  perpetualTotal: number;
  isModified: boolean;   // true when the user overrode the default price
  priceKey: string;      // key used for customPrices
  isService: boolean;    // services are excluded from perpetual ×3.5
}

// ─── calculatePricing ─────────────────────────────────────────────────────────

export function calculatePricing(data: ProposalData): {
  lineItems: LineItem[];
  licenseItems: LineItem[];
  serviceItems: LineItem[];
  annualTotal: number;
  perpetualTotal: number;
  licensesAnnual: number;
  licensesPerpetual: number;
  servicesTotal: number;
  fiveYearAnnual: number;
  fiveYearPerpetual: number;
  year2SupportAnnual: number;
} {
  const cp = data.customPrices ?? {};
  const lineItems: LineItem[] = [];

  for (const productId of data.selectedProducts) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) continue;

    if (productId === "kshare") {
      const priceKey   = getPriceKey("kshare", data.kshareТier);
      const defaultAnn = DEFAULT_ANNUAL_PRICES[priceKey] ?? 0;
      const annualUnit = cp[priceKey] ?? defaultAnn;
      const isModified = priceKey in cp && cp[priceKey] !== defaultAnn;
      const tier = KSHARE_PRICING[data.kshareТier];
      lineItems.push({
        name: `${product.name} – ${tier.label.split("–")[0].trim()}`,
        quantity: 1,
        unitLabel: "tier",
        annualUnit,
        perpetualUnit: annualUnit * PERP_MULTIPLIER,
        annualTotal: annualUnit,
        perpetualTotal: annualUnit * PERP_MULTIPLIER,
        isModified,
        priceKey,
        isService: false,
      });
      continue;
    }

    if (productId === "services") {
      if (!data.servicesPackage) continue;
      const priceKey   = getPriceKey("services", undefined, data.servicesPackage);
      const defaultAnn = DEFAULT_ANNUAL_PRICES[priceKey] ?? 0;
      const annualUnit = cp[priceKey] ?? defaultAnn;
      const isModified = priceKey in cp && cp[priceKey] !== defaultAnn;
      const pkg = SERVICES_PRICING[data.servicesPackage];
      lineItems.push({
        name: `${product.name} – ${pkg.label}`,
        quantity: 1,
        unitLabel: "package",
        annualUnit,
        perpetualUnit: annualUnit, // services are not ×3.5
        annualTotal: annualUnit,
        perpetualTotal: annualUnit,
        isModified,
        priceKey,
        isService: true,
      });
      continue;
    }

    // Standard product
    const priceKey   = productId;
    const defaultAnn = DEFAULT_ANNUAL_PRICES[priceKey] ?? product.annualPrice;
    const annualUnit = cp[priceKey] ?? defaultAnn;
    const isModified = priceKey in cp && cp[priceKey] !== defaultAnn;
    const qty        = product.hasQuantity ? (data.quantities[productId] ?? 1) : 1;

    lineItems.push({
      name: product.name,
      quantity: qty,
      unitLabel: product.unitLabel,
      annualUnit,
      perpetualUnit: annualUnit * PERP_MULTIPLIER,
      annualTotal: annualUnit * qty,
      perpetualTotal: annualUnit * PERP_MULTIPLIER * qty,
      isModified,
      priceKey,
      isService: false,
    });
  }

  const licenseItems = lineItems.filter((i) => !i.isService);
  const serviceItems = lineItems.filter((i) => i.isService);

  const licensesAnnual    = licenseItems.reduce((s, i) => s + i.annualTotal, 0);
  const licensesPerpetual = licenseItems.reduce((s, i) => s + i.perpetualTotal, 0);
  const servicesTotal     = serviceItems.reduce((s, i) => s + i.annualTotal, 0);

  const annualTotal    = licensesAnnual    + servicesTotal;
  const perpetualTotal = licensesPerpetual + servicesTotal;

  const year2Support = licensesPerpetual * SUPPORT_PCT; // support only on licenses

  return {
    lineItems,
    licenseItems,
    serviceItems,
    annualTotal,
    perpetualTotal,
    licensesAnnual,
    licensesPerpetual,
    servicesTotal,
    fiveYearAnnual:    annualTotal * 5,
    fiveYearPerpetual: perpetualTotal + year2Support * 4,
    year2SupportAnnual: year2Support,
  };
}

// Re-export constants for consumers that import from pricing.ts
export { DEFAULT_ANNUAL_PRICES, PERP_MULTIPLIER, SUPPORT_PCT, getPriceKey };

/** Products available per product line (used to filter Step 2 selection) */
export const PRODUCT_LINE_PRODUCTS: Record<ProductLine, string[]> = {
  ksafety:   ["core","cctv","lpr","face","analytics","users","iot","kshare","kreact","services"],
  kvideo:    ["cctv","lpr","face","analytics","users","services"],
  kdispatch: ["core","kreact","kshare","users","services"],
};

/** Helper: total CCTV channels from all vendor entries */
export function totalCctvChannels(data: ProposalData): number {
  return (data.cctvVendors ?? []).reduce((s, v) => s + v.channels, 0);
}

/** Helper: total LPR channels from all vendor entries */
export function totalLprChannels(data: ProposalData): number {
  return (data.lprVendors ?? []).reduce((s, v) => s + v.channels, 0);
}

/** Helper: total Face Recognition channels from all vendor entries */
export function totalFaceChannels(data: ProposalData): number {
  return (data.faceVendors ?? []).reduce((s, v) => s + v.channels, 0);
}

/** Helper: total IoT units from all vendor entries */
export function totalIotUnits(data: ProposalData): number {
  return (data.iotVendors ?? []).reduce((s, v) => s + v.units, 0);
}

/** Returns true if any "other" (unsupported) vendor is selected for any module */
export function hasUnsupportedVendors(data: ProposalData): boolean {
  return (
    (data.cctvVendors ?? []).some((v) => v.isOther) ||
    (data.lprVendors  ?? []).some((v) => v.isOther) ||
    (data.faceVendors ?? []).some((v) => v.isOther) ||
    (data.iotVendors  ?? []).some((v) => v.isOther)
  );
}
