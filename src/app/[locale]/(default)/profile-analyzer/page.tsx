import { Suspense } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import ProfileAnalyzer from "@/components/blocks/profile-analyzer";
import { ModernFAQ } from "@/components/blocks/faq";
import { Testimonial as TestimonialType, TestimonialItem } from "@/types/blocks/testimonial";
import LucyFeature from "@/components/blocks/lucy-feature";
import LucyFAQ from "@/components/blocks/lucy-faq";
import { Section } from "@/types/blocks/section";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile_analyzer" });
  
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/profile-analyzer`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/profile-analyzer`;
  }
  
  return {
    title: t("page_title"),
    description: t("page_description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// 渲染单个评价的辅助函数
const renderTestimonialItem = (item: TestimonialItem, index: number) => {
  if (!item) return null;
  
  // 解析评价内容，提取引用和主要内容
  const comment = item.comment || '';
  let quote = '';
  let content = '';
  
  // 检测是否为中文内容
  const isChinese = /[\u4e00-\u9fff]/.test(comment);
  
  if (isChinese) {
    // 中文文本：按句号分割
    const parts = comment.split('。');
    quote = parts[0] + (parts[0] ? '。' : '');
    content = parts.slice(1).join('。');
  } else {
    // 英文文本：按句点分割
    const parts = comment.split('. ');
    quote = parts[0] + (parts[0]?.endsWith('.') ? '' : '.');
    content = parts.slice(1).join('. ');
  }
  
  // 根据索引确定渐变色
  const gradients = [
    'bg-gradient-primary',
    'bg-gradient-secondary', 
    'bg-gradient-accent',
    'bg-gradient-primary'
  ];
  
  const textColors = [
    'text-white',
    'text-white',
    'text-accent-green-foreground',
    'text-white'
  ];

  return (
    <div key={index} className="card-glass rounded-2xl p-8 hover-lift">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 ${gradients[index % gradients.length]} rounded-full flex items-center justify-center ${textColors[index % textColors.length]} font-bold text-xl`}>
          {item.emoji}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
          <p className="text-foreground/70">{item.title}</p>
        </div>
      </div>
      <blockquote className="text-lg font-medium text-primary mb-4">
        "{quote}"
      </blockquote>
      <div className="text-foreground/80 leading-relaxed">
        {/* 渲染格式化的内容 */}
        <div 
          dangerouslySetInnerHTML={{
            __html: content
              // 英文高亮规则
              .replace(/The result\? My matches tripled/g, '<strong class="text-primary">The result? My matches tripled</strong>')
              .replace(/That night, I got my first like/g, '<strong class="text-primary">That night, I got my first like</strong>')
              .replace(/She sent me a voice message back\. We talked till 3am/g, '<strong class="text-primary">She sent me a voice message back. We talked till 3am</strong>')
              .replace(/After that, I got fewer matches—but they were better/g, '<strong class="text-primary">After that, I got fewer matches—but they were better</strong>')
              .replace(/That's when I realized—good first impressions aren't about looks, they're about clarity and connection/g, '<em>That\'s when I realized—good first impressions aren\'t about looks, they\'re about clarity and connection</em>')
              .replace(/Turns out I wasn't boring\. I just didn't know how to show my shine\. Lucy did/g, '<em>Turns out I wasn\'t boring. I just didn\'t know how to show my shine. Lucy did</em>')
              .replace(/Lucy didn't just help me talk\. She helped me connect/g, '<em>Lucy didn\'t just help me talk. She helped me connect</em>')
              .replace(/Lucy didn't just improve my profile\. She helped me believe again/g, '<em>Lucy didn\'t just improve my profile. She helped me believe again</em>')
              // 中文高亮规则
              .replace(/结果呢？我的匹配数量翻了三倍/g, '<strong class="text-primary">结果呢？我的匹配数量翻了三倍</strong>')
              .replace(/那天晚上，我得到了第一个赞/g, '<strong class="text-primary">那天晚上，我得到了第一个赞</strong>')
              .replace(/她给我回了语音消息。我们聊到了凌晨3点/g, '<strong class="text-primary">她给我回了语音消息。我们聊到了凌晨3点</strong>')
              .replace(/之后，我得到的匹配少了——但质量更好了/g, '<strong class="text-primary">之后，我得到的匹配少了——但质量更好了</strong>')
              .replace(/那时我才意识到——好的第一印象不是关于外貌，而是关于清晰度和连接/g, '<em>那时我才意识到——好的第一印象不是关于外貌，而是关于清晰度和连接</em>')
              .replace(/原来我并不无聊。我只是不知道如何展现我的光芒。Lucy帮我做到了/g, '<em>原来我并不无聊。我只是不知道如何展现我的光芒。Lucy帮我做到了</em>')
              .replace(/Lucy不只是帮我说话。她帮我建立连接/g, '<em>Lucy不只是帮我说话。她帮我建立连接</em>')
              .replace(/Lucy不只是改善了我的资料。她帮我重新相信了/g, '<em>Lucy不只是改善了我的资料。她帮我重新相信了</em>')
          }}
        />
      </div>
    </div>
  );
};

export default async function ProfileAnalyzerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile_analyzer");
  const homepageT = await getTranslations("homepage");
  
  // FAQ 数据 - 使用翻译
  const faqData = [
    {
      question: homepageT("faq.q1_question"),
      answer: homepageT("faq.q1_answer")
    },
    {
      question: homepageT("faq.q2_question"),
      answer: homepageT("faq.q2_answer")
    },
    {
      question: homepageT("faq.q3_question"),
      answer: homepageT("faq.q3_answer")
    },
    {
      question: homepageT("faq.q4_question"),
      answer: homepageT("faq.q4_answer")
    },
    {
      question: homepageT("faq.q5_question"),
      answer: homepageT("faq.q5_answer")
    },
    {
      question: homepageT("faq.q6_question"),
      answer: homepageT("faq.q6_answer")
    },
    {
      question: homepageT("faq.q7_question"),
      answer: homepageT("faq.q7_answer")
    },
    {
      question: homepageT("faq.q8_question"),
      answer: homepageT("faq.q8_answer")
    },
    {
      question: homepageT("faq.q9_question"),
      answer: homepageT("faq.q9_answer")
    },
    {
      question: homepageT("faq.q10_question"),
      answer: homepageT("faq.q10_answer")
    }
  ];

  // Lucy AI 功能配置 - 使用翻译
  const lucyFeatures: Section = {
    title: homepageT("lucy_features.title"),
    description: homepageT("lucy_features.description"),
    items: [
      {
        icon: "RiUserStarLine",
        title: homepageT("lucy_features.irresistible_profile_title"),
        description: homepageT("lucy_features.irresistible_profile_desc")
      },
      {
        icon: "RiChatSmileLine", 
        title: homepageT("lucy_features.high_response_openers_title"),
        description: homepageT("lucy_features.high_response_openers_desc")
      },
      {
        icon: "RiHeartLine",
        title: homepageT("lucy_features.personalized_feedback_title"), 
        description: homepageT("lucy_features.personalized_feedback_desc")
      }
    ]
  };

  // 适用人群配置 - 使用翻译
  const targetAudience: Section = {
    title: homepageT("target_audience.title"),
    description: homepageT("target_audience.description"),
    items: [
      {
        icon: "RiAppsLine",
        title: homepageT("target_audience.app_users_title"),
        description: homepageT("target_audience.app_users_desc")
      },
      {
        icon: "RiEditLine",
        title: homepageT("target_audience.profile_improvement_title"), 
        description: homepageT("target_audience.profile_improvement_desc")
      },
      {
        icon: "RiQuestionLine",
        title: homepageT("target_audience.conversation_starters_title"),
        description: homepageT("target_audience.conversation_starters_desc")
      },
      {
        icon: "RiTimeLine",
        title: homepageT("target_audience.serious_daters_title"),
        description: homepageT("target_audience.serious_daters_desc")
      }
    ]
  };

  // Testimonials 数据 - 使用翻译
  const testimonials: TestimonialType = {
    title: homepageT("testimonials.title"),
    description: homepageT("testimonials.description"),
    items: [
      {
        emoji: "🧑‍💼",
        name: homepageT("testimonials.david_name"),
        title: homepageT("testimonials.david_title"),
        comment: homepageT("testimonials.david_comment")
      },
      {
        emoji: "👩‍🎓",
        name: homepageT("testimonials.sophie_name"), 
        title: homepageT("testimonials.sophie_title"),
        comment: homepageT("testimonials.sophie_comment")
      },
      {
        emoji: "🧑‍🎤",
        name: homepageT("testimonials.liam_name"),
        title: homepageT("testimonials.liam_title"), 
        comment: homepageT("testimonials.liam_comment")
      },
      {
        emoji: "👩‍⚕️", 
        name: homepageT("testimonials.joanne_name"),
        title: homepageT("testimonials.joanne_title"),
        comment: homepageT("testimonials.joanne_comment")
      }
    ]
  };
  
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
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gradient-primary mb-8 float-animation leading-tight">
                  {homepageT("ai_dating_coach_title")}
                </h2>
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
                  {homepageT("personalized_coaching_title")}
                </h2>
                <p className="text-foreground/70 leading-relaxed">
                  {homepageT("personalized_coaching_desc")}
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
                  {homepageT("chat_openers_title")}
                </h2>
                <p className="text-foreground/70 leading-relaxed">
                  {homepageT("chat_openers_desc")}
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
                  {homepageT("photo_optimization_title")}
                </h2>
                <p className="text-foreground/70 leading-relaxed">
                  {homepageT("photo_optimization_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增的Lucy风格FAQ模块 */}
      <LucyFAQ 
        title={homepageT("faq.title")}
        subtitle={homepageT("faq.subtitle")}
        items={faqData}
      />

      {/* Feature */}
      <LucyFeature section={lucyFeatures} />
      <LucyFeature section={targetAudience} />

      {/* Testimonials */}
      {!testimonials.disabled && (
        <div className="relative py-20">
          {/* 背景装饰 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 w-60 h-60 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
            <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* 标题 */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-gradient-primary mb-6">
                  {testimonials.title}
                </h2>
                {testimonials.description && (
                  <p className="text-lg text-foreground/70 mb-8">
                    {testimonials.description}
                  </p>
                )}
                <div className="w-32 h-1 bg-gradient-primary mx-auto mb-8 rounded-full"></div>
              </div>

              {/* 用户评价网格 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {testimonials.items?.map((item, index) => renderTestimonialItem(item, index))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ 组件 */}
      <ModernFAQ 
        title={homepageT("faq.title")}
        subtitle={homepageT("faq.subtitle")}
        items={faqData}
      />
      
      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  );
} 