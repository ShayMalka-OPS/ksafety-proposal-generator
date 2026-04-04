// HW Calculator — formulas derived from Storage Size Calculator_V2.xlsx

export const HW_CONSTANTS = {
  RUSH_HOUR_FACTOR: 10,
  SECONDS_PER_HOUR: 3600,
  IO_SIZE_KB: 4,
  PERP_MULTIPLIER: 3.5,
  SUPPORT_PCT: 0.2,
} as const;

// Per-subsystem data sizes (from Excel model)
export const SUBSYSTEM_DEFAULTS = {
  lpr: { metaKB: 4,  totalImgKB: 112, avgDetPerMin: 5,   defaultRetentionDays: 90 },
  fr:  { metaKB: 40, totalImgKB: 18,  avgDetPerMin: 7,   defaultRetentionDays: 90 },
  va:  { metaKB: 4,  totalImgKB: 100, avgDetPerMin: 1,   defaultRetentionDays: 45 },
  iot: { metaKB: 2,  totalImgKB: 0,   avgDetPerMin: 0.2, defaultRetentionDays: 90 },
} as const;

export type SubsystemKey = keyof typeof SUBSYSTEM_DEFAULTS;

export interface SubsystemStorageResult {
  subsystem: string;
  numSensors: number;
  retentionDays: number;
  detectionsPerDay: number;
  imageGB_perDay: number;
  metaGB_perDay: number;
  peakDetPerSec: number;
  imageMBps: number;
  metaMBps: number;
  imageIOps: number;
  metaIOps: number;
  totalImageTB: number;
  totalMetaTB: number;
  totalTB: number;
}

export interface VideoStorageResult {
  channels: number;
  bitrateMbps: number;
  retentionDays: number;
  videoTB: number;
}

export interface VMSpec {
  group: string;
  serverName: string;
  vmPhysical: string;
  amount: number;
  os: string;
  vCores: number;
  ramGB: number;
  localDiskGB: number;
  storageGB: number;
  comments: string;
}

export interface DellRecommendation {
  compute: { model: string; specs: string; qty: number };
  storage: { model: string; capacity: string; qty: number };
  network: { model: string; specs: string; qty: number };
  workstation: { model: string; specs: string; note: string };
}

export interface HWCalcInput {
  lprChannels: number;
  frChannels: number;
  vaChannels: number;
  iotSensors: number;
  cctvChannels: number;
  haMode: boolean;
  hasKShare: boolean;
  hasKReact: boolean;
  retentionDays: {
    lpr: number;
    fr: number;
    va: number;
    iot: number;
    cctv: number;
  };
  videoBitrateMbps: number;
}

export interface HWCalcResult {
  subsystemStorage: SubsystemStorageResult[];
  videoStorage: VideoStorageResult;
  vmSpecs: VMSpec[];
  totals: {
    imageStorageTB: number;
    metaStorageTB: number;
    videoStorageTB: number;
    grandTotalTB: number;
    peakImageIOps: number;
    peakMetaIOps: number;
    videoThroughputMBps: number;
    totalVMs: number;
    totalStorageGB: number;
  };
  dellRecommendation: DellRecommendation;
}

// ─── Storage formula per subsystem ──────────────────────────────────────────

function calcSubsystem(
  key: SubsystemKey,
  numSensors: number,
  retentionDays: number
): SubsystemStorageResult {
  const d = SUBSYSTEM_DEFAULTS[key];
  const { RUSH_HOUR_FACTOR, IO_SIZE_KB } = HW_CONSTANTS;

  const detectionsPerDay   = numSensors * d.avgDetPerMin * 60 * 24;
  const imageGB_perDay     = (detectionsPerDay * d.totalImgKB) / 1024 / 1024;
  const metaGB_perDay      = (detectionsPerDay * d.metaKB)     / 1024 / 1024;
  const peakDetPerSec      = numSensors * (d.avgDetPerMin / 60) * RUSH_HOUR_FACTOR;
  const imageMBps          = (peakDetPerSec * d.totalImgKB) / 1024;
  const metaMBps           = (peakDetPerSec * d.metaKB)     / 1024;
  const imageIOps          = (imageMBps * 1024) / IO_SIZE_KB;
  const metaIOps           = (metaMBps  * 1024) / IO_SIZE_KB;
  const totalImageTB       = (imageGB_perDay * retentionDays) / 1024;
  const totalMetaTB        = (metaGB_perDay  * retentionDays) / 1024;

  return {
    subsystem: key.toUpperCase(),
    numSensors,
    retentionDays,
    detectionsPerDay,
    imageGB_perDay,
    metaGB_perDay,
    peakDetPerSec,
    imageMBps,
    metaMBps,
    imageIOps,
    metaIOps,
    totalImageTB,
    totalMetaTB,
    totalTB: totalImageTB + totalMetaTB,
  };
}

// ─── Dell hardware recommendation ───────────────────────────────────────────

function getDellRecommendation(
  totalChannels: number,
  grandTotalTB: number,
  vmCount: number
): DellRecommendation {
  const isLarge  = totalChannels > 500 || grandTotalTB > 100;
  const isMedium = totalChannels > 100 || grandTotalTB > 20;

  const computeModel =
    isLarge  ? "Dell PowerEdge R760XS" :
    isMedium ? "Dell PowerEdge R760"   :
               "Dell PowerEdge R750";

  const computeSpecs =
    isLarge  ? "Dual Intel Xeon Gold 6438N (2×32c), 512GB DDR5 ECC, 4×3.84TB NVMe SSD, PERC H755" :
    isMedium ? "Dual Intel Xeon Silver 4516Y+ (2×24c), 256GB DDR5 ECC, 4×960GB SSD, PERC H755"    :
               "Intel Xeon Silver 4314 (16c), 128GB DDR4 ECC, 2×480GB SSD RAID-1, PERC H755";

  const computeQty = Math.max(1, Math.ceil(vmCount / 12));

  // Storage: ME5024 holds ~96TB raw in 24-drive config
  const rawNeededTB = grandTotalTB * 1.4; // 40% overhead for RAID+growth
  const storageQty = Math.max(1, Math.ceil(rawNeededTB / 96));
  const usableTB   = Math.round(storageQty * 96 * 0.75); // RAID-6 ~75% usable

  return {
    compute: {
      model: computeModel,
      specs: computeSpecs,
      qty: computeQty,
    },
    storage: {
      model: "Dell PowerVault ME5024",
      capacity: `24×SAS/NVMe drives, ~${usableTB}TB usable (RAID-6), dual EMM controllers`,
      qty: storageQty,
    },
    network: {
      model: "Dell EMC PowerSwitch S5248F-ON",
      specs: "48×25GbE SFP28 + 6×100GbE QSFP28, BGP/EVPN capable, redundant PSU",
      qty: 2,
    },
    workstation: {
      model: "Dell OptiPlex 7090",
      specs: "Intel Core i7-11700, 32GB RAM, 512GB NVMe SSD, 4×USB-A + 2×USB-C, 4K display support",
      note: "1 unit per operator workstation (quantity TBD by customer)",
    },
  };
}

// ─── Main calculator ─────────────────────────────────────────────────────────

export function calculateHW(input: HWCalcInput): HWCalcResult {
  // ── Subsystem storage ──────────────────────────────────────────────────────
  const subsystemStorage: SubsystemStorageResult[] = [];

  if (input.lprChannels > 0)
    subsystemStorage.push(calcSubsystem("lpr", input.lprChannels, input.retentionDays.lpr));
  if (input.frChannels > 0)
    subsystemStorage.push(calcSubsystem("fr",  input.frChannels,  input.retentionDays.fr));
  if (input.vaChannels > 0)
    subsystemStorage.push(calcSubsystem("va",  input.vaChannels,  input.retentionDays.va));
  if (input.iotSensors > 0)
    subsystemStorage.push(calcSubsystem("iot", input.iotSensors,  input.retentionDays.iot));

  // ── Video (CCTV) storage ───────────────────────────────────────────────────
  // videoTB = channels × bitrateMbps × 125000 × 86400 × retentionDays / 1e12
  const videoTB =
    (input.cctvChannels * input.videoBitrateMbps * 125000 * 86400 * input.retentionDays.cctv) / 1e12;

  const videoStorage: VideoStorageResult = {
    channels: input.cctvChannels,
    bitrateMbps: input.videoBitrateMbps,
    retentionDays: input.retentionDays.cctv,
    videoTB,
  };

  // ── Aggregate storage ──────────────────────────────────────────────────────
  const totalImageTB  = subsystemStorage.reduce((s, r) => s + r.totalImageTB, 0);
  const totalMetaTB   = subsystemStorage.reduce((s, r) => s + r.totalMetaTB,  0);
  const grandTotalTB  = totalImageTB + totalMetaTB + videoTB;

  // SQL disk: max(500, round(sqlGB/500)*500)
  const sqlStorageGB = (totalMetaTB + totalImageTB) * 1024;
  const sqlDiskGB    = Math.max(500, Math.round(sqlStorageGB / 500) * 500);

  // ELK disk: max(100, esGB × 1.2)
  const esStorageGB = totalMetaTB * 1024;
  const elkDiskGB   = Math.max(100, Math.ceil(esStorageGB * 1.2));

  // ── VM sizing ──────────────────────────────────────────────────────────────
  const totalChannels = input.lprChannels + input.frChannels + input.vaChannels + input.cctvChannels;
  let appServerCount = 3;
  if (input.haMode)             appServerCount++;
  if (totalChannels > 500)      appServerCount++;

  const APP_COMMENTS = [
    "Permission, RBE, Events, Sync, UI_DATA, VMS",
    "Investigation, Video, Procedures, Face Rec, IM_VA, DS Face",
    "C-Share, C-React, Tasks, DS_LPR, IM_LPR, Units",
    "Additional capacity / HA server",
    "Overflow / HA failover server",
  ];

  const vmSpecs: VMSpec[] = [];

  // Always-present infrastructure VMs
  vmSpecs.push({
    group: "Infrastructure",
    serverName: "K1-AD-PKI-01",
    vmPhysical: "VM",
    amount: 1,
    os: "Windows Server 2022",
    vCores: 8,
    ramGB: 8,
    localDiskGB: 80,
    storageGB: 0,
    comments: "Active Directory, PKI, DNS",
  });
  vmSpecs.push({
    group: "Infrastructure",
    serverName: "K1-MAINT-01",
    vmPhysical: "VM",
    amount: 1,
    os: "Windows 11",
    vCores: 8,
    ramGB: 16,
    localDiskGB: 150,
    storageGB: 0,
    comments: "Monitoring, backups, patching",
  });

  // Application servers (K1-APP1…APP5)
  for (let i = 0; i < appServerCount; i++) {
    vmSpecs.push({
      group: "Application",
      serverName: `K1-APP${i + 1}`,
      vmPhysical: "VM",
      amount: 1,
      os: "Windows Server 2022",
      vCores: 16,
      ramGB: 32,
      localDiskGB: 80,
      storageGB: 0,
      comments: APP_COMMENTS[i] ?? "Application services",
    });
  }

  // Database
  vmSpecs.push({
    group: "Database",
    serverName: "K1-SQL-01",
    vmPhysical: "VM",
    amount: 1,
    os: "Windows Server 2022",
    vCores: 16,
    ramGB: 32,
    localDiskGB: 150,
    storageGB: sqlDiskGB,
    comments: "D:\\DATA | E:\\Backup | G:\\Object Storage",
  });

  // Search
  vmSpecs.push({
    group: "Search",
    serverName: "K1-ELK-01",
    vmPhysical: "VM",
    amount: 1,
    os: "Ubuntu 24.04",
    vCores: 8,
    ramGB: 16,
    localDiskGB: 100,
    storageGB: elkDiskGB,
    comments: "Elasticsearch metadata indexing",
  });

  // Web
  vmSpecs.push({
    group: "Web",
    serverName: "K1-WEB-01",
    vmPhysical: "VM",
    amount: 1,
    os: "Ubuntu 24.04",
    vCores: 8,
    ramGB: 32,
    localDiskGB: 500,
    storageGB: 0,
    comments: "NGINX + MongoDB + BFF",
  });

  // DMZ — only if K-Share or K-React
  if (input.hasKShare || input.hasKReact) {
    vmSpecs.push({
      group: "DMZ",
      serverName: "K1-DMZ-01",
      vmPhysical: "VM",
      amount: 1,
      os: "Ubuntu 24.04",
      vCores: 8,
      ramGB: 16,
      localDiskGB: 100,
      storageGB: 0,
      comments: "K-Share/K-React gateway. Ports 5228–5230 to Google Cloud",
    });
  }

  const totalVMs      = vmSpecs.reduce((s, v) => s + v.amount, 0);
  const totalStorageGB= vmSpecs.reduce((s, v) => s + v.storageGB, 0);
  const peakImageIOps = subsystemStorage.reduce((s, r) => s + r.imageIOps, 0);
  const peakMetaIOps  = subsystemStorage.reduce((s, r) => s + r.metaIOps, 0);
  const videoThroughputMBps = (input.cctvChannels * input.videoBitrateMbps) / 8;

  const dellRecommendation = getDellRecommendation(totalChannels, grandTotalTB, totalVMs);

  return {
    subsystemStorage,
    videoStorage,
    vmSpecs,
    totals: {
      imageStorageTB: totalImageTB,
      metaStorageTB: totalMetaTB,
      videoStorageTB: videoTB,
      grandTotalTB,
      peakImageIOps,
      peakMetaIOps,
      videoThroughputMBps,
      totalVMs,
      totalStorageGB,
    },
    dellRecommendation,
  };
}

// ─── Helper: build HWCalcInput from ProposalData ──────────────────────────────

export function buildHWInput(data: {
  selectedProducts: string[];
  quantities: Record<string, number>;
  haMode?: boolean;
  retentionDays?: Partial<HWCalcInput["retentionDays"]>;
  videoBitrateMbps?: number;
}): HWCalcInput {
  const DEFAULT_RETENTION: HWCalcInput["retentionDays"] = {
    lpr: SUBSYSTEM_DEFAULTS.lpr.defaultRetentionDays,
    fr:  SUBSYSTEM_DEFAULTS.fr.defaultRetentionDays,
    va:  SUBSYSTEM_DEFAULTS.va.defaultRetentionDays,
    iot: SUBSYSTEM_DEFAULTS.iot.defaultRetentionDays,
    cctv: 30,
  };

  return {
    lprChannels:      data.quantities["lpr"]       ?? 0,
    frChannels:       data.quantities["face"]      ?? 0,
    vaChannels:       data.quantities["analytics"] ?? 0,
    iotSensors:       data.quantities["iot"]       ?? 0,
    cctvChannels:     data.quantities["cctv"]      ?? 0,
    haMode:           data.haMode ?? false,
    hasKShare:        data.selectedProducts.includes("kshare"),
    hasKReact:        data.selectedProducts.includes("kreact"),
    retentionDays:    { ...DEFAULT_RETENTION, ...(data.retentionDays ?? {}) },
    videoBitrateMbps: data.videoBitrateMbps ?? 4,
  };
}
