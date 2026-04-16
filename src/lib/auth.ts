import { createHmac } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "ksafety-dev-secret-2026";

export function hashPassword(password: string): string {
  return createHmac("sha256", SESSION_SECRET).update(password).digest("hex");
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length < 3) return null;
    const sig = parts.pop()!;
    const payload = parts.join(":");
    const expected = createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("hex");
    if (sig !== expected) return null;
    const userId = parts[0];
    return userId;
  } catch {
    return null;
  }
}
