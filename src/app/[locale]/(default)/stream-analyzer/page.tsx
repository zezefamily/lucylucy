import { Suspense } from "react";
import { Metadata } from "next";
import StreamAnalyzer from "@/components/blocks/stream-analyzer";

export const metadata: Metadata = {
  title: "AI实时分析器 - lucylucy",
  description: "上传你的交友资料截图，AI实时分析并给出专业建议，提升你的交友魅力。",
};

export default function StreamAnalyzerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              AI实时分析器
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              体验最新的AI流式分析技术，实时获得专业的交友资料优化建议
            </p>
          </div>

          {/* 功能特色 */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">实时响应</h3>
              <p className="text-sm text-muted-foreground">
                AI边分析边输出，无需等待完整结果
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">智能视觉</h3>
              <p className="text-sm text-muted-foreground">
                GPT-4o视觉模型深度理解图像内容
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">自然对话</h3>
              <p className="text-sm text-muted-foreground">
                像聊天一样的分析体验，友好易懂
              </p>
            </div>
          </div>

          {/* 主要功能组件 */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <StreamAnalyzer />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 