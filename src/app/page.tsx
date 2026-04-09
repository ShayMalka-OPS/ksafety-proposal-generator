import Link from "next/link";

const CAPABILITIES = [
  {
    num: "01",
    title: "Product Configuration",
    desc: "Select from the full K-Safety module suite — CCTV, LPR, Face Recognition, Video Analytics, IoT Sensors, K-Share, K-React — with per-channel and per-unit quantities.",
  },
  {
    num: "02",
    title: "Live Pricing Engine",
    desc: "Annual vs. perpetual comparison, 5-year TCO analysis, and per-module breakdowns calculated instantly. Edit any line item before export.",
  },
  {
    num: "03",
    title: "AI Executive Summary",
    desc: "Claude generates a customer-specific narrative tailored to the city, deployment type, and selected product configuration. No template text.",
  },
  {
    num: "04",
    title: "HW Infrastructure Sizing",
    desc: "Server count, DMZ requirements, SQL Server, Elasticsearch, and NGINX configuration computed automatically from channel counts and product selection.",
  },
  {
    num: "05",
    title: "PDF & Word Export",
    desc: "Branded PDF with cover page, product descriptions, pricing tables, and infrastructure spec — ready to send. Word export for final edits.",
  },
  {
    num: "06",
    title: "Proposal History",
    desc: "All proposals saved with status tracking (Draft, Sent, Won, Lost), pipeline value dashboard, and one-click re-open for revisions.",
  },
];

const WORKFLOW = [
  "Customer & project details",
  "Deployment type — cloud or on-prem",
  "Product & channel quantity selection",
  "Pricing review with live adjustments",
  "AI executive summary generation",
  "Export to PDF or Word document",
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      <main style={{ flex: 1 }}>

        {/* ── Product header ────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "#1A3A5C" }}>
          <div style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "clamp(2.5rem, 5vw, 4rem) var(--space-8)",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "var(--space-8)",
            flexWrap: "wrap",
          }}>
            <div style={{ maxWidth: "640px" }}>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "var(--space-3)",
              }}>
                Kabatone · Smart City Platform
              </p>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.875rem, 4.5vw, 3.25rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                lineHeight: 1.05,
                marginBottom: "var(--space-4)",
              }}>
                K-Safety Proposal Generator
              </h1>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-md)",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.7,
                maxWidth: "54ch",
              }}>
                Configure products, calculate pricing, and generate export-ready
                proposals for city and government clients — in a single structured workflow.
              </p>
            </div>

            <Link href="/proposal" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              backgroundColor: "#1E6BA8",
              color: "#FFFFFF",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "var(--text-base)",
              letterSpacing: "0.02em",
              padding: "0.75rem 1.75rem",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "filter 0.15s ease",
            }}
            className="hover:brightness-110"
            >
              New Proposal
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 7.5h10M8.5 3.5l4 4-4 4"/>
              </svg>
            </Link>
          </div>
        </section>

        {/* ── Rule ─────────────────────────────────────────────────────────── */}
        <div style={{ height: "1px", backgroundColor: "var(--color-border)" }} />

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--color-surface)" }}>
          <div style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "var(--space-12) var(--space-8)",
            display: "flex",
            flexDirection: "row",
            gap: "clamp(2rem, 6vw, 5rem)",
            flexWrap: "wrap",
          }}>

            {/* ── Capabilities ─────────────────────────────────────────────── */}
            <div style={{ flex: "1 1 420px" }}>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#1E6BA8",
                marginBottom: "var(--space-6)",
              }}>
                Capabilities
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
                {CAPABILITIES.map((cap) => (
                  <div key={cap.num} style={{ display: "flex", gap: "var(--space-4)" }}>
                    <span style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 800,
                      color: "#1E6BA8",
                      letterSpacing: "0.04em",
                      minWidth: "1.75rem",
                      paddingTop: "0.15rem",
                      flexShrink: 0,
                    }}>
                      {cap.num}
                    </span>
                    <div>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 700,
                        color: "#1A3A5C",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        marginBottom: "0.3rem",
                      }}>
                        {cap.title}
                      </h3>
                      <p style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.7,
                        maxWidth: "52ch",
                      }}>
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Workflow ──────────────────────────────────────────────────── */}
            <div style={{ flex: "0 1 260px", minWidth: "220px" }}>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#1E6BA8",
                marginBottom: "var(--space-6)",
              }}>
                Workflow
              </p>

              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {WORKFLOW.map((step, i) => (
                  <li key={i} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "var(--space-3)",
                    paddingBottom: i < WORKFLOW.length - 1 ? "var(--space-5)" : 0,
                    position: "relative",
                  }}>
                    {/* Connector line */}
                    {i < WORKFLOW.length - 1 && (
                      <div style={{
                        position: "absolute",
                        left: "0.9375rem",
                        top: "1.875rem",
                        bottom: 0,
                        width: "1px",
                        backgroundColor: "var(--color-border)",
                      }} />
                    )}
                    {/* Step indicator */}
                    <div style={{
                      width: "1.875rem",
                      height: "1.875rem",
                      borderRadius: "50%",
                      backgroundColor: "#1A3A5C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                      zIndex: 1,
                    }}>
                      <span style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-2xs)",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        letterSpacing: "0.02em",
                      }}>
                        {i + 1}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text)",
                      lineHeight: "1.875rem",
                    }}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              {/* CTA panel */}
              <div style={{
                marginTop: "var(--space-8)",
                paddingTop: "var(--space-6)",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}>
                <Link href="/proposal" style={{
                  display: "block",
                  textAlign: "center",
                  backgroundColor: "#1E6BA8",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  letterSpacing: "0.02em",
                  padding: "0.6875rem 1.25rem",
                  borderRadius: "4px",
                  transition: "filter 0.15s ease",
                }}
                className="hover:brightness-110"
                >
                  Start a Proposal
                </Link>
                <Link href="/proposals" style={{
                  display: "block",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "4px",
                  transition: "color 0.15s ease",
                }}
                className="hover:text-[#1A3A5C]"
                >
                  View Proposal History
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ── Footer strip ─────────────────────────────────────────────────── */}
        <footer style={{
          backgroundColor: "#1A3A5C",
          padding: "var(--space-4) var(--space-8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)",
        }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.04em",
          }}>
            © {new Date().getFullYear()} Kabatone Ltd. · K-Safety Smart City Platform
          </p>
          <div style={{ display: "flex", gap: "var(--space-6)" }}>
            {[
              { href: "/proposals", label: "History" },
              { href: "/about",     label: "About" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.04em",
                transition: "color 0.15s ease",
              }}
              className="hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </footer>

      </main>
    </div>
  );
}
