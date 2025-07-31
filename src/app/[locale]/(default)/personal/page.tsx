"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app";
import { UserInfo } from "@/components/blocks/personal/user-info";
import { SubscriptionInfo } from "@/components/blocks/personal/subscription-info";
import { SubscriptionManagement } from "@/components/blocks/personal/subscription-management";
import { CreditHistory } from "@/components/blocks/personal/credit-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, CreditCard, History } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PersonalPage() {
  const t = useTranslations("personal");
  const { user, userCredits, fetchUserInfo, fetchUserCredits } = useAppContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        // 如果用户信息或积分信息为空，则重新获取
        if (!user) {
          await fetchUserInfo();
        }
        if (!userCredits) {
          await fetchUserCredits();
        }
      } catch (error) {
        console.error('初始化个人信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user, userCredits, fetchUserInfo, fetchUserCredits]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <User className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        {/* 上半部分：用户信息和订阅信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserInfo user={user} loading={loading} />
          <SubscriptionInfo userCredits={userCredits} loading={loading} />
        </div>

        {/* 下半部分：详细管理信息 - 使用标签页 */}
        <Tabs defaultValue="credits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-12">
            <TabsTrigger 
              value="credits" 
              className="personal-tab-trigger"
            >
              <History className="h-4 w-4" />
              {t("credit_history")}
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions" 
              className="personal-tab-trigger"
            >
              <Settings className="h-4 w-4" />
              {t("subscription_management")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="mt-6">
            <CreditHistory />
          </TabsContent>
          <TabsContent value="subscriptions" className="mt-6">
            <SubscriptionManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
