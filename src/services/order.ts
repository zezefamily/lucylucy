import {
  CreditsTransType,
  increaseCredits,
  updateCreditForOrder,
} from "./credit";
import {
  findOrderByOrderNo,
  OrderStatus,
  updateOrderStatus,
  updateOrderSubscription,
} from "@/models/order";
import { getIsoTimestr } from "@/lib/time";

import Stripe from "stripe";
import { updateAffiliateForOrder } from "./affiliate";
import { Order } from "@/types/order";

export async function handleOrderSession(session: Stripe.Checkout.Session) {
  try {
    if (
      !session ||
      !session.metadata ||
      !session.metadata.order_no ||
      session.payment_status !== "paid"
    ) {
      throw new Error("invalid session");
    }

    const order_no = session.metadata.order_no;
    const paid_email =
      session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);

    const order = await findOrderByOrderNo(order_no);
    if (!order || order.status !== OrderStatus.Created) {
      throw new Error("invalid order");
    }

    const paid_at = getIsoTimestr();

    // 检查是否为订阅订单
    const isSubscriptionOrder = session.mode === "subscription" && session.subscription;

    if (isSubscriptionOrder && session.subscription) {
      // 如果是订阅订单，需要获取订阅信息
      const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // 更新订单的订阅信息
      await updateOrderSubscription(
        order_no,
        subscription.id,
        subscription.items.data[0]?.price?.recurring?.interval_count || 1,
        subscription.billing_cycle_anchor || subscription.current_period_start,
        subscription.current_period_end,
        subscription.current_period_start,
        OrderStatus.Paid,
        paid_at,
        1, // sub_times 初始为 1
        paid_email,
        paid_detail
      );
    } else {
      // 非订阅订单，只更新订单状态
      await updateOrderStatus(
        order_no,
        OrderStatus.Paid,
        paid_at,
        paid_email,
        paid_detail
      );
    }

    if (order.user_uuid) {
      // 检查是否为 Elite 等级（无限制使用，credits = 0）
      const isEliteOrder = (order.tier === 'elite') || 
                          (order.product_name && order.product_name.toLowerCase().includes('elite'));
      
      if (order.credits > 0 || isEliteOrder) {
        // increase credits for paied order (包括 Elite 等级的 0 积分订单)
        await updateCreditForOrder(order as unknown as Order);
      }

      // update affiliate for paied order
      await updateAffiliateForOrder(order as unknown as Order);
    }

    console.log(
      "handle order session successed:  ",
      order_no,
      paid_at,
      paid_email,
      paid_detail,
      isSubscriptionOrder ? `subscription_id: ${session.subscription}` : "one-time payment"
    );
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}
