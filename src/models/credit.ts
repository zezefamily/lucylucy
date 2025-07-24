import { credits } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, and, gte, asc } from "drizzle-orm";

export async function insertCredit(
  data: typeof credits.$inferInsert
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db().insert(credits).values(data).returning();

  return credit;
}

export async function findCreditByTransNo(
  trans_no: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(eq(credits.trans_no, trans_no))
    .limit(1);

  return credit;
}

export async function findCreditByOrderNo(
  order_no: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(eq(credits.order_no, order_no))
    .limit(1);

  return credit;
}

export async function getUserValidCredits(
  user_uuid: string
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const now = new Date().toISOString();
  const data = await db()
    .select()
    .from(credits)
    .where(
      and(
        gte(credits.expired_at, new Date(now)),
        eq(credits.user_uuid, user_uuid)
      )
    )
    .orderBy(asc(credits.expired_at));

  return data;
}

export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(credits)
    .where(eq(credits.user_uuid, user_uuid))
    .orderBy(desc(credits.created_at))
    .limit(limit)
    .offset((page - 1) * limit);

  return data;
}

// 根据积分记录获取用户最高订阅等级（基于tier字段）
export async function getUserHighestTierFromCredits(
  user_uuid: string
): Promise<{ tier: string; totalCredits: number }> {
  const now = new Date().toISOString();
  
  // 定义等级优先级
  const tierPriority = { 'elite': 3, 'pro': 2, 'starter': 1, 'none': 0 };
  
  const data = await db()
    .select()
    .from(credits)
    .where(
      and(
        eq(credits.user_uuid, user_uuid),
        gte(credits.expired_at, new Date(now)) // 未过期
      )
    )
    .orderBy(desc(credits.created_at));

  if (!data || data.length === 0) {
    return { tier: 'none', totalCredits: 0 };
  }

  // 找到最高等级并计算总积分
  let highestTier = 'none';
  let totalCredits = 0;
  
  for (const credit of data) {
    const currentTier = credit.tier || 'none';
    totalCredits += credit.credits || 0;
    
    if (tierPriority[currentTier as keyof typeof tierPriority] > tierPriority[highestTier as keyof typeof tierPriority]) {
      highestTier = currentTier;
    }
  }

  return { tier: highestTier, totalCredits };
}
