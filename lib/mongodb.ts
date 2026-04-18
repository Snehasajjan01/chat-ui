import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = "chatui";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  var _mongoDb: Db | undefined;
  var _mongoFailed: boolean | undefined;
}

/**
 * Returns the DB, or null if MongoDB is unavailable.
 * The app continues working without persistence when null is returned.
 */
export async function getDb(): Promise<Db | null> {
  // Already connected
  if (global._mongoDb) return global._mongoDb;

  // Already failed — don't keep retrying on every request
  if (global._mongoFailed) return null;

  if (!uri) {
    console.warn("[MongoDB] MONGODB_URI not set — running without persistence.");
    global._mongoFailed = true;
    return null;
  }

  try {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000, // fail fast — 5s instead of 30s
        connectTimeoutMS: 5000,
      });
    }

    await global._mongoClient.connect();
    const db = global._mongoClient.db(dbName);

    // Quick ping to verify the connection actually works
    await db.command({ ping: 1 });

    // Create indexes only once
    await db
      .collection("conversations")
      .createIndex({ userId: 1, updatedAt: -1 })
      .catch(() => {});

    global._mongoDb = db;
    console.log("[MongoDB] Connected successfully.");
    return db;
  } catch (err) {
    console.error("[MongoDB] Connection failed — running without persistence:", err);
    global._mongoFailed = true;
    global._mongoClient = undefined;
    return null;
  }
}