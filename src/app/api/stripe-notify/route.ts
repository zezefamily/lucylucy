import Stripe from "stripe";
import { handleOrderSession } from "@/services/order";
import { respOk } from "@/lib/resp";

export async function POST(req: Request) {
  try {
    const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!stripePrivateKey) {
      throw new Error("STRIPE_PRIVATE_KEY is not configured");
    }

    if (!stripeWebhookSecret && !isDevelopment) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const stripe = new Stripe(stripePrivateKey);

    const sign = req.headers.get("stripe-signature") as string;
    const body = await req.text();
    
    if (!body) {
      throw new Error("Request body is empty");
    }

    let event: Stripe.Event;

    // 在开发环境中，如果没有webhook secret或签名验证失败，尝试直接解析事件
    if (isDevelopment && (!stripeWebhookSecret || !sign)) {
      console.log("Development mode: Parsing event without signature verification");
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch (parseError) {
        throw new Error("Failed to parse webhook payload as JSON");
      }
    } else {
      // 生产环境或有完整配置的开发环境使用签名验证
      if (!sign) {
        throw new Error("Missing stripe-signature header");
      }
      
      if (!stripeWebhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
      }

      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          sign,
          stripeWebhookSecret
        );
      } catch (signatureError: any) {
        console.error("Stripe signature verification failed:", signatureError.message);
        
        // 在开发环境中，如果签名验证失败，尝试直接解析
        if (isDevelopment) {
          console.log("Development mode: Falling back to direct JSON parsing");
          try {
            event = JSON.parse(body) as Stripe.Event;
          } catch (parseError) {
            throw new Error(`Signature verification failed and JSON parsing failed: ${signatureError.message}`);
          }
        } else {
          throw signatureError;
        }
      }
    }

    console.log("stripe notify event: ", event.type, event.id);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleOrderSession(session);
        break;
      }
      
      case "invoice.payment_succeeded": {
        console.log("Invoice payment succeeded:", event.data.object);
        // 根据您的业务逻辑处理订阅付款成功
        break;
      }

      default:
        console.log("Unhandled event type: ", event.type);
    }

    return respOk();
  } catch (e: any) {
    console.error("Stripe notify failed: ", e.message);
    console.error("Full error: ", e);
    
    return Response.json(
      { 
        error: `Handle stripe notify failed: ${e.message}`,
        ...(process.env.NODE_ENV === 'development' && { details: e.stack })
      },
      { status: 500 }
    );
  }
}
