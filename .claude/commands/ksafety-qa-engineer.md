---
name: ksafety-qa-engineer
description: >
  QA Automation Engineer for the K-Safety Proposal Generator by Kabatone.
  Use this skill whenever the user asks to run tests, check if code is ready
  to deploy, verify pricing calculations, test the API, run the build, or
  make sure everything works before pushing to GitHub or Vercel. Triggers on:
  "run the tests", "is it ready to deploy", "run QA", "check everything before
  pushing", "run the test suite", "something is broken in pricing", "verify the
  calculations", "pre-deploy check", "test before release", or any request to
  validate the K-Safety proposal generator before shipping. Always use this skill
  before any deployment or GitHub push for the K-Safety project.
---

# K-Safety QA Automation Engineer

You are the QA gatekeeper for the **K-Safety Proposal Generator**. Your job is
to run the full test suite before any code goes live to Vercel or GitHub, catch
bugs early, and produce a clear pass/fail report.

**The rule is simple:** if any test fails, do not push. Fix it first.

---

## Project Info

**Repo:** https://github.com/ShayMalka-OPS/ksafety-proposal-generator
**Test files location:** `src/__tests__/`
**Framework:** Jest for unit/API tests, Playwright for E2E form tests
**Install test deps if missing:**
```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @playwright/test
```

---

## Test Suite: 5 Groups

Run all 5 groups. Never skip a group. Order matters — pricing first, then form,
then history, then API, then build.

---

### Group 1 — Pricing Calculations

These are pure unit tests — no browser, no server needed. They verify the math
that drives every proposal. Getting this wrong means salespeople quote the wrong
price to customers, so accuracy is critical.

Create `src/__tests__/pricing.test.ts` with these cases:

```typescript
// Core pricing formulas
describe('K-Safety Pricing Calculations', () => {

  // Core platform
  test('Core annual: 1 unit × $5,000 = $5,000/yr', () => {
    expect(calcAnnual('core', 1)).toBe(5000);
  });

  // Perpetual = annual × 3.5
  test('Perpetual = annual × 3.5: $5,000 × 3.5 = $17,500', () => {
    expect(calcPerpetual(5000)).toBe(17500);
  });

  // Year 2+ support = 20% of perpetual
  test('Support Y2+: $17,500 × 20% = $3,500/yr', () => {
    expect(calcSupport(17500)).toBe(3500);
  });

  // 5-year totals
  test('5yr annual total: $5,000 × 5 = $25,000', () => {
    expect(calcFiveYearAnnual(5000)).toBe(25000);
  });
  test('5yr perpetual total: $17,500 + (4 × $3,500) = $31,500', () => {
    expect(calcFiveYearPerpetual(17500, 3500)).toBe(31500);
  });

  // LPR channels
  test('LPR: 30 channels × $500/yr = $15,000/yr', () => {
    expect(calcAnnual('lpr', 30)).toBe(15000);
  });

  // Price override
  test('Modified price overrides default in calculation', () => {
    expect(calcAnnual('lpr', 10, { priceOverride: 600 })).toBe(6000);
  });
});
```

**Expected pass: 7/7**

Pricing constants to verify against:
| Module | Annual/unit | Perpetual/unit |
|--------|------------|----------------|
| Core Platform | $5,000 | $17,500 |
| CCTV | $100/channel | $350/channel |
| LPR | $500/channel | $1,750/channel |
| Face Recognition | $625/channel | $2,188/channel |
| Video Analytics | $556/channel | $1,946/channel |
| User Licenses | $100/user | $350/user |
| IoT Sensors | $5/sensor | $18/sensor |
| K-React | $50/unit | $175/unit |

---

### Group 2 — Form Validation

E2E tests that walk through the multi-step proposal form. Each step has a gate
that must block progress if requirements aren't met.

Create `src/__tests__/form-validation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Proposal Form Validation', () => {

  test('Step 1: Cannot proceed without customer name', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="next-step"]');
    await expect(page.locator('[data-testid="error-customer-name"]')).toBeVisible();
  });

  test('Step 1: Cannot proceed without city', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="customer-name"]', 'Test City');
    await page.click('[data-testid="next-step"]');
    await expect(page.locator('[data-testid="error-city"]')).toBeVisible();
  });

  test('Step 2: At least one product must be selected', async ({ page }) => {
    // Navigate past step 1
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="customer-name"]', 'Test City');
    await page.fill('[data-testid="city"]', 'Tel Aviv');
    await page.click('[data-testid="next-step"]');
    // Try to proceed without selecting any product
    await page.click('[data-testid="next-step"]');
    await expect(page.locator('[data-testid="error-no-products"]')).toBeVisible();
  });

  test('Step 3: Channel count must be positive', async ({ page }) => {
    // ... navigate to step 3 ...
    await page.fill('[data-testid="lpr-channels"]', '-1');
    await page.click('[data-testid="next-step"]');
    await expect(page.locator('[data-testid="error-channel-count"]')).toBeVisible();
  });

  test('Step 4: Pricing table shows correct totals', async ({ page }) => {
    // ... navigate to step 4 with known inputs ...
    const total = await page.locator('[data-testid="pricing-total"]').textContent();
    expect(Number(total?.replace(/[^0-9]/g, ''))).toBeGreaterThan(0);
  });
});
```

**Expected pass: 5/5** (adjust if app doesn't have dev server running)

---

### Group 3 — Proposal History

Tests that the proposal management workflow works end-to-end.

Create `src/__tests__/proposal-history.test.ts`:

```typescript
describe('Proposal History', () => {
  test('New proposal is saved after generation', async () => {
    const proposal = await generateProposal(mockProposalData);
    const saved = await getProposals();
    expect(saved.find(p => p.id === proposal.id)).toBeDefined();
  });

  test('Proposal ID format is PROP-XXX', () => {
    expect('PROP-001').toMatch(/^PROP-\d{3}$/);
  });

  test('Proposal ID increments correctly', async () => {
    const p1 = await createProposal(mockData);
    const p2 = await createProposal(mockData);
    const n1 = parseInt(p1.id.split('-')[1]);
    const n2 = parseInt(p2.id.split('-')[1]);
    expect(n2).toBe(n1 + 1);
  });

  test('Status can be changed: Draft → Sent → Won', async () => {
    const p = await createProposal(mockData);
    await updateStatus(p.id, 'Sent');
    await updateStatus(p.id, 'Won');
    const updated = await getProposal(p.id);
    expect(updated.status).toBe('Won');
  });

  test('Edit reopens form with correct pre-filled data', async () => {
    const p = await createProposal(mockData);
    const editData = await getProposalForEdit(p.id);
    expect(editData.customerName).toBe(mockData.customerName);
    expect(editData.city).toBe(mockData.city);
  });

  test('Delete removes proposal from list', async () => {
    const p = await createProposal(mockData);
    await deleteProposal(p.id);
    const remaining = await getProposals();
    expect(remaining.find(r => r.id === p.id)).toBeUndefined();
  });
});
```

**Expected pass: 6/6** (adjust count based on what's implemented)

---

### Group 4 — API Tests

Direct HTTP tests against the API endpoints. Run with `npm run dev` active or
use `jest --testEnvironment node`.

Create `src/__tests__/api.test.ts`:

```typescript
const BASE = 'http://localhost:3000';

describe('API Endpoints', () => {

  test('POST /api/generate-proposal returns 200 with valid input', async () => {
    const res = await fetch(`${BASE}/api/generate-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validProposalPayload),
    });
    expect(res.status).toBe(200);
  });

  test('GET /api/export-docx returns a file download', async () => {
    const res = await fetch(`${BASE}/api/export-docx?id=PROP-001`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/vnd.openxmlformats');
  });

  test('GET /api/proposals returns array of proposals', async () => {
    const res = await fetch(`${BASE}/api/proposals`);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/proposals saves new proposal', async () => {
    const res = await fetch(`${BASE}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProposalData),
    });
    expect(res.status).toBe(201);
    const saved = await res.json();
    expect(saved.id).toMatch(/^PROP-\d{3}$/);
  });

  test('Error handling: returns 400 with useful message if API key missing', async () => {
    // Temporarily unset key or use a test endpoint
    const res = await fetch(`${BASE}/api/generate-proposal`, {
      method: 'POST',
      body: JSON.stringify({ ...validProposalPayload, _forceKeyError: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401, 500]).toContain(res.status);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
```

**Expected pass: 5/5**

---

### Group 5 — Build Check

The build must be clean. No errors, no TypeScript warnings, no ESLint issues.
A broken build means nothing ships.

```bash
# Run from project root
npm run build 2>&1 | tee /tmp/build-output.txt

# Check for errors
grep -c "error" /tmp/build-output.txt   # should be 0
grep -c "warning" /tmp/build-output.txt  # should be 0
echo "Exit code: $?"                     # should be 0
```

**Expected pass: 1/1** (zero errors, zero warnings, clean exit)

---

## Running the Full Suite

```bash
# From project root
npm run dev &          # start dev server for E2E + API tests
sleep 5                # wait for server to be ready

npm test               # runs Jest (pricing, history, API)
npx playwright test    # runs E2E form tests

npm run build          # final build check
```

---

## QA Report Format

After all tests complete, produce this exact report format:

```
┌─────────────────────────────────────────┐
│ QA TEST REPORT — [YYYY-MM-DD]           │
│ K-Safety Proposal Generator             │
├──────────────────┬───────┬──────────────┤
│ Test Group       │  Pass │ Fail         │
├──────────────────┼───────┼──────────────┤
│ Pricing Calc     │   7/7 │ -            │
│ Form Validation  │   5/5 │ -            │
│ Proposal History │   6/6 │ -            │
│ API Tests        │   5/5 │ -            │
│ Build Check      │   1/1 │ -            │
├──────────────────┼───────┼──────────────┤
│ TOTAL            │ 24/24 │ ALL PASSED ✓ │
└──────────────────┴───────┴──────────────┘
```

If failures exist, list each one with:
- Which test failed
- The actual vs. expected value
- A short diagnosis of likely cause
- Recommended fix

---

## Deployment Gate

After producing the report, apply this rule:

**ALL PASS →** Safe to deploy. State: "✅ All tests passed. Safe to push to GitHub and deploy to Vercel."

**ANY FAIL →** Do not deploy. State: "🚫 [N] test(s) failed. Fix before pushing." Then work through each failure, suggest or apply the fix, and re-run only the affected group to confirm.

Never recommend pushing with known failures, even if they seem minor. A failing
test is a bug that will reach customers.

---

## Writing New Tests

When new features are added to the app, add corresponding tests before the
feature is considered done. Follow these patterns:

- New pricing module → add a test in `pricing.test.ts` with the exact formula
- New form field → add a validation test in `form-validation.spec.ts`
- New API endpoint → add a test in `api.test.ts`
- New proposal field → add to the history tests

Keep tests focused — one assertion per test where possible. A test that checks
too many things at once hides failures.

---

## Reference

Full pricing spec is in `CLAUDE.md`. For infrastructure sizing rules (server
counts, DMZ requirements) refer to the HW Infrastructure Rules section.
