import { MongoClient, Collection, ObjectId } from "mongodb";
import type { SavedProposal } from "@/app/api/proposals/route";

const DB_NAME   = "ksafety";
const COLLECTION = "proposals";

// ─── Connection caching ────────────────────────────────────────────────────────
// IMPORTANT: MONGODB_URI must NOT be read at module load time.
// Next.js evaluates modules during the build step where env vars are absent.
// We defer the check to the first runtime request via getClientPromise().
//
// We also cache the Promise at module level in production (not just in dev).
// Without this, every Vercel serverless invocation opens a fresh TCP connection,
// quickly exhausting the Atlas M0 free-tier connection limit (500 max).

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Module-level cache for production (persists across warm invocations)
let _prodClientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'Missing environment variable "MONGODB_URI". ' +
      "Add it in Vercel → Project Settings → Environment Variables, " +
      "then redeploy."
    );
  }

  if (process.env.NODE_ENV === "development") {
    // In dev: use the global to survive hot-reloads
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      }).connect();
    }
    return global._mongoClientPromise;
  }

  // In production: cache at module level so warm serverless instances
  // reuse the same connection instead of opening a new one each request.
  if (!_prodClientPromise) {
    _prodClientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    }).connect();
  }
  return _prodClientPromise;
}

// ─── Helper: returns the proposals collection ─────────────────────────────────

export async function getProposalsCollection(): Promise<Collection<SavedProposal>> {
  const mongo = await getClientPromise();
  return mongo.db(DB_NAME).collection<SavedProposal>(COLLECTION);
}

// ─── Helper: returns the users collection ──────────────────────────────────────

export interface DBUser {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
  lastLogin: Date | null;
}

export async function getUsersCollection(): Promise<Collection<DBUser>> {
  const mongo = await getClientPromise();
  return mongo.db(DB_NAME).collection<DBUser>("users");
}
