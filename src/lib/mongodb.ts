import { MongoClient, Collection } from "mongodb";
import type { SavedProposal } from "@/app/api/proposals/route";

const uri = process.env.MONGODB_URI as string;

if (!uri) {
  throw new Error(
    'Missing environment variable "MONGODB_URI". ' +
    'Add it to your .env.local file (see .env.local.example).'
  );
}

const DB_NAME = "ksafety";
const COLLECTION = "proposals";

// ─── Connection caching (avoids too many connections in dev / serverless) ──────

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In dev, reuse the connection across hot-reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a fresh client per module instance
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// ─── Helper: returns the proposals collection ─────────────────────────────────

export async function getProposalsCollection(): Promise<Collection<SavedProposal>> {
  const mongo = await clientPromise;
  return mongo.db(DB_NAME).collection<SavedProposal>(COLLECTION);
}
