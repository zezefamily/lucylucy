"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PricingModalContent from "./modal-content";
import { Pricing as PricingType } from "@/types/blocks/pricing";

interface PricingModalProps {
  pricing: PricingType;
  trigger?: React.ReactNode;
  triggerText?: string;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function PricingModal({
  pricing,
  trigger,
  triggerText = "查看定价",
  triggerClassName,
  open,
  onOpenChange,
}: PricingModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  }, [onOpenChange]);

  const controlledOpen = open !== undefined ? open : isOpen;

  return (
    <Dialog open={controlledOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className={triggerClassName}
          >
            {triggerText}
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent 
        className="max-w-6xl w-[95vw] max-h-[95vh] p-6"
      >
        <PricingModalContent pricing={pricing} />
      </DialogContent>
    </Dialog>
  );
}

// 业务调用的便捷钩子
export function usePricingModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openPricingModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePricingModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePricingModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    openPricingModal,
    closePricingModal,
    togglePricingModal,
    setIsOpen,
  };
} 