import { CreditsAmount, CreditsTransType } from "./credit";
import { findUserByEmail, findUserByUuid, insertUser } from "@/models/user";

import { User, SubscriptionTier, UserSubscription } from "@/types/user";
import { auth } from "@/auth";
import { getIsoTimestr, getOneYearLaterTimestr } from "@/lib/time";
import { getUserUuidByApiKey } from "@/models/apikey";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";
import { users } from "@/db/schema";
import { getUuid } from "@/lib/hash";
import { getValidSubscriptionsByUserUuid, getUserHighestTierFromOrders } from "@/models/order";

// save user to database, if user not exist, create a new user
export async function saveUser(user: User) {
  try {
    if (!user.email) {
      throw new Error("invalid user email");
    }

    const existUser = await findUserByEmail(user.email);

    if (!existUser) {
      // user not exist, create a new user
      if (!user.uuid) {
        user.uuid = getUuid();
      }

      console.log("user to be inserted:", user);

      const dbUser = await insertUser(user as typeof users.$inferInsert);

      // increase credits for new user, expire in one year
      await increaseCredits({
        user_uuid: user.uuid,
        trans_type: CreditsTransType.NewUser,
        credits: CreditsAmount.NewUserGet,
        expired_at: getOneYearLaterTimestr(),
      });

      user = {
        ...(dbUser as unknown as User),
      };
    } else {
      // user exist, return user info in db
      user = {
        ...(existUser as unknown as User),
      };
    }

    return user;
  } catch (e) {
    console.log("save user failed: ", e);
    throw e;
  }
}

export async function getUserUuid() {
  // 在开发环境中使用固定的 user_uuid
  if (process.env.NODE_ENV === 'development') {
    return '506a7a22-cd55-4bae-90b4-9fa5feb579be';
  }

  let user_uuid = "";

  const token = await getBearerToken();

  if (token) {
    // api key
    if (token.startsWith("sk-")) {
      const user_uuid = await getUserUuidByApiKey(token);

      return user_uuid || "";
    }
  }

  const session = await auth();
  if (session && session.user && session.user.uuid) {
    user_uuid = session.user.uuid;
  }

  return user_uuid;
}

export async function getBearerToken() {
  const h = await headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  return auth.replace("Bearer ", "");
}

export async function getUserEmail() {
  let user_email = "";

  const session = await auth();
  if (session && session.user && session.user.email) {
    user_email = session.user.email;
  }

  return user_email;
}

export async function getUserInfo() {
  let user_uuid = await getUserUuid();

  if (!user_uuid) {
    return;
  }

  const user = await findUserByUuid(user_uuid);

  return user;
}

/**
 * 根据产品ID获取订阅等级
 * @param productId 产品ID
 * @returns 订阅等级
 */
export function getSubscriptionTierFromProductId(productId: string): SubscriptionTier {
  if (!productId) {
    return SubscriptionTier.NONE;
  }
  
  const lowerProductId = productId.toLowerCase();
  
  if (lowerProductId.includes('starter')) {
    return SubscriptionTier.STARTER;
  } else if (lowerProductId.includes('pro')) {
    return SubscriptionTier.PRO;
  } else if (lowerProductId.includes('elite')) {
    return SubscriptionTier.ELITE;
  }
  
  return SubscriptionTier.NONE;
}

/**
 * 获取订阅等级的优先级（数字越大等级越高）
 * @param tier 订阅等级
 * @returns 优先级数字
 */
export function getSubscriptionTierPriority(tier: SubscriptionTier): number {
  switch (tier) {
    case SubscriptionTier.ELITE:
      return 3;
    case SubscriptionTier.PRO:
      return 2;
    case SubscriptionTier.STARTER:
      return 1;
    case SubscriptionTier.NONE:
    default:
      return 0;
  }
}

/**
 * 获取用户有效订阅内的最高等级（基于orders表 - 推荐方案）
 * @param user_uuid 用户UUID
 * @returns 用户最高订阅等级信息
 */
export async function getUserHighestSubscriptionTier(user_uuid?: string): Promise<UserSubscription> {
  try {
    // 如果没有传入user_uuid，尝试获取当前用户的UUID
    if (!user_uuid) {
      user_uuid = await getUserUuid();
    }
    
    if (!user_uuid) {
      return {
        tier: SubscriptionTier.NONE,
        isActive: false
      };
    }

    // 获取用户所有有效的订阅订单
    const validSubscriptions = await getValidSubscriptionsByUserUuid(user_uuid);
    
    if (!validSubscriptions || validSubscriptions.length === 0) {
      return {
        tier: SubscriptionTier.NONE,
        isActive: false
      };
    }

    // 找到最高等级的订阅
    let highestTier = SubscriptionTier.NONE;
    let highestSubscription = null;
    
    for (const subscription of validSubscriptions) {
      const tier = getSubscriptionTierFromProductId(subscription.product_id || '');
      
      if (getSubscriptionTierPriority(tier) > getSubscriptionTierPriority(highestTier)) {
        highestTier = tier;
        highestSubscription = subscription;
      }
    }

    if (!highestSubscription) {
      return {
        tier: SubscriptionTier.NONE,
        isActive: false
      };
    }

    return {
      tier: highestTier,
      productId: highestSubscription.product_id || undefined,
      productName: highestSubscription.product_name || undefined,
      isActive: true,
      expiredAt: highestSubscription.expired_at || undefined,
      interval: highestSubscription.interval || undefined
    };
    
  } catch (error) {
    console.log('获取用户最高订阅等级失败:', error);
    return {
      tier: SubscriptionTier.NONE,
      isActive: false
    };
  }
}

/**
 * 获取用户订阅等级的快速版本（基于credits表）
 * 注意：这个方法不如orders表准确，主要用于性能要求高的场景
 * @param user_uuid 用户UUID
 * @returns 简化的订阅等级信息
 */
export async function getUserSubscriptionTierFast(user_uuid?: string): Promise<{ tier: SubscriptionTier; hasCredits: boolean }> {
  try {
    if (!user_uuid) {
      user_uuid = await getUserUuid();
    }
    
    if (!user_uuid) {
      return { tier: SubscriptionTier.NONE, hasCredits: false };
    }

    // 查询用户有效积分（来自订阅的积分）
    const { getUserValidCredits } = await import("@/models/credit");
    const validCredits = await getUserValidCredits(user_uuid);
    
    if (!validCredits || validCredits.length === 0) {
      return { tier: SubscriptionTier.NONE, hasCredits: false };
    }

    // 计算总积分
    const totalCredits = validCredits.reduce((sum, credit) => sum + (credit.credits || 0), 0);
    
    // 根据积分推测订阅等级（这是一个估算，不如orders表准确）
    let estimatedTier = SubscriptionTier.NONE;
    if (totalCredits >= 9999) {
      estimatedTier = SubscriptionTier.ELITE; // Elite用户通常有9999积分
    } else if (totalCredits >= 300) {
      estimatedTier = SubscriptionTier.PRO; // Pro用户通常有300+积分
    } else if (totalCredits >= 50) {
      estimatedTier = SubscriptionTier.STARTER; // Starter用户通常有50+积分
    }

    return { 
      tier: estimatedTier, 
      hasCredits: totalCredits > 0 
    };
    
  } catch (error) {
    console.log('快速获取用户订阅等级失败:', error);
    return { tier: SubscriptionTier.NONE, hasCredits: false };
  }
}

/**
 * 获取用户最高订阅等级（安全版本 - 基于tier字段）
 * 推荐使用这个版本，不依赖字符串匹配，更安全可靠
 * @param user_uuid 用户UUID
 * @returns 用户最高订阅等级信息
 */
export async function getUserHighestSubscriptionTierSafe(user_uuid?: string): Promise<UserSubscription> {
  try {
    if (!user_uuid) {
      user_uuid = await getUserUuid();
    }
    
    if (!user_uuid) {
      return {
        tier: SubscriptionTier.NONE,
        isActive: false
      };
    }

    // 直接使用tier字段查询，避免字符串匹配风险
    const { tier, order } = await getUserHighestTierFromOrders(user_uuid);
    
    if (tier === 'none' || !order) {
      return {
        tier: SubscriptionTier.NONE,
        isActive: false
      };
    }

    // 转换字符串到枚举类型
    const subscriptionTier = tier.toUpperCase() as SubscriptionTier;

    return {
      tier: subscriptionTier,
      productId: order.product_id || undefined,
      productName: order.product_name || undefined,
      isActive: true,
      expiredAt: order.expired_at || undefined,
      interval: order.interval || undefined
    };
    
  } catch (error) {
    console.log('获取用户最高订阅等级失败:', error);
    return {
      tier: SubscriptionTier.NONE,
      isActive: false
    };
  }
}

/**
 * 获取用户订阅等级的快速安全版本（基于credits表tier字段）
 * @param user_uuid 用户UUID
 * @returns 简化的订阅等级信息
 */
export async function getUserSubscriptionTierFastSafe(user_uuid?: string): Promise<{ tier: SubscriptionTier; hasCredits: boolean; totalCredits: number }> {
  try {
    if (!user_uuid) {
      user_uuid = await getUserUuid();
    }
    
    if (!user_uuid) {
      return { tier: SubscriptionTier.NONE, hasCredits: false, totalCredits: 0 };
    }

    // 使用tier字段直接查询，避免积分推测
    const { getUserHighestTierFromCredits } = await import("@/models/credit");
    const { tier, totalCredits } = await getUserHighestTierFromCredits(user_uuid);
    
    // 转换字符串到枚举类型
    const subscriptionTier = tier === 'none' ? SubscriptionTier.NONE : tier.toUpperCase() as SubscriptionTier;

    return { 
      tier: subscriptionTier, 
      hasCredits: totalCredits > 0,
      totalCredits 
    };
    
  } catch (error) {
    console.log('快速获取用户订阅等级失败:', error);
    return { tier: SubscriptionTier.NONE, hasCredits: false, totalCredits: 0 };
  }
}
