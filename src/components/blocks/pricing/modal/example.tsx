"use client";

import { Button } from "@/components/ui/button";
import { PricingModal, usePricingModal } from "./index";
import { Pricing as PricingType } from "@/types/blocks/pricing";

// 示例定价数据
const examplePricing: PricingType = {
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
    },
    {
      title: "专业版",
      price: "¥299",
      unit: "/月",
      description: "适合专业用户",
      is_featured: true,
      label: "最受欢迎",
      features: [
        "500次分析",
        "高级功能",
        "优先支持",
        "自定义配置"
      ],
      button: {
        title: "选择专业版",
      },
      product_id: "pro",
      amount: 299,
      currency: "cny",
      interval: "month",
      credits: 500,
    }
  ]
};

// 使用示例组件
export default function PricingModalExample() {
  const { 
    isOpen, 
    openPricingModal, 
    closePricingModal, 
    setIsOpen 
  } = usePricingModal();

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">定价模态框使用示例</h2>
      
      {/* 方式1: 使用 Hook 控制 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">方式1: 使用 Hook 控制</h3>
        <div className="space-x-4">
          <Button onClick={openPricingModal}>
            打开定价模态框
          </Button>
          <Button variant="outline" onClick={closePricingModal}>
            关闭模态框
          </Button>
        </div>
        
        <PricingModal 
          pricing={examplePricing}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>

      {/* 方式2: 使用默认触发器 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">方式2: 使用默认触发器</h3>
        <PricingModal 
          pricing={examplePricing}
          triggerText="查看套餐价格"
          triggerClassName="bg-primary text-primary-foreground"
        />
      </div>

      {/* 方式3: 使用自定义触发器 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">方式3: 使用自定义触发器</h3>
        <PricingModal 
          pricing={examplePricing}
          trigger={
            <Button variant="secondary" size="lg">
              🚀 升级套餐
            </Button>
          }
        />
      </div>

      {/* 代码示例 */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-4">代码示例</h3>
        <pre className="text-sm overflow-x-auto">
{`// 导入组件
import { PricingModal, usePricingModal } from "@/components/blocks/pricing/modal";

// 方式1: 使用 Hook 控制
const { isOpen, openPricingModal, setIsOpen } = usePricingModal();

<Button onClick={openPricingModal}>打开定价</Button>
<PricingModal 
  pricing={pricingData}
  open={isOpen}
  onOpenChange={setIsOpen}
/>

// 方式2: 使用默认触发器
<PricingModal 
  pricing={pricingData}
  triggerText="查看价格"
/>

// 方式3: 使用自定义触发器
<PricingModal 
  pricing={pricingData}
  trigger={<Button>自定义按钮</Button>}
/>`}
        </pre>
      </div>
    </div>
  );
} 