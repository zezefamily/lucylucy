"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface BackButtonProps {
  isBottomButton?: boolean;
}

export default function BackButton({ isBottomButton = false }: BackButtonProps) {
  const router = useRouter();
  const t = useTranslations("common");
  
  const handleBack = () => {
    // 使用浏览器的后退功能，这会自动保持滚动位置
    router.back();
  };
  
  if (isBottomButton) {
    return (
      <button 
        onClick={handleBack}
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t("back_to_blog_list")}
      </button>
    );
  }
  
  return (
    <button 
      onClick={handleBack}
      className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {t("back")}
    </button>
  );
} 