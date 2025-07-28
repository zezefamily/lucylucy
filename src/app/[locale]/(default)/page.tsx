import { Suspense } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import ProfileAnalyzer from "@/components/blocks/profile-analyzer";
import { ModernFAQ } from "@/components/blocks/faq";
import { Testimonial as TestimonialType, TestimonialItem } from "@/types/blocks/testimonial";
import LucyFeature from "@/components/blocks/lucy-feature";
import { Section } from "@/types/blocks/section";

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

// Testimonials 数据
const testimonials: TestimonialType = {
  title: "What Users Are Saying",
  description: "Real stories from real users who transformed their dating experience",
  items: [
    {
      emoji: "🧑‍💼",
      name: "David, 30",
      title: "Product Manager",
      comment: "I always thought I had good credentials—turns out people weren't even clicking on my profile. I'm a product manager at a tech company. My life's pretty stable, and I joined dating apps wanting something real. I spent hours writing my Tinder profile, trying to sound smart but approachable. Still—nothing. Some weeks I wouldn't even get a single match. Then I found Lucy. She showed me that my profile didn't reflect my personality at all—it was too formal, too stiff, more like a résumé than a real intro. She rewrote my bio in three different styles, each more personal and expressive. The result? My matches tripled. People actually messaged me about lines in my bio. One person even said, 'Your profile feels like you actually care about life.' That's when I realized—good first impressions aren't about looks, they're about clarity and connection."
    },
    {
      emoji: "👩‍🎓",
      name: "Sophie, 22", 
      title: "Recent Graduate",
      comment: "I had no idea what to write. Honestly, I was scared someone might actually read it. I'm kind of shy. I'd just signed up for Hinge, and everyone's profile looked so natural, witty, polished. I only posted a selfie and wrote something vague like: 'Love music and art.' No matches. No likes. I felt invisible. Then I tried Lucy. I gave her one photo and listed some things I liked. In return, she gave me three versions of a profile bio—one sweet, one artsy, one playful. I picked the 'soft & sincere' one. It felt like me, just… more fluent. That night, I got my first like. The guy said, 'I love that bookstore line—it sounds like a rom-com meet-cute.' It made me smile. Turns out I wasn't boring. I just didn't know how to show my shine. Lucy did."
    },
    {
      emoji: "🧑‍🎤",
      name: "Liam, 27",
      title: "Music Producer", 
      comment: "I matched with people—but conversations always died fast. I'm not shy. I love talking to people, I'm a bit of a goofball. On dating apps, I got plenty of matches, but conversations went nowhere. A joke here, a meme there—people either ghosted or replied with a dry 'lol.' Lucy changed that. I pasted in a match's profile, and she gave me an opener tailored to that person's vibe. One girl mentioned she loved sunsets and LANY, so Lucy suggested this: 'What's your favorite street to watch the sunset from? I've got a secret overpass I'll trade you for.' She sent me a voice message back. We talked till 3am. We swapped Instagrams. Later, we went to a concert together. Lucy didn't just help me talk. She helped me connect."
    },
    {
      emoji: "👩‍⚕️", 
      name: "Joanne, 29",
      title: "Nurse",
      comment: "I'm looking for something serious—but I kept attracting people who weren't. I work long shifts at the hospital. My schedule's hectic, and I don't have time for endless small talk or flaky people. I joined dating apps to find someone mature, grounded, ready. But most matches felt like… distractions. Lucy helped me rethink my whole profile. She pointed out that my bio was too 'nice'—too neutral, too agreeable. It didn't communicate my values or my standards. She rewrote it to be clearer about what I wanted, and more confident in my tone. She also helped me re-order my photos to better show my lifestyle and energy. After that, I got fewer matches—but they were better. The conversations were real, intentional. Now I'm dating someone I met through Lucy's help, and for the first time, I feel like I'm building something that matters. Lucy didn't just improve my profile. She helped me believe again."
    }
  ]
};

// Lucy AI 功能配置
const lucyFeatures: Section = {
  title: "What Can You Do with Lucy AI?",
  description: "Unlock the power of AI to transform your dating experience",
  items: [
    {
      icon: "RiUserStarLine",
      title: "Create an Irresistible Dating Profile",
      description: "Generates multiple high-impact profile versions based on your photos, interests, and profession. Adapts tone and language for different platforms like Tinder, Bumble, Hinge. Avoids generic bios—stand out from the crowd with unique, engaging intros."
    },
    {
      icon: "RiChatSmileLine", 
      title: "Write High-Response Openers",
      description: "Analyzes your match's profile to identify interests and personality cues. Creates multiple openers that feel natural, personal, and targeted. Boosts your reply rate and makes cold starts feel effortless."
    },
    {
      icon: "RiHeartLine",
      title: "Get Personalized Dating Coach Feedback", 
      description: "Evaluates compatibility between you and your match. Identifies weak points and areas to improve in your conversations. Offers strategic advice to attract the kind of people you actually want."
    }
  ]
};

// 适用人群配置
const targetAudience: Section = {
  title: "Who Is Lucy For?",
  description: "Perfect for anyone looking to improve their dating game",
  items: [
    {
      icon: "RiAppsLine",
      title: "App Users Struggling with Match Quality",
      description: "People using Tinder, Hinge, or Bumble but struggling with poor match quality"
    },
    {
      icon: "RiEditLine",
      title: "Profile Improvement Seekers", 
      description: "Those who want a more attractive profile but don't know how to write it"
    },
    {
      icon: "RiQuestionLine",
      title: "Conversation Starters",
      description: "Anyone unsure how to break the ice or start meaningful chats"
    },
    {
      icon: "RiTimeLine",
      title: "Serious Daters",
      description: "Serious daters who value their time and want better results"
    }
  ]
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

// 渲染单个评价的辅助函数
const renderTestimonialItem = (item: TestimonialItem, index: number) => {
  if (!item) return null;
  
  // 解析评价内容，提取引用和主要内容
  const parts = item.comment?.split('. ') || [];
  const quote = parts[0] + (parts[0]?.endsWith('.') ? '' : '.');
  const content = parts.slice(1).join('. ');
  
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
              .replace(/The result\? My matches tripled/g, '<strong class="text-primary">The result? My matches tripled</strong>')
              .replace(/That night, I got my first like/g, '<strong class="text-primary">That night, I got my first like</strong>')
              .replace(/She sent me a voice message back\. We talked till 3am/g, '<strong class="text-primary">She sent me a voice message back. We talked till 3am</strong>')
              .replace(/After that, I got fewer matches—but they were better/g, '<strong class="text-primary">After that, I got fewer matches—but they were better</strong>')
              .replace(/That's when I realized—good first impressions aren't about looks, they're about clarity and connection/g, '<em>That\'s when I realized—good first impressions aren\'t about looks, they\'re about clarity and connection</em>')
              .replace(/Turns out I wasn't boring\. I just didn't know how to show my shine\. Lucy did/g, '<em>Turns out I wasn\'t boring. I just didn\'t know how to show my shine. Lucy did</em>')
              .replace(/Lucy didn't just help me talk\. She helped me connect/g, '<em>Lucy didn\'t just help me talk. She helped me connect</em>')
              .replace(/Lucy didn't just improve my profile\. She helped me believe again/g, '<em>Lucy didn\'t just improve my profile. She helped me believe again</em>')
          }}
        />
      </div>
    </div>
  );
};

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
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gradient-primary mb-8 float-animation leading-tight">
                  Your AI Dating Coach: Perfect Your Dating Profile and Start Meaningful Conversations
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
        title="FAQ"
        subtitle="Frequently Asked Questions"
        items={faqData}
      />
      
      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  );
}
