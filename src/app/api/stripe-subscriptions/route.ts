import Stripe from "stripe";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getOrdersByUserUuid } from "@/models/order";

export async function GET() {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("用户未登录");
    }

    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
    
    // 获取用户的订单记录，找到有效的订阅ID
    const orders = await getOrdersByUserUuid(user_uuid);
    if (!orders || orders.length === 0) {
      return respData([]);
    }

    // 筛选出有订阅ID的订单
    const subscriptionOrders = orders.filter(order => order.status === "paid");
    
    if (subscriptionOrders.length === 0) {
      return respData([]);
    }

    // 获取所有订阅信息
    const subscriptions = [];
    
    for (const order of subscriptionOrders) {
      try {
        const subscription = await stripe.subscriptions.retrieve(order.sub_id!);
        subscriptions.push({
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at,
          product_name: order.product_name,
          amount: order.amount,
          currency: order.currency,
          interval: order.interval,
          order_no: order.order_no,
          tier: order.tier,
          created: subscription.created
        });
      } catch (error) {
        console.error(`Failed to retrieve subscription ${order.sub_id}:`, error);
      }
    }

    return respData(subscriptions);
  } catch (error: any) {
    console.error("获取订阅列表失败:", error);
    return respErr(`获取订阅列表失败: ${error.message}`);
  }
} 