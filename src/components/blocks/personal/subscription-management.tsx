"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings, Calendar, DollarSign, XCircle, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import moment from "moment";

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  product_name: string;
  amount: number;
  currency: string;
  interval: string;
  order_no: string;
  tier: string;
  created: number;
}

export function SubscriptionManagement() {
  const t = useTranslations("personal");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe-subscriptions');
      if (response.ok) {
        const { data } = await response.json();
        setSubscriptions(data || []);
      } else {
        toast.error(t("management.fetch_error"));
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
      toast.error(t("management.fetch_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setCancelling(subscriptionId);
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (response.ok) {
        toast.success(t("management.cancel_success"));
        fetchSubscriptions(); // 重新获取订阅信息
      } else {
        const { message } = await response.json();
        toast.error(`${t("management.cancel_failed")}: ${message}`);
      }
    } catch (error) {
      console.error('取消订阅失败:', error);
      toast.error(t("management.cancel_failed"));
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (subscription.canceled_at) {
      return <Badge variant="destructive">{t("management.canceled")}</Badge>;
    }
    if (subscription.cancel_at_period_end) {
      return <Badge variant="secondary">{t("management.plan_cancel")}</Badge>;
    }
    if (subscription.status === 'active') {
      return <Badge variant="default">{t("subscription.active")}</Badge>;
    }
    return <Badge variant="outline">{subscription.status}</Badge>;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'pro':
        return 'text-purple-600 dark:text-purple-400';
      case 'starter':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            订阅管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("subscription_management")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("management.no_subscriptions")}</p>
            <Button variant="outline" onClick={() => window.open('/pricing', '_blank')}>
              {t("management.view_plans")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("subscription_management")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className={`font-semibold ${getTierColor(subscription.tier)}`}>
                  {subscription.product_name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("management.order_no")}: {subscription.order_no}
                </p>
              </div>
              {getStatusBadge(subscription)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {/* <DollarSign className="h-4 w-4 text-muted-foreground" /> */}
                <span>
                  {subscription.currency.toUpperCase() === 'CNY' ? '¥' : '$'}
                  {(subscription.amount / 100).toFixed(2)}
                  /{subscription.interval === 'month' ? t("common.month") : subscription.interval === 'year' ? t("common.year") : subscription.interval}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {t("management.start_date")}: {moment.unix(subscription.current_period_start).format('YYYY-MM-DD')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {t("management.end_date")}: {moment.unix(subscription.current_period_end).format('YYYY-MM-DD')}
                </span>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                <XCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 dark:text-yellow-400">
                  {t("management.cancel_at_end", { date: moment.unix(subscription.current_period_end).format('YYYY-MM-DD') })}
                </span>
              </div>
            )}

            {subscription.canceled_at && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {t("management.canceled_at", { date: moment.unix(subscription.canceled_at).format('YYYY-MM-DD') })}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                {t("management.created_date")}: {moment.unix(subscription.created).format('YYYY-MM-DD HH:mm')}
              </div>

              {subscription.status === 'active' && !subscription.cancel_at_period_end && !subscription.canceled_at && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={cancelling === subscription.id}
                    >
                      {cancelling === subscription.id ? t("management.processing") : t("management.cancel_subscription")}
                    </Button>
                  </DialogTrigger>
                                      <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("management.confirm_cancel")}</DialogTitle>
                        <DialogDescription>
                          {t("management.cancel_confirm_text", { product: subscription.product_name })}
                          <br />
                          <br />
                          {t("management.cancel_description_detail", { date: moment.unix(subscription.current_period_end).format('YYYY-MM-DD') })}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex gap-2">
                        <Button variant="outline">{t("common.cancel")}</Button>
                        <Button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {t("management.confirm_cancel")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 