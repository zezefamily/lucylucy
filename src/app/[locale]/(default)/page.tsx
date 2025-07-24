import { Suspense } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import ProfileAnalyzer from "@/components/blocks/profile-analyzer";
import { ModernFAQ } from "@/components/blocks/faq";

type Props = {
  params: Promise<{ locale: string }>;
};

// FAQ 数据
const faqData = [
  {
    question: "What is a Dating Coach and How Can LucyAI Help Me?",
    answer: "A dating coach is a professional offering personalized strategies to navigate the dating world. This expert works to enhance communication and boost confidence, making them invaluable for attracting the right matches. If you need help with your dating profile or first messages, a dating coach provides step-by-step guidance. While AI tools can optimize profiles, a dating coach offers in-depth insights into your behaviors and strategies to improve your overall dating approach."
  },
  {
    question: "How Can I Improve My Dating Profile with Lucy AI?",
    answer: "LucyAI uses artificial intelligence to help you optimize your dating profile. Our system evaluates your photos and descriptions to provide suggestions that make your page more engaging. Unlike a dating coach who offers subjective feedback, Lucy AI provides data-driven tips. This optimization ensures your page makes a strong first impression, much like what a dating coach might guide you toward in the dating world."
  },
  {
    question: "Do I Need a Dating Coach to Create a Strong Dating Profile?",
    answer: "While a personal dating coach provides tailored advice, tools like Lucy AI can significantly improve your dating profile on your own. Our AI platform helps optimize your bio and photos with professional suggestions, enhancing your chances of making a great impression. Lucy AI offers similar insights and optimizations that you would receive from a dating coach, but without the cost or commitment."
  },
  {
    question: "What Should I Include in My Dating Profile?",
    answer: "To build a strong dating profile, it's essential to showcase your personality, interests, and values authentically. A dating coach might ask you to list your hobbies, career, and what you're looking for. Lucy AI helps select the right images and write captivating descriptions. With Lucy AI, you can create a dating profile that reflects your true self, much like a dating coach would advise you to do."
  },
  {
    question: "How Does Lucy AI's Dating Profile Optimization Work?",
    answer: "Lucy AI provides an in-depth optimization tool that analyzes your entire dating profile. We give you personalized feedback on photos and descriptions, much like a dating coach would. Our AI ensures your account is optimized for the best results, increasing your chances of getting matches. By using advanced algorithms, a task a dating coach can't perform in real time, we suggest tweaks that boost appeal for your dating profile."
  },
  {
    question: "Can a Dating Coach Help Me After I Create My Dating Profile?",
    answer: "Yes, a dating coach is a great support even after your initial setup. Once your dating profile is optimized, a dating coach can help refine communication strategies, like following up with matches and engaging in meaningful conversations. A dating coach provides ongoing support, helping you improve your interactions and maintain a strong online presence as your preferences evolve."
  },
  {
    question: "How Quickly Can I Improve My Dating Profile with Lucy AI?",
    answer: "Lucy AI's optimization tools provide instant feedback for improving your dating profile. Within minutes, you'll get actionable tips to make your presentation more attractive. While a dating coach may take several sessions to offer personalized advice, our AI works in real-time. This makes it a fast and effective way to optimize your dating profile, saving time compared to working with a dating coach."
  },
  {
    question: "What are the Benefits of Using a Dating Coach Over AI Tools?",
    answer: "A dating coach provides tailored, one-on-one guidance that accounts for personal nuances. However, AI tools like Lucy AI offer quick, automated solutions that are accessible anytime. A dating coach can offer deeper insights into your behaviors, preferences, and emotional needs. On the other hand, Lucy AI gives you an efficient and data-driven approach to profile optimization, which can be used for an instant boost to your dating experience."
  },
  {
    question: "Is My Dating Profile Privacy Protected with Lucy AI?",
    answer: "Yes, your privacy is a top priority. All data related to your dating profile is kept private and secure, unlike sharing personal details with a dating coach. We do not share your information, and all suggestions are AI-generated without human intervention. Your account is completely under your control, ensuring confidentiality. Lucy AI provides the same benefits without the exposure of sharing sensitive personal data with a dating coach."
  },
  {
    question: "Can Lucy AI Help Me If I'm New to Online Dating?",
    answer: "Absolutely! If you're new to online dating, Lucy AI is an excellent resource for creating your first dating profile. Our AI tools simplify the process with suggestions on photos and descriptions, much like what a dating coach might offer at the beginning of your journey. Whether starting out or improving an existing account, Lucy AI helps build a great dating profile. Many people use our tool as a first step before considering a dating coach."
  }
];

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
    <div className="min-h-screen bg-gradient-fluid relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient-primary mb-6 float-animation">
                {t("title")}
              </h1>
              <div className="absolute -inset-4 bg-gradient-primary rounded-full blur-2xl opacity-20 animate-pulse"></div>
            </div>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* 功能特色 - 现代化设计 */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-16">
            {/* AI 评分 */}
            <div className="card-glass rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 text-center hover-lift group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-primary rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 glow-primary group-hover:pulse-glow transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm md:text-lg font-semibold mb-1 sm:mb-2 md:mb-3 text-foreground leading-tight">{t("feature_ai_score_title")}</h3>
              <p className="text-xs sm:text-sm md:text-sm text-foreground/70 leading-relaxed hidden sm:block">
                {t("feature_ai_score_desc")}
              </p>
            </div>
            
            {/* 建议优化 */}
            <div className="card-glass rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 text-center hover-lift group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-secondary rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 glow-secondary group-hover:pulse-glow transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm md:text-lg font-semibold mb-1 sm:mb-2 md:mb-3 text-foreground leading-tight">{t("feature_advice_title")}</h3>
              <p className="text-xs sm:text-sm md:text-sm text-foreground/70 leading-relaxed hidden sm:block">
                {t("feature_advice_desc")}
              </p>
            </div>
            
            {/* 隐私保护 */}
            <div className="card-glass rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 text-center hover-lift group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-accent rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 glow-accent group-hover:pulse-glow transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent-green-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm md:text-lg font-semibold mb-1 sm:mb-2 md:mb-3 text-foreground leading-tight">{t("feature_privacy_title")}</h3>
              <p className="text-xs sm:text-sm md:text-sm text-foreground/70 leading-relaxed hidden sm:block">
                {t("feature_privacy_desc")}
              </p>
            </div>
          </div>

          {/* 主要功能组件 */}
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-10"></div>
            <div className="relative">
              <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-secondary rounded-full animate-spin animate-reverse"></div>
                  </div>
                </div>
              }>
                <ProfileAnalyzer />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ 组件 */}
      <div className="relative py-20">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-20 w-40 h-40 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"></div>
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* 主标题 */}
            <div className="text-center mb-16">
              <div className="relative inline-block">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gradient-primary mb-8 float-animation leading-tight">
                  Your AI Dating Coach: Perfect Your Dating Profile and Start Meaningful Conversations
                </h1>
                <div className="absolute -inset-6 bg-gradient-primary rounded-full blur-3xl opacity-15 animate-pulse"></div>
              </div>
            </div>

            {/* 功能特色卡片 */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* 个性化AI指导 */}
              <div className="card-glass rounded-2xl p-6 lg:p-8 text-center hover-lift group">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 glow-primary group-hover:pulse-glow transition-all duration-300">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-4 leading-tight">
                  Transform Your Dating Profile with Personalized AI Coaching
                </h2>
                <p className="text-foreground/70 leading-relaxed">
                  Get AI-powered insights to optimize your profile and make a lasting first impression
                </p>
              </div>
              
              {/* 聊天开场白 */}
              <div className="card-glass rounded-2xl p-6 lg:p-8 text-center hover-lift group">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 glow-secondary group-hover:pulse-glow transition-all duration-300">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-4 leading-tight">
                  Unlock Tailored Chat Openers to Improve Your Match Success
                </h2>
                <p className="text-foreground/70 leading-relaxed">
                  Generate personalized conversation starters that spark meaningful connections
                </p>
              </div>
              
              {/* 照片优化 */}
              <div className="card-glass rounded-2xl p-6 lg:p-8 text-center hover-lift group">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6 glow-accent group-hover:pulse-glow transition-all duration-300">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-accent-green-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-4 leading-tight">
                  Enhance Your Profile with Photo Ratings and Optimization
                </h2>
                <p className="text-foreground/70 leading-relaxed">
                  Receive detailed feedback on your photos to maximize your profile's appeal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ 组件 */}
      <ModernFAQ 
        title="FAQ"
        subtitle="Frequently Asked Questions"
        items={faqData}
      />
      
      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  );
}
