import { getUserHighestSubscriptionTier } from "@/services/user";
import { respData, respErr } from "@/lib/resp";

export async function GET() {
  try {
    const subscription = await getUserHighestSubscriptionTier();
    
    return respData({
      subscription
    });
  } catch (error: any) {
    console.log("获取用户订阅等级失败: ", error);
    return respErr("获取用户订阅等级失败: " + error.message);
  }
}

export async function POST(req: Request) {
  try {
    const { user_uuid } = await req.json();
    
    const subscription = await getUserHighestSubscriptionTier(user_uuid);
    
    return respData({
      subscription
    });
  } catch (error: any) {
    console.log("获取用户订阅等级失败: ", error);
    return respErr("获取用户订阅等级失败: " + error.message);
  }
} 