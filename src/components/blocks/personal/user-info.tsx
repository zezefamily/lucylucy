"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/types/user";
import { CalendarDays, Mail, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import moment from "moment";

interface UserInfoProps {
  user: User | null;
  loading?: boolean;
}

export function UserInfo({ user, loading }: UserInfoProps) {
  const t = useTranslations("personal");

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t("basic_info")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t("basic_info")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("user_info.no_user_found")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          {t("basic_info")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url} alt={user.nickname} />
            <AvatarFallback className="text-lg">
              {user.nickname?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{user.nickname}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
            {user.signin_provider && (
              <Badge variant="outline" className="text-xs">
                {user.signin_provider === "google" ? "Google" : 
                 user.signin_provider === "email" ? "邮箱" : 
                 user.signin_provider}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("user_info.registration_date")}:</span>
              <span>{moment(user.created_at).format("YYYY-MM-DD")}</span>
            </div>
            {user.uuid && (
              <div className="text-xs text-muted-foreground">
                {t("user_info.user_id")}: {user.uuid.substring(0, 8)}...
              </div>
            )}
          </div>
          
          {user.invite_code && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">{t("user_info.invite_code")}:</span>
                <Badge variant="secondary" className="ml-2">
                  {user.invite_code}
                </Badge>
              </div>
              {user.invited_by && (
                <div className="text-xs text-muted-foreground">
                  {t("user_info.invited_by")} {user.invited_by.substring(0, 8)}...
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 