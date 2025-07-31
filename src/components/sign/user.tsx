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
import PricingModal, { usePricingModal } from "@/components/blocks/pricing/modal";
import { usePricingData } from "@/hooks/usePricingData";

import { Link } from "@/i18n/navigation";
import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { NavItem } from "@/types/blocks/base";

export default function SignUser({ user }: { user: User }) {
  const t = useTranslations();
  const { isOpen, openPricingModal, setIsOpen } = usePricingModal();
  const { pricing } = usePricingData();

  const dropdownItems: NavItem[] = [
    {
      title: user.nickname,
    },
    {
      title: t("user.personal_center"),
      url: "/personal",
    },
    {
      title: t("user.sign_out"),
      onClick: () => signOut(),
    },
  ];

  const handleCreditsBadgeClick = () => {
    openPricingModal();
  };

  return (
    <>
      <DropdownMenu>
        <div className="flex items-center gap-2">
          <CreditsBadge showTier={true} size="sm" onClick={handleCreditsBadgeClick} />
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
              {item.url ? (
                <DropdownMenuItem asChild className="flex justify-center cursor-pointer">
                  <Link href={item.url as any} target={item.target}>
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="flex justify-center cursor-pointer"
                  onClick={item.onClick}
                >
                  {item.title}
                </DropdownMenuItem>
              )}
              {index !== dropdownItems.length - 1 && <DropdownMenuSeparator />}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {pricing && (
        <PricingModal 
          pricing={pricing}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      )}
    </>
  );
}
