"use client";

import { useAppContext } from "@/contexts/app";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface CreditsBadgeProps {
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
}

export function CreditsBadge({ 
  className, 
  showIcon = true, 
  size = "default" 
}: CreditsBadgeProps) {
  const { userCredits } = useAppContext();
  const t = useTranslations("user");

  if (!userCredits) {
    return (
      <Badge variant="outline" className={cn("gap-1 py-1.5", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("loading")}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={userCredits.is_pro ? "default" : "secondary"} 
      className={cn("gap-1 py-1.5", className)}
    >
      {showIcon && <Coins className="h-4 w-4" />}
      {userCredits.left_credits} {t("credits")}
    </Badge>
  );
} 