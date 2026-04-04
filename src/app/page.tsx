import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header style={{ backgroundColor: "#1A3A5C" }} className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg"
            style={{ backgroundColor: "#F0A500" }}
          >
            K
          </div>
          <div>
            <div className="text-white font-bold text-xl tracking-wide">KABATONE</div>
            <div className="text-xs tracking-widest" style={{ color: "#F0A500" }}>
              SMART CITY SOLUTIONS
            </div>
          </div>
        </div>
        <nav className="flex gap-6 text-sm text-blue-200">
          <span className="text-white font-medium">Proposal Generator</span>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section
          className="py-24 px-8 text-center text-white"
          style={{ background: "linear-gradient(135deg, #1A3A5C 0%, #1E6BA8 100%)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="inline-block text-sm font-semibold px-4 py-1 rounded-full mb-6 tracking-wider"
              style={{ backgroundColor: "rgba(240,165,0,0.2)", color: "#F0A500", border: "1px solid rgba(240,165,0,0.4)" }}
            >
              K-SAFETY PLATFORM
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              K-Safety Proposal
              <br />
              <span style={{ color: "#F0A500" }}>Generator</span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Create professional, AI-powered proposals for the K-Safety smart city
              platform in minutes. Tailored pricing, infrastructure sizing, and
              executive summaries — all in one place.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/proposal"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all hover:opacity-90 hover:scale-105"
                style={{ backgroundColor: "#F0A500", color: "#1A3A5C" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Proposal
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg border border-white/30 text-white hover:bg-white/10 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 px-8 bg-white border-b">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "5 Steps", label: "Simple Wizard" },
              { value: "AI", label: "Claude-Powered" },
              { value: "PDF + Word", label: "Export Formats" },
              { value: "Live", label: "Price Calculator" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold" style={{ color: "#1A3A5C" }}>{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "#1A3A5C" }}>
              Everything Your Sales Team Needs
            </h2>
            <p className="text-center text-gray-500 mb-14">
              From customer details to export-ready proposals in minutes.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🏙️",
                  title: "Smart Product Selection",
                  desc: "Choose from CCTV, LPR, Face Recognition, Video Analytics, IoT Sensors, K-Share, K-React and more. Quantities and channels auto-calculate pricing.",
                },
                {
                  icon: "💰",
                  title: "Instant Pricing",
                  desc: "Annual vs. perpetual comparison, 5-year TCO analysis, and HW infrastructure sizing — all calculated live as you configure.",
                },
                {
                  icon: "🤖",
                  title: "AI Executive Summary",
                  desc: "Claude generates a professional, customer-specific narrative for each proposal. Tailored to the city, use case, and selected products.",
                },
                {
                  icon: "📄",
                  title: "PDF Export",
                  desc: "Branded PDF proposal with cover page, product descriptions, pricing tables, and infrastructure requirements — ready to send.",
                },
                {
                  icon: "📝",
                  title: "Word Export",
                  desc: "Editable .docx file so your team can make final tweaks before sending to the customer.",
                },
                {
                  icon: "🔧",
                  title: "HW Sizing Included",
                  desc: "Automatically calculates server count, DMZ requirements, SQL, Elasticsearch, and NGINX setup based on your configuration.",
                },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: "#1A3A5C" }}>{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-8 text-center" style={{ backgroundColor: "#1A3A5C" }}>
          <h2 className="text-3xl font-bold text-white mb-4">Ready to create your first proposal?</h2>
          <p className="text-blue-200 mb-8">Takes less than 5 minutes.</p>
          <Link
            href="/proposal"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#F0A500", color: "#1A3A5C" }}
          >
            Get Started →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-sm text-gray-400 border-t">
        © {new Date().getFullYear()} Kabatone Ltd. All rights reserved. · K-Safety Smart City Platform
      </footer>
    </div>
  );
}
