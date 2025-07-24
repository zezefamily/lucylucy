# 订阅等级查询方案对比分析

## 背景

项目中有 `orders` 表和 `credits` 表，需要选择合适的表来查询用户的最高订阅等级。

## 数据表结构

### Orders 表
```sql
orders (
  id, order_no, user_uuid, user_email,
  product_id,        -- 产品ID (starter_weekly, pro_monthly, elite_monthly)
  product_name,      -- 产品名称
  amount, currency, interval,  -- 价格和周期信息
  status,           -- 订单状态 (created, paid, deleted)
  expired_at,       -- 过期时间
  created_at, paid_at
)
```

### Credits 表
```sql
credits (
  id, trans_no, user_uuid,
  trans_type,       -- 交易类型 (order_pay, new_user, system_add)
  credits,          -- 积分数量
  order_no,         -- 关联订单号
  expired_at,       -- 过期时间
  created_at
)
```

## 方案对比

| 维度 | Orders 表方案 | Credits 表方案 |
|------|---------------|----------------|
| **业务语义** | ✅ 直接对应订阅等级概念 | ❌ 积分 ≠ 订阅等级 |
| **数据准确性** | ✅ 准确反映用户购买的订阅产品 | ❌ 积分可能来自多种渠道 |
| **等级识别** | ✅ 通过 product_id 直接识别等级 | ❌ 需要根据积分数量推测等级 |
| **订阅信息** | ✅ 包含完整产品信息和周期 | ❌ 无订阅产品信息 |
| **查询复杂度** | ⚠️ 需要解析 product_id | ✅ 简单的积分汇总 |
| **性能** | ⚠️ 相对较慢 | ✅ 查询更快 |
| **可扩展性** | ✅ 支持复杂的订阅逻辑 | ❌ 难以处理多种订阅类型 |

## 详细分析

### 🎯 推荐方案：Orders 表

**原因：**

1. **业务逻辑匹配**
   - 订阅等级是基于用户购买的产品类型
   - Orders 表直接记录了用户的订阅行为

2. **数据可靠性**
   ```typescript
   // Orders 表：明确的订阅等级
   product_id: "pro_monthly" → SubscriptionTier.PRO
   
   // Credits 表：积分来源不明确
   credits: 500 → 可能是 Pro？也可能是多次 Starter + 赠送？
   ```

3. **完整的订阅信息**
   ```typescript
   {
     tier: "pro",
     productId: "pro_monthly",
     productName: "Lucy AI Pro Monthly", 
     interval: "month",
     expiredAt: "2024-02-15T10:30:00.000Z"
   }
   ```

### ⚡ 备选方案：Credits 表（快速查询）

**适用场景：**
- 高频调用的API接口
- 只需要简单的等级判断
- 性能优先的场景

**限制：**
- 精度较低，只能估算等级
- 无法区分积分来源
- 缺乏详细的订阅信息

## 推荐的实现策略

### 主要方案
```typescript
// 准确但稍慢 - 用于重要的业务逻辑
const subscription = await getUserHighestSubscriptionTier(user_uuid);
```

### 备选方案  
```typescript
// 快速但不够准确 - 用于高频场景
const { tier, hasCredits } = await getUserSubscriptionTierFast(user_uuid);
```

### 混合策略
```typescript
// 在需要完整信息时使用 orders 表
if (needDetailedInfo) {
  return await getUserHighestSubscriptionTier(user_uuid);
}

// 在高频调用时使用 credits 表
return await getUserSubscriptionTierFast(user_uuid);
```

## 实际使用建议

### 使用 Orders 表的场景
- 🔐 权限验证和功能限制
- 💰 支付和订阅管理
- 📊 用户等级展示
- 🎯 个性化功能推荐

### 使用 Credits 表的场景
- ⚡ 实时积分余额查询
- 🔄 高频的API调用
- 📱 移动端轻量查询
- 🏃‍♂️ 性能敏感的场景

## 结论

**推荐使用 Orders 表作为主要方案**，原因：

1. ✅ **语义准确**：订阅等级本质上就是订单产品等级
2. ✅ **数据可靠**：直接反映用户的购买行为  
3. ✅ **信息完整**：包含所有必要的订阅信息
4. ✅ **易于维护**：业务逻辑清晰，便于后续扩展

Credits 表可以作为**性能优化的补充方案**，在特定场景下使用。 