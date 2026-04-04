"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DARK_BLUE = "#1A3A5C";
const GOLD      = "#F0A500";

interface NavLink { href: string; label: string; exact?: boolean; }

const LINKS: NavLink[] = [
  { href: "/proposals", label: "📋 History" },
  { href: "/proposal",  label: "➕ New Proposal" },
];

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header style={{ backgroundColor: DARK_BLUE }} className="px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-lg text-white transition-transform group-hover:scale-105"
          style={{ backgroundColor: GOLD }}
        >
          K
        </div>
        <div>
          <div className="text-white font-bold tracking-wide leading-none">KABATONE</div>
          <div className="text-xs tracking-widest leading-none mt-0.5" style={{ color: GOLD }}>
            SMART CITY SOLUTIONS
          </div>
        </div>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        <span className="text-blue-300 text-sm mr-3 hidden md:block">K-Safety Proposals</span>
        {LINKS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={
                active
                  ? { backgroundColor: GOLD, color: DARK_BLUE }
                  : { color: "rgba(255,255,255,0.75)" }
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
