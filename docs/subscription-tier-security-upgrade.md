# 订阅等级安全升级指南

## 问题分析

### 🚨 原方案的安全性问题

1. **依赖字符串匹配**
   ```typescript
   // 不安全：依赖 product_id 字符串匹配
   if (lowerProductId.includes('starter')) {
     return SubscriptionTier.STARTER;
   }
   ```

2. **潜在风险**
   - 产品ID变更导致等级识别失败
   - 字符串匹配可能被恶意绕过
   - 维护复杂性高，容易出错

### ✅ 新方案的安全改进

1. **专用 tier 字段**
   - Orders 表增加 `tier` 字段
   - Credits 表增加 `tier` 字段
   - 直接存储等级信息，避免字符串解析

2. **数据一致性保证**
   - 数据库约束确保 tier 值有效
   - 索引优化查询性能
   - 兼容性处理历史数据

## 升级步骤

### 1. 数据库迁移

**执行迁移脚本：**
```bash
# 在生产环境执行前，请先在测试环境验证
psql -d your_database -f src/db/schema-migration.sql
```

**迁移内容：**
- 为 `orders` 表增加 `tier VARCHAR(20)` 字段
- 为 `credits` 表增加 `tier VARCHAR(20)` 字段
- 为现有数据填充 tier 值
- 创建性能索引
- 添加数据约束

### 2. 代码更新

**新增安全函数：**
```typescript
// 推荐使用 - 基于 tier 字段的安全版本
const subscription = await getUserHighestSubscriptionTierSafe(user_uuid);

// 快速查询 - 基于 credits 表 tier 字段
const { tier, totalCredits } = await getUserSubscriptionTierFastSafe(user_uuid);
```

**兼容性保持：**
```typescript
// 旧版本函数仍然保留，但建议迁移到新版本
const subscription = await getUserHighestSubscriptionTier(user_uuid);
```

### 3. 渐进式迁移策略

#### 阶段 1：并行运行（推荐）
```typescript
// 在关键业务逻辑中同时使用两种方法进行验证
const oldResult = await getUserHighestSubscriptionTier(user_uuid);
const newResult = await getUserHighestSubscriptionTierSafe(user_uuid);

// 记录差异，用于验证新方案的正确性
if (oldResult.tier !== newResult.tier) {
  console.warn('订阅等级检测差异:', { old: oldResult.tier, new: newResult.tier, user_uuid });
}

// 使用新方案的结果
return newResult;
```

#### 阶段 2：完全切换
```typescript
// 验证无误后，完全切换到安全版本
const subscription = await getUserHighestSubscriptionTierSafe(user_uuid);
```

## API 使用对比

### 旧版本 API
```typescript
// ❌ 不推荐：依赖字符串匹配
import { getUserHighestSubscriptionTier } from "@/services/user";

const subscription = await getUserHighestSubscriptionTier();
// 风险：如果 product_id 格式变更，可能返回错误等级
```

### 新版本 API
```typescript
// ✅ 推荐：基于数据库 tier 字段
import { getUserHighestSubscriptionTierSafe } from "@/services/user";

const subscription = await getUserHighestSubscriptionTierSafe();
// 安全：直接读取 tier 字段，无字符串解析风险
```

### 快速查询版本
```typescript
// ✅ 高性能场景
import { getUserSubscriptionTierFastSafe } from "@/services/user";

const { tier, totalCredits } = await getUserSubscriptionTierFastSafe();
// 安全且高效：基于 credits 表的 tier 字段
```

## 安全性对比

| 特性 | 旧版本（product_id） | 新版本（tier字段） |
|------|---------------------|-------------------|
| **数据可靠性** | ❌ 依赖字符串格式 | ✅ 直接存储等级 |
| **维护复杂度** | ❌ 需同步更新匹配逻辑 | ✅ 简单的字段查询 |
| **性能** | ⚠️ 需要字符串处理 | ✅ 直接索引查询 |
| **安全性** | ❌ 可能被绕过 | ✅ 数据库约束保证 |
| **扩展性** | ❌ 新产品需更新代码 | ✅ 只需设置 tier 值 |

## 回滚方案

如果需要回滚到旧版本：

```sql
-- 1. 备份新增的 tier 字段数据（可选）
CREATE TABLE orders_tier_backup AS 
SELECT order_no, tier FROM orders WHERE tier IS NOT NULL;

CREATE TABLE credits_tier_backup AS 
SELECT trans_no, tier FROM credits WHERE tier IS NOT NULL;

-- 2. 删除新增字段（谨慎操作）
ALTER TABLE orders DROP COLUMN tier;
ALTER TABLE credits DROP COLUMN tier;

-- 3. 删除索引
DROP INDEX idx_orders_user_tier_status;
DROP INDEX idx_credits_user_tier_expired;
```

## 验证检查清单

### 数据验证
- [ ] 所有有效订单的 tier 字段已正确填充
- [ ] 积分记录的 tier 字段与对应订单一致
- [ ] 数据库约束正常工作

### 功能验证
- [ ] 新用户注册和订阅流程正常
- [ ] 现有用户等级识别准确
- [ ] 权限控制功能正常
- [ ] 性能没有明显下降

### 兼容性验证
- [ ] 旧版本 API 仍然可用
- [ ] 新旧版本结果一致
- [ ] 历史数据处理正确

## 最佳实践

1. **优先使用安全版本**
   ```typescript
   // 推荐
   const subscription = await getUserHighestSubscriptionTierSafe();
   ```

2. **性能敏感场景使用快速版本**
   ```typescript
   // 高频调用场景
   const { tier } = await getUserSubscriptionTierFastSafe();
   ```

3. **新订单创建时确保设置 tier**
   ```typescript
   const order = {
     // ... 其他字段
     tier: getTierFromProductId(product_id),
   };
   ```

4. **定期验证数据一致性**
   ```typescript
   // 定期检查 tier 字段与 product_id 的一致性
   // 可以作为数据验证的一部分
   ```

## 总结

新版本通过增加专用的 `tier` 字段，彻底解决了依赖字符串匹配的安全性问题：

- ✅ **安全性提升**：消除字符串匹配风险
- ✅ **性能优化**：直接索引查询，避免字符串处理
- ✅ **维护简化**：不需要同步更新匹配逻辑
- ✅ **扩展性增强**：新产品类型只需设置 tier 值

建议尽快完成升级，享受更安全、更高效的订阅等级管理！ 