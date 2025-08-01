"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Crown, Gem } from "lucide-react";
import { UserCredits, SubscriptionTier } from "@/types/user";
import { useTranslations } from "next-intl";

interface SubscriptionInfoProps {
  userCredits: UserCredits | null;
  loading?: boolean;
}

export function SubscriptionInfo({ userCredits, loading }: SubscriptionInfoProps) {
  const t = useTranslations("personal");
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/get-user-subscription');
      if (response.ok) {
        const { data } = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.ELITE:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case SubscriptionTier.PRO:
        return <Gem className="h-5 w-5 text-purple-500" />;
      case SubscriptionTier.STARTER:
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTierDisplayName = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.ELITE:
        return "Elite";
      case SubscriptionTier.PRO:
        return "Pro";
      case SubscriptionTier.STARTER:
        return "Starter";
      default:
        return "Free";
    }
  };

  const getTierBadgeVariant = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.ELITE:
        return "default";
      case SubscriptionTier.PRO:
        return "secondary";
      case SubscriptionTier.STARTER:
        return "outline";
      default:
        return "destructive";
    }
  };

  const totalCredits = userCredits ? 
    (userCredits.one_time_credits || 0) + 
    (userCredits.left_credits || 0) : 0;

  if (loading || subscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {t("subscription_info")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          {t("subscription_info")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTierIcon(subscription?.tier || SubscriptionTier.NONE)}
            <span className="text-lg font-semibold">
              {getTierDisplayName(subscription?.tier || SubscriptionTier.NONE)}
            </span>
          </div>
          <Badge variant={getTierBadgeVariant(subscription?.tier || SubscriptionTier.NONE)}>
            {subscription?.isActive ? t("subscription.active") : t("subscription.inactive")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="text-sm text-muted-foreground">{t("subscription.total_credits")}</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalCredits.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="text-sm text-muted-foreground">{t("subscription.valid_credits")}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(userCredits?.left_credits || 0).toLocaleString()}
            </div>
          </div>

          {/* <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <div className="text-sm text-muted-foreground">{t("subscription.one_time_credits")}</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(userCredits?.one_time_credits || 0).toLocaleString()}
            </div>
          </div> */}
        </div>

        {subscription?.expiredAt && (
          <div className="text-sm text-muted-foreground">
            {t("subscription.expired_at")}: {new Date(subscription.expiredAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 