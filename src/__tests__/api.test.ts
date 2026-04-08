/**
 * Group 4 — API Endpoint Tests
 * Direct HTTP tests against the running dev server.
 * Requires `npm run dev` to be running on port 3000.
 * Tests are skipped with a clear message if the server is not reachable.
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

const validProposalPayload = {
  productLine: 'ksafety',
  deploymentType: 'onprem',
  customerName: 'API Test City',
  city: 'Beersheba',
  country: 'Israel',
  contactPerson: 'API Tester',
  contactEmail: 'api@test.com',
  projectName: 'API Test Proposal',
  salesPerson: 'QA Bot',
  selectedProducts: ['core', 'lpr'],
  quantities: { lpr: 5 },
  kshareТier: 'entry',
  servicesPackage: null,
  customPrices: {},
  pricingModel: 'annual',
  haMode: false,
  videoBitrateMbps: 4,
  retentionDays: { lpr: 90, fr: 90, va: 45, iot: 90, cctv: 30 },
};

// ─── Connectivity check ───────────────────────────────────────────────────────

let serverAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(3000) });
    serverAvailable = res.ok || res.status < 500;
  } catch {
    serverAvailable = false;
    console.warn(
      '\n⚠️  Dev server not running at http://localhost:3000\n' +
      '   Start it with `npm run dev` to enable API tests.\n' +
      '   API tests will be SKIPPED this run.\n'
    );
  }
});

function skipIfNoServer() {
  if (!serverAvailable) {
    console.log('  SKIPPED (dev server not running)');
    return true;
  }
  return false;
}

// ─── Group 4: API Endpoints ───────────────────────────────────────────────────

describe('API Endpoints', () => {

  // ── GET /api/proposals ────────────────────────────────────────────────────

  test('GET /api/proposals returns array', async () => {
    if (skipIfNoServer()) return;
    const res  = await fetch(`${BASE}/api/proposals`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // ── POST /api/proposals ───────────────────────────────────────────────────

  test('POST /api/proposals saves new proposal and returns id', async () => {
    if (skipIfNoServer()) return;
    const res  = await fetch(`${BASE}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: validProposalPayload, narrative: '' }),
    });
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved.id).toMatch(/^PROP-\d{4}-\d{3}$/);
    expect(saved.status ?? saved.ok).toBeTruthy();
  });

  // ── GET /api/proposals/[id] ───────────────────────────────────────────────

  test('GET /api/proposals/:id returns the saved proposal', async () => {
    if (skipIfNoServer()) return;
    // First create one
    const postRes = await fetch(`${BASE}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: validProposalPayload, narrative: 'Test narrative' }),
    });
    const { id } = await postRes.json();

    const getRes  = await fetch(`${BASE}/api/proposals/${id}`);
    expect(getRes.status).toBe(200);
    const proposal = await getRes.json();
    expect(proposal.id).toBe(id);
    expect(proposal.customerName).toBe('API Test City');
    expect(proposal.narrative).toBe('Test narrative');
  });

  test('GET /api/proposals/:id returns 404 for unknown id', async () => {
    if (skipIfNoServer()) return;
    const res = await fetch(`${BASE}/api/proposals/PROP-9999-999`);
    expect(res.status).toBe(404);
  });

  // ── PATCH /api/proposals/[id] ─────────────────────────────────────────────

  test('PATCH /api/proposals/:id updates proposal status', async () => {
    if (skipIfNoServer()) return;
    const postRes = await fetch(`${BASE}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: validProposalPayload }),
    });
    const { id } = await postRes.json();

    const patchRes = await fetch(`${BASE}/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Sent' }),
    });
    expect(patchRes.status).toBe(200);

    const updated = await fetch(`${BASE}/api/proposals/${id}`).then(r => r.json());
    expect(updated.status).toBe('Sent');
  });

  // ── DELETE /api/proposals/[id] ────────────────────────────────────────────

  test('DELETE /api/proposals/:id removes the proposal', async () => {
    if (skipIfNoServer()) return;
    const postRes = await fetch(`${BASE}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: validProposalPayload }),
    });
    const { id } = await postRes.json();

    const delRes = await fetch(`${BASE}/api/proposals/${id}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const checkRes = await fetch(`${BASE}/api/proposals/${id}`);
    expect(checkRes.status).toBe(404);
  });

  // ── POST /api/export-docx ─────────────────────────────────────────────────

  test('POST /api/export-docx returns a .docx file download', async () => {
    if (skipIfNoServer()) return;
    const res = await fetch(`${BASE}/api/export-docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: validProposalPayload, narrative: 'Test summary' }),
    });
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('openxmlformats');
  });

  // ── POST /api/generate-proposal — error handling ──────────────────────────

  test('POST /api/generate-proposal returns structured error if API key missing / invalid', async () => {
    if (skipIfNoServer()) return;
    // We can't unset the server's env var, but we can verify the error shape
    // when the Claude call fails (will return 500 with { error: "..." })
    // Allow up to 30s — a real Claude call can take 10-15s
    const res = await fetch(`${BASE}/api/generate-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validProposalPayload),
    });
    // Should be either 200 (key valid) or 500 with error message (key missing/invalid)
    expect([200, 500]).toContain(res.status);
    const body = await res.json();
    if (res.status === 500) {
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    } else {
      expect(typeof body.narrative).toBe('string');
    }
  }, 30000); // 30s timeout — Claude API can take 10-15s

});
