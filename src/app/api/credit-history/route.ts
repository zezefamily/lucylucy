import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getCreditsByUserUuid } from "@/models/credit";

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("用户未登录");
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (page < 1 || limit < 1 || limit > 100) {
      return respErr("页码或每页数量参数无效");
    }

    const credits = await getCreditsByUserUuid(user_uuid, page, limit);
    
    return respData({
      credits: credits || [],
      page,
      limit,
      hasMore: credits && credits.length === limit
    });
  } catch (error: any) {
    console.error("获取积分记录失败:", error);
    return respErr(`获取积分记录失败: ${error.message}`);
  }
}

export async function POST(req: Request) {
  try {
    const { user_uuid: targetUserUuid, page = 1, limit = 20 } = await req.json();
    
    // 如果指定了目标用户UUID，使用它；否则使用当前用户
    const user_uuid = targetUserUuid || await getUserUuid();
    if (!user_uuid) {
      return respErr("用户未登录");
    }

    if (page < 1 || limit < 1 || limit > 100) {
      return respErr("页码或每页数量参数无效");
    }

    const credits = await getCreditsByUserUuid(user_uuid, page, limit);
    
    return respData({
      credits: credits || [],
      page,
      limit,
      hasMore: credits && credits.length === limit
    });
  } catch (error: any) {
    console.error("获取积分记录失败:", error);
    return respErr(`获取积分记录失败: ${error.message}`);
  }
} 