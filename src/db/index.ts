import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getSupabaseDrizzle } from "./supabase";

// Detect if running in Cloudflare Workers environment
const isCloudflareWorker =
  typeof globalThis !== "undefined" && "Cloudflare" in globalThis;

// Check if we should use Supabase client (recommended for better stability)
const useSupabaseClient = 
  process.env.SUPABASE_SERVICE_ROLE_KEY && 
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.USE_SUPABASE_CLIENT === "true";

// Database instance for Node.js environment
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function db() {
  // Use Supabase client if configured (recommended for stability)
  if (useSupabaseClient) {
    console.log("Using Supabase client for database connection");
    return getSupabaseDrizzle();
  }

  // Fallback to direct PostgreSQL connection
  console.log("Using direct PostgreSQL connection");
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
  // Highly optimized for Supabase and serverless environments
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 3, // Further reduced for serverless stability
    idle_timeout: 30, // Balanced timeout
    connect_timeout: 30, // Reduced but sufficient
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
    connection: {
      application_name: "lucylucy_app",
    }
  });
  dbInstance = drizzle(client);

  return dbInstance;
}
