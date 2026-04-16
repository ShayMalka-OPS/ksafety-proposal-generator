"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

const DARK_BLUE = "#1A3A5C";
const GOLD = "#F0A500";

function LoginForm() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Hard redirect so the middleware picks up the new session cookie
      window.location.href = fromParam;
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: DARK_BLUE }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/kabatone-logo.png"
            alt="Kabatone"
            width={200}
            height={50}
            style={{ height: "50px", width: "auto" }}
            priority
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: DARK_BLUE }}>
            K-Safety Proposals
          </h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Sign in to your account
          </p>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#DC2626" }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: DARK_BLUE }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kabatone.com"
                required
                className="w-full mt-2 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "#E5E7EB" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = GOLD;
                  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(240, 165, 0, 0.1)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: DARK_BLUE }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full mt-2 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "#E5E7EB" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = GOLD;
                  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(240, 165, 0, 0.1)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: GOLD }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>


        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          © {new Date().getFullYear()} Kabatone Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
