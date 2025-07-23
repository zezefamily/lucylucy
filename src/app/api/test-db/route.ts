import { db } from "@/db";
import { users } from "@/db/schema";
import { respData, respErr } from "@/lib/resp";

export async function GET() {
  try {
    console.log("开始测试数据库连接... test");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("DATABASE_URL format:", process.env.DATABASE_URL?.includes('supabase.co') ? 'Supabase' : 'Other');
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("NEXT_PUBLIC_SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("USE_SUPABASE_CLIENT:", process.env.USE_SUPABASE_CLIENT);
    
    // 测试简单查询
    const startTime = Date.now();
    const result = await db().select().from(users).limit(1);
    const endTime = Date.now();
    
    console.log("数据库连接成功！查询耗时:", endTime - startTime, "ms");
    
    return respData({
      status: "success",
      message: "数据库连接正常",
      queryTime: endTime - startTime,
      hasUsers: result.length > 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("数据库连接测试失败:", error);
    
    return respErr(
      `数据库连接失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
} 