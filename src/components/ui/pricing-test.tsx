"use client";

import { Button } from "@/components/ui/button";
import PricingModal, { usePricingModal } from "@/components/blocks/pricing/modal";
import { usePricingData } from "@/hooks/usePricingData";

export function PricingTest() {
  const { isOpen, openPricingModal, setIsOpen } = usePricingModal();
  const { pricing, loading, error } = usePricingData();

  console.log('PricingTest Debug:', { pricing: !!pricing, loading, error });

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-sm font-semibold mb-2">定价模态框测试</h3>
      <div className="space-y-2 text-xs">
        <div>定价数据: {pricing ? '✅ 已加载' : '❌ 未加载'}</div>
        <div>加载中: {loading ? '是' : '否'}</div>
        <div>错误: {error || '无'}</div>
        <div>模态框状态: {isOpen ? '打开' : '关闭'}</div>
      </div>
      
      <div className="mt-3 space-x-2">
        <Button 
          size="sm" 
          onClick={() => {
            console.log('Test button clicked');
            openPricingModal();
          }}
          disabled={!pricing}
        >
          测试打开模态框
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setIsOpen(false)}
        >
          关闭模态框
        </Button>
      </div>
      
      {pricing && (
        <PricingModal 
          pricing={pricing}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      )}
    </div>
  );
} 