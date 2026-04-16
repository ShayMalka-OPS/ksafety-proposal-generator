# K-Safety Proposal Generator — Release Notes v1.7.0

**Release Date:** April 16, 2026  
**Prepared by:** Kabatone Product Team (shaym@kabatone.com)

---

## What's New in v1.7.0

### 🐛 Bug Fixes

#### Annual vs Perpetual Pricing — Corrected Flow
- **Pricing model selector moved to Step 1** ("Product Line & Deployment"). Previously it was buried in Step 3, causing confusion about which model applied to the displayed prices.
- **Step 3 product prices** now display in the correct currency (Annual or Perpetual) matching the selection made in Step 1. The label "Unit Price / Year" changes to "Unit Price (Perpetual)" when Perpetual is selected.
- **Step 5 Pricing Summary** now shows a single-model table — either Annual or Perpetual columns, not both. Eliminates the confusing dual-column layout.
- **5-Year Cost Comparison** now shows only the selected model's projection rather than both models side-by-side.
- **Final Proposal Section 4** (Pricing Summary in the exported proposal) now renders only the selected model's pricing.
- **Proposal History dashboard** now shows model-aware columns:
  - "Investment" column shows Annual/yr OR Perpetual one-time based on each proposal's selected model.
  - New "5-Year Total" column calculated per-model (Annual × 5 or Perpetual + 4 yr support).

---

### 🎥 CCTV & Video — Multi-Vendor Support

#### 3rd-Party VMS Integration (Step 3)
Users can now select **one or more VMS vendors** for their CCTV integration. Each vendor gets its own channel count:
- **Supported vendors:** Milestone, HikVision, Genetec, Dahua, ISS (SecureOS), Digivod
- **Other vendor:** Free-text entry with automatic warning: *"Non-standard vendor integrations require additional R&D evaluation and may incur extra costs."*
- Channel pricing remains $100/channel/year regardless of VMS vendor.
- 3rd-party VMS channels do not affect HW sizing (handled externally).

#### K1-Video — Kabatone Native VMS (VXG OEM)
New option alongside 3rd-party CCTV:
- Toggle **K1-Video (VXG Embedded VMS)** in Step 3 under the CCTV section.
- Configure: number of channels, video retention (days), average bitrate per camera (1/2/4 Mbps).
- **HW sizing is fully calculated** using the VXG HW Sizing Guide formulas:
  - On-premises: 7% Kubernetes overhead, physical server count, RAID storage.
  - Cloud: 30% virtualization overhead, AWS EC2 instance sizing, S3 storage.
- Results appear in the final proposal as a separate table: **"K1-Video HW Requirements (VXG Embedded VMS)"** under Section 3 (Infrastructure).

---

### 🔍 LPR — Multi-Vendor Support (Step 3)

- **Supported vendors:** Nerosoft, Milestone
- Multiple vendors can be added; each gets its own channel count.
- Total LPR channels are summed for pricing and HW sizing.
- "Other" vendor triggers the unsupported integration warning.

---

### 👤 Face Recognition — Multi-Vendor Support (Step 3)

- **Supported vendors:** Corsight, SAFR
- Multiple vendors; per-vendor channel counts.
- "Other" vendor triggers the unsupported integration warning.

---

### 🌐 IoT — Sensor Type Breakdown (Step 3)

Users now select individual IoT sensor types instead of a single generic count:
- **Supported types:** AVL – Motorola, AVL – Hytera, Panic Buttons, Access Control, Fire Alarm (Telefire), Traffic Lights (YSB), Smart Light (Tondo), Alarm System (PIMA), Alarm System (RISCO)
- Each type gets its own unit count.
- Total units are summed for pricing ($5/sensor/year) and HW metadata storage sizing.
- "Other" sensor type triggers the unsupported integration warning.

---

### 🔐 Site Security — Authentication

The application is now protected by username/password login:
- **Login page** at `/login` — branded, mobile-friendly.
- All pages (except `/login` and auth API routes) require an active session.
- Sessions are stored as signed HMAC-SHA256 tokens in HttpOnly cookies (7-day expiry).
- **Default admin credentials:** `admin@kabatone.com` / `Admin@2026` (auto-created on first launch).
- Passwords are stored as HMAC-SHA256 hashes in MongoDB (never plain-text).

#### Admin Panel (`/admin`)
- List all users.
- Add new users with Name, Email, Password, and Role (admin / user).
- Delete users (with self-deletion protection).
- Accessible to admin-role users only.

---

### 🎨 Proposal Preview Redesign

The final proposal preview (Step 6) has been redesigned to match the `ProposalTemplate_EN.html` style:
- **Gradient hero cover** (dark blue → mid blue) matching the Kabatone brand template.
- **Integration chips** — shows each configured vendor (VMS, LPR, Face, IoT) as badge chips.
- **Feature cards** in a 3-column grid for product descriptions.
- **Accent color** changed to `#29ABE2` (Kabatone accent blue) for section borders.
- **K1-Video HW table** — when K1-Video is enabled, a second infrastructure table appears below the K-Safety VM table.

---

## Technical Notes

- **New fields on `ProposalData`:** `cctvVendors`, `k1VideoEnabled`, `k1VideoChannels`, `k1VideoRetentionDays`, `k1VideoBitrateMbps`, `lprVendors`, `faceVendors`, `iotVendors`. Old proposals without these fields will default to empty arrays / disabled.
- **New library:** `calculateK1VideoHW()` in `src/lib/hw-calculator.ts` implements the full VXG sizing algorithm (on-prem and cloud paths).
- **New auth library:** `src/lib/auth.ts` — HMAC-SHA256 hashing and session token creation/verification.
- **Middleware:** `src/middleware.ts` protects all routes; public paths are `/login`, `/api/auth/*`, `/favicon.ico`, `/_next/*`.
- **MongoDB `users` collection** added alongside existing `proposals` collection.
- **31 new test cases** in `src/__tests__/v170-features.test.ts` covering vendors, K1-Video HW calculator, pricing model regression.

---

## How to Test Locally

```bash
cd ksafety-proposal-generator
npm run dev
# Open http://localhost:3000
# Login with admin@kabatone.com / Admin@2026

# Run tests
npm test -- --testPathPattern=v170-features
```

---

## Sharing This Release

This document can be shared directly with users as release notes. Key highlights to communicate:
1. **Pricing bug fixed** — Annual vs Perpetual now consistent across all steps.
2. **CCTV now supports multi-vendor** — Milestone, HikVision, Genetec, Dahua, ISS, Digivod + Other.
3. **K1-Video is now in the wizard** — native VXG VMS with full HW sizing.
4. **LPR, Face, IoT** now have vendor selection with channel/unit breakdowns.
5. **Login required** — site is now secured with username/password.
6. **Admin panel** — manage users at `/admin`.

---

*Kabatone Ltd. · www.kabatone.com · shaym@kabatone.com*
