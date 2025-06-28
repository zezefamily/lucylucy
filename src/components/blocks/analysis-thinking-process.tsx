"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Check, Clock } from "lucide-react";

interface AnalysisThinkingProcessProps {
  files: File[];
  locale: string;
  onStreamComplete: () => void;
  isVisible: boolean;
}

// 分析步骤接口
interface AnalysisStep {
  id: string;
  description: string;
  completed: boolean;
  timestamp?: string;
}

export default function AnalysisThinkingProcess({ 
  files, 
  locale, 
  onStreamComplete, 
  isVisible 
}: AnalysisThinkingProcessProps) {
  const t = useTranslations("profile_analyzer");
  const [steps, setSteps] = useState<AnalysisStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 预定义分析步骤
  const getAnalysisSteps = (fileCount: number): AnalysisStep[] => {
    const baseSteps = [
      { id: "image_recognition", description: locale === 'zh' ? "正在识别图片中的内容..." : "Recognizing image content..." },
      { id: "facial_analysis", description: locale === 'zh' ? "分析面部表情和情绪..." : "Analyzing facial expressions and emotions..." },
      { id: "style_assessment", description: locale === 'zh' ? "评估个人风格和穿着..." : "Assessing personal style and attire..." },
      { id: "background_context", description: locale === 'zh' ? "分析背景环境和场景..." : "Analyzing background environment and scenes..." },
      { id: "composition_quality", description: locale === 'zh' ? "评估照片构图和质量..." : "Evaluating photo composition and quality..." },
    ];

    if (fileCount > 1) {
      baseSteps.push(
        { id: "consistency_check", description: locale === 'zh' ? "检查多张照片的一致性..." : "Checking consistency across multiple photos..." },
        { id: "variety_analysis", description: locale === 'zh' ? "分析照片的多样性展示..." : "Analyzing variety in photo presentation..." }
      );
    }

    baseSteps.push(
      { id: "psychology_impact", description: locale === 'zh' ? "评估心理影响和印象..." : "Evaluating psychological impact and impressions..." },
      { id: "market_positioning", description: locale === 'zh' ? "分析市场定位和竞争力..." : "Analyzing market positioning and competitiveness..." },
      { id: "final_synthesis", description: locale === 'zh' ? "综合分析结果整理..." : "Synthesizing analysis results..." }
    );

    return baseSteps.map(step => ({ ...step, completed: false }));
  };

  // 格式化时间戳
  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // 开始分析思考过程
  const startThinkingProcess = async () => {
    if (files.length === 0) return;
    
    const analysisSteps = getAnalysisSteps(files.length);
    setSteps(analysisSteps);
    setCurrentStepIndex(-1);
    setProgress(0);
    setIsAnalyzing(true);
    setError(null);
    
    // 创建 AbortController 用于取消请求
    abortControllerRef.current = new AbortController();
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('fileCount', files.length.toString());
      formData.append('locale', locale);
      
      // 模拟步骤进度（同时处理真实的API请求）
      simulateStepProgress(analysisSteps);
      
      // 发起流式请求
      const response = await fetch('/api/analyze-thinking', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No reader available');
      }
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                setError(data.error);
                setIsAnalyzing(false);
                return;
              }
              
              if (data.done) {
                // 确保所有步骤都完成
                setSteps(prev => prev.map(step => ({ 
                  ...step, 
                  completed: true,
                  timestamp: step.timestamp || formatTimestamp()
                })));
                setProgress(100);
                setIsAnalyzing(false);
                
                // 延迟一点时间再触发完成回调，让用户看到完整的进度
                setTimeout(() => {
                  onStreamComplete();
                }, 1000);
                return;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Thinking process request was aborted');
        return;
      }
      
      console.error('思考过程流式请求错误:', error);
      setError(
        locale === 'zh' 
          ? "思考过程分析失败，请重试" 
          : "Thinking process analysis failed, please try again"
      );
      setIsAnalyzing(false);
    }
  };

  // 模拟步骤进度
  const simulateStepProgress = (analysisSteps: AnalysisStep[]) => {
    const stepDuration = 2000; // 每个步骤2秒
    const totalSteps = analysisSteps.length;
    
    analysisSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStepIndex(index);
        setSteps(prev => prev.map((s, i) => ({
          ...s,
          completed: i <= index,
          timestamp: i === index ? formatTimestamp() : s.timestamp
        })));
        
        // 更新进度
        const newProgress = Math.round(((index + 1) / totalSteps) * 100);
        setProgress(newProgress);
      }, index * stepDuration);
    });
  };

  // 停止分析过程
  const stopThinkingProcess = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
  };

  // 当组件可见时开始思考过程
  useEffect(() => {
    if (isVisible && files.length > 0) {
      startThinkingProcess();
    }
    
    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isVisible, files.length]);

  // 如果不可见，不渲染
  if (!isVisible) return null;

  return (
    <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 border-b border-blue-200/30">
        <CardTitle className="flex items-center text-xl">
          <div className="relative">
            <Brain className="w-6 h-6 mr-3 text-blue-600" />
            {isAnalyzing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t("ai_thinking_process")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {error ? (
          <div className="text-red-600 text-center py-8">
            <div className="text-lg font-medium mb-2">{t("thinking_error")}</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 分析步骤列表 */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    step.completed 
                      ? 'bg-green-50 border border-green-200' 
                      : index === currentStepIndex
                        ? 'bg-blue-50 border border-blue-200 animate-pulse'
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {/* 状态图标 */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : index === currentStepIndex
                        ? 'bg-blue-500 text-white animate-spin'
                        : 'bg-gray-300 text-gray-500'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4" />
                    ) : index === currentStepIndex ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* 步骤描述 */}
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      step.completed ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </div>
                    {step.completed && (
                      <div className="text-xs text-green-600 mt-1">
                        {locale === 'zh' ? '已完成' : 'Completed'}
                      </div>
                    )}
                  </div>
                  
                  {/* 时间戳 */}
                  {step.timestamp && (
                    <div className="text-xs text-gray-400 font-mono">
                      {step.timestamp}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-600">
                  {locale === 'zh' ? '分析进度' : 'Analysis Progress'}
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* 完成状态 */}
            {!isAnalyzing && progress === 100 && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-100/80 to-blue-100/80 border border-green-200/50">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">{t("thinking_complete")}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 