"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Camera, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function MobileTabBar() {
  const t = useTranslations("tabbar");
  const pathname = usePathname();
  
  // 更健壮的路径处理逻辑
  // 移除可能的locale前缀（/en, /zh, /zh-CN等），如果没有locale前缀则保持原样
  let pathWithoutLocale = pathname;
  
  // 检查是否以locale开头（考虑localePrefix: "as-needed"的情况）
  const localeMatch = pathname.match(/^\/([a-z]{2}(-[A-Z]{2})?)(\/.+|$)/);
  if (localeMatch) {
    // 有locale前缀，提取后面的路径
    pathWithoutLocale = localeMatch[3] || '/';
  }
  
  // 确保路径以/开头，如果是空字符串则设为'/'
  if (!pathWithoutLocale.startsWith('/')) {
    pathWithoutLocale = '/' + pathWithoutLocale;
  }
  if (pathWithoutLocale === '') {
    pathWithoutLocale = '/';
  }
  
  // 添加调试日志
  console.log('TabBar Debug - 原始路径:', pathname);
  console.log('TabBar Debug - 处理后路径:', pathWithoutLocale);
  console.log('TabBar Debug - Locale匹配:', localeMatch);
  
  const tabs = [
    {
      id: 'photo_analyzer',
      label: t('photo_analyzer'),
      href: '/',
      icon: Camera,
      isActive: pathWithoutLocale === '/'
    },
    {
      id: 'conversation_starter', 
      label: t('conversation_starter'),
      href: '/conversation-starter',
      icon: MessageCircle,
      // 精确匹配conversation-starter路径
      isActive: pathWithoutLocale === '/conversation-starter' || pathWithoutLocale.startsWith('/conversation-starter/')
    }
  ];

  // 打印每个tab的激活状态
  tabs.forEach(tab => {
    console.log(`TabBar Debug - ${tab.id} 激活状态:`, tab.isActive);
  });

  // 弹簧动画配置
  const springConfig = {
    type: "spring",
    stiffness: 400,
    damping: 17,
    mass: 0.8
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-card/95 backdrop-blur-md border-t border-border/50",
      "safe-area-pb", // 为iOS安全区域预留空间
      "block md:hidden" // 只在移动端显示
    )}>
      <nav className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.div
              key={tab.id}
              whileTap={{ 
                scale: 0.85,
                transition: springConfig
              }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              className="relative flex-1"
            >
              <Link
                href={tab.href as any}
                className={cn(
                  "relative", // 添加相对定位作为活动指示器的定位容器
                  "flex flex-col items-center justify-center",
                  "min-w-0 w-full py-2 px-1",
                  "transition-colors duration-200 ease-in-out",
                  "rounded-lg",
                  tab.isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <motion.div 
                  className={cn(
                    "flex items-center justify-center w-6 h-6 mb-1",
                    "transition-all duration-200 ease-in-out",
                    tab.isActive && "scale-110"
                  )}
                  animate={tab.isActive ? { 
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.6, ease: "easeInOut" }
                  } : {}}
                >
                  <Icon className="w-5 h-5" strokeWidth={tab.isActive ? 2.5 : 2} />
                </motion.div>
                <span className={cn(
                  "text-xs font-medium leading-tight text-center",
                  "transition-all duration-200 ease-in-out",
                  tab.isActive && "font-semibold"
                )}>
                  {tab.label}
                </span>
                {/* 活动指示器 */}
                {tab.isActive && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      transition: { 
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        delay: 0.1
                      }
                    }}
                    className={cn(
                      "absolute bottom-1 left-1/2 transform -translate-x-1/2",
                      "w-1 h-1 rounded-full bg-primary",
                      "animate-pulse"
                    )}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
} 