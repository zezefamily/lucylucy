"use client";

import { useAppContext } from "@/contexts/app";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SubscriptionTier } from "@/types/user";

interface CreditsBadgeProps {
  className?: string;
  showTier?: boolean;
  size?: "sm" | "default" | "lg";
  onClick?: () => void;
}

export function CreditsBadge({ 
  className, 
  showTier = true, 
  size = "default",
  onClick
}: CreditsBadgeProps) {
  const { userCredits } = useAppContext();
  const t = useTranslations("user");
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.NONE);
  const [loading, setLoading] = useState(true);

  // 获取用户订阅等级
  useEffect(() => {
    async function fetchUserTier() {
      try {
        const response = await fetch('/api/get-user-subscription');
        if (response.ok) {
          const { data } = await response.json();
          setUserTier(data.subscription?.tier || SubscriptionTier.NONE);
        }
      } catch (error) {
        console.error('获取用户订阅等级失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserTier();
  }, []);

  // 监听 userCredits 变化，当积分变化时重新获取等级信息
  useEffect(() => {
    if (userCredits) {
      setLoading(false);
    }
  }, [userCredits]);

  // 获取等级显示名称
  const getTierDisplayName = (tier: SubscriptionTier): string => {
    switch (tier) {
      case SubscriptionTier.STARTER:
        return "Starter";
      case SubscriptionTier.PRO:
        return "Pro";
      case SubscriptionTier.ELITE:
        return "Elite";
      default:
        return "Free";
    }
  };

  // 获取等级对应的徽章样式 - 使用主题色调
  const getTierStyles = (tier: SubscriptionTier) => {
    return {
        style: {
            background: 'var(--gradient-primary)',
            color: 'var(--primary-foreground)',
            border: 'none'
          },
          className: "text-white shadow-lg shadow-primary/25",
          variant: "default" as const
    };
    // switch (tier) {
    //   case SubscriptionTier.ELITE:
    //     return {
    //       style: {
    //         background: 'var(--gradient-primary)',
    //         color: 'var(--primary-foreground)',
    //         border: 'none'
    //       },
    //       className: "text-white shadow-lg shadow-primary/25",
    //       variant: "default" as const
    //     };
    //   case SubscriptionTier.PRO:
    //     return {
    //         style: {
    //             background: 'var(--gradient-primary)',
    //             color: 'var(--primary-foreground)',
    //             border: 'none'
    //           },
    //           className: "text-white shadow-lg shadow-primary/25",
    //           variant: "default" as const
    //     };
    //   case SubscriptionTier.STARTER:
    //     return {
    //       style: {
    //         background: 'var(--gradient-accent)',
    //         color: 'var(--accent-green-foreground)',
    //         border: 'none'
    //       },
    //       className: "text-foreground shadow-lg shadow-accent-green/25",
    //       variant: "default" as const
    //     };
    //   default:
    //     return {
    //       style: {},
    //       className: "bg-muted text-muted-foreground border-border",
    //       variant: "outline" as const
    //     };
    // }
  };

  if (!userCredits || loading) {
    return (
      <Badge variant="outline" className={cn("gap-1 py-1.5", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("loading")}
      </Badge>
    );
  }

  const tierStyles = getTierStyles(userTier);

  return (
    <Badge  
      onClick={onClick}
      variant={tierStyles.variant} 
      style={tierStyles.style}
      className={cn(
        "gap-1 py-2 rounded-full", 
        tierStyles.className,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity", 
        className
      )}
    >
      {showTier && (
        <span className="text-xs font-medium">
          {getTierDisplayName(userTier)}
        </span>
      )}
      {/* 显示积分或无限制状态 */}
      {userTier === SubscriptionTier.ELITE ? (
        <span className="text-xs font-medium">
          {t("unlimited")}
        </span>
      ) : (
        <>
          {userCredits.left_credits} {t("credits")}
        </>
      )}
    </Badge>
  );
} 