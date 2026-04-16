import Link from "next/link";
import Image from "next/image";

const DARK_BLUE = "#1A3A5C";
const GOLD      = "#FFFFFF";
const MID_BLUE  = "#1E6BA8";

const APP_VERSION = "2.0.0";
const RELEASE_DATE = "2026-04-16";

const CHANGELOG = [
  {
    version: "2.0.0",
    date: "2026-04-16",
    changes: [
      // New Features
      "Feature: Proposal preview (Step 6) completely redesigned to match Kabatone's official template — gradient hero with sector pills, product overview & investment callout, core capability cards, use-case cards, integration chips, category-row pricing table, business model box, HW infrastructure, Why section, AI summary, and CTA footer",
      "Feature: PDF and Word exports fully rewritten to match the new Step 6 layout — what you see in the browser is now exactly what appears in the exported document",
      "Feature: Export now carries user-edited VM rows from Step 5 so any manual server spec changes are reflected in every exported document",
      "Feature: Admin panel — Change Password for any user; administrators can now reset passwords for both Admin and User accounts directly from the user management table",
      "Feature: Customer Information — Sales Person (Prepared by) field is now auto-filled with the name of the logged-in user; field remains editable",
      // Improvements
      "Improvement: Core Capabilities grid in Step 6 now shows a fixed, standardised set of 11 capabilities in every proposal (Unified Video Management, Video Analytics AI, Face & LPR, Smart Event Management, GIS / Live Map, BI & Reports, Panic Buttons / IoT, Shift & Force Management, Task Management, Sensors Dashboard, BPM / Rules Engine)",
      "Improvement: HW Infrastructure table in Step 6 restyled to match the K1-Video VXG table format — Service / Instances / vCPU / RAM GB / HDD GB with a bold totals row",
      "Improvement: Use Case card titles (Airports, Oil & Gas Facilities, Critical Infrastructure, etc.) now render in explicit white text on dark-gradient cards",
      // Bug Fixes
      "Fix: Admin panel was inaccessible — added conditional Admin link to the top navigation bar (visible to Admin role only)",
      "Fix: Vendor dropdown always showed the first vendor name due to a React stale state bug — fixed by combining field updates into a single atomic state change",
      "Fix: K1-Video enable toggle overlapped the label text due to an invalid Tailwind class (ml-13) — replaced with valid spacing classes",
      "Fix: Editing a unit price in Perpetual mode produced wrong values on every keystroke — changed to text input with local state; annual equivalent is computed on blur only",
      "Fix: VXG K1-Video HW sizing table did not appear on the proposal summary even when K1-Video was enabled — fixed render condition in both Step 4 and Step 6",
      // Security
      "Security: Removed hardcoded Default Credentials box from the login page — users must contact an administrator to obtain login details",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-04-16",
    changes: [
      "Feature: Pricing model (Annual / Perpetual) selector moved to Step 1 — set once, reflected everywhere",
      "Fix: Step 3 product prices now shown in the correct currency (Annual or Perpetual) based on Step 1 selection",
      "Fix: Step 5 Pricing Summary shows only the selected model — no more dual Annual + Perpetual columns",
      "Fix: 5-Year Cost Comparison now shows only the selected model's projection",
      "Fix: Final proposal Section 4 pricing table shows only the selected model",
      "Fix: History dashboard now shows Investment column (annual/yr or perpetual one-time) and 5-Year Total, both based on each proposal's model",
      "Feature: CCTV Step 3 — multi-vendor VMS selector (Milestone, HikVision, Genetec, Dahua, ISS, Digivod, Other)",
      "Feature: CCTV Step 3 — K1-Video (VXG OEM embedded VMS) option with channels, retention, and bitrate",
      "Feature: K1-Video HW sizing table in proposal Section 3 (separate from K-Safety VMs)",
      "Feature: LPR Step 3 — multi-vendor selector (Nerosoft, Milestone, Other) with channels per vendor",
      "Feature: Face Recognition Step 3 — multi-vendor selector (Corsight, SAFR, Other)",
      "Feature: IoT Step 3 — sensor-type selector (AVL Motorola/Hytera, Panic Buttons, Access Control, Fire Alarm, Traffic Lights, Smart Light, Alarm Systems, Other)",
      "Feature: Unsupported-vendor warning shown when 'Other' is selected for any integration",
      "Feature: Site authentication — login page with username/password stored in MongoDB",
      "Feature: Admin panel for user management (add/delete users, set roles)",
      "Feature: Step 6 proposal preview redesigned to match ProposalTemplate_EN.html style (gradient hero, accent chips, feature cards)",
      "Feature: Vendor integration chips shown in final proposal (shows which VMS/LPR/FR/IoT vendors were configured)",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-04-10",
    changes: [
      "Fixed: Product line cards now show a clear blue selected state — matching the Deployment Model cards",
      "Fixed: K-Analytics product line fully removed from live site (forced clean Vercel rebuild)",
      "Fixed: Proposal history now reliably loads from MongoDB after browser close and reopen",
      "Fixed: HA Mode toggle is now blue when active and no longer overlaps its label text",
      "Fixed: 'You save' savings amount in 5-year comparison is now visible in blue",
      "Fixed: Final proposal now shows only the pricing model the user selected (Annual OR Perpetual, not both)",
      "Fixed: Product checkbox in Step 3 stays visible after selection so users can deselect",
      "Fixed: AI summary now renders with section headings and bullet points — much easier to read",
      "Feature: HA Mode generates full redundancy architecture (dual AD, dedicated integration servers, 3-node Elasticsearch, dual web)",
      "Feature: VM Infrastructure table in Step 5 is fully editable (edit specs, add/delete rows, reset)",
      "Feature: Discount percentage field in Step 5 with live recalculation and strikethrough",
      "Feature: Step 6 Section 5 renamed to 'Generative AI Summary'; button repositioned to align with it",
      "Feature: Product descriptions in Section 2 filtered to selected products only",
      "Feature: Currency selector in Step 6 — USD, NIS (₪), MXN (MX$) with live conversion",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-09",
    changes: [
      "Removed K-Analytics from product line selector (Step 1) — now shows K-Safety, K-Video, K-Dispatch only",
      "Fixed: Proposal history now correctly loads from MongoDB Atlas after page reload (projection API fix)",
      "HA Mode now generates full redundancy architecture: dual AD servers, dedicated app servers per integration (LPR/FR/VA), 3-node Elasticsearch cluster, dual web servers",
      "VM Infrastructure table in Step 5 is now fully editable — edit specs, add custom rows, delete rows, reset to calculated",
      "Added discount percentage field in Step 5 with live recalculation of grand total and 5-year cost comparison",
      "Step 6: Section 5 renamed from 'Next Steps' to 'Generative AI Summary'",
      "Step 6: 'Generate AI Summary' button moved from top toolbar to align with Section 5",
      "Step 6: Product descriptions in Section 2 now filtered to show only user-selected products",
      "Step 6: Added currency selector (USD / NIS ₪ / MXN MX$) with live price conversion",
      "MongoDB Atlas integration: persistent proposal storage replaces ephemeral JSON file",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-09",
    changes: [
      "Updated brand accent color from Gold (#F0A500) to White (#FFFFFF) across all pages",
      "Home page hero heading 'K-Safety Proposal Generator' now renders in full white bold",
      "Removed 'Generate AI Summary' placeholder hint text from Step 6 of the proposal wizard",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04-08",
    changes: [
      "Added product line selector (K-Safety, K-Video, K-Dispatch, K-Analytics) at start of wizard",
      "Added Cloud vs On-Prem deployment question — affects infrastructure language in proposals",
      "Replaced window.print() with puppeteer-rendered PDF export (dedicated print template)",
      "Added Zabbix monitoring VM (K1-MON-01) as standard HW line item",
      "Added object storage tiered logic: <1TB on SQL server; ≥1TB = dedicated appliance",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-08",
    changes: [
      "Fixed: Generate AI Summary — added 60s timeout and ANTHROPIC_API_KEY validation",
      "Fixed: Annual vs Perpetual 'Save X' badge is now conditional (only shown when cheaper)",
      "Fixed: Removed CCTV from HW/storage calculator — video handled by 3rd-party VMS",
      "Fixed: DMZ server OS changed to Windows Server 2022 STD (was Ubuntu 24.04)",
      "Fixed: Added 100GB C: drive OS disk to all Windows Server 2022 VMs",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-05",
    changes: [
      "Added proposal history dashboard with CRUD actions",
      "Added dynamic price calculation with 5-year cost comparison",
      "Added navigation bar",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-29",
    changes: [
      "Initial release — 5-step proposal wizard",
      "AI-powered executive summary via Claude Sonnet 4.6",
      "Live pricing calculator (annual vs perpetual)",
      "HW infrastructure sizing engine",
      "Word (.docx) export",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="py-16 px-8 text-white text-center" style={{ background: `linear-gradient(135deg, ${DARK_BLUE} 0%, ${MID_BLUE} 100%)` }}>
        <div className="inline-block mb-4">
          <Image src="/images/kabatone-logo.png" alt="Kabatone" width={56} height={56} style={{ height: "56px", width: "auto", borderRadius: "12px" }} priority />
        </div>
        <h1 className="text-3xl font-bold mt-2">K-Safety Proposal Generator</h1>
        <p className="text-blue-200 mt-2 text-sm">by Kabatone Ltd.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: GOLD, color: DARK_BLUE }}>
            v{APP_VERSION}
          </span>
          <span className="text-xs text-blue-300">Released {RELEASE_DATE}</span>
        </div>
      </section>

      <div className="max-w-3xl mx-auto py-12 px-6 space-y-10">

        {/* Version info */}
        <section className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: DARK_BLUE }}>Current Version</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Version</div>
              <div className="font-bold text-xl mt-1" style={{ color: DARK_BLUE }}>v{APP_VERSION}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Release Date</div>
              <div className="font-bold text-xl mt-1" style={{ color: MID_BLUE }}>{RELEASE_DATE}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">AI Model</div>
              <div className="font-semibold mt-1">Claude Sonnet 4.6</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Framework</div>
              <div className="font-semibold mt-1">Next.js 14 + TypeScript</div>
            </div>
          </div>
        </section>

        {/* Changelog */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: DARK_BLUE }}>Changelog</h2>
          <div className="space-y-4">
            {CHANGELOG.map((entry, i) => (
              <div key={entry.version} className="bg-white rounded-[8px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={i === 0
                      ? { backgroundColor: GOLD, color: DARK_BLUE }
                      : { backgroundColor: "rgba(26,58,92,0.08)", color: DARK_BLUE }}
                  >
                    v{entry.version}
                  </span>
                  {i === 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-green-700 bg-green-100 border border-green-200">
                      Latest
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{entry.date}</span>
                </div>
                <ul className="px-6 py-4 space-y-2">
                  {entry.changes.map((change, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span style={{ color: GOLD }} className="mt-0.5 flex-shrink-0">▸</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: DARK_BLUE }}>Contact & Support</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                <span>✉️</span>
              </div>
              <div>
                <div className="font-semibold" style={{ color: DARK_BLUE }}>Product Manager</div>
                <a href="mailto:shaym@kabatone.com" className="hover:underline" style={{ color: MID_BLUE }}>shaym@kabatone.com</a>
                <div className="text-xs text-gray-400 mt-0.5">For feature requests, bug reports, and pricing updates</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(30,107,168,0.12)" }}>
                <span>🌐</span>
              </div>
              <div>
                <div className="font-semibold" style={{ color: DARK_BLUE }}>Website</div>
                <span style={{ color: MID_BLUE }}>www.kabatone.com</span>
                <div className="text-xs text-gray-400 mt-0.5">Official Kabatone Ltd. product site</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(26,58,92,0.08)" }}>
                <span>💻</span>
              </div>
              <div>
                <div className="font-semibold" style={{ color: DARK_BLUE }}>GitHub Repository</div>
                <a
                  href="https://github.com/ShayMalka-OPS/ksafety-proposal-generator"
                  target="_blank" rel="noopener noreferrer"
                  className="hover:underline" style={{ color: MID_BLUE }}
                >
                  ShayMalka-OPS/ksafety-proposal-generator
                </a>
                <div className="text-xs text-gray-400 mt-0.5">Source code and issue tracker</div>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:bg-blue-50"
            style={{ border: "2px solid #1A3A5C", color: DARK_BLUE }}
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
