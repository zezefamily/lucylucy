"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Plus, Minus, Calendar, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import moment from "moment";

interface CreditRecord {
  id: number;
  trans_no: string;
  created_at: string;
  user_uuid: string;
  trans_type: string;
  credits: number;
  order_no?: string;
  tier: string;
  expired_at?: string;
}

interface CreditHistoryResponse {
  credits: CreditRecord[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export function CreditHistory() {
  const t = useTranslations("personal");
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchCreditHistory(1, true);
  }, []);

  const fetchCreditHistory = async (pageNum: number, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/credit-history?page=${pageNum}&limit=20`);
      if (response.ok) {
        const { data }: { data: CreditHistoryResponse } = await response.json();
        
        if (reset) {
          setRecords(data.credits);
        } else {
          setRecords(prev => [...prev, ...data.credits]);
        }
        
        setPage(pageNum);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('获取积分记录失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCreditHistory(page + 1);
    }
  };

  const getTransTypeDisplay = (transType: string) => {
    const typeMap: { [key: string]: { label: string; color: string } } = {
      'order_pay': { label: t("credits.transaction_types.order_pay"), color: 'text-green-600' },
      'new_user': { label: t("credits.transaction_types.new_user"), color: 'text-blue-600' },
      'system_add': { label: t("credits.transaction_types.system_add"), color: 'text-purple-600' },
      'profile_analysis': { label: t("credits.transaction_types.profile_analysis"), color: 'text-red-600' },
      'conversation_starter': { label: t("credits.transaction_types.conversation_starter"), color: 'text-orange-600' },
      'invite_reward': { label: t("credits.transaction_types.invite_reward"), color: 'text-cyan-600' },
      'refund': { label: t("credits.transaction_types.refund"), color: 'text-gray-600' },
      'ping': { label: t("credits.transaction_types.ping"), color: 'text-gray-600' },
    };
    
    return typeMap[transType] || { label: transType, color: 'text-gray-600' };
  };

  const getTransTypeBadge = (transType: string, credits: number) => {
    const isPositive = credits > 0;
    return (
      <Badge variant={isPositive ? "default" : "secondary"} className="text-xs">
        {getTransTypeDisplay(transType).label}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierMap: { [key: string]: { label: string; variant: any } } = {
      'elite': { label: 'Elite', variant: 'default' },
      'pro': { label: 'Pro', variant: 'secondary' },
      'starter': { label: 'Starter', variant: 'outline' },
      'none': { label: '', variant: '' },
    };
    
    const tierInfo = tierMap[tier] || { label: tier, variant: 'outline' };
    return <Badge variant={tierInfo.variant} className="text-xs">{tierInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            积分记录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t("credit_history")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("credits.no_records")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t("credit_history")}
          <Badge variant="outline" className="ml-auto">
            {t("credits.total_records", { count: records.length })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => (
          <div key={record.trans_no} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getTransTypeBadge(record.trans_type, record.credits)}
                {/* 如果返回为 none  不展示标签 */}
                {record.tier !== 'none' && getTierBadge(record.tier)}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {moment(record.created_at).format('YYYY-MM-DD HH:mm')}
              </div>
              
              {record.trans_no && (
                <div className="text-xs text-muted-foreground">
                  {t("management.order_no")}: {record.trans_no}
                </div>
              )}
              {/* 如果是 订阅订单，则展示过期时间 */}
              {record.trans_type === 'order_pay' && (
                <div className="text-xs text-muted-foreground">
                  {t("subscription.expired_at")}: {moment(record.expired_at).format('YYYY-MM-DD')}
                </div>
              )}
              {/* {record.expired_at && (
                <div className="text-xs text-muted-foreground">
                  {t("subscription.expired_at")}: {moment(record.expired_at).format('YYYY-MM-DD')}
                </div>
              )} */}
            </div>

            <div className="text-right space-y-1">
              <div className={`text-lg font-semibold flex items-center gap-1 ${
                record.credits >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {/* 如果为 订阅订单，且 等级为 无限制，则不展示积分 */}
                {record.credits >= 0 ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  // 如果 credits == 0 不展示积分
                  <Minus className="h-4 w-4" />
                )}
                {Math.abs(record.credits).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {/* #{record.trans_no.substring(0, 8)}... */}
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full"
            >
              {loadingMore ? (
                <>
                  <ArrowUpDown className="h-4 w-4 mr-2 animate-spin" />
                  {t("credits.loading")}
                </>
              ) : (
                t("credits.load_more")
              )}
            </Button>
          </div>
        )}

        {!hasMore && records.length > 0 && (
          <div className="text-center pt-4 text-sm text-muted-foreground">
            {t("credits.all_loaded")}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 