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
  items: FAQItem[];
}

export function ModernFAQ({ title = "FAQ", subtitle = "Frequently Asked Questions", items }: ModernFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
            {items.map((item, index) => (
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
