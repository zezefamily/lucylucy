import Stripe from "stripe";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";

export async function POST(req: Request) {
  try {
    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      return respErr("订阅ID不能为空");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("用户未登录");
    }

    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
    
    // 验证订阅是否属于当前用户
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // 这里需要验证订阅是否属于当前用户
    // 通过metadata或者customer信息来验证
    
    // 取消订阅（在当前周期结束时取消）
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return respData({
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      current_period_end: updatedSubscription.current_period_end,
    });
  } catch (error: any) {
    console.error("取消订阅失败:", error);
    return respErr(`取消订阅失败: ${error.message}`);
  }
} 