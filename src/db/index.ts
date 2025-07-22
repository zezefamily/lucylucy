import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Detect if running in Cloudflare Workers environment
const isCloudflareWorker =
  typeof globalThis !== "undefined" && "Cloudflare" in globalThis;

// Database instance for Node.js environment
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function db() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // In Cloudflare Workers, create new connection each time
  if (isCloudflareWorker) {
    // Workers environment uses minimal configuration
    const client = postgres(databaseUrl, {
      prepare: false,
      max: 1, // Limit to 1 connection in Workers
      idle_timeout: 10, // Shorter timeout for Workers
      connect_timeout: 30, // Increased for better reliability
      ssl: { rejectUnauthorized: false }, // Required for cloud databases
    });

    return drizzle(client);
  }

  // In Node.js environment, use singleton pattern
  if (dbInstance) {
    return dbInstance;
  }

  // Node.js environment with connection pool configuration
  // Optimized for Supabase and production environments
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 5, // Reduced for serverless/production stability
    idle_timeout: 20, // Shorter idle timeout for serverless
    connect_timeout: 60, // Increased for Supabase connection time
    ssl: { rejectUnauthorized: false }, // Required for most cloud databases
    connection: {
      application_name: "lucylucy_app", // For connection tracking
    }
  });
  dbInstance = drizzle({ client });

  return dbInstance;
}
