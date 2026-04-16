# K-Safety Proposal Generator — Sprint v1.5.0
**Prepared by:** Shay Malka, Product Manager  
**Date:** 2026-04-09  
**Target version:** 1.5.0  
**Repository:** https://github.com/ShayMalka-OPS/ksafety-proposal-generator

---

## Overview

This sprint addresses 6 work items: 1 bug fix, 1 data-layer fix, and 4 feature enhancements across the proposal wizard. All changes are scoped to the Next.js 14 / TypeScript codebase. No new dependencies are required unless noted.

---

## Work Items

---

### WI-1 · BUG — Remove K-Analytics from Product Line selector

**File:** `src/lib/pricing.ts`  
**Priority:** High  

**Problem:** The "K-Analytics" option appears in Step 1 ("Product Line & Deployment") but should not be offered to users.

**Instructions:**

1. In `src/lib/pricing.ts`, remove the `kanalytics` entry from the `PRODUCT_LINES` record:
   ```ts
   // DELETE this entry:
   kanalytics: { label: "K-Analytics", description: "...", icon: "📊" },
   ```

2. Remove the `kanalytics` entry from the `PRODUCT_LINE_PRODUCTS` record:
   ```ts
   // DELETE this entry:
   kanalytics: ["core","iot","users","services"],
   ```

3. Update the `ProductLine` type to remove `"kanalytics"`:
   ```ts
   // BEFORE:
   export type ProductLine = "ksafety" | "kvideo" | "kdispatch" | "kanalytics";
   // AFTER:
   export type ProductLine = "ksafety" | "kvideo" | "kdispatch";
   ```

4. In `src/app/proposal/page.tsx`, update `emptyData.productLine` default — confirm it is `"ksafety"` (no change needed if already set).

5. Verify: Step 1 should now show exactly 3 product line options: K-Safety, K-Video, K-Dispatch.

---

### WI-2 · BUG — Proposal history empty after page reload / server restart

**File:** `src/app/api/proposals/route.ts`  
**Priority:** Critical  

**Problem:** Proposals are saved to MongoDB Atlas but the `/proposals` history page shows an empty list after reloading. The root cause is the MongoDB `.project()` chaining syntax — in the official Node.js driver v6+, projection must be passed as an option to `find()`, not chained.

**Instructions:**

1. In `src/app/api/proposals/route.ts`, update the `GET` handler to pass projection as an option instead of chaining:

   ```ts
   // BEFORE:
   const all = await col
     .find({})
     .sort({ dateCreated: -1 })
     .project<Omit<SavedProposal, "formData">>({
       _id: 0,
       formData: 0,
     })
     .toArray();

   // AFTER:
   const all = await col
     .find({}, { projection: { _id: 0, formData: 0 } })
     .sort({ dateCreated: -1 })
     .toArray() as Omit<SavedProposal, "formData">[];
   ```

2. In `src/app/api/proposals/[id]/route.ts`, confirm the `GET` handler already uses `{ projection: { _id: 0 } }` as an option to `findOne()` (not chained). If it uses `.project()`, fix it the same way.

3. Verify fix: Restart dev server, create a proposal, reload the page — proposals should persist and appear in history.

---

### WI-3 · FEATURE — High Availability (HA) Mode: full redundancy infrastructure

**File:** `src/lib/hw-calculator.ts`  
**Priority:** High  

**Problem:** The current HA mode only adds +1 generic app server. The correct HA architecture requires full redundancy across multiple tiers.

**Instructions:**

Rewrite the HA-related section inside the `calculateHW()` function (after app servers are built). When `input.haMode === true`, apply ALL of the following rules:

**Rule 1 — Second Active Directory VM**
Add a second VM immediately after `K1-AD-PKI-01`:
```
serverName: "K1-AD-PKI-02"
group: "Infrastructure"
os: "Windows Server 2022"
vCores: 8, ramGB: 8, localDiskGB: 100, storageGB: 0
comments: "Active Directory replica (HA) | C: 100GB OS"
```

**Rule 2 — Dedicated app server per active integration**
For each integration that has channels > 0, add one dedicated Windows Application Server:
- If `input.lprChannels > 0`:
  ```
  serverName: "K1-APP-LPR-01"
  comments: "Dedicated LPR integration server (HA) | C: 100GB OS"
  ```
- If `input.frChannels > 0`:
  ```
  serverName: "K1-APP-FR-01"
  comments: "Dedicated Face Recognition server (HA) | C: 100GB OS"
  ```
- If `input.vaChannels > 0`:
  ```
  serverName: "K1-APP-VA-01"
  comments: "Dedicated Video Analytics server (HA) | C: 100GB OS"
  ```
All three use: `group: "Application"`, `os: "Windows Server 2022"`, `vCores: 16`, `ramGB: 32`, `localDiskGB: 100`, `storageGB: 0`.

**Rule 3 — Dedicated app server for mobile apps**
If `input.hasKShare || input.hasKReact`:
```
serverName: "K1-APP-MOB-01"
group: "Application"
os: "Windows Server 2022"
vCores: 16, ramGB: 32, localDiskGB: 100, storageGB: 0
comments: "Dedicated K-Share/K-React application server (HA) | C: 100GB OS"
```

**Rule 4 — Elasticsearch 3-node cluster**
Replace the single `K1-ELK-01` VM with 3 nodes when `haMode === true`:
- Calculate per-node storage:
  ```ts
  const elkNodeGB = Math.max(200, Math.ceil((esStorageGB * 1.2) / 3));
  ```
- Add VMs named `K1-ELK-01`, `K1-ELK-02`, `K1-ELK-03` each with:
  ```
  group: "Search"
  os: "Ubuntu 24.04"
  vCores: 8, ramGB: 16, localDiskGB: 100
  storageGB: elkNodeGB
  comments: "Elasticsearch node N/3 (HA cluster) | /: 100GB OS, /data SAN"
  ```
- When `haMode === false`, keep the existing single `K1-ELK-01` with `elkDiskGB` as before.

**Rule 5 — Second web server**
Add `K1-WEB-02` as an exact duplicate of `K1-WEB-01`:
```
serverName: "K1-WEB-02"
group: "Web"
os: "Ubuntu 24.04"
vCores: 8, ramGB: 32, localDiskGB: 200, storageGB: 0
comments: "NGINX + MongoDB + BFF — HA replica | /: 200GB (OS + app + MongoDB data)"
```

Also update the HA description text in Step 3 (`src/app/proposal/page.tsx`) from:
```
"Adds an additional app server for failover (+1 VM)"
```
to:
```
"Full HA: dual AD, dedicated integration servers, 3-node Elasticsearch cluster, dual web servers"
```

---

### WI-4 · FEATURE — Editable VM Infrastructure table in Step 5

**File:** `src/app/proposal/page.tsx` — `Step4` component  
**Priority:** Medium  

**Problem:** The VM Infrastructure table in Step 5 ("Pricing Summary") is read-only. Users need to be able to edit cell values, add new rows, and delete rows to customise the infrastructure list for their proposal.

**Instructions:**

1. Convert `Step4` from a pure display component to one that accepts and manages `vmRows` state. Add props:
   ```ts
   function Step4({
     data,
     vmRows,
     setVmRows,
   }: {
     data: ProposalData;
     vmRows: VMSpec[];
     setVmRows: (rows: VMSpec[]) => void;
   })
   ```

2. In the parent `ProposalWizard`, initialise `vmRows` state from `calculateHW(buildHWInput(data)).vmSpecs` whenever the user navigates to Step 5. Use a `useEffect` that watches `step` — only recalculate from the HW engine when `vmRows` is empty or when the user explicitly presses a "Reset to calculated" button.

3. Render each VM table row as editable `<input>` fields for the columns: **Server Name**, **OS**, **vCores**, **RAM (GB)**, **Storage (GB)**, and **Comments**. The **Group** and **Type** columns can remain read-only.

4. Add a **Delete row** button (red ✕) at the end of each row.

5. Add an **"+ Add Row"** button below the table that appends a blank VMSpec row with sensible defaults:
   ```ts
   { group: "Custom", serverName: "", vmPhysical: "VM", amount: 1, os: "Windows Server 2022",
     vCores: 8, ramGB: 16, localDiskGB: 100, storageGB: 0, comments: "" }
   ```

6. Add a **"↺ Reset to calculated"** button above the table (small, secondary style) that resets `vmRows` back to the HW engine output.

7. Pass `vmRows` down to Step 6 (`Step5`) so the exported proposal and PDF/Word export use the user-edited table, not the re-calculated one.

---

### WI-5 · FEATURE — Discount percentage in Step 5 Pricing Summary

**File:** `src/app/proposal/page.tsx` — `Step4` component  
**Priority:** Medium  

**Problem:** There is no way to apply a discount to the proposal total. Sales reps need to be able to enter a discount percentage that recalculates the final prices shown in Step 5 and carries through to the exported proposal.

**Instructions:**

1. Add `discount` (number, 0–100) to `ProposalData` in `src/lib/pricing.ts`:
   ```ts
   discount?: number;   // percentage, e.g. 10 = 10%
   ```
   And set the default in `emptyData`:
   ```ts
   discount: 0,
   ```

2. In `Step4`, add a discount input field above the Grand Total row:
   ```
   Label: "Discount (%)"
   Input: number, min=0, max=100, step=0.5
   ```

3. Calculate discounted totals:
   ```ts
   const discountFactor = 1 - (data.discount ?? 0) / 100;
   const discountedAnnual    = pricing.annualTotal    * discountFactor;
   const discountedPerpetual = pricing.perpetualTotal * discountFactor;
   ```

4. Add a "Discount" row to the pricing table (shown only when discount > 0):
   ```
   Label: "Discount (X%)"   | colour: green
   Annual:     -$X,XXX
   Perpetual:  -$X,XXX
   ```

5. Replace the existing **GRAND TOTAL** row values with the discounted amounts (annual and perpetual) when `discount > 0`. Show the original amount struck-through in a smaller font below.

6. Update the **5-Year Cost Comparison** section to apply the same discount factor to `fiveYearAnnual` and `fiveYearPerpetual`.

7. In `Step5` (the proposal preview), apply the discount to Section 4 — Pricing Summary totals. Show a "Discount applied: X%" note below the grand total row when discount > 0.

---

### WI-6 · FEATURE — Step 6 "Generate Proposal" improvements

**File:** `src/app/proposal/page.tsx` — `Step5` component  
**Priority:** High  

This work item covers four sub-tasks.

---

#### WI-6a — Rename Section 5

**Instruction:** In the `Step5` component, find:
```tsx
<SectionHeading>Section 5 — Next Steps</SectionHeading>
```
Replace with:
```tsx
<SectionHeading>Section 5 — Generative AI Summary</SectionHeading>
```

---

#### WI-6b — Move "Generate AI Summary" button to Section 5

**Instruction:**
1. Remove the `"Generate AI Summary"` button from the top action bar in `Step5` (keep Save to History, Export Word, Export PDF there).
2. Render the button directly above the narrative text block, inside the Section 5 `<section>`:
   ```tsx
   <section>
     <SectionHeading>Section 5 — Generative AI Summary</SectionHeading>
     <div className="flex justify-end mb-3">
       <button onClick={generateNarrative} disabled={generating} ...>
         {generating ? "Generating…" : "✨ Generate AI Summary"}
       </button>
     </div>
     {narrative ? (
       <p className="text-sm text-gray-700 leading-relaxed">{narrative}</p>
     ) : (
       <div className="italic text-gray-400 ...">No summary generated yet.</div>
     )}
   </section>
   ```

---

#### WI-6c — Filter product descriptions to selected products only

**File:** `src/lib/content-extractor.ts`  
**Problem:** Section 2 ("Product Descriptions") currently displays descriptions for both K-Safety and K-Video regardless of the user's selection. Only modules the user actually selected should appear.

**Instruction:**
1. Open `src/lib/content-extractor.ts` and review the `getSelectedProductSections()` function.
2. Ensure the function filters sections strictly by the `selectedProducts` array that is passed in. No section should be included for a product not present in `selectedProducts`.
3. If the function currently maps over a hardcoded list of all products (or all sections), change it to map only over `selectedProducts` and look up each product's section data.
4. Verify: if a user selects only LPR and User Licenses, Section 2 in the preview should show only those two product descriptions — not all K-Safety or K-Video products.

---

#### WI-6d — Currency selector (USD / NIS / MXN)

**Scope:** `src/app/proposal/page.tsx` — `Step5` component  
**Priority:** Medium  

**Instructions:**

1. Add a `currency` state to the `Step5` component (local state, does not need to persist):
   ```ts
   const [currency, setCurrency] = useState<"USD" | "NIS" | "MXN">("USD");
   ```

2. Define exchange rates as constants (hardcoded, not live-fetched for now):
   ```ts
   const EXCHANGE_RATES: Record<string, number> = {
     USD: 1,
     NIS: 3.7,    // 1 USD = 3.7 NIS (approximate)
     MXN: 17.5,   // 1 USD = 17.5 MXN (approximate)
   };
   const CURRENCY_SYMBOLS: Record<string, string> = {
     USD: "$", NIS: "₪", MXN: "MX$",
   };
   ```

3. Add a currency selector control in the top action bar area of Step 6 (right-aligned, next to export buttons):
   ```tsx
   <div className="flex items-center gap-2 text-sm">
     <span className="text-gray-500 text-xs font-semibold">Currency:</span>
     {["USD","NIS","MXN"].map((c) => (
       <button key={c} onClick={() => setCurrency(c as "USD"|"NIS"|"MXN")}
         className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all"
         style={{ borderColor: currency === c ? DARK_BLUE : "#e5e7eb",
                  backgroundColor: currency === c ? DARK_BLUE : "white",
                  color: currency === c ? "white" : "#374151" }}>
         {c}
       </button>
     ))}
   </div>
   ```

4. Create a `fmtCurrency(usdAmount: number): string` helper inside `Step5` that converts and formats:
   ```ts
   const fmtCurrency = (usd: number) => {
     const rate = EXCHANGE_RATES[currency];
     const sym  = CURRENCY_SYMBOLS[currency];
     const converted = Math.round(usd * rate);
     return `${sym}${converted.toLocaleString("en-US")}`;
   };
   ```

5. Replace ALL `fmt(...)` calls inside the `Step5` component's proposal preview (Section 1 investment boxes, Section 4 pricing table, Section 4 5-year comparison) with `fmtCurrency(...)`.

6. Add a small note below the cover/header area of the preview when currency is not USD:
   ```tsx
   {currency !== "USD" && (
     <div className="text-xs text-center text-blue-300 mt-2">
       Prices shown in {currency} (approx. rate: 1 USD = {EXCHANGE_RATES[currency]} {currency})
     </div>
   )}
   ```

7. Note: the currency selection is for display only — prices are always stored and exported in USD. The Word/PDF export should continue to use USD. Add a comment to clarify this.

---

## Testing Checklist

Before marking this sprint as complete, verify the following:

- [ ] Step 1 shows exactly 3 product lines: K-Safety, K-Video, K-Dispatch
- [ ] Proposals created and saved persist in the MongoDB `/proposals` history page after full page reload
- [ ] With HA Mode ON and LPR + Face + K-Share selected: infra table shows dual AD, 3 dedicated app servers, 3 ELK nodes, dual WEB servers
- [ ] ELK node storage = max(200GB, totalMetaTB × 1.2 × 1024 / 3)
- [ ] VM table in Step 5 is editable; rows can be added and deleted; "Reset" restores calculated values
- [ ] Discount of 15% on a $100,000 proposal shows $85,000 as the discounted grand total
- [ ] Step 6 Section 5 is titled "Generative AI Summary"; the button appears aligned with that section
- [ ] Product descriptions in Section 2 match exactly the products the user selected — no extras
- [ ] Switching to NIS shows ₪ symbol with converted amounts; switching back to USD restores original values

---

## About Page Update

Bump version to `1.5.0` and add changelog entry to `src/app/about/page.tsx`:

```ts
const APP_VERSION = "1.5.0";
const RELEASE_DATE = "2026-04-09";
```

New changelog entry (insert at top of CHANGELOG array):
```ts
{
  version: "1.5.0",
  date: "2026-04-09",
  changes: [
    "Removed K-Analytics from product line selector (Step 1)",
    "Fixed: Proposal history now correctly loads from MongoDB Atlas after page reload",
    "HA Mode now generates full redundancy: dual AD, dedicated integration app servers, 3-node Elasticsearch cluster, dual web servers",
    "VM Infrastructure table in Step 5 is now fully editable (edit, add row, delete row, reset to calculated)",
    "Added discount percentage field in Step 5 with live recalculation of totals and 5-year comparison",
    "Step 6: Section 5 renamed to 'Generative AI Summary'; AI button moved to align with Section 5",
    "Step 6: Product descriptions now filtered to show only selected products",
    "Step 6: Added currency selector — USD, NIS (₪), MXN (MX$) with live price conversion",
  ],
},
```
