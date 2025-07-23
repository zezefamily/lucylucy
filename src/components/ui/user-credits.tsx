"use client";

import { useAppContext } from "@/contexts/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, RefreshCw } from "lucide-react";
import { useState } from "react";

export function UserCredits() {
  const { userCredits, refreshUserCredits } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserCredits();
    } catch (error) {
      console.error("刷新积分失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!userCredits) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">加载积分信息中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">我的积分</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{userCredits.left_credits}</div>
            <p className="text-xs text-muted-foreground">剩余积分</p>
          </div>
          <div className="flex flex-col gap-2">
            {userCredits.is_pro && (
              <Badge variant="default">Pro 用户</Badge>
            )}
            {userCredits.is_recharged && (
              <Badge variant="secondary">已充值</Badge>
            )}
          </div>
        </div>
        
        {userCredits.total_credits && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">总积分:</span>
              <span>{userCredits.total_credits}</span>
            </div>
            {userCredits.used_credits && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">已使用:</span>
                <span>{userCredits.used_credits}</span>
              </div>
            )}
            {userCredits.free_credits && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">免费积分:</span>
                <span>{userCredits.free_credits}</span>
              </div>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          刷新积分
        </Button>
      </CardContent>
    </Card>
  );
} 