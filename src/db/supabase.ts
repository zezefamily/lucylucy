import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: ReturnType<typeof createClient> | null = null;
let drizzleInstance: ReturnType<typeof drizzle> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseClient;
}

// 使用Supabase的PostgreSQL连接创建Drizzle实例
export function getSupabaseDrizzle() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!drizzleInstance) {
    // 针对Supabase优化的连接配置
    const connectionString = process.env.DATABASE_URL;
    
    const client = postgres(connectionString, {
      prepare: false,
      max: 1, // 单连接，避免连接池问题
      idle_timeout: 20,
      connect_timeout: 60,
      ssl: { rejectUnauthorized: false },
      connection: {
        application_name: "lucylucy_supabase",
      }
    });

    drizzleInstance = drizzle(client);
  }

  return drizzleInstance;
} 