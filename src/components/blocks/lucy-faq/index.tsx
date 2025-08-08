"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface LucyFAQProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
}

export default function LucyFAQ({ title = "FAQ", subtitle = "Frequently Asked Questions", items }: LucyFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="relative py-20">
      {/* LucyHero渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5]" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* 标题部分 */}
            <div className="text-center mb-16">
              <div className="relative inline-block">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                  {title}
                </h2>
                <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl opacity-30 animate-pulse"></div>
              </div>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* FAQ 列表 */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 group">
                  <button
                    className="w-full p-6 md:p-8 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-semibold text-sm transition-all duration-300 flex-shrink-0 mt-1 group-hover:bg-white/30">
                        {index + 1}
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-white leading-relaxed pr-4">
                        {item.question}
                      </h3>
                    </div>
                    <div className={`transform transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}>
                      <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-6 md:px-8 pb-6 md:pb-8">
                      <div className="pl-12 pr-4">
                        <p className="text-white/80 leading-relaxed text-sm md:text-base">
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
      </div>
    </div>
  );
} 