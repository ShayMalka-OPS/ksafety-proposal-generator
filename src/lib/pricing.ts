export interface ProductConfig {
  id: string;
  name: string;
  category: "platform" | "video" | "app" | "services";
  unitLabel: string;
  annualPrice: number; // per unit
  perpetualPrice: number; // per unit
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
    annualPrice: 0, // dynamic based on population
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
    annualPrice: 0, // dynamic
    perpetualPrice: 0,
    description:
      "Expert installation, configuration, training, and go-live support by Kabatone certified engineers.",
    hasQuantity: false,
  },
];

export type KShareTier = "entry" | "small" | "medium" | "large" | "mega";
export type ServicesPackage = "installation" | "training" | "full";

export const KSHARE_PRICING: Record<KShareTier, { label: string; price: number }> = {
  entry: { label: "Entry (up to 50K population) – Included", price: 0 },
  small: { label: "Small (50K–100K population)", price: 10000 },
  medium: { label: "Medium (100K–500K population)", price: 20000 },
  large: { label: "Large (500K–1M population)", price: 35000 },
  mega: { label: "Mega (1M+ population)", price: 50000 },
};

export const SERVICES_PRICING: Record<ServicesPackage, { label: string; price: number }> = {
  installation: { label: "Installation & Setup (2 weeks)", price: 10000 },
  training: { label: "Training & Implementation (1 week)", price: 2250 },
  full: { label: "Full Implementation (1 month)", price: 15000 },
};

export interface ProposalData {
  // Step 1 - Customer Info
  customerName: string;
  city: string;
  country: string;
  contactPerson: string;
  contactEmail: string;
  projectName: string;
  salesPerson: string;

  // Step 2+3 - Products & Config
  selectedProducts: string[];
  quantities: Record<string, number>;
  kshareТier: KShareTier;
  servicesPackage: ServicesPackage | null;
  pricingModel: "annual" | "perpetual";

  // Step 3 - HW configuration
  haMode: boolean;
  videoBitrateMbps: number;
  retentionDays: {
    lpr: number;
    fr: number;
    va: number;
    iot: number;
    cctv: number;
  };

  // Step 5 - Generated content
  aiNarrative?: string;
}

export interface LineItem {
  name: string;
  quantity: number;
  unitLabel: string;
  annualUnit: number;
  perpetualUnit: number;
  annualTotal: number;
  perpetualTotal: number;
}

export function calculatePricing(data: ProposalData): {
  lineItems: LineItem[];
  annualTotal: number;
  perpetualTotal: number;
  fiveYearAnnual: number;
  fiveYearPerpetual: number;
  year2SupportAnnual: number;
} {
  const lineItems: LineItem[] = [];

  for (const productId of data.selectedProducts) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) continue;

    if (productId === "kshare") {
      const tier = KSHARE_PRICING[data.kshareТier];
      lineItems.push({
        name: `${product.name} – ${tier.label.split("–")[0].trim()}`,
        quantity: 1,
        unitLabel: "tier",
        annualUnit: tier.price,
        perpetualUnit: tier.price * 3.5,
        annualTotal: tier.price,
        perpetualTotal: tier.price * 3.5,
      });
      continue;
    }

    if (productId === "services") {
      if (!data.servicesPackage) continue;
      const pkg = SERVICES_PRICING[data.servicesPackage];
      lineItems.push({
        name: `${product.name} – ${pkg.label}`,
        quantity: 1,
        unitLabel: "package",
        annualUnit: pkg.price,
        perpetualUnit: pkg.price,
        annualTotal: pkg.price,
        perpetualTotal: pkg.price,
      });
      continue;
    }

    const qty = product.hasQuantity ? (data.quantities[productId] ?? 1) : 1;
    lineItems.push({
      name: product.name,
      quantity: qty,
      unitLabel: product.unitLabel,
      annualUnit: product.annualPrice,
      perpetualUnit: product.perpetualPrice,
      annualTotal: product.annualPrice * qty,
      perpetualTotal: product.perpetualPrice * qty,
    });
  }

  const annualTotal = lineItems.reduce((s, i) => s + i.annualTotal, 0);
  const perpetualTotal = lineItems.reduce((s, i) => s + i.perpetualTotal, 0);
  const year2Support = perpetualTotal * 0.2;

  return {
    lineItems,
    annualTotal,
    perpetualTotal,
    fiveYearAnnual: annualTotal * 5,
    fiveYearPerpetual: perpetualTotal + year2Support * 4,
    year2SupportAnnual: year2Support,
  };
}

