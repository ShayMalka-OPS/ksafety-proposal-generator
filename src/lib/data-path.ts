import { join } from "path";

/**
 * Returns the proposals data file path.
 * On Vercel the project filesystem is read-only — use /tmp (writable, ephemeral per instance).
 * In local dev, write to src/data/proposals.json so data persists across restarts.
 */
export function getDataPath(): string {
  return process.env.VERCEL
    ? "/tmp/proposals.json"
    : join(process.cwd(), "src", "data", "proposals.json");
}
