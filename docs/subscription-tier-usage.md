# 用户订阅等级功能使用说明

## 概述

本功能实现了获取用户有效订阅内最高等级的逻辑，支持三个订阅等级：
- **Starter（入门版）**
- **Pro（进阶版）**  
- **Elite（精英版）**

## 订阅等级优先级

等级优先级从高到低：Elite > Pro > Starter > None

## API 接口

### 1. 获取当前用户的最高订阅等级

```http
GET /api/get-user-subscription
```

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "subscription": {
      "tier": "pro",
      "productId": "pro_monthly",
      "productName": "Lucy AI Pro Monthly",
      "isActive": true,
      "expiredAt": "2024-02-15T10:30:00.000Z",
      "interval": "month"
    }
  }
}
```

### 2. 获取指定用户的最高订阅等级

```http
POST /api/get-user-subscription
Content-Type: application/json

{
  "user_uuid": "user-uuid-here"
}
```

## 服务函数使用

### 在服务端代码中使用

```typescript
import { getUserHighestSubscriptionTier, SubscriptionTier } from "@/services/user";

// 获取当前用户的最高订阅等级
const subscription = await getUserHighestSubscriptionTier();

// 根据订阅等级执行不同逻辑
switch (subscription.tier) {
  case SubscriptionTier.ELITE:
    // Elite 用户逻辑
    console.log("Elite 用户享有最高级权限");
    break;
  case SubscriptionTier.PRO:
    // Pro 用户逻辑
    console.log("Pro 用户享有进阶权限");
    break;
  case SubscriptionTier.STARTER:
    // Starter 用户逻辑
    console.log("Starter 用户享有基础权限");
    break;
  default:
    // 无订阅用户逻辑
    console.log("用户无有效订阅");
}

// 获取指定用户的最高订阅等级
const userSubscription = await getUserHighestSubscriptionTier("user-uuid");
```

### 在前端组件中使用

```typescript
import { useEffect, useState } from 'react';
import { SubscriptionTier } from '@/types/user';

function useUserSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/get-user-subscription');
        const { data } = await response.json();
        setSubscription(data.subscription);
      } catch (error) {
        console.error('获取订阅信息失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  return { subscription, loading };
}

// 在组件中使用
function MyComponent() {
  const { subscription, loading } = useUserSubscription();

  if (loading) return <div>加载中...</div>;

  const isEliteUser = subscription?.tier === SubscriptionTier.ELITE;
  const isProUser = subscription?.tier === SubscriptionTier.PRO;

  return (
    <div>
      {isEliteUser && <div>Elite 专属功能</div>}
      {isProUser && <div>Pro 专属功能</div>}
      <div>当前订阅等级: {subscription?.tier || 'none'}</div>
    </div>
  );
}
```

## 数据结构

### SubscriptionTier 枚举

```typescript
export enum SubscriptionTier {
  NONE = "none",
  STARTER = "starter", 
  PRO = "pro",
  ELITE = "elite"
}
```

### UserSubscription 接口

```typescript
export interface UserSubscription {
  tier: SubscriptionTier;           // 订阅等级
  productId?: string;               // 产品ID
  productName?: string;             // 产品名称
  isActive: boolean;                // 是否有效
  expiredAt?: Date;                 // 过期时间
  interval?: string;                // 订阅周期 (week/month)
}
```

## 实现逻辑

1. **获取有效订阅**：查询用户所有已支付且未过期的订阅订单
2. **等级识别**：根据 `product_id` 识别订阅等级（包含 starter/pro/elite 关键词）
3. **优先级比较**：在多个有效订阅中选择等级最高的
4. **返回结果**：返回最高等级的订阅信息

## 注意事项

- 函数会自动处理过期订阅的过滤
- 如果用户没有有效订阅，返回 `tier: "none"` 和 `isActive: false`
- 支持同时拥有多个有效订阅的情况，返回最高等级
- 在开发环境中，`getUserUuid()` 使用固定的用户ID进行测试 