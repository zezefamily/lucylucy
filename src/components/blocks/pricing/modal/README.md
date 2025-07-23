# 定价模态框组件 (PricingModal)

一个封装好的定价弹出框组件，支持灵活的业务调用和自定义配置。

## 特性

- 🎯 支持多种触发方式
- 🎨 响应式设计，适配各种屏幕尺寸
- ⚙️ 高度可配置
- 🪝 提供便捷的 Hook 调用
- 🔄 完整的支付流程集成

## 安装和导入

```tsx
import { PricingModal, usePricingModal } from "@/components/blocks/pricing/modal";
```

## 基础用法

### 方式1: 使用默认触发器

```tsx
<PricingModal 
  pricing={pricingData}
  triggerText="查看价格"
/>
```

### 方式2: 使用自定义触发器

```tsx
<PricingModal 
  pricing={pricingData}
  trigger={
    <Button variant="primary">
      🚀 升级套餐
    </Button>
  }
/>
```

### 方式3: 使用 Hook 控制

```tsx
function MyComponent() {
  const { isOpen, openPricingModal, closePricingModal, setIsOpen } = usePricingModal();

  return (
    <>
      <Button onClick={openPricingModal}>
        打开定价
      </Button>
      
      <PricingModal 
        pricing={pricingData}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
```

## API 参数

### PricingModal Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pricing` | `PricingType` | - | **必填** 定价数据 |
| `trigger` | `React.ReactNode` | - | 自定义触发器元素 |
| `triggerText` | `string` | `"查看定价"` | 默认触发器文本 |
| `triggerClassName` | `string` | - | 默认触发器样式类 |
| `open` | `boolean` | - | 受控模式下的显示状态 |
| `onOpenChange` | `(open: boolean) => void` | - | 显示状态变化回调 |

### usePricingModal Hook

```tsx
const {
  isOpen,           // 当前显示状态
  openPricingModal, // 打开模态框
  closePricingModal,// 关闭模态框
  togglePricingModal,// 切换显示状态
  setIsOpen,        // 直接设置显示状态
} = usePricingModal();
```

## 定价数据格式

```tsx
const pricingData: PricingType = {
  title: "选择你的套餐",
  description: "灵活的定价方案，满足不同需求",
  items: [
    {
      title: "基础版",
      price: "¥99",
      unit: "/月",
      description: "适合个人用户",
      features: [
        "100次分析",
        "基础功能",
        "邮件支持"
      ],
      button: {
        title: "选择基础版",
      },
      product_id: "basic",
      amount: 99,
      currency: "cny",
      interval: "month",
      credits: 100,
    }
  ]
};
```

## 高级用法

### 结合业务逻辑使用

```tsx
function PaymentButton() {
  const { openPricingModal } = usePricingModal();
  const { user } = useAppContext();

  const handleUpgrade = () => {
    if (!user) {
      // 处理未登录逻辑
      toast.error("请先登录");
      return;
    }
    
    // 打开定价模态框
    openPricingModal();
  };

  return (
    <Button onClick={handleUpgrade}>
      升级套餐
    </Button>
  );
}
```

### 在页面中集成

```tsx
export default function HomePage() {
  const { isOpen, setIsOpen } = usePricingModal();

  return (
    <div>
      {/* 页面内容 */}
      <section>
        <h1>欢迎使用我们的服务</h1>
        <PricingModal 
          pricing={pricingData}
          triggerText="查看套餐"
          triggerClassName="bg-primary text-white"
        />
      </section>

      {/* 或者在其他地方控制 */}
      <PricingModal 
        pricing={pricingData}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
```

## 样式自定义

组件使用 Tailwind CSS 构建，支持自定义样式：

```tsx
<PricingModal 
  pricing={pricingData}
  triggerClassName="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
  trigger={
    <div className="custom-trigger-style">
      自定义触发器
    </div>
  }
/>
```

## 注意事项

1. 确保传入正确格式的 `pricing` 数据
2. 组件依赖 `@/contexts/app` 上下文，确保在应用的上下文提供者内使用
3. 支付功能需要正确配置 Stripe
4. 模态框最大宽度为 `6xl`，在小屏幕上会自适应

## 完整示例

查看 `example.tsx` 文件获取完整的使用示例。 