import { Suspense } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import ProfileAnalyzer from "@/components/blocks/profile-analyzer";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile_analyzer" });
  
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }
  
  return {
    title: t("page_title"),
    description: t("page_description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile_analyzer");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* 功能特色 - 移动端也3列展示，紧凑样式 */}
          <div className="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-md md:rounded-xl p-2 md:p-6 text-center">
              <div className="w-6 h-6 md:w-12 md:h-12 bg-primary/10 rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-4">
                <svg className="w-3 h-3 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1 md:mb-2 leading-tight">{t("feature_ai_score_title")}</h3>
              <p className="text-[10px] md:text-sm text-muted-foreground leading-tight hidden md:block">
                {t("feature_ai_score_desc")}
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-md md:rounded-xl p-2 md:p-6 text-center">
              <div className="w-6 h-6 md:w-12 md:h-12 bg-secondary/10 rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-4">
                <svg className="w-3 h-3 md:w-6 md:h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1 md:mb-2 leading-tight">{t("feature_advice_title")}</h3>
              <p className="text-[10px] md:text-sm text-muted-foreground leading-tight hidden md:block">
                {t("feature_advice_desc")}
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-md md:rounded-xl p-2 md:p-6 text-center">
              <div className="w-6 h-6 md:w-12 md:h-12 bg-accent/30 rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-4">
                <svg className="w-3 h-3 md:w-6 md:h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1 md:mb-2 leading-tight">{t("feature_privacy_title")}</h3>
              <p className="text-[10px] md:text-sm text-muted-foreground leading-tight hidden md:block">
                {t("feature_privacy_desc")}
              </p>
            </div>
          </div>

          {/* 主要功能组件 */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <ProfileAnalyzer />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
