"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditsBadge } from "@/components/ui/credits-badge";

import { Link } from "@/i18n/navigation";
import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { NavItem } from "@/types/blocks/base";

export default function SignUser({ user }: { user: User }) {
  const t = useTranslations();

  const dropdownItems: NavItem[] = [
    {
      title: user.nickname,
    },
    {
      title: t("user.user_center"),
      url: "/my-orders",
    },
    {
      title: t("user.admin_system"),
      url: "/admin/users",
    },
    {
      title: t("user.sign_out"),
      onClick: () => signOut(),
    },
  ];

  return (
    <DropdownMenu>
      <div className="flex items-center gap-2">
        <CreditsBadge showIcon={true} size="sm" />
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src={user.avatar_url} alt={user.nickname} />
            <AvatarFallback>{user.nickname}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent className="mx-4 bg-background">
        {dropdownItems.map((item, index) => (
          <React.Fragment key={index}>
            <DropdownMenuItem
              key={index}
              className="flex justify-center cursor-pointer"
            >
              {item.url ? (
                <Link href={item.url as any} target={item.target}>
                  {item.title}
                </Link>
              ) : (
                <button onClick={item.onClick}>{item.title}</button>
              )}
            </DropdownMenuItem>
            {index !== dropdownItems.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
