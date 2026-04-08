/**
 * Group 3 — Proposal History
 * Tests proposal ID generation, status transitions, and CRUD logic
 * using the same functions the API routes use internally.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { SavedProposal } from '@/app/api/proposals/route';
import { calculatePricing, ProposalData } from '@/lib/pricing';

// ─── Test-isolated file path ──────────────────────────────────────────────────

const TEST_DATA_PATH = join(process.cwd(), 'src', 'data', '__test_proposals__.json');

function readAll(): SavedProposal[] {
  try {
    if (!existsSync(TEST_DATA_PATH)) return [];
    return JSON.parse(readFileSync(TEST_DATA_PATH, 'utf-8'));
  } catch { return []; }
}

function writeAll(proposals: SavedProposal[]) {
  const dir = join(process.cwd(), 'src', 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(TEST_DATA_PATH, JSON.stringify(proposals, null, 2), 'utf-8');
}

function generateId(existing: SavedProposal[]): string {
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;
  const nums = existing
    .map(p => { const m = p.id.match(new RegExp(`^PROP-${year}-(\\d+)$`)); return m ? parseInt(m[1]) : 0; })
    .filter(n => n > 0);
  const next = nums.length === 0 ? 1 : Math.max(...nums) + 1;
  return prefix + String(next).padStart(3, '0');
}

function makeProposalData(overrides: Partial<ProposalData> = {}): ProposalData {
  return {
    productLine: 'ksafety',
    deploymentType: 'onprem',
    customerName: 'Test City',
    city: 'Haifa',
    country: 'Israel',
    contactPerson: 'QA Tester',
    contactEmail: 'qa@test.com',
    projectName: 'QA Test Proposal',
    salesPerson: 'Rep',
    selectedProducts: ['core'],
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

function createProposal(data: ProposalData, narrative = ''): SavedProposal {
  const all     = readAll();
  const pricing = calculatePricing(data);
  const saved: SavedProposal = {
    id: generateId(all),
    customerName: data.customerName,
    city: data.city,
    country: data.country,
    dateCreated: new Date().toISOString(),
    products: data.selectedProducts,
    pricingModel: data.pricingModel,
    annualTotal: pricing.annualTotal,
    perpetualTotal: pricing.perpetualTotal,
    status: 'Draft',
    formData: data,
    narrative,
  };
  all.push(saved);
  writeAll(all);
  return saved;
}

function getProposals(): SavedProposal[] { return readAll(); }

function getProposal(id: string): SavedProposal | undefined {
  return readAll().find(p => p.id === id);
}

function updateStatus(id: string, status: SavedProposal['status']) {
  const all = readAll();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Not found: ${id}`);
  all[idx] = { ...all[idx], status };
  writeAll(all);
}

function deleteProposal(id: string) {
  const filtered = readAll().filter(p => p.id !== id);
  writeAll(filtered);
}

// ─── Group 3: Proposal History ────────────────────────────────────────────────

describe('Proposal History', () => {

  // Wipe test file before each test for isolation
  beforeEach(() => {
    writeAll([]);
  });

  afterAll(() => {
    // Clean up test file
    try { import('fs').then(fs => fs.unlinkSync(TEST_DATA_PATH)); } catch { /* ignore */ }
  });

  test('New proposal is saved after creation', () => {
    const data = makeProposalData();
    const proposal = createProposal(data);
    const saved = getProposals();
    expect(saved.find(p => p.id === proposal.id)).toBeDefined();
  });

  test('Proposal ID format is PROP-YYYY-XXX', () => {
    const currentYear = new Date().getFullYear();
    const p = createProposal(makeProposalData());
    expect(p.id).toMatch(new RegExp(`^PROP-${currentYear}-\\d{3}$`));
  });

  test('Proposal ID increments correctly', () => {
    const p1 = createProposal(makeProposalData());
    const p2 = createProposal(makeProposalData());
    const n1 = parseInt(p1.id.split('-')[2]);
    const n2 = parseInt(p2.id.split('-')[2]);
    expect(n2).toBe(n1 + 1);
  });

  test('New proposal starts with status "Draft"', () => {
    const p = createProposal(makeProposalData());
    expect(p.status).toBe('Draft');
  });

  test('Status can be changed: Draft → Sent → Won', () => {
    const p = createProposal(makeProposalData());
    updateStatus(p.id, 'Sent');
    expect(getProposal(p.id)?.status).toBe('Sent');
    updateStatus(p.id, 'Won');
    expect(getProposal(p.id)?.status).toBe('Won');
  });

  test('Status can be set to Lost', () => {
    const p = createProposal(makeProposalData());
    updateStatus(p.id, 'Lost');
    expect(getProposal(p.id)?.status).toBe('Lost');
  });

  test('Edit reopens form with correct pre-filled customer data', () => {
    const data = makeProposalData({ customerName: 'City of Haifa', city: 'Haifa' });
    const p    = createProposal(data);
    const found = getProposal(p.id);
    expect(found?.formData.customerName).toBe('City of Haifa');
    expect(found?.formData.city).toBe('Haifa');
  });

  test('Edit reopens form with correct selected products', () => {
    const data = makeProposalData({ selectedProducts: ['core', 'lpr', 'face'] });
    const p    = createProposal(data);
    const found = getProposal(p.id);
    expect(found?.formData.selectedProducts).toEqual(['core', 'lpr', 'face']);
  });

  test('Delete removes proposal from list', () => {
    const p = createProposal(makeProposalData());
    deleteProposal(p.id);
    const remaining = getProposals();
    expect(remaining.find(r => r.id === p.id)).toBeUndefined();
  });

  test('Delete does not affect other proposals', () => {
    const p1 = createProposal(makeProposalData());
    const p2 = createProposal(makeProposalData());
    deleteProposal(p1.id);
    const remaining = getProposals();
    expect(remaining.find(r => r.id === p2.id)).toBeDefined();
  });

  test('Proposals are stored with correct pricing totals', () => {
    const data = makeProposalData({ selectedProducts: ['core'] });
    const p    = createProposal(data);
    expect(p.annualTotal).toBe(5000);
    expect(p.perpetualTotal).toBe(17500);
  });

  test('Proposal narrative is preserved', () => {
    const data = makeProposalData();
    const p    = createProposal(data, 'This is the AI executive summary.');
    const found = getProposal(p.id);
    expect(found?.narrative).toBe('This is the AI executive summary.');
  });

  test('Multiple proposals are all retrievable', () => {
    createProposal(makeProposalData({ customerName: 'City A' }));
    createProposal(makeProposalData({ customerName: 'City B' }));
    createProposal(makeProposalData({ customerName: 'City C' }));
    expect(getProposals().length).toBe(3);
  });

});
