/**
 * Group 1 — Pricing Calculations
 * Pure unit tests for pricing formulas. No browser or server required.
 */
import {
  calculatePricing,
  PRODUCTS,
  KSHARE_PRICING,
  SERVICES_PRICING,
  ProposalData,
  PERP_MULTIPLIER,
  SUPPORT_PCT,
} from '@/lib/pricing';
import { DEFAULT_ANNUAL_PRICES } from '@/lib/default-prices';

// ─── Helpers that mirror the skill spec ──────────────────────────────────────

function calcAnnual(productId: string, qty: number, opts?: { priceOverride?: number }): number {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) throw new Error(`Unknown product: ${productId}`);
  const unitPrice = opts?.priceOverride ?? DEFAULT_ANNUAL_PRICES[productId] ?? product.annualPrice;
  return unitPrice * qty;
}

function calcPerpetual(annualTotal: number): number {
  return annualTotal * PERP_MULTIPLIER;
}

function calcSupport(perpetualLicenseTotal: number): number {
  return perpetualLicenseTotal * SUPPORT_PCT;
}

function calcFiveYearAnnual(annualTotal: number): number {
  // Services are one-time; for these helper tests we treat full annualTotal
  return annualTotal * 5;
}

function calcFiveYearPerpetual(perpetualTotal: number, year2Support: number): number {
  return perpetualTotal + year2Support * 4;
}

// ─── Minimal proposal factory ─────────────────────────────────────────────────

function makeProposal(overrides: Partial<ProposalData> = {}): ProposalData {
  return {
    productLine: 'ksafety',
    deploymentType: 'onprem',
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
    pricingModel: 'annual',
    haMode: false,
    videoBitrateMbps: 4,
    retentionDays: { lpr: 90, fr: 90, va: 45, iot: 90, cctv: 30 },
    ...overrides,
  };
}

// ─── Group 1: Pricing Calculations ───────────────────────────────────────────

describe('K-Safety Pricing Calculations', () => {

  // ── Core platform ─────────────────────────────────────────────────────────

  test('Core annual: 1 unit × $5,000 = $5,000/yr', () => {
    expect(calcAnnual('core', 1)).toBe(5000);
  });

  test('Core default annual price matches CLAUDE.md spec ($5,000)', () => {
    expect(DEFAULT_ANNUAL_PRICES['core']).toBe(5000);
  });

  // ── Perpetual multiplier ──────────────────────────────────────────────────

  test('Perpetual = annual × 3.5: $5,000 × 3.5 = $17,500', () => {
    expect(calcPerpetual(5000)).toBe(17500);
  });

  test('PERP_MULTIPLIER constant is 3.5', () => {
    expect(PERP_MULTIPLIER).toBe(3.5);
  });

  // ── Year 2+ support ───────────────────────────────────────────────────────

  test('Support Y2+: $17,500 × 20% = $3,500/yr', () => {
    expect(calcSupport(17500)).toBe(3500);
  });

  test('SUPPORT_PCT constant is 0.20', () => {
    expect(SUPPORT_PCT).toBe(0.20);
  });

  // ── 5-year totals ─────────────────────────────────────────────────────────

  test('5yr annual total: $5,000 × 5 = $25,000', () => {
    expect(calcFiveYearAnnual(5000)).toBe(25000);
  });

  test('5yr perpetual total: $17,500 + (4 × $3,500) = $31,500', () => {
    expect(calcFiveYearPerpetual(17500, 3500)).toBe(31500);
  });

  // ── LPR channels ─────────────────────────────────────────────────────────

  test('LPR: 30 channels × $500/yr = $15,000/yr', () => {
    expect(calcAnnual('lpr', 30)).toBe(15000);
  });

  test('LPR default annual price matches spec ($500/channel)', () => {
    expect(DEFAULT_ANNUAL_PRICES['lpr']).toBe(500);
  });

  test('LPR perpetual: 1 channel × $500 × 3.5 = $1,750', () => {
    expect(calcPerpetual(DEFAULT_ANNUAL_PRICES['lpr'])).toBe(1750);
  });

  // ── Price override ────────────────────────────────────────────────────────

  test('Modified price overrides default in calculation', () => {
    expect(calcAnnual('lpr', 10, { priceOverride: 600 })).toBe(6000);
  });

  // ── All default prices match CLAUDE.md spec ───────────────────────────────

  test('CCTV default: $100/channel/yr', () => {
    expect(DEFAULT_ANNUAL_PRICES['cctv']).toBe(100);
  });

  test('Face Recognition default: $625/channel/yr', () => {
    expect(DEFAULT_ANNUAL_PRICES['face']).toBe(625);
  });

  test('Video Analytics default: $556/channel/yr', () => {
    expect(DEFAULT_ANNUAL_PRICES['analytics']).toBe(556);
  });

  test('User Licenses default: $100/user/yr', () => {
    expect(DEFAULT_ANNUAL_PRICES['users']).toBe(100);
  });

  test('IoT Sensors default: $5/sensor/yr', () => {
    expect(DEFAULT_ANNUAL_PRICES['iot']).toBe(5);
  });

  test('K-React default: $50/unit/yr', () => {
    expect(DEFAULT_ANNUAL_PRICES['kreact']).toBe(50);
  });

  // ── K-Share tiers ─────────────────────────────────────────────────────────

  test('K-Share Entry tier: $0 (included)', () => {
    expect(KSHARE_PRICING.entry.price).toBe(0);
  });

  test('K-Share Small tier (50K–100K): $10,000/yr', () => {
    expect(KSHARE_PRICING.small.price).toBe(10000);
  });

  test('K-Share Medium tier (100K–500K): $20,000/yr', () => {
    expect(KSHARE_PRICING.medium.price).toBe(20000);
  });

  test('K-Share Large tier (500K–1M): $35,000/yr', () => {
    expect(KSHARE_PRICING.large.price).toBe(35000);
  });

  test('K-Share Mega tier (1M+): $50,000/yr', () => {
    expect(KSHARE_PRICING.mega.price).toBe(50000);
  });

  // ── Services ──────────────────────────────────────────────────────────────

  test('Installation & Setup: $10,000 one-time', () => {
    expect(SERVICES_PRICING.installation.price).toBe(10000);
  });

  test('Training & Implementation: $2,250 one-time', () => {
    expect(SERVICES_PRICING.training.price).toBe(2250);
  });

  test('Full Implementation: $15,000 one-time', () => {
    expect(SERVICES_PRICING.full.price).toBe(15000);
  });

  // ── calculatePricing integration ──────────────────────────────────────────

  test('calculatePricing: Core platform annual total = $5,000', () => {
    const data = makeProposal({ selectedProducts: ['core'] });
    const pricing = calculatePricing(data);
    expect(pricing.annualTotal).toBe(5000);
    expect(pricing.licensesAnnual).toBe(5000);
    expect(pricing.servicesTotal).toBe(0);
  });

  test('calculatePricing: Core perpetual = $17,500', () => {
    const data = makeProposal({ selectedProducts: ['core'] });
    const pricing = calculatePricing(data);
    expect(pricing.licensesPerpetual).toBe(17500);
  });

  test('calculatePricing: 10 LPR channels × $500 = $5,000 annual', () => {
    const data = makeProposal({
      selectedProducts: ['lpr'],
      quantities: { lpr: 10 },
    });
    const pricing = calculatePricing(data);
    expect(pricing.annualTotal).toBe(5000);
  });

  test('calculatePricing: 10 LPR perpetual = $17,500', () => {
    const data = makeProposal({
      selectedProducts: ['lpr'],
      quantities: { lpr: 10 },
    });
    const pricing = calculatePricing(data);
    expect(pricing.licensesPerpetual).toBe(17500);
  });

  test('calculatePricing: services are excluded from perpetual ×3.5', () => {
    const data = makeProposal({
      selectedProducts: ['services'],
      servicesPackage: 'installation',
    });
    const pricing = calculatePricing(data);
    // Services annualTotal = perpetualTotal (no ×3.5)
    expect(pricing.annualTotal).toBe(pricing.perpetualTotal);
    expect(pricing.annualTotal).toBe(10000);
  });

  test('calculatePricing: 5-year annual for licenses only = licenses × 5', () => {
    const data = makeProposal({ selectedProducts: ['core'] });
    const pricing = calculatePricing(data);
    expect(pricing.fiveYearAnnual).toBe(5000 * 5);
  });

  test('calculatePricing: 5-year perpetual = perp + 4 × support', () => {
    const data = makeProposal({ selectedProducts: ['core'] });
    const pricing = calculatePricing(data);
    // Core: perp = 17500, support = 17500 × 0.2 = 3500, 5yr = 17500 + 4×3500 = 31500
    expect(pricing.fiveYearPerpetual).toBe(31500);
  });

  test('calculatePricing: annual is cheaper than perpetual over 5 years (license-only)', () => {
    const data = makeProposal({ selectedProducts: ['core'] });
    const pricing = calculatePricing(data);
    // 5yr annual = 25000, 5yr perpetual = 31500
    expect(pricing.fiveYearAnnual).toBeLessThan(pricing.fiveYearPerpetual);
  });

  test('calculatePricing: custom price override is applied', () => {
    const data = makeProposal({
      selectedProducts: ['lpr'],
      quantities: { lpr: 5 },
      customPrices: { lpr: 600 }, // override $500 → $600
    });
    const pricing = calculatePricing(data);
    expect(pricing.annualTotal).toBe(3000); // 5 × $600
    expect(pricing.lineItems[0].isModified).toBe(true);
  });

  test('calculatePricing: multi-product total sums correctly', () => {
    const data = makeProposal({
      selectedProducts: ['core', 'lpr', 'users'],
      quantities: { lpr: 10, users: 20 },
    });
    const pricing = calculatePricing(data);
    // core=$5000, lpr=10×$500=$5000, users=20×$100=$2000 → total=$12000
    expect(pricing.annualTotal).toBe(12000);
  });

});
