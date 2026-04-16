"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DARK_BLUE = "#1A3A5C";
const GOLD      = "#FFFFFF";

interface NavLink { href: string; label: string; exact?: boolean; }
interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

const LINKS: NavLink[] = [
  { href: "/proposals", label: "📋 History" },
  { href: "/proposal",  label: "➕ New Proposal" },
  { href: "/about",     label: "ℹ️ About", exact: true },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {
        // User not authenticated or error
      });
  }, []);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoadingLogout(false);
    }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header
      style={{ backgroundColor: DARK_BLUE, height: "64px" }}
      className="px-6 flex items-center justify-between shadow-sm"
    >
      {/* Logo — real Kabatone logo */}
      <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
        <Image
          src="/images/kabatone-logo.png"
          alt="Kabatone"
          height={40}
          width={160}
          style={{ height: "40px", width: "auto", borderRadius: "4px" }}
          priority
        />
        <div className="hidden sm:block">
          <div className="text-white font-bold tracking-wide leading-none text-sm">KABATONE</div>
          <div className="text-xs tracking-widest leading-none mt-0.5" style={{ color: GOLD }}>
            SMART CITY SOLUTIONS
          </div>
        </div>
      </Link>

      {/* Nav links — active = gold underline (per brand spec) */}
      <nav className="flex items-center gap-1">
        <span className="text-sm mr-3 hidden lg:block" style={{ color: "rgba(255,255,255,0.55)" }}>K-Safety Proposals</span>
        {LINKS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 text-sm font-medium transition-all relative"
              style={{ color: active ? GOLD : "rgba(255,255,255,0.80)" }}
            >
              {label}
              {/* Gold underline for active state */}
              {active && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: GOLD }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User menu — right side */}
      {user && (
        <div className="flex items-center gap-3 ml-auto">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="px-3 py-1.5 text-xs font-semibold rounded transition-all hover:opacity-80"
              style={{ backgroundColor: "rgba(240,165,0,0.2)", color: "#F0A500", border: "1px solid rgba(240,165,0,0.4)" }}
            >
              ⚙️ Admin
            </Link>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-xs text-blue-100">{user.name}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              {user.role === "admin" ? "Admin" : "User"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loadingLogout}
            className="px-4 py-2 text-sm font-medium rounded transition-all hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: GOLD }}
          >
            {loadingLogout ? "..." : "Sign Out"}
          </button>
        </div>
      )}
    </header>
  );
}
