import Link from "next/link";
import Image from "next/image";

const DARK_BLUE = "#1A3A5C";
const GOLD      = "#F0A500";
const MID_BLUE  = "#1E6BA8";

const APP_VERSION = "1.3.0";
const RELEASE_DATE = "2026-04-08";

const CHANGELOG = [
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(240,165,0,0.12)" }}>
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
