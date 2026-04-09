"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavLink { href: string; label: string; exact?: boolean; }

const LINKS: NavLink[] = [
  { href: "/proposals", label: "History" },
  { href: "/proposal",  label: "New Proposal" },
  { href: "/about",     label: "About", exact: true },
];

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header
      style={{
        backgroundColor: "#1A3A5C",
        height: "60px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
      className="px-6 flex items-center justify-between"
    >
      {/* Logo + brand name */}
      <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
        <Image
          src="/images/kabatone-logo.png"
          alt="Kabatone"
          height={36}
          width={144}
          style={{ height: "36px", width: "auto", borderRadius: "3px" }}
          priority
        />
        <div className="hidden sm:block" style={{ lineHeight: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              color: "#FFFFFF",
              textTransform: "uppercase",
            }}
          >
            Kabatone
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: "0.625rem",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
              marginTop: "3px",
            }}
          >
            Smart City Solutions
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center" style={{ gap: "var(--space-1)" }}>
        {/* App context label */}
        <span
          className="hidden lg:block mr-4"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.05em",
          }}
        >
          K-Safety Proposals
        </span>

        {LINKS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: active ? 600 : 400,
                color: active ? "#FFFFFF" : "rgba(255,255,255,0.60)",
                padding: "0.5rem 0.875rem",
                borderRadius: "4px",
                transition: "color 0.15s ease, background-color 0.15s ease",
                backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                position: "relative",
              }}
              className="hover:text-white hover:bg-white/5"
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
