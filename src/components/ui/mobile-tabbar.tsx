"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Camera, MessageCircle, Heart } from "lucide-react";
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

  const tabs = [
    {
      id: 'photo_analyzer',
      href: '/',
      icon: Camera,
      label: t('photo_analyzer'),
      isActive: pathWithoutLocale === '/'
    },
    {
      id: 'conversation_starter',
      href: '/conversation-starter',
      icon: MessageCircle,
      label: t('conversation_starter'),
      // 精确匹配conversation-starter路径
      isActive: pathWithoutLocale === '/conversation-starter' || pathWithoutLocale.startsWith('/conversation-starter/')
    },
    {
      id: 'fit_test',
      href: '/fit-test',
      icon: Heart,
      label: t('fit_test'),
      // 匹配fit-test路径和相关页面（如fit-report）
      isActive: pathWithoutLocale === '/fit-test' || pathWithoutLocale.startsWith('/fit-test/') || pathWithoutLocale === '/fit-report' || pathWithoutLocale.startsWith('/fit-report/')
    }
  ];

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
      "card-glass border-t-2 border-primary/10",
      "safe-area-pb",
      "block md:hidden"
    )}>
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      
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
                  "relative flex flex-col items-center justify-center",
                  "min-w-0 w-full py-2 px-1",
                  "transition-all duration-300 ease-in-out",
                  "rounded-xl",
                  tab.isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <motion.div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 mb-1 rounded-xl",
                    "transition-all duration-300 ease-in-out",
                    tab.isActive && "bg-gradient-primary shadow-lg glow-primary"
                  )}
                  animate={tab.isActive ? { 
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.6, ease: "easeInOut" }
                  } : {}}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5",
                      tab.isActive ? "text-white" : "text-current"
                    )} 
                    strokeWidth={tab.isActive ? 2.5 : 2} 
                  />
                </motion.div>
                
                <span className={cn(
                  "text-xs font-medium leading-tight text-center",
                  "transition-all duration-300 ease-in-out",
                  tab.isActive && "font-semibold text-gradient-primary"
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
                      "absolute -bottom-1 left-1/2 transform -translate-x-1/2",
                      "w-1 h-1 rounded-full bg-gradient-primary",
                      "glow-primary"
                    )}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
      
      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </div>
  );
} 