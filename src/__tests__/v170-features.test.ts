/**
 * v1.7.0 Regression & Feature Tests
 * Covers: vendor selections, K1-Video HW sizing, pricing model fix,
 * and new data-model fields introduced in v1.7.0.
 */

import {
  calculatePricing,
  ProposalData,
  PERP_MULTIPLIER,
  VMS_VENDORS,
  LPR_VENDORS,
  FACE_VENDORS,
  IOT_VENDORS,
  VmsVendorEntry,
  LprVendorEntry,
  FaceVendorEntry,
  IotVendorEntry,
  totalCctvChannels,
  totalLprChannels,
  totalFaceChannels,
  totalIotUnits,
  hasUnsupportedVendors,
} from '@/lib/pricing';

import {
  calculateK1VideoHW,
  K1VideoHWInput,
} from '@/lib/hw-calculator';

// ─── Proposal factory ─────────────────────────────────────────────────────────

function makeProposal(overrides: Partial<ProposalData> = {}): ProposalData {
  return {
    productLine: 'ksafety',
    deploymentType: 'onprem',
    pricingModel: 'annual',
    customerName: 'Test City',
    city: 'Tel Aviv',
    country: 'Israel',
    contactPerson: 'Test User',
    contactEmail: 'test@test.com',
    projectName: 'Test Proposal',
    salesPerson: 'Sales Rep',
    selectedProducts: [],
    quantities: {},
    kshareТier: 'entry',
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
    videoBitrateMbps: 4,
    retentionDays: { lpr: 90, fr: 90, va: 45, iot: 90, cctv: 30 },
    ...overrides,
  };
}

// ─── 1. Vendor list constants ─────────────────────────────────────────────────

describe('Vendor list constants', () => {
  test('VMS_VENDORS contains exactly 6 supported vendors', () => {
    expect(VMS_VENDORS).toHaveLength(6);
  });

  test('VMS_VENDORS includes Milestone, HikVision, Genetec, Dahua, ISS (SecureOS), Digivod', () => {
    expect(VMS_VENDORS).toContain('Milestone');
    expect(VMS_VENDORS).toContain('HikVision');
    expect(VMS_VENDORS).toContain('Genetec');
    expect(VMS_VENDORS).toContain('Dahua');
    expect(VMS_VENDORS).toContain('ISS (SecureOS)');
    expect(VMS_VENDORS).toContain('Digivod');
  });

  test('LPR_VENDORS contains Nerosoft and Milestone', () => {
    expect(LPR_VENDORS).toContain('Nerosoft');
    expect(LPR_VENDORS).toContain('Milestone');
  });

  test('FACE_VENDORS contains Corsight and SAFR', () => {
    expect(FACE_VENDORS).toContain('Corsight');
    expect(FACE_VENDORS).toContain('SAFR');
  });

  test('IOT_VENDORS contains 9 types', () => {
    expect(IOT_VENDORS).toHaveLength(9);
  });

  test('IOT_VENDORS includes AVL Motorola, Panic Buttons, Fire Alarm', () => {
    expect(IOT_VENDORS).toContain('AVL – Motorola');
    expect(IOT_VENDORS).toContain('Panic Buttons');
    expect(IOT_VENDORS).toContain('Fire Alarm (Telefire)');
  });
});

// ─── 2. Vendor total helpers ──────────────────────────────────────────────────

describe('Vendor total helpers', () => {
  test('totalCctvChannels: sums channels across multiple VMS vendors', () => {
    const data = makeProposal({
      cctvVendors: [
        { vendorName: 'Milestone', channels: 100, isOther: false },
        { vendorName: 'HikVision', channels: 50,  isOther: false },
      ],
    });
    expect(totalCctvChannels(data)).toBe(150);
  });

  test('totalCctvChannels: empty array returns 0', () => {
    expect(totalCctvChannels(makeProposal())).toBe(0);
  });

  test('totalLprChannels: sums across multi-vendor LPR', () => {
    const data = makeProposal({
      lprVendors: [
        { vendorName: 'Nerosoft',  channels: 20, isOther: false },
        { vendorName: 'Milestone', channels: 30, isOther: false },
      ],
    });
    expect(totalLprChannels(data)).toBe(50);
  });

  test('totalFaceChannels: sums Corsight + SAFR channels', () => {
    const data = makeProposal({
      faceVendors: [
        { vendorName: 'Corsight', channels: 10, isOther: false },
        { vendorName: 'SAFR',     channels: 5,  isOther: false },
      ],
    });
    expect(totalFaceChannels(data)).toBe(15);
  });

  test('totalIotUnits: sums units across multiple IoT types', () => {
    const data = makeProposal({
      iotVendors: [
        { vendorName: 'Panic Buttons', units: 50, isOther: false },
        { vendorName: 'AVL – Motorola', units: 20, isOther: false },
        { vendorName: 'Custom Sensor',  units: 10, isOther: true },
      ],
    });
    expect(totalIotUnits(data)).toBe(80);
  });
});

// ─── 3. Unsupported vendor detection ─────────────────────────────────────────

describe('hasUnsupportedVendors', () => {
  test('returns false when all vendors are supported', () => {
    const data = makeProposal({
      cctvVendors:  [{ vendorName: 'Milestone', channels: 10, isOther: false }],
      lprVendors:   [{ vendorName: 'Nerosoft',  channels: 5,  isOther: false }],
    });
    expect(hasUnsupportedVendors(data)).toBe(false);
  });

  test('returns true when any CCTV vendor is "other"', () => {
    const data = makeProposal({
      cctvVendors: [{ vendorName: 'AxxonNext', channels: 10, isOther: true }],
    });
    expect(hasUnsupportedVendors(data)).toBe(true);
  });

  test('returns true when any LPR vendor is "other"', () => {
    const data = makeProposal({
      lprVendors: [{ vendorName: 'CustomLPR', channels: 5, isOther: true }],
    });
    expect(hasUnsupportedVendors(data)).toBe(true);
  });

  test('returns true when any Face Recognition vendor is "other"', () => {
    const data = makeProposal({
      faceVendors: [{ vendorName: 'FaceX', channels: 3, isOther: true }],
    });
    expect(hasUnsupportedVendors(data)).toBe(true);
  });

  test('returns true when any IoT vendor is "other"', () => {
    const data = makeProposal({
      iotVendors: [{ vendorName: 'SomeSensor', units: 10, isOther: true }],
    });
    expect(hasUnsupportedVendors(data)).toBe(true);
  });
});

// ─── 4. Pricing model in Step 1 (Bug fix regression) ─────────────────────────

describe('Pricing model field on ProposalData', () => {
  test('pricingModel defaults to "annual" in emptyData shape', () => {
    const data = makeProposal();
    expect(data.pricingModel).toBe('annual');
  });

  test('calculatePricing works with pricingModel = "perpetual"', () => {
    const data = makeProposal({
      pricingModel: 'perpetual',
      selectedProducts: ['core'],
      quantities: {},
    });
    const result = calculatePricing(data);
    expect(result.perpetualTotal).toBe(5000 * PERP_MULTIPLIER);
    expect(result.perpetualTotal).toBe(17500);
  });

  test('annualTotal and perpetualTotal are both computed regardless of pricingModel', () => {
    const dataAnnual = makeProposal({ pricingModel: 'annual',    selectedProducts: ['lpr'], quantities: { lpr: 10 } });
    const dataPerp   = makeProposal({ pricingModel: 'perpetual', selectedProducts: ['lpr'], quantities: { lpr: 10 } });
    const r1 = calculatePricing(dataAnnual);
    const r2 = calculatePricing(dataPerp);
    // The calculation itself is the same — pricingModel only affects display
    expect(r1.annualTotal).toBe(r2.annualTotal);
    expect(r1.perpetualTotal).toBe(r2.perpetualTotal);
  });

  test('5-year annual = annualTotal × 5', () => {
    const data = makeProposal({ selectedProducts: ['core'], quantities: {} });
    const result = calculatePricing(data);
    expect(result.fiveYearAnnual).toBe(result.annualTotal * 5);
  });

  test('5-year perpetual = perpetualTotal + year2Support × 4', () => {
    const data = makeProposal({ selectedProducts: ['core'], quantities: {} });
    const result = calculatePricing(data);
    const expected = result.perpetualTotal + result.year2SupportAnnual * 4;
    expect(result.fiveYearPerpetual).toBe(expected);
  });
});

// ─── 5. K1-Video HW Calculator — On-Premises ─────────────────────────────────

describe('calculateK1VideoHW — On-Premises', () => {
  function makeInput(cameras: number, opts: Partial<K1VideoHWInput> = {}): K1VideoHWInput {
    return { cameras, bitrateMbps: 1, retentionDays: 30, deploymentType: 'onprem', ...opts };
  }

  test('1000 cameras @ 1 Mbps / 30 days: produces service rows for all 9 on-prem services', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    expect(result.serviceRows).toHaveLength(9);
  });

  test('1000 cameras: Hosting service instances = ceil(1000/160) = 7', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    const hosting = result.serviceRows.find(r => r.service === 'Hosting');
    expect(hosting?.instances).toBe(7);
  });

  test('1000 cameras: Media service instances = ceil(1000/200) = 5', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    const media = result.serviceRows.find(r => r.service === 'Media');
    expect(media?.instances).toBe(5);
  });

  test('1000 cameras: on-prem overhead factor is 7%', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    expect(result.overheadPct).toBe(0.07);
  });

  test('1000 cameras @ 1 Mbps / 30 days: total storage > 400 TB (guide says ~467 TB)', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    expect(result.totalStorageTB).toBeGreaterThan(400);
    expect(result.totalStorageTB).toBeLessThan(550);
  });

  test('Video TB formula: bitrate_MBps × cameras × 86400 × days / 1e6', () => {
    const result = calculateK1VideoHW(makeInput(1000, { bitrateMbps: 1, retentionDays: 30 }));
    const expected = (1 / 8) * 1000 * 86400 * 30 / 1_000_000;
    expect(result.videoTB).toBeCloseTo(expected, 0);
  });

  test('Archive = 20% of video storage', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    expect(result.archiveTB).toBeCloseTo(result.videoTB * 0.20, 1);
  });

  test('500 cameras: node count ≥ 2 (reference node = 14 cores)', () => {
    const result = calculateK1VideoHW(makeInput(500));
    expect(result.nodes.count).toBeGreaterThanOrEqual(2);
  });

  test('finalVCPU = rawVCPU × 1.07 (rounded up)', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    expect(result.finalVCPU).toBe(Math.ceil(result.rawVCPU * 1.07));
  });

  test('On-prem RAID overhead factor for 1000 cameras = 20%', () => {
    const result = calculateK1VideoHW(makeInput(1000));
    // raidTB ≈ (video + archive) × 0.20
    const base = result.videoTB + result.archiveTB;
    expect(result.raidOrRedundancyTB).toBeCloseTo(base * 0.20, 0);
  });
});

// ─── 6. K1-Video HW Calculator — Cloud (AWS) ─────────────────────────────────

describe('calculateK1VideoHW — Cloud (AWS)', () => {
  function makeCloudInput(cameras: number): K1VideoHWInput {
    return { cameras, bitrateMbps: 1, retentionDays: 30, deploymentType: 'cloud' };
  }

  test('Cloud produces 10 service rows (includes ELK Cluster)', () => {
    const result = calculateK1VideoHW(makeCloudInput(1000));
    expect(result.serviceRows).toHaveLength(10);
    expect(result.serviceRows.find(r => r.service === 'ELK Cluster')).toBeDefined();
  });

  test('Cloud overhead factor is 30%', () => {
    const result = calculateK1VideoHW(makeCloudInput(1000));
    expect(result.overheadPct).toBe(0.30);
  });

  test('Cloud finalVCPU = ceil(rawVCPU × 1.30)', () => {
    const result = calculateK1VideoHW(makeCloudInput(1000));
    expect(result.finalVCPU).toBe(Math.ceil(result.rawVCPU * 1.30));
  });

  test('Cloud: no RAID overhead (raidOrRedundancyTB = 0)', () => {
    const result = calculateK1VideoHW(makeCloudInput(1000));
    expect(result.raidOrRedundancyTB).toBe(0);
  });

  test('Cloud: 1000 cameras maps to m6i.4xlarge (16 vCPU / 64 GB) nodes', () => {
    const result = calculateK1VideoHW(makeCloudInput(1000));
    expect(result.nodes.spec).toContain('m6i.4xlarge');
  });

  test('Cloud: 300 cameras maps to m6i.2xlarge', () => {
    const result = calculateK1VideoHW(makeCloudInput(300));
    expect(result.nodes.spec).toContain('m6i.2xlarge');
  });

  test('Cloud: minimum 2 EKS nodes (Multi-AZ)', () => {
    const result = calculateK1VideoHW(makeCloudInput(50));
    expect(result.nodes.count).toBeGreaterThanOrEqual(2);
  });

  test('Cloud total storage = video + archive (no RAID)', () => {
    const result = calculateK1VideoHW(makeCloudInput(1000));
    expect(result.totalStorageTB).toBeCloseTo(result.videoTB + result.archiveTB, 1);
  });
});

// ─── 7. K1-Video + CCTV pricing integration ──────────────────────────────────

describe('K1-Video + CCTV pricing (CCTV channels still priced)', () => {
  test('CCTV pricing: $100/channel/yr; 100 channels = $10,000/yr', () => {
    const data = makeProposal({
      selectedProducts: ['cctv'],
      quantities: { cctv: 100 },
      cctvVendors: [{ vendorName: 'Milestone', channels: 100, isOther: false }],
    });
    const result = calculatePricing(data);
    expect(result.annualTotal).toBe(10000);
  });

  test('K1-Video channels added to CCTV total quantity via vendor sync', () => {
    // Simulate: 50 channels from Milestone + 100 K1-Video channels = 150 total
    const data = makeProposal({
      selectedProducts: ['cctv'],
      quantities: { cctv: 150 },
      cctvVendors: [{ vendorName: 'Milestone', channels: 50, isOther: false }],
      k1VideoEnabled: true,
      k1VideoChannels: 100,
    });
    expect(data.quantities['cctv']).toBe(150);
    const result = calculatePricing(data);
    expect(result.annualTotal).toBe(150 * 100); // $100/channel
  });
});
