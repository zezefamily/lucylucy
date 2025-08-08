"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Section as SectionType } from "@/types/blocks/section";

interface FAQItem {
  question: string;
  answer: string;
}

interface ModernFAQProps {
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
}

export function ModernFAQ({ 
  title = "常见问题", 
  subtitle = "关于 Lucy AI 的一切你想知道的", 
  items 
}: ModernFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 默认FAQ数据
  const defaultFAQData: FAQItem[] = [
    {
      question: "Lucy AI 是如何工作的？",
      answer: "Lucy AI 使用先进的人工智能技术分析你的约会档案，提供个性化的建议和优化方案。通过深度学习算法，Lucy 能够理解什么样的档案更容易获得匹配，并帮助你提升约会成功率。"
    },
    {
      question: "我的个人信息安全吗？",
      answer: "我们非常重视用户隐私和数据安全。所有上传的信息都经过加密处理，仅用于分析目的，不会与第三方分享。你可以随时删除你的数据。"
    },
    {
      question: "Lucy AI 支持哪些约会平台？",
      answer: "Lucy AI 支持主流的约会平台，包括 Tinder、Bumble、Hinge、Match 等。我们会根据不同平台的特点提供定制化的建议。"
    },
    {
      question: "使用 Lucy AI 需要付费吗？",
      answer: "我们提供免费的基础分析功能，让你体验 Lucy AI 的能力。高级功能和深度分析需要订阅我们的付费计划，价格非常合理。"
    },
    {
      question: "多久能看到效果？",
      answer: "大多数用户在按照 Lucy AI 的建议优化档案后，在 1-2 周内就能看到匹配数量的显著提升。持续使用我们的建议，效果会更加明显。"
    },
    {
      question: "如果我不满意结果怎么办？",
      answer: "我们对 Lucy AI 的效果充满信心。如果你在使用付费功能后不满意，我们提供 30 天退款保证。你的满意是我们最大的目标。"
    }
  ];

  // 使用传入的items或默认数据
  const faqItems = items || defaultFAQData;

  return (
    <section className="py-16 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* 标题部分 */}
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <h2 className="text-3xl md:text-5xl font-bold text-gradient-primary mb-4 float-animation">
                {title}
              </h2>
              <div className="absolute -inset-2 bg-gradient-primary rounded-full blur-xl opacity-15 animate-pulse"></div>
            </div>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* FAQ 列表 */}
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="card-glass rounded-xl md:rounded-2xl overflow-hidden hover-lift group">
                <button
                  className="w-full p-6 md:p-8 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-semibold text-sm glow-primary group-hover:pulse-glow transition-all duration-300 flex-shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-foreground leading-relaxed pr-4">
                      {item.question}
                    </h3>
                  </div>
                  <div className={`transform transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}>
                    <svg className="w-6 h-6 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <div className="pl-12 pr-4">
                      <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 保持原有的FAQ组件以兼容其他页面
export default function FAQ({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container">
        <div className="text-center">
          {section.label && (
            <Badge className="text-xs font-medium">{section.label}</Badge>
          )}
          <h2 className="mt-4 text-4xl font-semibold">{section.title}</h2>
          <p className="mt-6 font-medium text-muted-foreground">
            {section.description}
          </p>
        </div>
        <div className="mx-auto mt-14 grid gap-8 md:grid-cols-2 md:gap-12">
          {section.items?.map((item, index) => (
            <div key={index} className="flex gap-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-primary font-mono text-xs text-primary">
                {index + 1}
              </span>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-md text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
