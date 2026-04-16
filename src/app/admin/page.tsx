"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DARK_BLUE = "#1A3A5C";
const GOLD = "#F0A500";
const MID_BLUE = "#1E6BA8";

// shared input style helpers
const inputBase = "w-full mt-1 px-4 py-2 border rounded-lg text-sm focus:outline-none";
const inputStyle = { borderColor: "#E5E7EB" };
const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = GOLD;
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(240, 165, 0, 0.1)";
};
const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "#E5E7EB";
  e.currentTarget.style.boxShadow = "none";
};

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "user" as "admin" | "user",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Change password modal
  const [pwUser, setPwUser] = useState<User | null>(null);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        const me = await meRes.json();
        setCurrentUser(me);
        if (me.role !== "admin") { router.push("/"); return; }

        const usersRes = await fetch("/api/admin/users");
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // ── Add user ─────────────────────────────────────────────────────────────
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to create user");
        return;
      }
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      setFormData({ name: "", email: "", password: "", role: "user" });
      setShowAddModal(false);
    } catch {
      setFormError("An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    if (currentUser?.id === userId) { alert("You cannot delete your own account"); return; }
    setDeleting(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setDeleting(null);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const openPwModal = (user: User) => {
    setPwUser(user);
    setPwNew(""); setPwConfirm(""); setPwError(""); setPwSuccess(false);
  };

  const closePwModal = () => { setPwUser(null); setPwNew(""); setPwConfirm(""); setPwError(""); setPwSuccess(false); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pwNew.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match"); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${pwUser!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: pwNew }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPwError(data.error || "Failed to update password");
        return;
      }
      setPwSuccess(true);
      setTimeout(() => closePwModal(), 1500);
    } catch {
      setPwError("An error occurred");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>;
  if (!currentUser || currentUser.role !== "admin") return <div className="min-h-screen flex items-center justify-center"><div className="text-red-600">Access denied. Admin only.</div></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-sm mb-2 inline-flex items-center gap-1 hover:underline" style={{ color: MID_BLUE }}>
              ← Back to App
            </Link>
            <h1 className="text-3xl font-bold" style={{ color: DARK_BLUE }}>User Management</h1>
            <p className="text-gray-600 mt-2">Manage K-Safety Proposal users</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: GOLD }}
          >
            + Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#F3F4F6" }}>
                <tr>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: DARK_BLUE }}>Name</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: DARK_BLUE }}>Email</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: DARK_BLUE }}>Role</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: DARK_BLUE }}>Created</th>
                  <th className="px-6 py-4 text-right font-semibold" style={{ color: DARK_BLUE }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium" style={{ color: DARK_BLUE }}>{user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: user.role === "admin" ? "rgba(240, 165, 0, 0.1)" : "rgba(30, 107, 168, 0.1)",
                            color: user.role === "admin" ? GOLD : MID_BLUE,
                          }}
                        >
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {/* Change Password — available for all users, callable by admin */}
                          <button
                            onClick={() => openPwModal(user)}
                            className="text-xs font-semibold px-3 py-1 rounded transition-all hover:opacity-80"
                            style={{ backgroundColor: "rgba(30,107,168,0.1)", color: MID_BLUE }}
                          >
                            🔑 Change Password
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleting === user.id || currentUser.id === user.id}
                            className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                          >
                            {deleting === user.id ? "Deleting..." : currentUser.id === user.id ? "You" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: DARK_BLUE }}>Add New User</h2>

            {formError && (
              <div className="mb-4 p-4 rounded-lg text-sm font-medium" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#DC2626" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium" style={{ color: DARK_BLUE }}>Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe" required className={inputBase} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: DARK_BLUE }}>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com" required className={inputBase} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: DARK_BLUE }}>Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••" required className={inputBase} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: DARK_BLUE }}>Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "user" })}
                  className={inputBase} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: GOLD }}>
                  {formLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {pwUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-1" style={{ color: DARK_BLUE }}>Change Password</h2>
            <p className="text-sm text-gray-500 mb-5">
              Updating password for <span className="font-semibold" style={{ color: MID_BLUE }}>{pwUser.name}</span>
            </p>

            {pwSuccess ? (
              <div className="py-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-semibold text-green-600">Password updated successfully</p>
              </div>
            ) : (
              <>
                {pwError && (
                  <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#DC2626" }}>
                    {pwError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium" style={{ color: DARK_BLUE }}>New Password</label>
                    <input
                      type="password"
                      value={pwNew}
                      onChange={(e) => setPwNew(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoFocus
                      className={inputBase}
                      style={inputStyle}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                    />
                    <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: DARK_BLUE }}>Confirm Password</label>
                    <input
                      type="password"
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={inputBase}
                      style={inputStyle}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closePwModal}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={pwLoading}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: MID_BLUE }}>
                      {pwLoading ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
