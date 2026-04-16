# K-Safety Proposal Generator — Sprint v1.6.0
**Product Manager:** Shay Malka (shaym@kabatone.com)
**Date:** 2026-04-10
**Target version:** 1.6.0
**Repository:** https://github.com/ShayMalka-OPS/ksafety-proposal-generator

---

## Overview

This sprint addresses 8 bugs and 6 feature enhancements. All items have been triaged from user-reported issues during UAT of v1.5.0. Bugs are marked **[BUG]** and must be completed before features. Items are ordered by priority within each category.

---

## Part A — Bug Fixes (complete all before features)

---

### BUG-1 · Product Line cards have no visible selected state

**File:** `src/app/proposal/page.tsx` — `Step0` component
**Priority:** High — users cannot tell which product line is selected

**Root cause:** The selected border colour is set to `GOLD` which resolves to `#FFFFFF` (white) — invisible on a white card background. The Deployment Model section below it correctly uses `MID_BLUE` (`#1E6BA8`). The product line section must match.

**Fix:** In the `Step0` component, find the product line card `<button>` and update three style values:

```tsx
// BEFORE:
style={{
  borderColor: selected ? GOLD : "#e5e7eb",
  backgroundColor: selected ? "rgba(255,255,255,0.05)" : "white",
}}

// AFTER:
style={{
  borderColor: selected ? MID_BLUE : "#e5e7eb",
  backgroundColor: selected ? "rgba(30,107,168,0.05)" : "white",
}}
```

Also update the checkmark circle inside the card from white to blue:
```tsx
// BEFORE:
style={{ backgroundColor: GOLD }}

// AFTER:
style={{ backgroundColor: MID_BLUE }}
```

**Result:** Selected product line cards now show a blue border and blue checkmark — identical visual behaviour to the Deployment Model cards directly below.

---

### BUG-2 · Proposal history empty after browser close / re-open

**Files:** `src/app/api/proposals/route.ts`, `src/app/api/proposals/[id]/route.ts`
**Priority:** Critical

**Root cause:** Next.js 14 on Vercel caches GET API routes at the CDN edge. The responses are frozen at build time and never refreshed, so the history page always shows an empty list. Both route files need `export const dynamic = "force-dynamic"` to opt out of caching.

**Fix:** Confirm both files already have this line near the top (it may have been added but not deployed due to a Vercel build-cache issue):

```ts
export const dynamic = "force-dynamic";
```

If either file is missing it, add it immediately after the imports. Then trigger a **clean** Vercel rebuild:
- In the Vercel dashboard → Deployments → Redeploy → **uncheck "Use existing Build Cache"**

---

### BUG-3 · K-Analytics product line still appears on live site

**File:** `src/lib/pricing.ts`
**Priority:** High

**Root cause:** The code change removing K-Analytics is correct in git, but Vercel is serving a stale cached build that still contains the old JavaScript bundle.

**Fix:** No code change required. Force a clean Vercel rebuild:
```bash
git commit --allow-empty -m "chore: force clean Vercel rebuild — remove K-Analytics cache"
git push
```
In Vercel dashboard → Deployments → Redeploy → **uncheck "Use existing Build Cache"** → Redeploy.

**Verify:** After the new deployment, open the site in incognito mode and confirm Step 1 shows only: K-Safety, K-Video, K-Dispatch.

---

### BUG-4 · HA Mode toggle: button overlaps text and shows white when active

**File:** `src/app/proposal/page.tsx` — `Step3` component, HA toggle block
**Priority:** Medium

**Root cause 1 (overlap):** The toggle row uses `flex items-center gap-3` but the text div has no min-width, so on smaller screens the toggle button overlaps the label text.

**Root cause 2 (colour):** The toggle active colour is set to `GOLD` = `#FFFFFF` (white), making it invisible against a white background.

**Fix — find the HA toggle block and replace it entirely:**

```tsx
// BEFORE:
<div className="flex items-center gap-3">
  <button
    onClick={() => onChange({ haMode: !data.haMode })}
    className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
    style={{ backgroundColor: data.haMode ? GOLD : "#d1d5db" }}
  >
    <span
      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
      style={{ transform: data.haMode ? "translateX(20px)" : "translateX(2px)" }}
    />
  </button>
  <div>
    <div className="text-sm font-semibold" style={{ color: DARK_BLUE }}>High Availability (HA) Mode</div>
    <div className="text-xs text-gray-500">...</div>
  </div>
</div>

// AFTER:
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
```

---

### BUG-5 · "You save" amount invisible in 5-Year comparison

**File:** `src/app/proposal/page.tsx` — `Step4` component, 5-Year Cost Comparison section
**Priority:** Medium

**Root cause:** The savings banner uses `color: GOLD` (`#FFFFFF`) for both the emoji and the bold amount — white text on a near-white background is invisible.

**Fix:** Find the savings banner inside the 5-Year Cost Comparison section and change the colour:

```tsx
// BEFORE:
<div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
  style={{ backgroundColor: "rgba(255,255,255,0.12)", color: DARK_BLUE }}>
  <span style={{ color: GOLD }}>💰</span>
  You save <strong style={{ color: GOLD }}>{fmt(...)}</strong> over 5 years...

// AFTER:
<div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
  style={{ backgroundColor: "rgba(30,107,168,0.08)", color: DARK_BLUE }}>
  <span>💰</span>
  You save <strong style={{ color: MID_BLUE }}>{fmt(...)}</strong> over 5 years...
```

Apply the same fix to the equivalent savings line inside the `Step5` proposal preview Section 4.

---

### BUG-6 · Final proposal shows both Annual and Perpetual columns regardless of user's choice

**File:** `src/app/proposal/page.tsx` — `Step5` component, Section 1 and Section 4 of the proposal preview
**Priority:** High — confuses the customer receiving the proposal

**Fix — Section 1 (investment summary boxes):**
Replace the two-column investment grid with a single box showing only the chosen model:
```tsx
// BEFORE: always shows both boxes side-by-side
<div className="grid md:grid-cols-2 gap-4 mt-4">
  <div>Annual Investment ... {fmtCurrency(pricing.annualTotal)}</div>
  <div>Perpetual Investment ... {fmtCurrency(pricing.perpetualTotal)}</div>
</div>

// AFTER: show only the selected model
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
      <div className="text-xs text-gray-400">one-time license + {fmt(pricing.year2SupportAnnual)}/yr support from Year 2</div>
    </div>
  )}
</div>
```

**Fix — Section 4 (pricing table):**
The table currently has both "Annual Total" and "Perpetual Total" columns. Show only the relevant column based on `data.pricingModel`:

```tsx
// In the <thead>, show only the relevant column:
<th className="text-right px-3 py-2 text-white">
  {data.pricingModel === "annual" ? "Annual Total" : "Perpetual Total"}
</th>
// (remove the second total column entirely)

// In each data row, show only the relevant value:
<td className="px-3 py-2 border-b border-gray-100 text-right">
  {item.isService
    ? fmt(item.annualTotal)
    : data.pricingModel === "annual"
      ? fmtCurrency(item.annualTotal)
      : fmtCurrency(item.perpetualTotal)}
</td>
// (remove the second total <td>)

// In the GRAND TOTAL row:
<td className="px-3 py-2 text-right" style={{ color: DARK_BLUE }}>
  {data.pricingModel === "annual"
    ? `${fmtCurrency(pricing.annualTotal)}/yr`
    : fmtCurrency(pricing.perpetualTotal)}
</td>
```

---

### BUG-7 · AI summary is a single unreadable paragraph

**Files:** `src/app/api/generate-proposal/route.ts` (prompt), `src/app/proposal/page.tsx` (renderer)
**Priority:** High

**Part 1 — Update the AI prompt** in `src/app/api/generate-proposal/route.ts`:

The system prompt or user prompt must instruct Claude to format the output with clear sections. Add this formatting instruction to the prompt:

```
Format your response with the following structure, using these exact section headers:

## Executive Summary
[2-3 sentences on the overall value proposition]

## Business Challenges Addressed
- [bullet]
- [bullet]

## Proposed Solution
[2-3 sentences describing the selected modules and how they work together]

## Key Capabilities
- [bullet per major selected product]

## Investment Overview
[1-2 sentences summarising the pricing model and 5-year value]

## Recommended Next Steps
- [bullet]
- [bullet]

Keep each section concise. Use the customer's name and city naturally throughout.
```

**Part 2 — Update the narrative renderer** in `src/app/proposal/page.tsx` (Step5, Section 5):

Replace the plain `<p>` tag with a markdown-style renderer:

```tsx
// BEFORE:
{narrative ? (
  <p className="text-sm text-gray-700 leading-relaxed">{narrative}</p>
) : (...)}

// AFTER:
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
    No summary generated yet. Click "✨ Generate AI Summary" below.
  </div>
)}
```

---

### BUG-8 · Product checkbox disappears when item is selected in Step 3

**File:** `src/app/proposal/page.tsx` — `Step2` component, product card toggle button
**Priority:** Medium

**Root cause:** When a product is selected, the checkbox div's styling changes to a filled state with a white checkmark, but the visual affordance to click again to deselect is lost because the clickable area and hover state are not clear.

**Fix:** Update the checkbox `<div>` inside the product toggle `<button>` to always show a clear border and to display a visible "×" or checkmark that signals it is clickable:

```tsx
// The outer button already handles the toggle click — ensure the checkbox
// div always renders with clear border and hover feedback:
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
```

Also ensure the product card border changes to `MID_BLUE` (not `GOLD`) when selected, so the entire row is visually consistent:
```tsx
// On the outer card div:
style={{ borderColor: selected ? MID_BLUE : "#e5e7eb" }}
```

---

## Part B — Feature Enhancements

---

### FEAT-1 · HA Mode — Full redundancy infrastructure generation

**File:** `src/lib/hw-calculator.ts` — `calculateHW()` function
**Priority:** High

When `input.haMode === true`, apply ALL five rules below in addition to the standard VMs. These rules are additive — do not replace existing servers.

**Rule 1 — Second Active Directory VM**
Add immediately after `K1-AD-PKI-01`:
```ts
{ group: "Infrastructure", serverName: "K1-AD-PKI-02", vmPhysical: "VM", amount: 1,
  os: "Windows Server 2022", vCores: 8, ramGB: 8, localDiskGB: 100, storageGB: 0,
  comments: "Active Directory replica (HA) | C: 100GB OS" }
```

**Rule 2 — Dedicated app server per active integration**
Add one server for each integration with channels > 0:
- LPR: `K1-APP-LPR-01` — `"Dedicated LPR integration server (HA) | C: 100GB OS"`
- Face: `K1-APP-FR-01` — `"Dedicated Face Recognition server (HA) | C: 100GB OS"`
- VA: `K1-APP-VA-01` — `"Dedicated Video Analytics server (HA) | C: 100GB OS"`

All three: `group: "Application"`, `os: "Windows Server 2022"`, `vCores: 16`, `ramGB: 32`, `localDiskGB: 100`, `storageGB: 0`.

**Rule 3 — Dedicated mobile app server**
If `input.hasKShare || input.hasKReact`:
```ts
{ group: "Application", serverName: "K1-APP-MOB-01", vmPhysical: "VM", amount: 1,
  os: "Windows Server 2022", vCores: 16, ramGB: 32, localDiskGB: 100, storageGB: 0,
  comments: "Dedicated K-Share/K-React application server (HA) | C: 100GB OS" }
```

**Rule 4 — Elasticsearch 3-node cluster**
Replace the single `K1-ELK-01` with 3 nodes when `haMode === true`:
```ts
const elkNodeGB = Math.max(200, Math.ceil((esStorageGB * 1.2) / 3));
// Add K1-ELK-01, K1-ELK-02, K1-ELK-03 — each with storageGB: elkNodeGB
// comments: `Elasticsearch node N/3 (HA cluster) | /: 100GB OS, /data SAN`
```
When `haMode === false`, keep the existing single `K1-ELK-01` with `elkDiskGB`.

**Rule 5 — Second web server**
Add after `K1-WEB-01`:
```ts
{ group: "Web", serverName: "K1-WEB-02", vmPhysical: "VM", amount: 1,
  os: "Ubuntu 24.04", vCores: 8, ramGB: 32, localDiskGB: 200, storageGB: 0,
  comments: "NGINX + MongoDB + BFF — HA replica | /: 200GB" }
```

---

### FEAT-2 · Editable VM Infrastructure table in Step 5

**File:** `src/app/proposal/page.tsx` — `Step4` component
**Priority:** Medium

The VM infrastructure table should be editable. Based on the current code, `vmRows`, `setVmRows`, `updateRow`, `deleteRow`, `addRow`, and `resetRows` are already defined in `Step4`. Verify this is wired up correctly:

1. Confirm each row in the VM table renders editable `<input>` fields (not static text) for: Server Name, OS, vCores, RAM, Storage, Comments.
2. Confirm a red **✕** delete button appears at the end of each row.
3. Confirm an **"+ Add Row"** button below the table appends a blank row.
4. Confirm a **"↺ Reset to calculated"** button above the table calls `resetRows()`.
5. If any of these are missing, implement them now.

---

### FEAT-3 · Discount percentage in Step 5

**File:** `src/app/proposal/page.tsx` — `Step4` component
**Priority:** Medium

Based on the current code, `data.discount`, `factor`, `discAnn`, `discPerp`, `disc5Ann`, `disc5Per` are already implemented. Verify:

1. The discount input field renders inside or near the GRAND TOTAL row.
2. The discounted amount shows with a strikethrough of the original price when discount > 0.
3. The 5-Year Cost Comparison section uses the discounted values `disc5Ann` and `disc5Per`.
4. If any are missing, implement them per the existing variable definitions.

---

### FEAT-4 · Step 6 — Rename Section 5 and relocate AI button

**File:** `src/app/proposal/page.tsx` — `Step5` component
**Priority:** High

**4a — Rename Section 5:**
```tsx
// BEFORE:
<SectionHeading>Section 5 — Next Steps</SectionHeading>

// AFTER:
<SectionHeading>Section 5 — Generative AI Summary</SectionHeading>
```

**4b — Move "Generate AI Summary" button:**
Remove it from the top action bar. Add it directly above the narrative renderer, inside the Section 5 `<section>`:
```tsx
<section>
  <SectionHeading>Section 5 — Generative AI Summary</SectionHeading>
  <div className="flex justify-end mb-4">
    <button onClick={generateNarrative} disabled={generating}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60 shadow-sm"
      style={{ backgroundColor: MID_BLUE, color: "white" }}>
      {generating ? "⏳ Generating…" : "✨ Generate AI Summary"}
    </button>
  </div>
  {/* narrative renderer — see BUG-7 */}
</section>
```

---

### FEAT-5 · Filter product descriptions to selected products only

**File:** `src/lib/content-extractor.ts`
**Priority:** High

Review `getSelectedProductSections()`. It must return sections **only** for products in the `selectedProducts` array. No section should appear for a product the user did not select.

1. If the function maps over a hardcoded list of all products, change it to map over `selectedProducts` and look up each product's section data by ID.
2. Verify: a user who selects only LPR and User Licenses sees only those two descriptions in Section 2.

---

### FEAT-6 · Currency selector in Step 6 (USD / NIS / MXN)

**File:** `src/app/proposal/page.tsx` — `Step5` component
**Priority:** Medium

Based on the current code, `currency` state and `fmtCurrency()` are already implemented with USD/NIS/MXN and a `<select>` dropdown. Verify:

1. The currency selector is visible in the top action bar of Step 6.
2. All price values in the proposal preview (Section 1, Section 4) use `fmtCurrency()` instead of `fmt()`.
3. A note appears below the cover when currency is not USD:
   ```tsx
   {currency !== "USD" && (
     <div className="text-xs text-center text-blue-300 mt-2">
       Prices shown in {currency} · Rate: 1 USD = {rates[currency]} {currency}
     </div>
   )}
   ```
4. Word/PDF exports continue to use USD (the export API receives `data` not the converted values).

---

## Testing Checklist

Before marking this sprint complete, verify:

- [ ] Step 1: Selected product line shows blue border + blue checkmark (matches Deployment Model style)
- [ ] Step 1: Only 3 product lines visible: K-Safety, K-Video, K-Dispatch
- [ ] Step 3: HA Mode toggle is blue when ON, has enough spacing, text is not overlapped
- [ ] Step 3: Checkboxes in product list remain visible and clickable after product is selected
- [ ] Step 5: "You save" savings amount is clearly visible in blue
- [ ] Step 5: Discount field calculates and strikes through original price correctly
- [ ] Step 5: VM table rows are editable; add/delete/reset all work
- [ ] Step 6: Section 5 titled "Generative AI Summary"; AI button is inside that section
- [ ] Step 6: Generated summary renders with headings and bullet points
- [ ] Step 6: Section 2 shows descriptions only for selected products
- [ ] Step 6: Final proposal shows only the chosen pricing model column (not both)
- [ ] Step 6: Currency selector converts prices; USD default shows $ symbol
- [ ] Proposal history: proposals persist after browser close and reopen
- [ ] Vercel: live site shows K-Safety, K-Video, K-Dispatch only (no K-Analytics)

---

## About Page Update

Bump `src/app/about/page.tsx`:
```ts
const APP_VERSION = "1.6.0";
const RELEASE_DATE = "2026-04-10";
```

Add new changelog entry at the top of the CHANGELOG array — see about page update in this sprint.
